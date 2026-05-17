---
layout: post
title: Hermes Agent
date: 2026-05-13
author: Sophie
category: Agent
tags: [general agent, harness, hermes agent]
excerpt: 本文讨论了对 Hermes Agent 这一通用 agent 平台的调研分析，涉及定位、系统提示、工具系统、目录发现机制、上下文压缩、规划模式、子代理机制、自我进化机制以及网关架构等方面。
---

# System Prompt
Hermes Agent 的 system prompt 核心目标，是把它塑造成一个覆盖问答、代码、分析、创作、工具执行等多场景的通用 Agent。相比只聚焦 coding 的框架，它更强调技能沉淀、跨会话记忆和多平台适配，因此整体设计更接近一个可持续演化的通用 Agent 平台。

system prompt 中最关键的约束可以概括为：
- 身份定位：Hermes Agent 是用来完成问答、代码、分析、创作、工具执行等全场景任务，而非像claude code主要是完成code任务，更像是openclaw。
- 持久记忆：记忆主要用来长期稳定保存跨会话的固定信息，比如用户使用偏好、环境配置、工具特点和固定规范内容，不会记录临时任务进度、会话记录、待办事项以及各类流程操作步骤；内容书写仅使用陈述句，不采用命令式表述，避免被误判为强制指令，同时遇到过往对话相关内容时，会优先检索历史信息，尽量不让用户重复说明。
- 可复用技能（自进化）：针对复杂任务、疑难报错和通用流程这类高频场景，都会沉淀为可复用的技能内容，同时技能需要长期跟进维护，一旦发现内容过时、存在错误或是信息残缺，就会主动进行修补与更新，保证内容准确可用。
- 工具使用要求：在使用工具开展工作时有明确要求，要坚持行动优先，不能只罗列计划却不实际执行，但凡确定要进行的操作都需立刻调用对应工具落实，杜绝拖延与空泛承诺；同时做到全程闭环执行，持续推进工作直至任务完成并核验结果，不半途中断；并且每一次回复，要么通过工具调用推动任务进展，要么直接给出最终结论。
- 工具使用原则：日常工作需严格遵守全局执行纪律，所有计算、系统信息、文件内容、实时网络数据及哈希编码等内容，都不能依靠心算或记忆判断，必须借助指定工具查询获取；遵循少提问原则，常规默认场景直接推进执行，只在歧义会严重影响操作结果时才向用户确认；正式操作前会提前校验前置条件与依赖项，不省略关键排查步骤；产出结果会从正确性、事实依据、格式规范和操作安全四个维度严格核验；遇到信息不足的情况绝不主观脑补，优先通过工具检索补充，检索无果再向用户询问，缺少必要条件时会清晰标注相关假设；若工具返回内容为空或信息残缺，会及时更换方式重试，不会随意终止操作。
- Google的模型专属prompt补丁：进行文件操作时必须使用绝对路径，修改文件前要先读取内容完成核验，杜绝凭猜测判断文件内容；操作前务必提前检查项目依赖与配置，不能默认相关库已完成安装；输出文案保持简洁精炼，聚焦核心动作和最终结果；支持批量并行调用工具，命令行操作统一使用非交互参数避免进程阻塞，全程自主推进、闭环完成全部工作。
- 强制skill机制（hermes agent自进化机制基于skills，为了让沉淀的知识被充分用到，因此在SP中指定要优先使用skills）：所有对话都要优先检索并加载匹配的可用技能，只要内容相关就必须严格遵照执行；技能整合了专属业务与各类工具的最优实操规范，执行优先级高于通用处理方式；如果发现技能存在问题会及时修正，完成复杂任务后，还会沉淀梳理出新的实用技能。
- 环境&多平台适配：会自动读取并加载项目本地的上下文配置文件，同时做好各类特殊环境的适配工作，比如在 WSL 环境中自动映射 Windows 挂载路径、为特定模型设置专属输出标识；还会根据 CLI、各类社交办公软件以及定时任务等数十种不同使用平台的差异，针对性定制排版样式、媒体发送、格式渲染和交互限制等专属规则，实现多平台的平稳适配。

# 工具
Hermes Agent 的工具系统采用自注册模式：每个工具在代码层面定义后，会自动注册到中央注册表，供模型调用。这让用户扩展工具的门槛较低，通常只需要定义 Python 函数并加上装饰器即可。

