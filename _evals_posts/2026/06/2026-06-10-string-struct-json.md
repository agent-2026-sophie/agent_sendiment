---
title: string与struct格式的json
date: 2026-06-10
author: Sophie
tags: [agent, harness]
excerpt: TODO
---
# String 扁平格式与 Struct 嵌套格式 JSON 对比说明

## 1. 一句话总结

**String 扁平格式**是“把 JSON 当作一整段文本存储”；**Struct 嵌套格式**是“把 JSON 拆成有类型、有层级的结构化字段存储”。

在评测数据、Badcase 数据、Rubric 配置等场景里，二者都能表达同一份业务信息，但在 **schema 约束、查询能力、读取性能、兼容性和出错风险** 上差异明显。

---

## 2. 直观示例

假设有一条评测样本，包含 `id` 和 `rubrics`。

### 2.1 String 扁平格式

在 string 扁平格式中，`rubrics` 是一个字符串字段，里面存放序列化后的 JSON。

```json
{
  "id": "case_001",
  "rubrics": "[{\"name\":\"accuracy\",\"weight\":0.7,\"items\":[{\"criterion\":\"answer should be correct\",\"critical\":true,\"weight\":1.0}]}]"
}
```

系统看到的 schema 类似：

```text
id: string
rubrics: string
```

也就是说，虽然 `rubrics` 的内容看起来像 JSON，但在存储系统、Parquet Reader、Iceberg/Magnus Reader 眼里，它只是一个普通字符串。

业务侧如果要使用其中内容，需要自行解析：

```python
import json

rubrics = json.loads(row["rubrics"])
first_name = rubrics[0]["name"]
```

---

### 2.2 Struct 嵌套格式

在 struct 嵌套格式中，`rubrics` 被建模为真实的数组和结构体。

```json
{
  "id": "case_001",
  "rubrics": [
    {
      "name": "accuracy",
      "weight": 0.7,
      "items": [
        {
          "criterion": "answer should be correct",
          "critical": true,
          "weight": 1.0
        }
      ]
    }
  ]
}
```

系统看到的 schema 类似：

```text
id: string
rubrics: array<struct<
  name: string,
  weight: double,
  items: array<struct<
    criterion: string,
    critical: boolean,
    weight: double
  >>
>>
```

这时存储系统知道：

- `rubrics` 是数组；
- 数组元素是 struct；
- 每个 rubric 有 `name`、`weight`、`items`；
- `items` 又是一个数组；
- 每个 item 有 `criterion`、`critical`、`weight` 等字段。

---

## 3. 二者对比

| 维度 | String 扁平格式 | Struct 嵌套格式 |
|---|---|---|
| 存储方式 | JSON 整体作为字符串存储 | JSON 被拆成 array / struct / primitive 字段存储 |
| Schema 约束 | 弱，系统不知道内部结构 | 强，每个字段都有明确类型 |
| 查询能力 | 查询内部字段前需要 JSON parse | 可以直接查询 nested 字段 |
| 类型安全 | 较弱，写入时不校验 JSON 内部字段类型 | 较强，写入和读取时会校验字段类型 |
| 兼容性 | 高，新增字段通常不需要改表 schema | 中等，字段新增、删除、类型变化要考虑 schema 演进 |
| 读取复杂度 | 读取一个字符串字段，路径简单 | 需要读取多层嵌套结构，路径复杂 |
| 性能特点 | 整体读取简单；内部字段过滤较慢 | 分析查询友好；深层嵌套读取成本更高 |
| 出错位置 | 多发生在业务 JSON 解析阶段 | 可能发生在底层 Reader / Parquet / Iceberg / Magnus 读取阶段 |
| 适合场景 | 样本拉取、配置透传、评测输入、schema 不稳定的数据 | 数据分析、字段级过滤、聚合统计、schema 稳定的数据 |

---

## 4. 底层读取差异的直观演示

### 4.1 String 格式：一行里读一个大字符串

对于 string 格式，底层读取可以近似理解为：

```text
row_1:
  id       -> "case_001"
  rubrics  -> "[{...很长的一段 JSON 字符串...}]"
```

即使 `rubrics` 内容很复杂，底层也主要把它当成一个字符串值读取。

逻辑上是：

```text
读取 rubrics 字段 = 读取 1 个 string value
```

当然，如果字符串本身特别大，仍然可能带来大字段、内存或反序列化压力，但它不会被底层 Reader 拆成多层 nested values。

---

### 4.2 Struct 格式：一行会展开成很多 nested values

对于 struct 嵌套格式，底层读取不是“读一个 rubrics 字段”这么简单。

例如：

```json
{
  "rubrics": [
    {
      "name": "accuracy",
      "items": [
        {"criterion": "c1", "critical": true},
        {"criterion": "c2", "critical": false},
        {"criterion": "c3", "critical": true}
      ]
    },
    {
      "name": "safety",
      "items": [
        {"criterion": "c4", "critical": true},
        {"criterion": "c5", "critical": true}
      ]
    }
  ]
}
```

