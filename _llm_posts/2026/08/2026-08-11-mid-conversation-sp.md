---
title: Claude mid-conversation sp
date: 2026-08-11
author: Sophie
tags: [agent, harness]
excerpt: TODO
---
> 来源:Claude 官方文档《Mid-conversation system messages and tool changes》
> 原文:https://platform.claude.com/docs/en/build-with-claude/mid-conversation-system-messages

---

## 一句话总结

**Mid-conversation system message(会话中系统消息)就是一条插在 `messages` 数组中间、带"运营方(operator)权威"的 `role: "system"` 消息**,用来在**不破坏 prompt 缓存前缀**的前提下,于对话中途追加系统级规则、转达状态变化或转达用户插话。

| 能力 | 状态 | Beta Header | 支持模型 |
|---|---|---|---|
| **Mid-conversation system messages** | 正式可用(GA) | 不需要 | Fable 5、Mythos 5、Opus 4.8、Opus 5、Sonnet 5 |
| **Mid-conversation tool changes** | Beta | `mid-conversation-tool-changes-2026-07-01` | Fable 5、Mythos 5、Opus 4.8、Opus 5(**不支持 Sonnet 5**) |

两者均可用于 Claude API、Amazon Bedrock、Google Cloud。

---

## 一、要解决的问题

系统指令通常放在顶层 `system` 字段,位于所有消息之前。这个位置对 prompt caching 很友好(系统提示是稳定前缀的一部分,后续轮次命中缓存),但对"会话中途才发现需要"的指令很糟糕。

Prompt caching 按顺序对请求前缀做哈希:**先 `tools`,再 `system`,最后 `messages`**。缓存命中要求前缀逐字节完全匹配(byte for byte),直到缓存断点。

因此顶层 `system` 越靠前,**任何改动(哪怕只加一句话)都会产生不同哈希**,让系统提示及其后所有缓存消息全部 miss,整段历史重新处理、重新计费。

## 二、解决方案

在对话中新指令变得相关的位置,**追加一条 `{"role": "system"}` 消息**,而不是编辑顶层 `system` 字段。这样:

- 缓存前缀保持不变,下一次请求仍从缓存读取;
- 新指令仍以**系统指令**(而非普通用户文本)的身份被应用。

---

## 三、形象例子:代码审查助手

### 场景:审查到一半,团队追加了新规矩

初始对话(顶层 `system` 定整体人设):

```json
{
  "model": "claude-opus-5",
  "system": "You are a code review assistant. Be concise.",
  "messages": [
    { "role": "user", "content": "帮我审查 utils.py 里的 process() 有没有性能问题。" },
    { "role": "assistant", "content": "小输入下列表推导没问题;大输入建议改用生成器,避免一次性物化整个列表。" },
    { "role": "user", "content": "再看看调用 process() 的那段代码。" }
  ]
}
```

审查到这里,想加一条新规矩:**从现在起,每条建议都必须带显式类型标注**。

- **❌ 笨办法**:改顶层 `system` 字段 → 改动了 prompt 最开头 → 前面几轮缓存全部失效,整段对话重新计费。
- **✅ 正确办法**:在 `messages` 末尾追加一条 system 消息:

```json
{
  "model": "claude-opus-5",
  "system": "You are a code review assistant. Be concise.",
  "messages": [
    { "role": "user", "content": "帮我审查 utils.py 里的 process() 有没有性能问题。" },
    { "role": "assistant", "content": "小输入下列表推导没问题;大输入建议改用生成器……" },
    { "role": "user", "content": "再看看调用 process() 的那段代码。" },

    // 👇 这就是 mid-conversation system message
    {
      "role": "system",
      "content": "From now on, every suggestion must include explicit type annotations."
    }
  ]
}
```

前面三条消息**一个字节都没变**,缓存照命中;只有新加的这条 system 消息作为新输入被处理。且这条指令带**系统级权威**——即使后面用户说"不用加类型标注了",Claude 也以系统指令优先。

### 关键对比:内容放哪,身份就不同

| 插入内容放哪 | Claude 怎么看待它 |
|---|---|
| 放 `user` 消息 | 当作**终端用户**说的话,和用户请求同级 |
| 放 mid-conversation `system` 消息 | 当作**你(应用运营方)**下的指令,冲突时优先于用户 |

> 关键区别在**优先级**:两者冲突时系统指令优先。mid-conversation system message 在保留 operator 级优先级的同时,避免了编辑顶层 `system` 字段的缓存 miss 成本。

---

## 四、Agent 循环里的经典用法:转达"用户插话"

让 Claude "跑测试并修复失败",它正执行工具时,用户又打了一句"顺便把 changelog 也更新了"。把用户这句话包装成 system 消息,放在 **tool result 之后**:

```json
[
  { "role": "user", "content": "跑一遍测试套件,修复所有失败。" },
  {
    "role": "assistant",
    "content": [{ "type": "tool_use", "id": "toolu_01", "name": "run_tests", "input": {} }]
  },
  {
    "role": "user",
    "content": [
      { "type": "tool_result", "tool_use_id": "toolu_01", "content": "12 passed, 0 failed" }
    ]
  },
  {
    "role": "system",
    "content": "The user sent the following message while you were working: also update the changelog before you finish."
  }
]
```

这样 Claude 会把新要求**融进正在做的活儿**,而不是当成新请求打断重启。

> 措辞要**陈述事实**("用户发来了这条消息:X"、"剩余 token 预算现为 Y"),而不是"忽略之前的、改做 Y"。Claude 被训练为抵制看起来对抗用户的指令,这种保护同样适用于系统角色,因此对抗式措辞效果更差。
>
> 此模式仅用于转达**对话自身终端用户**的输入。不要用它传工具输出、检索文档或其他第三方内容——那些要留在 `tool_result` 块里。