`tools/` 目录下大约有 80 个 Python 文件、247 个函数实现，但这里需要区分两个层级：`247` 指的是底层实现总数，真正直接暴露给模型调用的核心工具约为 `60-70` 个。

这 247 个底层实现大致可以分成以下几层：

| 层级 | 规模 | 说明 |
| --- | --- | --- |
| 模型可见的核心工具 | ~60+ | 如 `read_file`、`web_search`、`browser_navigate`、`delegate_task` 等，是真正直接暴露给模型调用的工具 |
| 多后端适配层 | ~20+ | 浏览器自动化支持 Browserbase、Browser Use、Firecrawl、Camofox 等多个云服务商，各自包含连接、认证和重试逻辑 |
| 执行环境抽象 | ~30+ | 覆盖 `local`、`docker`、`ssh`、`modal`、`daytona`、`singularity` 六种运行环境的同步、执行与生命周期管理 |
| 工具内部辅助函数 | ~100+ | 如浏览器会话管理、页面快照解析、元素定位、MCP OAuth 流程管理、工具结果压缩等 |
| 安全与校验层 | ~30+ | 如路径安全检查、URL 过滤、凭据白名单、危险命令审批、Prompt 注入检测等 |

Hermes Agent 的工具调用还有几个值得注意的特点：
- Hermes Agent没有 Claude Code 那种自动并发批次调度，工具调用严格按模型输出顺序串行执行。
- Hermes Agent在工具调用这块也有长度管理，当单个工具的 max_result_size_chars 超限后，tools/tool_result_storage.py 会把结果持久化到磁盘，模型收到路径引用。这和 Claude Code 的思路一致，但 Hermes 还加了一层"每轮全局工具结果预算"——所有工具本轮的累计结果字符数达到上限后，后续工具结果整体被裁剪，避免一轮里多个大结果合起来把 context 撑爆。
- 由于Hermes Agent定位是通用agent，需要考虑更多的场景，增加了很多浏览器工具、多模态工具，降低完成这些任务的难度（如果给code agent框架，可能就得花掉更多的token自己写一些工具出来）。
- Hermes Agent主打的“自进化”能力主要依托skills机制，因此专门设计了skills相关机制。
- Hermes Agent主打多平台，因此也为飞书、discord设计了相关工具
- Hermes Agent为tinker-atropos训练平台定制了RL训练的接口，能够让hermes agent自动管理RL模型训练实验。（RL训练和Hermes Agent所说的自进化能力没关系，自进化机制是通过skills为媒介实现的）

Hermes Agent 对外暴露的工具大致如下：

## 文件与终端
- read_file — 读取文件，支持行偏移和二进制扩展名检测
- write_file — 覆盖写入文件
- patch — 基于 diff/块替换的精细编辑
- search_files — 基于 ripgrep 的全文搜索
- terminal — 持久化 shell 会话（每个 task_id 一个独立 shell）
- process — 前后台进程管理

## Web 与浏览器
- web_search — 搜索引擎查询（支持 Exa / Firecrawl / Parallel / Tavily 多后端）
- web_extract — 网页内容抓取
- browser_navigate — 浏览器导航
- browser_snapshot — 获取页面可访问性树快照
- browser_click / browser_type / browser_scroll / browser_back / browser_press — 元素交互操作
- browser_get_images — 提取页面图片
- browser_vision — 视觉模式浏览（截图 + 分析）
- browser_console — 读取/执行浏览器控制台命令
- browser_cdp — 直接下发 Chrome DevTools Protocol 命令
- browser_dialog — 处理浏览器弹窗（alert/confirm/prompt）

## 委派与规划
- delegate_task — 启动子 Agent，支持多并发（默认最多 3 个并发子任务）
- clarify — 向用户提问（平台相关，CLI 交互式，Gateway 异步队列）
- todo — 轻量 todo 列表管理
- memory — 持久化记忆读写（MEMORY.md / USER.md）
- execute_code — 执行 Python 脚本（可直接调用工具，减少 LLM 轮次）

## 技能与跨会话
- skills_list / skill_view / skill_manage — 技能系统三件套
- session_search — 基于 SQLite FTS5 的跨会话文本检索

## 多模态
- vision_analyze — 图像分析
- image_generate — 文本到图像
- text_to_speech — TTS 合成（支持 Edge TTS、ElevenLabs、OpenAI、xAI 等）
- transcribe — 语音转文字（支持 OpenAI Whisper、Deepgram、本地模型等）