从业务视角看，这还是一行数据。

但从嵌套列式存储视角看，它会被拆成多组叶子字段，例如：

```text
rubrics.name:
  accuracy
  safety

rubrics.items.criterion:
  c1
  c2
  c3
  c4
  c5

rubrics.items.critical:
  true
  false
  true
  true
  true
```

也就是说：

```text
业务上的 1 行数据
  -> 可能展开成多个 rubrics
  -> 每个 rubric 又展开成多个 items
  -> 每个 item 再展开成多个叶子字段 values
```

如果某一条样本的 `rubrics` 很大，或者 `items` 数组特别长，底层实际读取的 values 数量可能远超“1 行”的直观感受。

---

## 5. 与 `Values read exceeded upper bound` 报错的关系

如下异常核心是：

```text
IOError: Values read exceeded upper bound
RuntimeError: ScanTask NextRecordBatch failed
```

结合 schema：

```text
rubrics: array<struct<
  items: array<struct<
    criterion,
    critical,
    evidence_source,
    how_to_verify,
    weight
  >>,
  name,
  weight
>>
```

这说明 `rubrics` 是典型的 struct 嵌套格式。

在这种格式下，Magnus / Parquet / Iceberg Reader 读取数据时，需要处理多层 array / struct，并读取多个叶子字段的 values。如果某一行的嵌套结构特别大，或者某个 nested 字段异常膨胀，就可能触发底层 reader 的 value 数量或 batch 大小上限。

因此，这类问题通常不是 `swalm eval` 业务逻辑直接导致的，而是业务逻辑在按 `__internal_uuid__` 拉取样本时，底层数据读取失败。

---

## 6. 如何判断是不是 nested 字段导致

可以按字段逐步读取定位。

### Step 1：只读取轻量字段

例如只读：

```text
__internal_uuid__
id
instance_id
```

如果成功，说明基础行定位没有问题。

### Step 2：逐个增加大字段

继续尝试读取：

```text
prompt
appendix_dir
rubrics
```

如果加到 `rubrics` 后开始失败，基本可以判断问题集中在嵌套字段 `rubrics`。

### Step 3：检查目标样本的嵌套规模

重点看：

- `rubrics` 数组长度；
- 每个 rubric 下的 `items` 数量；
- `criterion`、`evidence_source`、`how_to_verify` 是否存在超长文本；
- 是否有异常重复、递归式膨胀或脏数据；
- 单条样本展开后的 nested values 数量是否异常。

---

## 7. 选型建议

### 7.1 更适合 String 扁平格式的场景

如果数据主要用于：

- 评测任务按 ID 拉取整条样本；
- 业务侧完整读取后再解析；
- `rubrics` 只是配置或输入，不需要在 SQL 层频繁分析；
- 字段结构经常变化；
- 希望降低底层 nested reader 的复杂度；

那么建议使用：

```text
rubrics: string
```

优点是：

- schema 简单；
- 兼容性好；
- 不容易因为嵌套数组过长触发底层 Reader 的 nested value 上限；
- 适合评测样本、badcase、配置透传等场景。

代价是：

- 查询内部字段不方便；
- 需要业务侧 `json.loads`；
- 写入时无法依赖表 schema 校验内部字段类型。

---

### 7.2 更适合 Struct 嵌套格式的场景

如果数据主要用于：

- SQL 分析；
- 按 `rubrics.name` 聚合；
- 统计 `critical=true` 的 item 数；
- 过滤某类 `evidence_source`；
- 长期维护稳定 schema；
- 希望在写入时做字段类型约束；

那么 struct 嵌套格式更合适。

优点是：

- 字段语义清晰；
- 类型安全更好；
- 便于查询、过滤、聚合；
- 更适合数据仓库分析场景。

代价是：

- schema 演进成本更高；
- 深层嵌套读取更复杂；
- 单行复杂嵌套数据可能展开成大量底层 values；
- 更容易暴露 Parquet / Iceberg / Magnus nested reader 相关问题。

---

简化决策表

| 问题 | 推荐格式 |
|---|---|
| 只是按 ID 拉取整条样本做评测 | String 扁平格式 |
| `rubrics` 结构经常变化 | String 扁平格式 |
| 希望减少 nested reader 复杂度 | String 扁平格式 |
| 需要 SQL 查询 `rubrics.name` | Struct 嵌套格式 |
| 需要统计 nested item 字段 | Struct 嵌套格式 |
| 需要 schema 级类型校验 | Struct 嵌套格式 |
| 当前遇到 nested values 上限问题 | 优先考虑 String 扁平格式或限制 nested 规模 |


**String 扁平格式更稳、更简单、更适合评测样本透传；Struct 嵌套格式更结构化、更适合分析查询，但对底层 Reader 和数据规模更敏感。**
