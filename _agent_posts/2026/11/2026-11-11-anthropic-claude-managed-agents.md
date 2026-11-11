---
title: Anthropic Claude Managed Agents 产品理念与架构设计
date: 2026-11-11
author: Sophie
tags: [Agent, Decoupling]
excerpt: Managed Agents = Claude（大脑）+ Harness（推理循环）+ Sandbox（执行沙盒）的三层解耦架构。
---
> **核心结论**：Managed Agents = Claude（大脑）+ Harness（推理循环）+ Sandbox（执行沙盒）的三层解耦架构。开发者只需定义 Agent 和 Environment，Anthropic 托管推理循环与沙盒生命周期。

## 一、产品概览

**Managed Agents** 是 Anthropic 在 Claude Platform 上推出的**全托管 Agent 运行时服务**，目前处于 Beta 阶段。它让开发者无需自行构建推理循环（harness）、维护工具调用逻辑或管理沙盒执行环境，只需定义 **Agent**（指令 + 工具）和 **Environment**（执行环境），即可启动自主运行的 AI Agent。

| 维度 | Messages API | Managed Agents |
|------|-------------|----------------|
| 推理循环 | 开发者自行构建 | Anthropic 托管（Harness） |
| 工具执行 | 需自行调度与解析 | 沙盒内自动执行 |
| 状态管理 | 无状态，需外部维护 | Session 持久化对话与文件 |
| 沙盒环境 | 自行搭建 | 云沙盒或自托管 |
| 流式输出 | 文本流 | 结构化 Events 流 |

该服务可通过三大云平台访问：**Claude API**、**Claude Platform on AWS**、**Claude Models on Google Cloud**，支持所有 Claude 模型。Beta 阶段需通过 `managed-agents-2026-04-01` header 激活。

## 二、核心概念

Managed Agents 围绕**四大核心概念**构建，每个概念对应一个独立的生命周期和管理接口：

| 概念 | 角色 | 关键属性 |
|------|------|---------|
| **Agent** | 定义"做什么"——系统提示词、可用工具、模型选择 | name, model, tools, system_prompt |
| **Environment** | 定义"在哪里做"——代码执行沙盒与文件系统 | 云沙盒（托管）或自托管 worker |
| **Session** | 定义"做到哪了"——持久化对话历史与文件系统状态 | 有状态（持久）或无状态（临时） |
| **Events** | 定义"怎么追踪"——结构化事件流，实时反馈 Agent 行为 | text_delta, tool_use, tool_result, file 等 |

- **Agent 定义示例**：通过 YAML frontmatter 定义名称、模型、工具集和系统提示词，可绑定 GitHub 仓库作为技能来源。
- **Session 资源**：支持 `file`（上传文件）和 `github_repository`（克隆仓库）两种会话初始化资源，为 Agent 提供上下文。

创建流程为：**创建 Agent** → **创建 Environment** → **启动 Session**（指定 Agent + Environment）→ **发送消息**并接收 Events 流。Session 可在多轮对话间保持文件系统和对话历史。

## 三、架构设计理念

Anthropic 的工程博客将 Managed Agents 的架构设计类比为**操作系统的虚拟化**。正如操作系统通过进程虚拟化让多个程序共享硬件，Managed Agents 通过**三大虚拟化组件**让多个 Agent 共享 Claude 推理能力：

| 组件 | 操作系统类比 | 职责 |
|------|------------|------|
| **Session** | 进程的执行日志 | 仅追加（append-only）的事件日志，记录 Agent 的完整行为轨迹 |
| **Harness** | 进程调度器 | 调用 Claude 模型、解析工具调用、路由到沙盒执行的推理循环 |
| **Sandbox** | 进程的内存空间 | 隔离的代码执行环境，提供文件系统、网络和工具能力 |

> **核心设计原则**：每个组件都是一个**接口**，几乎不对其他组件做任何假设。Session 不知道 Harness 如何调用 Claude，Harness 不知道 Sandbox 如何执行代码，Sandbox 不知道 Session 如何存储日志。这种解耦使得各组件可独立替换和扩展。