## 高级推理与混合
- mixture_of_agents — 调用多个模型并聚合答案（MoA）

## 平台与外部系统
- send_message — 跨平台消息发送（Telegram/Discord/Slack/WhatsApp/Signal/Email/SMS 等）
- cronjob — 定时任务管理
- ha_list_entities / ha_get_state / ha_list_services / ha_call_service — Home Assistant 智能家居
- discord / discord_admin — Discord 消息读取、成员搜索、频道管理、角色分配
- feishu_doc_read — 飞书文档读取
- feishu_drive_list_comments / feishu_drive_reply_comment / feishu_drive_add_comment — 飞书文档评论操作
- MCP 工具（动态注册）— mcp____ 格式，热加载

## RL 训练（Tinker-Atropos 集成）
- rl_list_environments / rl_select_environment — 列出/选择 RL 环境
- rl_start_training / rl_stop_training / rl_check_status — 启停训练、查看状态
- rl_get_results / rl_list_runs / rl_test_inference — 获取结果、列出运行、测试推理

# 仓库目录树感知能力
与 Claude Code 选择"不注入目录树，只注入 git 状态"不同，Hermes 实现了一套渐进式目录发现机制。这套机制要解决的核心问题是：Agent 在会话进行中探索代码库时，如何自动感知它所进入的目录上下文。

## 为什么要做渐进式目录发现？
假设我们在一个全栈项目的根目录启动 Hermes，Agent 先浏览了根目录的文件，然后你让它深入看看后端代码。它读取了 backend/src/models/user.py，接着又看了 backend/src/services/auth.py。随着 Agent 的探索范围从根目录扩展到后端子系统，它应该能自动感知到"我现在正在后端目录里工作"，并应用后端目录的特定规则。如果没有渐进式发现，会出现几个问题：
- 启动时扫描范围有限：会话启动时，Hermes 只会扫描当前工作目录及其祖先目录的上下文文件（如 .hermes.md、HERMES.md）。如果你在项目根目录启动，启动时的扫描不会触及 backend/ 或 frontend/ 子目录里的上下文文件——因为它们不是当前目录的祖先。
- 手动切换工作目录破坏会话连续性：如果想让模型看到子文件夹的上下文文件（hermes.md等），你可以手动 cd backend/ 然后重新启动 Hermes，但这会中断当前会话的对话历史，丢失已经建立的上下文。
- 大型项目的子系统隔离需求：大型项目往往有多个子系统（前端、后端、基础设施、文档等），每个子系统有自己的技术栈和约定。把所有规则塞进根目录的一个上下文文件会导致文件臃肿，而且不同子系统的规则可能互相冲突。
渐进式目录发现就是为解决这些问题而设计的：让 Agent 在探索代码库的过程中，自动发现它所进入目录的上下文，无需重启会话，也无需手动切换工作目录。

## 渐进式目录发现的工作原理
下面用一个具体例子展示这套机制是如何工作的。假设项目结构如下：

```text
my-project/
├── HERMES.md              # 根目录：通用项目约定
├── backend/
│   ├── HERMES.md          # 后端目录：Django + PostgreSQL 约定
│   └── src/
│       └── models/
│           └── user.py
└── frontend/
    └── HERMES.md          # 前端目录：React + TypeScript 约定
```

它的执行过程可以拆成 6 个阶段：

1. **启动会话**
在项目根目录启动 Hermes，系统先加载根目录的 `HERMES.md`，建立全局项目背景。此时 Agent 还不知道后端和前端目录的专属规则。

2. **探索后端目录**
用户让 Agent “看看后端用户模型是怎么定义的”。Agent 调用工具读取 `backend/src/models/user.py`。

3. **路径提取与目录发现**
系统从工具调用中提取到路径 `backend/src/models/user.py`，识别出这是一个新的目录上下文（`backend/` 及其子目录），并检查该目录是否已经被处理过。

4. **向上扫描上下文文件**
系统从 `backend/src/models/` 开始向上扫描，最多回溯 5 层，查找上下文文件。此时它会发现 `backend/HERMES.md`，而根目录的 `HERMES.md` 因为已经在启动时加载过，所以不会重复注入。