---

## 五、Mid-conversation tool changes(工具变更,Beta)

`tools` 数组在哈希前缀里比 `system` 还靠前,编辑它会让整段对话缓存失效。做法:

- **在 `tools` 里一次性声明完整工具集且永不改动**;
- 用 `tool_addition` / `tool_removal` 内容块在轮次之间"开放"或"撤回"某个工具;
- `tools` 数组本身从不改变,缓存前缀保持完整。

要点:

- `tool_addition` / `tool_removal` 是 `role: "system"` 消息 `content` 数组里的内容块,可与 `text` 块混用;遵循与普通 mid-conversation system 消息相同的放置规则,变更从该点往后生效;
- 每个块的 `tool` 字段是**引用**而非定义:
  - `{"type": "tool_reference", "name": "..."}` 引用 `tools` 中已声明的工具;
  - MCP 工具可用 `mcp_tool_reference`(`server_name` + `name`,单个)或 `mcp_toolset_reference`(`server_name`,整个工具集)引用;
- 引用未在 `tools` 中声明的名字返回 **400 错误**;
- `tools` 中声明的工具默认从对话开始就开放,除非带 `defer_loading: true`(被 withhold,直到 `tool_addition` 才 surface);`tool_addition` 也能重新开放之前被 `tool_removal` 撤回的工具。

示例(撤回 `get_weather`):

```python
client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-opus-5",
    max_tokens=1024,
    betas=["mid-conversation-tool-changes-2026-07-01"],
    # 完整工具集一次声明,永不改变,缓存前缀保持完整
    tools=[
        {
            "name": "get_weather",
            "description": "Get the current weather for a location.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "location": {"type": "string", "description": "City name"},
                },
                "required": ["location"],
            },
        },
    ],
    messages=[
        {"role": "user", "content": "Say OK."},
        # 从这点起撤回 get_weather。块按名字引用工具,而非编辑 tools,
        # 因此更早的轮次保持字节一致,缓存仍命中。
        {
            "role": "system",
            "content": [
                {
                    "type": "tool_removal",
                    "tool": {"type": "tool_reference", "name": "get_weather"},
                },
            ],
        },
    ],
)
```

---

## 六、什么时候该用(典型场景)

1. **会话中途的策略/人格变更**——长 agent 会话在几十轮缓存后需要新约束(如"从现在起所有 SQL 都写成参数化查询")。
2. **必须具权威性的逐轮上下文**——注入新鲜度提示、会话截止时间、工具可用性变更,且变化太频繁不适合放进缓存前缀。
3. **应用观测到的状态变更**——磁盘文件变了、用户切换了自动批准设置、可用工具变了、剩余 token 预算跌破阈值等 operator 级事实。
4. **不应打断 agent 循环的用户输入**——用户在 Claude 执行工具时打字追加,把它作为系统消息放在下一个 tool result 之后(见第四节)。
5. **授予长期权限的模式切换**——会话级模式可用它授予对昂贵能力的长期同意(如自动启动多 agent 工作流),配合每隔几轮的简短提醒和退出模式时的通知。

---

## 七、工作机制与放置规则

- 在 `messages` 数组里加一条 `"role": "system"` 消息,`content` 用纯字符串或内容块(与 user/assistant 轮次相同);
- 指令**从该位置往后**生效;冲突时**后面的系统消息优先于前面的**,且 mid-conversation 系统消息优先于顶层 `system` 字段(对其后的轮次);
- 顶层 `system` 字段仍可用于作用于整段对话的指令;mid-conversation 消息留给"只在后面才相关"或"想在不失效缓存前提下追加"的指令。

**放置约束**:

- 系统消息必须**紧跟在一个用户轮次之后**(含携带 `tool_result` 块的用户轮次),或以 server tool result 结尾的助手轮次之后;
- 并且要么是 `messages` 最后一项,要么**紧接一个助手轮次**;
- 放在其他位置(**包括 `tool_use` 块与对应 `tool_result` 之间**)返回 **400 错误**。

---

## 八、与 Prompt Caching 结合

1. **显式开启缓存**:只有请求含 `cache_control`(顶层自动缓存字段或某内容块上的显式断点)时才缓存;mid-conversation 系统消息本身不创建缓存条目。
2. **像往常一样缓存稳定前缀**:把 `cache_control` 放在跨请求保持不变的最后一个块上(顶层 `system` 末尾、工具定义末尾,或消息历史中的稳定点)。
3. **在断点之后追加系统消息**:因其位于缓存前缀之后,不改变前缀哈希,缓存仍命中。
4. **mid-conversation 系统消息自身也可缓存**:一旦进入对话就成为稳定历史的一部分,下一轮可把断点移到它之后(或依赖自动缓存),它就像其他轮次一样从缓存读取。

> **不要编辑或删除已发送的 mid-conversation 系统消息**——和改动任何更早消息一样,会从该点起使缓存失效。需要演进就**追加新消息**,而非重写旧的。连续的系统消息会被当作单一系统段处理,遵循整体相同的放置规则。
>
> 注:缓存还要求对话达到最小可缓存 prompt 长度;过短的示例会低于该阈值,`cache_creation_input_tokens` 和 `cache_read_input_tokens` 会保持为 0,直到对话变长。

---

## 九、限制(Limitations)

- **不能当第一条消息**:`messages` 首条不能是 system(起始指令请用顶层 `system` 字段)。
- **放置受限**:如第七节所述,错误位置返回 **400**。
- **不放不可信内容**:Claude 把系统内容当 operator 指令执行,**不要**把原始工具输出、检索文档、网页内容等外部文本直接放进系统消息(会赋予其 operator 级权威),这类数据应保留在 `tool_result` 块中,并继续遵循防越狱/防注入的最佳实践。