```
┌─────────────────────────────────────────────────────┐
│              Managed Agents 架构                     │
│                                                     │
│  开发者 ──► Agent 定义 ──┐                           │
│         ──► Environment ─┤                          │
│                          ▼                          │
│                   ┌─────────────┐                   │
│                   │   Session    │  ◄── 仅追加日志   │
│                   │ (事件日志)    │                   │
│                   └──────┬──────┘                   │
│                          │                          │
│                   ┌──────▼──────┐                   │
│                   │   Harness    │  ◄── 推理循环     │
│                   │ (调用 Claude) │                   │
│                   └──┬──────┬───┘                   │
│                      │      │                       │
│                   ┌──▼──┐┌──▼──┐                    │
│                   │Claude││Sandbox│ ◄── 执行环境     │
│                   └─────┘└──┬──┘                    │
│                              │                      │
│                   ┌──────────▼─────────┐            │
│                   │ 工具集              │            │
│                   │ Bash/文件/Web/MCP   │            │
│                   └────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

## 四、架构演进路径

Anthropic 在工程博客中以三个阶段描述了 Managed Agents 架构的演进逻辑：

### 4.1 Don't Adopt a Pet — 从单体到可替换

**Pets vs Cattle 模式**：传统 Agent 框架将推理循环、工具执行和状态管理绑定在单一容器中——就像养宠物，每个实例都是独特的、不可替换的。Managed Agents 将其拆分为可替换的标准化组件——像牲畜一样，任何一个实例故障后可被新实例无缝接管。

最初，Anthropic 把所有 Agent 组件（Session、Harness、Sandbox）放进**同一个容器**。这带来了好处：文件编辑是直接的 syscall，无需设计服务边界。但也引入了经典的"宠物问题"：

- **容器挂了 → Session 就丢了**（不可恢复）
- **容器卡住 → 必须"护理"它**，而非直接换一个
- **排查问题极困难**：唯一的观测手段是 WebSocket 事件流，但无法区分故障来源——Harness 的 bug、网络丢包、容器宕机，三者表现一模一样
- **调试手段受限**：工程师想 debug 只能 SSH 进容器，但容器里存着用户数据，不能随便进去翻看

这一理念的关键在于：**不在 Agent 容器内部维护不可恢复的状态**。所有需要持久化的信息都写入 Session 日志，Harness 和 Sandbox 都是无状态的，可以在任何节点重启而不丢失上下文。

### 4.2 Decouple Brain from Hands — 大脑与双手解耦

| | 大脑（Brain） | 双手（Hands） |
|--|--------------|-------------|
| 组成 | Claude 模型 + Harness 推理循环 | Sandbox 沙盒 + 工具集 |
| 职责 | 理解任务、规划步骤、生成工具调用、解析执行结果 | 执行代码、读写文件、发起网络请求 |
| 特征 | 无状态，可水平扩展 | 有状态（文件系统），可隔离，可替换 |

解耦后，大脑专注于**决策**，双手专注于**执行**。一个大脑可以指挥多双手（不同沙盒并行执行不同任务），多双手也可以协作完成一个大脑的指令。

### 4.3 Security Boundary — 安全边界设计

解耦带来的直接安全收益：**Tokens 绝不能从 Claude 生成代码运行的沙盒中访问到**。这意味着：

- API Keys、OAuth Tokens 等敏感凭据存储在 **Vault**（安全保险库）中，不暴露给沙盒环境
- Git tokens 在初始化时通过 `git clone` 捆绑到沙盒，而非作为环境变量传递
- MCP OAuth tokens 通过专用代理（proxy）访问，沙盒代码无法直接读取

## 五、Session ≠ Context Window

> **关键区分**：Session 是一个独立于 Claude 上下文窗口（Context Window）的持久化对象。上下文窗口是模型推理时的"工作记忆"，而 Session 是跨多轮调用的"长期记忆"。

在传统 Agent 框架中，对话历史通常被塞入模型的上下文窗口。随着对话增长，上下文窗口溢出，需要截断或摘要——这会丢失信息。Managed Agents 的设计将**对话历史和文件系统状态**从上下文窗口中分离出来：

| 维度 | Context Window | Session |
|------|---------------|---------|
| 生命周期 | 单次推理调用 | 跨多次推理调用，持久化 |
| 存储内容 | 当前推理所需的 token | 完整事件日志 + 文件系统快照 |
| 访问方式 | 模型直接读取 | 通过 `getEvents()` API 查询 |
| 容量限制 | 受模型上下文长度限制 | 无固定上限，按需扩展 |
| 截断策略 | 自动截断旧内容 | 仅追加，不截断 |

Harness 在每次调用 Claude 时，从 Session 中提取**当前需要的事件子集**注入上下文窗口，而非全量灌入。这使得 Agent 可以在**极长的对话历史**中保持连贯性，而不会因上下文窗口限制而遗忘早期信息。

## 六、Many Brains, Many Hands

由于 Harness 是无状态的，它可以**水平扩展**到多个实例。这意味着多个 Claude 调用可以并行进行，而共享同一个 Session 的执行历史。

> **架构优势**：无状态 Harness 可在任意节点启动，无需"预热"或"迁移状态"。当一个 Harness 实例完成一轮推理后，另一个实例可以立即接手下一轮——这就是"Many Brains"。

同样，每个"手"（Sandbox）都是一个实现 `execute(name, input) → string` 接口的工具执行单元。多个沙盒可以并行执行不同的工具调用，这就是"Many Hands"。

```
  ┌─── Many Brains ───┐     ┌── Session（共享）──┐     ┌─── Many Hands ────┐
  │                   │     │                    │     │                   │
  │  Harness 1 ───────┼────►│   事件日志          │◄────┼─ Sandbox A (Bash) │
  │  Harness 2 ───────┼────►│                    │◄────┼─ Sandbox B (文件)  │
  │  Harness 3 ───────┼────►│                    │◄────┼─ Sandbox C (Web)   │
  │                   │     │                    │     │                   │
  └───────────────────┘     └────────────────────┘     └───────────────────┘
