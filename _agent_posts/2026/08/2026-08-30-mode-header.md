---
title: 小流量头
date: 2026-08-30
author: Sophie
tags: [basics]
excerpt: 浏览器小流量头"（Small Traffic Header）
---
## 一、请求头 vs 响应头

HTTP 消息由 **起始行 + Header + Body** 三部分组成。Header 又分为请求头和响应头，方向和用途完全不同。

| 维度 | 请求头（Request Header） | 响应头（Response Header） |
|---|---|---|
| 方向 | 客户端 → 服务器 | 服务器 → 客户端 |
| 谁产生 | 浏览器 / App / curl / SDK | 服务器 / 网关 / CDN |
| 作用 | 告诉服务器"我是谁、我要什么、怎么处理我" | 告诉客户端"结果是什么、怎么解析、怎么缓存" |
| 常见字段 | `Host`、`User-Agent`、`Accept`、`Authorization`、`Cookie`、`Content-Type`（POST 时）、自定义头如 `x-maas-env` | `Content-Type`、`Content-Length`、`Set-Cookie`、`Cache-Control`、`Access-Control-Allow-*`、`Server` |
| 能否被客户端修改 | ✅ 可以（插件、代码、抓包工具） | ❌ 客户端一般只能读取，不能改（除非通过代理伪造） |
| 小流量头属于哪一类 | **请求头** —— 由客户端注入，让网关识别并路由 | 不涉及 |

**一次典型请求的头交换：**

```
浏览器 ──请求头──> 网关/服务
   GET /api/xxx HTTP/1.1
   Host: ark.volcengine.com
   x-maas-env: hotfix          ← 小流量头在这里
   x-arkbff-env: pperelease
   Cookie: session=...

网关/服务 ──响应头──> 浏览器
   HTTP/1.1 200 OK
   Content-Type: application/json
   Set-Cookie: trace_id=...
   Cache-Control: no-store
```

**一句话记忆**：请求头是"我要什么"，响应头是"给你什么"。小流量头是**请求头**，作用就是在"我要什么"里额外声明一句"请把我路由到灰度/预发环境"。

---

## 二、什么是小流量头

**小流量头**（Small Traffic Header）指的是在 HTTP 请求头里注入的、用于标识"这次请求属于小流量 / 灰度流量"的字段。网关或服务框架识别后，会把流量路由到指定的**泳道**（lane）、**预发环境**（PPE）、**灰度版本**或**特定机房 / 集群**。

**常见形式：**

- `X-Tt-Env: ppe_xxx` / `X-Use-PPE: 1`
- `X-Tt-Small-Traffic: 1`
- `x-tt-header-lane: staging`
- `x-maas-env: hotfix`
- `x-arkbff-env: pperelease`
- `X-Canary: true`

字段名与取值**没有全公司统一标准**，由各业务线网关约定，需查对应业务的接入文档。

---

## 三、小流量头的主要作用

1. **流量分流 / 灰度发布**  
   新版本先只放开给带小流量头的请求，验证稳定后再全量，避免全量事故。

2. **环境隔离（PPE / Staging / BOE）**  
   开发或测试同学挂上头，就能让线上域名的请求打到预发 / 测试集群，不影响真实用户。

3. **泳道路由（Service Mesh Lane）**  
   微服务链路里，网关根据 header 把整条调用链固定在同一个泳道，方便多人并行开发和联调。

4. **AB 实验强制命中**  
   QA / PM 想直接命中某个实验分组时，用小流量头强制路由到对应实验版本，跳过随机分桶。

5. **问题复现与排查**  
   线上出问题时，SRE / RD 用小流量头把自己的请求打到带 debug 日志或特定版本的实例。

6. **对外零感知**  
   因为是 header 层控制，普通用户浏览器不会带这个字段，对生产流量完全无影响。

---

## 四、配置和使用方式

以火山方舟为例，需要注入：

```
x-maas-env: hotfix
x-arkbff-env: pperelease
```

作用范围：`https://ark.volcengine.com/`

### 方式一：浏览器插件（推荐日常使用）

用 **ModHeader** / **Header Editor** / **Requestly** 这类插件，图形化配置，改完立即生效。

**ModHeader 配置步骤：**

1. Chrome / Edge 应用商店安装 ModHeader，pin 到工具栏。
2. 新建一个 Rule：
   - **Rule type**: `Request headers`
   - **Name**: `ark-hotfix+ppe`（自定义，方便识别）
   - **URL mode**: `URL pattern`（推荐）或 `Domain`
   - **URL or domain**: `https://ark.volcengine.com/*`
3. 在 **Header modifications** 添加两行：

   | Type | Operation | Header name | Value |
   |---|---|---|---|
   | Request headers | Set | `x-maas-env` | `hotfix` |
   | Request headers | Set | `x-arkbff-env` | `pperelease` |