5. **把子目录上下文拼接到工具结果中**
`backend/HERMES.md` 的内容会被附加到当前工具结果里。能够触发这一步的工具主要有两类：
- 文件操作工具：如 `read_file`、`write_file`、`patch` 等，这些工具都带有 `path` 或 `file_path` 参数
- 终端工具：如 `terminal`，系统会从命令字符串里解析路径，例如执行 `cat backend/src/models.py` 时，也能识别出相关目录

Agent 看到的结果会类似于：

```text
文件内容：user.py 的代码...]

[Subdirectory context discovered: backend/HERMES.md]
本后端服务使用 Django ORM，数据库为 PostgreSQL：
- 所有模型必须继承自 BaseModel
- 外键字段必须设置 related_name
- 使用 pytest-django 进行测试，运行命令：pytest backend/ -v
- 数据库迁移需通过 ./manage.py migrate 执行
```

6. **模型获得新的目录上下文**
Agent 在收到文件内容的同时，也拿到了后端目录的局部规则。如果接下来用户要求它“给这个模型写个测试”，它就可以按照后端目录的约定生成代码，而不需要重启会话。

Hermes将子目录的上下文文件注入到工具返回而不是system prompt，是为了防止KV cache失效。渐进式目录发现能力有去重机制，每个目录的上下文只会被加载一次。系统维护一个已访问目录的集合，避免重复处理同一个目录。从工程角度看，这也反映了 Hermes 的多租户基因：作为同时服务多个平台、多个用户的 Agent 服务端，它更倾向于"按目录组织配置"，让不同项目、不同子系统可以自然地隔离和定制自己的行为规则。

# context压缩
Hermes 的 context 压缩策略相比 Claude Code 更简单，也更保守。它会在当前消息总 token 数达到模型 context window 的 `50%` 时触发压缩，而很多框架通常会拖到 `80%-90%` 才开始处理。

之所以把阈值设在 50%，核心原因是压缩本身也需要调用一次辅助模型（如 Claude Haiku 或 Gemini Flash）生成摘要。如果等到上下文几乎占满再压缩，就容易出现一轮对话里连续发生“快满了 -> 压缩 -> 又快满了”的情况，整体延迟会明显上升。提前触发则可以让一次摘要覆盖后续更多轮对话。

压缩不是简单地把整段历史压缩，而是有选择地保留关键部分，把中间内容摘要化：

| 区域 | 保留策略 | 作用 |
| --- | --- | --- |
| 头部 | 最开始的 3 条消息原样保留 | 保存任务背景和最初目标，避免模型忘记“我们在做什么” |
| 尾部 | 最近几轮对话完整保留，约占 context window 的 20% | 保持对当前状态、最近操作和用户最新要求的感知 |
| 中间部分 | 交给辅助 LLM 生成摘要，摘要长度约为原内容的 20% | 压缩历史信息，同时保留问题、决策、错误与文件等关键线索 |

中间摘要通常会保留这些信息：
  - 已解决的问题，例如："用户询问如何部署到 Kubernetes → 已提供 kubectl apply 命令"
  - 待处理的工作/当前活跃任务，例如："等待用户确认是否使用 Helm chart"
  - 关键事实与决策，例如："集群运行在 GKE us-central1"
  - 剩余工作项，例如："配置 ingress"
  - 错误模式与修复（如有），例如："遇到权限错误 → 已通过 sudo 解决"
  - 涉及的文件和资源，例如："主要修改了 deployment.yaml、service.yaml"

长会话可能触发多次压缩。如果每次都重新摘要整个历史（包括上次的摘要），会出现"摘要的摘要的摘要"问题——早期的重要细节会在层层摘要中逐渐稀释。Hermes 的解决方案是增量合并：
- 第一次压缩：把早期的对话历史摘要成一份摘要 A。
- 第二次压缩：不是重新摘要"摘要 A + 新对话"，而是把摘要 A 作为背景，加上新积累的对话，生成一份合并后的新摘要 B。提示词明确要求辅助 LLM"保留旧摘要里的关键事实"。
- 第三次及以后：重复这个逻辑，每次都在前一次摘要的基础上增量合并。