```

### 性能提升

| 指标 | 传统 Agent | Managed Agents |
|------|-----------|----------------|
| p50 TTFT | 基线 | ↓ ~60% |
| p95 TTFT | 基线 | ↓ >90% |
| 并行能力 | 串行推理 | 多 Harness 并行 |

p95 的显著改善意味着即使在高负载下，用户也能获得稳定的响应延迟——这对生产环境的 Agent 应用至关重要。

## 七、环境配置：云 vs 自托管

Managed Agents 提供两种 Environment 类型，开发者可根据数据合规、网络访问和运维需求选择：

### 云沙盒（Anthropic 托管）

Anthropic 管理的隔离执行环境，开箱即用：
- 预装运行时（Python, Node 等）
- 支持 file / github_repository 资源
- Vault 环境变量凭据管理
- 仓库技能自动发现
- 无需运维

### 自托管沙盒

在用户自有基础设施上运行 Worker：
- 数据不离开用户网络
- 可访问内部服务和 API
- 满足合规/审计要求
- 环境密钥认证
- 需自行运维

### 自托管 Worker 架构

自托管沙盒采用**工作队列模型**：Environment 作为工作队列，Worker 进程领取（claim）工作项并执行。Anthropic 提供预构建的 Worker，可通过 `ant` CLI 和 Python/TypeScript/Go SDKs 使用。

| 特性 | 云沙盒 | 自托管 |
|------|-------|--------|
| file 资源 | ✅ | ❌ |
| github_repository 资源 | ✅ | ❌ |
| 仓库技能发现 | ✅ | ❌ |
| Vault 凭据 | ✅ | ❌ |
| 预装运行时 | ✅ | ❌ |
| 内部网络访问 | ❌ | ✅ |
| 合规控制 | 受限 | ✅ 完全控制 |

**支持的部署平台**：AWS Lambda MicroVMs、Cloudflare、Daytona、E2B、Fly.io、Modal、Namespace、Vercel 等。

## 八、内置工具与 MCP 支持

Managed Agents 内置了一组常用工具，同时支持通过 MCP（Model Context Protocol）扩展自定义工具：

| 工具类别 | 具体工具 | 说明 |
|---------|---------|------|
| 命令执行 | `Bash` | 在沙盒中执行 shell 命令，支持脚本运行 |
| 文件操作 | 文件读写/编辑 | 在沙盒文件系统中创建、读取、修改文件 |
| 网络访问 | Web 搜索 | 搜索互联网获取实时信息 |
| 网络访问 | Web 抓取 | 获取指定 URL 的网页内容 |
| 协议扩展 | MCP Servers | 连接外部 MCP 服务器，扩展自定义工具集 |

> **MCP 集成**：开发者可以在 Agent 定义中配置 MCP Servers，Agent 会自动发现并使用这些服务器提供的工具。OAuth 认证的 MCP tokens 存储在安全 Vault 中，通过专用代理访问——沙盒中的代码无法直接读取这些 token。

工具调用的完整流程：Claude 生成工具调用 → Harness 解析并路由到 Sandbox → Sandbox 执行工具 → 结果返回 Session → Harness 将结果注入下一轮 Claude 调用。整个过程对开发者透明，无需手动编排。

## 九、安全设计

安全是 Managed Agents 架构设计的**第一性原则**。Anthropic 在工程博客中明确指出：tokens 绝不能从 Claude 生成代码运行的沙盒中访问到。

### 9.1 Vault 模式

> **核心原则**：所有敏感凭据（API Keys、OAuth Tokens）存储在独立的 Vault 中，通过专用代理（proxy）访问。沙盒中的代码——包括 Claude 生成的代码——无法直接读取这些凭据。

Vault 作为**独立的信任域**运行，与沙盒执行环境严格隔离。当 Agent 需要使用某个 MCP 服务的 OAuth 凭据时，请求通过代理转发，代理在 Vault 中取出 token 完成认证后将结果返回——token 本身从不进入沙盒内存空间。

### 9.2 Git Token 捆绑

当 Session 初始化时指定 `github_repository` 资源，Anthropic 会在沙盒创建时执行 `git clone`，将仓库内容直接复制到沙盒文件系统中。Git token 仅在 clone 时使用一次，之后**不再保留在沙盒环境中**。

### 9.3 沙盒隔离

| 隔离层 | 机制 |
|--------|------|
| 文件系统 | 每个 Session 独立的文件系统，Session 间不可互访 |
| 网络 | 沙盒网络隔离，仅允许出站到公网（云沙盒） |
| 进程 | 沙盒内进程隔离，不影响宿主机或其他沙盒 |
| 凭据 | Vault 代理模式，token 不进入沙盒 |

### 9.4 安全边界总结

```
┌─ 信任域：Claude + Harness ─┐    ┌─ 信任域：Vault ─┐    ┌─ 隔离域：Sandbox ─┐
│                           │    │                 │    │                  │
│  Claude 模型              │    │  🔐 Vault       │    │  沙盒执行环境     │
│  Harness 推理循环 ────────┼───►│  API Keys       │◄──►│  Claude 生成的代码│
│                           │    │  OAuth Tokens   │    │  文件系统         │
│                           │    │  Proxy 代理     │    │                  │
│                           │    │      ▲          │    │      ▲           │
│                           │    │      │          │    │      │           │
└───────────────────────────┘    └──────┼──────────┘    └──────┼──────────┘
                                        │                      │
                                        └─── 代为认证 ─────────┘
                                    （返回结果，不含 token）