4. **Lifetime**: `Persistent`（持久保存）。
5. 打开右上角总开关（ON），保存。
6. 刷新页面，F12 → Network → 任意请求 → Request Headers 里应能看到这两个头。

**URL mode 说明：**

- `Current site`：跟随当前激活 Tab，切 Tab 时生效范围会变，容易混淆。
- `URL pattern`：按 URL 通配符匹配，推荐。
- `Domain`：按域名匹配，最简单。
- `Regex`：正则匹配，适合同时覆盖多个 API 域名，例如：
  ```
  ^https://(ark\.volcengine\.com|.*\.volcengineapi\.com)/.*
  ```

### 方式二：Chrome DevTools 原生（临时验证）

Chrome 137+ 支持在 DevTools 里手动加请求头，无需插件：

1. F12 打开 DevTools。
2. `Ctrl / Cmd + Shift + P` → 输入 `Show Network conditions`。
3. 勾选 **Enable Local Overrides** → **Override headers**。
4. 添加：
   - `x-maas-env: hotfix`
   - `x-arkbff-env: pperelease`
5. 刷新页面生效，DevTools 关闭后失效。

### 方式三：命令行 / 脚本调试

**curl：**

```bash
curl -H "x-maas-env: hotfix" \
     -H "x-arkbff-env: pperelease" \
     -H "Cookie: <你的登录 cookie>" \
     "https://ark.volcengine.com/api/xxx"
```

**Postman / Apifox**：在 Headers 面板加两行 key-value 即可。

**前端本地代码（axios 拦截器）：**

```js
axios.interceptors.request.use(cfg => {
  if (cfg.url.includes('ark.volcengine.com')) {
    cfg.headers['x-maas-env'] = 'hotfix';
    cfg.headers['x-arkbff-env'] = 'pperelease';
  }
  return cfg;
});
```

### 方式四：抓包代理（跨浏览器 / 跨 App）

适合需要同时改多个域名、跨浏览器或 App 生效的场景。以 **Whistle** 为例：

```
ark.volcengine.com reqHeaders://{ark-ppe-headers}
```

Values `ark-ppe-headers` 定义：

```
x-maas-env: hotfix
x-arkbff-env: pperelease
```

浏览器 / App 走 Whistle 代理即可命中。

---

## 五、具体值的含义（以方舟为例）

- `x-maas-env: hotfix` → 路由到 MaaS（模型即服务）后端的 **hotfix 分支**环境，通常是修复紧急问题的临时环境。
- `x-arkbff-env: pperelease` → 路由到方舟 BFF 层的 **预发布（PPE / pre-release）**环境，用来在上线前验证前后端联调。

两个头一起用，实现"前端 BFF 走预发 + 后端 MaaS 走 hotfix"的组合联调。

---

## 六、验证是否生效

1. 触发一次实际接口请求（比如点一下调用模型、进入控制台某页面）。
2. F12 → **Network** → 选中任意 XHR / Fetch 请求。
3. 查看 **Headers → Request Headers**，能看到目标头即生效。
4. 也可看 Response Headers 里网关回带的 `x-tt-logid`、`x-env` 等，确认后端确实识别到了。

---

## 七、常见坑

| 现象 | 排查方向 |
|---|---|
| 头没生效 | 插件图标是否是彩色（生效）而非灰色；URL 规则是否覆盖到 API 域；总开关是否 ON |
| API 域名不同 | 页面域名 `ark.volcengine.com`，接口可能是 `*.volcengineapi.com`，需要额外加规则 |
| CORS preflight（OPTIONS）失败 | 网关未把自定义头加入 CORS 白名单，需联系对应服务同学加白 |
| 登录态失效 | 小流量头通常仍需要正常登录态，先确保能登录再挂头 |
| 缓存干扰 | `Ctrl + Shift + R` 强刷；DevTools 勾 **Disable cache** |
| 生产数据被污染 | 日常浏览时把 ModHeader 规则关掉，避免把预发头带到生产埋点 |
| 头带上了但路由没变 | 值拼写是否正确（大小写通常不敏感，但值一定要准）；是否被 CDN 缓存了旧响应 |

---

## 八、最佳实践

- **命名有辨识度**：把 rule 命名成 `业务-环境` 格式，如 `ark-hotfix+ppe`，避免规则多了以后找不到。
- **按业务分 Folder**：ModHeader 支持 Folder，一键开关整组规则。
- **联调完及时关**：养成"用完即关"的习惯，避免长期挂着影响埋点和 AB 数据。
- **不同环境不同 Profile**：ModHeader 支持多 Profile 切换，可分别配置 hotfix / ppe / boe，按需切换。
- **团队共享**：Header Editor / ModHeader 都支持导出 JSON，团队内可共享规则集。