# plan
与 Claude Code 不同，Hermes 没有独立的 Plan 模式。
Claude Code 的 Plan 模式是一个显式的权限状态——进入后写操作被系统拦截，模型只能进行只读探索，直到用户审批通过才能进入执行阶段。这套机制需要专门的工具（EnterPlanMode、ExitPlanMode）、UI 审批流程、以及权限系统的配合。Hermes 选择不做这个机制，原因可能包括：
- 设计哲学差异：Hermes 倾向于用工具而非模式来解决问题。如果用户希望 Agent 先规划再执行，可以直接在 prompt 里说明，或者使用 todo 工具让 Agent 把计划写成任务列表。不需要一个系统级的"模式切换"来强制执行。
- 多平台复杂性：Hermes 要支持 20+ 个平台（Telegram、Discord、Slack 等），其中很多是异步消息场景，没有"弹出 UI 审批对话框"的条件。Claude Code 的 Plan 模式依赖交互式 TUI，在消息平台上无法复现。

虽然没有 Plan 模式，Hermes 提供了 `todo` 工具来承担相近能力：一方面帮助模型拆解复杂任务，另一方面通过 `pending / in_progress / completed` 跟踪执行进度。下面是一个典型例子：

用户：帮我实现一个用户认证系统

Agent：我来先规划这个任务，并创建一个任务列表。随后调用 `todo` 工具。

todo 工具输入：

```json
{"todos": [{"id": "1", "content": "设计数据库用户表结构", "status": "pending"},{"id": "2", "content": "实现密码哈希和验证", "status": "pending"},{"id": "3", "content": "创建登录/注册 API", "status": "pending"},{"id": "4", "content": "添加 JWT token 生成", "status": "pending"},{"id": "5", "content": "写单元测试", "status": "pending"}],"merge": false}
```

todo 工具输出：

```json
{"todos": [{"id": "1", "content": "设计数据库用户表结构", "status": "pending"},{"id": "2", "content": "实现密码哈希和验证", "status": "pending"},{"id": "3", "content": "创建登录/注册 API", "status": "pending"},{"id": "4", "content": "添加 JWT token 生成", "status": "pending"},{"id": "5", "content": "写单元测试", "status": "pending"}],"summary": {"total": 5, "pending": 5, "in_progress": 0, "completed": 0, "cancelled": 0}}
```

# sub agent
Hermes的sub agent机制通过主agent调用delegate_task工具进行委派，与 Claude Code 相比，Hermes 的子sub Agent 机制偏保守。
- 层数：Hermes 默认只允许一层委派——父 Agent 可以启动子 Agent，但子 Agent 不能再启动孙 Agent。claude code则没有这样的限制。
- 并发数：父 Agent 同时运行的子 Agent 数量默认限制为 3 个，防止资源过度消耗。

Hermes 的子 Agent 不继承父 Agent 的对话历史。每个子 Agent 从空白状态开始，只收到父 Agent 通过delegate_task 传入的任务描述。


# 自我进化机制
Hermes Agent 宣传的一个核心卖点是"self-improving"。Hermes 的 self-improving 不是"模型权重在线更新"，也不是"后台自动学习"，而是一套显式的知识沉淀机制——模型通过工具主动记录经验，下次会话自动加载，形成"一次比一次做得好"的循环。
self-improving机制主要基于更加完善的memory机制来记住用户偏好（比如用户倾向于用pandas库处理csv文件）以及用沉淀skill机制来保存复杂的操作流程（比如整理一份文件需要先清洗空值，再按日期分组，最后计算平均值）。
Hermes能够做到self imporving 机制需要在system prompt、工具设计、memory等各个基础组件上做针对性的定制。
system prompt引导
SP明确说明了如果遇到复杂操作，需要沉淀为skill，方便后续调用，提高自身能力，同时也强调了如果技能存在问题，需要及时的进行skill修复。具体prompt如下：
完成复杂任务（调用工具 5 次及以上）、修复棘手报错，或是摸索出一套实用流程后，要用 skill_manage 将这套方法保存为技能，方便后续复用。
使用技能时如果发现内容过时、流程不全或存在错误，主动立即用 skill_manage(action='patch') 修补，不要等他人提醒。得不到维护的技能，终将变成累赘隐患。
SP明确说明了，模型在回复先，先看skill，看看之前有没有沉淀下来有用的skills，避免绕弯路：
回复前，请先通读下方所有技能。若某项技能与你的任务匹配，哪怕只是部分相关，你都必须用skill_view(name) 加载该技能，并严格遵循其指令执行。
宁可多加载无关技能，也绝不遗漏关键流程、潜在坑点和既定工作规范。技能中包含专属专业知识：API 接口地址、专属工具命令、经过验证的成熟工作流，效果远优于通用处理方式。
即便你认为只用网页搜索、终端等基础工具就能完成任务，也依然要加载对应技能。
技能同时固化了用户在代码审查、方案规划、测试等任务上的惯用处理方式、格式规范和质量标准。哪怕是你本来就会做的任务，也要加载技能 —— 因为技能规定了在此环境下必须按这套标准来做。
若加载的技能存在问题，使用 skill_manage(action='patch') 进行修复。完成复杂任务或多轮迭代任务后，主动询问是否将本次流程保存为新技能。如果你加载的技能存在步骤缺失、命令错误、未标注潜在风险等问题，请在任务结束前主动更新完善该技能。
更加完善的memory机制
Hermes 主要依赖 `MEMORY.md` 和 `USER.md` 两类文件记录跨会话信息，并额外提供 `memory` 工具让 Agent 把重要信息写入持久化存储。记忆文件默认会加载到 system prompt 中，但**本次会话的 system prompt 在启动后不会变化**，新增记忆需要等到下次会话启动时才会作为新快照读入。这种设计主要是为了保护 prefix cache，因此 memory 机制本质上是面向跨 session 的。