```

## 十、使用场景与限制

### 10.1 适用场景

- **代码型 Agent**：需要执行代码、读写文件、运行测试的自主编程助手
- **数据处理 Agent**：需要在沙盒中处理结构化/非结构化数据的分析助手
- **研究型 Agent**：需要 Web 搜索和信息抓取的深度调研助手
- **多工具编排 Agent**：需要同时调用多个工具（Bash + 文件 + Web + MCP）的复杂任务
- **企业内部 Agent**：需要访问内部服务且数据不能离开网络的场景（自托管）

### 10.2 合规限制

> **状态会话（Stateful Sessions）的限制**：由于持久化文件系统和对话历史涉及数据存储，状态会话**不符合** Zero Data Retention（ZDR）和 HIPAA 合规要求。需要 ZDR/HIPAA 合规的场景应使用无状态会话。

### 10.3 Beta 阶段说明

| 项目 | 状态 |
|------|------|
| 产品阶段 | Beta |
| 模型支持 | 所有 Claude 模型 |
| 云平台 | Claude API / AWS / Google Cloud |
| Beta Header | `managed-agents-2026-04-01` |
| SDK | Python / TypeScript / Go |
| CLI 工具 | `ant` CLI（自托管 Worker） |

## 十一、总结与启示

> **核心价值主张**：Managed Agents 将 Agent 运行时的三大组件（Session / Harness / Sandbox）解耦为可独立替换的标准化接口，如同操作系统虚拟化让多个程序共享硬件一样，让多个 Agent 共享 Claude 推理能力——开发者只需关注"做什么"（Agent 定义）和"在哪里做"（Environment），"怎么做"由 Anthropic 托管。

### 关键启示

1. **解耦是扩展的前提**：Session、Harness、Sandbox 三层解耦使得每层可独立扩展和替换，这是"Many Brains, Many Hands"架构的基础
2. **无状态化是高可用的关键**：Harness 无状态设计使得 p95 TTFT 下降 90%+，消除了传统 Agent 框架的"热启动"瓶颈
3. **Session ≠ Context Window**：将对话历史从模型上下文窗口中分离，通过 `getEvents()` 按需检索，解决了长对话的信息丢失问题
4. **安全边界优先**：Vault 代理模式和 Git Token 捆绑策略确保敏感凭据不暴露给沙盒中的代码——这在 AI Agent 执行不可信代码时尤为关键
5. **云 + 自托管双轨**：云沙盒提供开箱即用体验，自托管满足企业合规和内部网络访问需求，Worker 工作队列模型降低了自托管门槛