两类记忆文件的职责分工如下：

| 文件 | 作用 | 典型内容 |
| --- | --- | --- |
| `MEMORY.md` | 工作笔记 | 环境事实、项目约定、工具怪癖、固定流程 |
| `USER.md` | 用户画像 | 名字、角色、偏好、沟通风格、时区等 |

Agent 通常会在以下场景主动写入记忆：

| 触发场景 | 说明 |
| --- | --- |
| 用户纠正 | 例如 “remember this” / “don't do that again” |
| 用户偏好 | 名字、角色、时区、编码风格、沟通习惯 |
| 环境发现 | OS、已安装工具、项目结构、API 版本 |
| 约定学习 | 项目特定规范、工具怪癖、工作流程 |
| 稳定事实 | 未来会话仍然有用的长期信息 |

更完善的skill机制
`memory` 用来存事实，回答“用户喜欢什么”；`skill` 用来存程序，回答“某件事应该怎么做”。除了在 system prompt 中反复强调“复杂流程要沉淀为 skill、执行前优先加载 skill”之外，Hermes 还专门为 skill 设计了独立工具，提高其在框架里的地位。相关工具如下：
- skills_list：列出所有可用技能。一般的agent脚手架都是把skills的meta信息存到SP里，一个可能的疑问是为啥还需要skills_list工具。System Prompt 中的技能索引是会话开始时的静态快照，如果会话期间技能被修改（skill_manage 创建/更新/删除），不能实时更新 System Prompt，否则会导致 Prefix Cache 失效，token 成本翻倍，因此需要调用skills_list 工具实时获取skills最新状态。
- skill_view：读取指定技能的完整内容，发现相关技能后加载详情（别的框架会用正常的read file去读skill文件）
- skill_manage：创建、修改、删除技能，完成任务后保存经验，或修复过时技能。它是一个多能力组合工具，支持的动作如下：

| Action | 用途 | 关键参数 | 典型使用场景 |
| --- | --- | --- | --- |
| `create` | 创建新技能 | `name`, `content`, `category` | 完成复杂任务（5+ tool calls）后保存经验 |
| `patch` | 局部修改，最常用 | `name`, `old_string`, `new_string` | 修复过时命令、添加新步骤、更新错误处理 |
| `edit` | 全文重写 | `name`, `content` | 技能大改版、重构结构、合并多个技能 |
| `delete` | 删除技能 | `name` | 清理废弃技能，或在合并重复技能后删除旧版 |
| `write_file` | 添加辅助文件 | `name`, `file_path`, `file_content` | 添加模板、脚本、参考文档到 `references/templates/scripts/` |
| `remove_file` | 删除辅助文件 | `name`, `file_path` | 清理无用的辅助文件 |
这里解释下hermes agent单独设计skills相关工具的必要性。单独设计工具跟工具设计模式有关，举另外一个例子，比如执行shell命令，当然可以只提供一个shell工具就能完成很复杂的搜索、替换等操作（codex更倾向于这种方案），但是你也可以把最常用的几个功能比如Glob、edit、grep这种shell本身也能完成的能力单独封装成工具（claude code倾向于这种方式），这样能让模型调用工具更简单，更不容易出错（试想一下如果用原生shell命令实现替换需要一串长长的指令，更容易出错）。回到skill的问题上来，不为skills设计工具也可以用基础的edit、read等功能对skill进行操作，只不过对模型来说更难，单独设计成工具也能增强模型调用相关工具的意愿。hermes agent定位就是让 Agent 能够对skills自主创建（完成复杂任务后保存经验）、即时修复（发现过时时立即 patch）、版本演化（技能随使用不断进化），其他agent脚手架通常是不需要agent自己自动迭代skills，人提前定义好就行，因此hermes agent有必要针对skills设计一套专有工具。

Session Search：查看历史内容
`Memory` 存结论，`Skill` 存方法，但很多真正有价值的经验往往来自试错过程本身：失败的尝试、错误的假设、临时修补和突然的顿悟。这些内容不会自动沉淀为 Memory 或 Skill，却对后续处理类似问题非常有帮助。

`session_search` 的意义就在于让 Agent 能回看过去的完整思考轨迹。由于存在 context 压缩机制，完整历史不会一直留在当前上下文里，因此 Hermes 专门提供了 `session_search` 工具，其工作流程如下：
- FTS5 全文索引：所有消息实时索引到 SQLite 的 FTS5 虚拟表
- 相关性排序：按关键词匹配度排序
- 会话分组：取最相关的几个会话
- LLM 摘要：用便宜的模型（如 Gemini Flash）生成带元数据的摘要
- 返回结果：不是返回原始对话的完整记录，而是 LLM 生成的摘要，包含「问题→尝试过程→最终解法」的完整脉络


下面给出一个完整的self imporve触发流程，答道下一次任务的起点比上一次更高的效果：
- 步骤 1：用户问"帮我把这周的 HN 头条整理成摘要发到 Telegram"
- 步骤 2：Agent 启动会话，system prompt 自动包含：
  - USER.md："User prefers short summaries"
  - Skills 索引：发现 "weekly-digest" 技能相关
- 步骤 3：Agent 调用 skill_view("weekly-digest") 加载技能，按步骤执行
- 步骤 4：执行中发现技能写的"RSS 抓取"过时了，用户实际用 HN API。Agent 调用 skill_manage(action='patch') 更新技能
- 步骤 5：用户说"以后只要 5 条头条"。Agent 调用 memory(action='add', target='user', content='User wants HN digest capped at 5 headlines')
- 步骤 6：磁盘更新，但本次会话 system prompt 不变
- 步骤 7：下周用户再问同样的问题。启动时 system prompt 已经包含新记忆和修补后的技能。用户不需要重复"只要 5 条"、不需要纠正技能错误。

# Gateway 架构：多平台支持
Hermes Agent 与 Claude Code、Codex 这类本地 CLI 不同，它本质上是一个 Agent 服务端：后台可以同时维护多个 session，对应多个用户和多个平台。它通过异步消息网关接入 Telegram、Discord、Slack、WhatsApp 等 20+ 平台，实现统一的消息接收、会话路由和上下文隔离。

其架构分层如下：
暂时无法在飞书文档外展示此内容

Gateway 的核心职责可以概括为：

| 职责 | 说明 |
| --- | --- |
| 接收消息 | 从 Telegram、Discord 等多个平台接收用户请求 |
| 生成 Session Key | 根据消息来源、用户 ID、聊天 ID、线程信息等生成唯一标识 |
| 路由到 AIAgent | 根据 Session Key 找到或创建对应的 AIAgent 实例 |
| 隔离上下文 | 确保不同会话之间的上下文互不干扰 |

Gateway 大致支持两种会话模式：

| 模式 | 说明 |
| --- | --- |
| 私聊 | Gateway 与单个用户进行私信交互。每个私聊对话都有独立的 Session Key 和上下文 |
| 群聊 | Gateway 在群组或频道中与多个用户互动，可配置为“每个用户独立会话”（默认）或“群内共享会话” |

Hermes 虽然支持同时运行多个 session，但并不是无限制扩张。系统通常会采用淘汰机制控制资源，例如：当活跃会话数超过 128 个时，淘汰最近最少使用的会话；当某个会话超过 1 小时无消息时，清理对应的 AIAgent 实例以释放内存。
