# agent_sendiment

一个围绕 `LLM`、`Agent` 和个人技术沉淀构建的静态博客网站。

## 项目定位

这个仓库的目标不是做排行榜或数据看板，而是做一个可长期维护的专业博客：

- 跟踪 LLM、Agent 的前沿发展
- 发布专题文章、研究笔记与工程复盘
- 沉淀长期可复用的知识卡片和写作模板
- 建立持续更新的个人技术品牌站点

## 站点结构

- `index.md`
  首页，展示博客定位、栏目入口和最新文章
- `llm.md`
  LLM 专栏页，适合发布模型观察、论文拆解、推理与部署实践
- `agent.md`
  Agent 专栏页，适合发布系统设计、工作流、工具使用与评估内容
- `knowledge.md`
  知识库页面，沉淀概念卡片、学习路径和方法论
- `about.md`
  关于页面，介绍博客定位与更新计划

## 内容目录

- `_llm_posts/`
  LLM 相关文章
- `_agent_posts/`
  Agent 相关文章
- `_knowledge_posts/`
  知识沉淀类文章

现在文章按 `年/月/文件.md` 组织，例如：

```text
_llm_posts/2026/05/2026-05-05-agent-memory-design.md
_agent_posts/2026/05/2026-05-05-agent-workflow-notes.md
_knowledge_posts/2026/05/2026-05-05-llm-learning-map.md
```

## 日常更新流程

后续维护这个博客，推荐固定按下面的顺序来：

1. 拉取最新代码

```bash
git pull origin main
```

2. 本地启动预览

```bash
bundle exec jekyll serve
```

3. 浏览器查看效果

```text
http://localhost:4000/agent_sendiment/
```

4. 修改文章或页面

- 新增博客文章：修改 `_llm_posts/`、`_agent_posts/`、`_knowledge_posts/`
- 修改栏目页面：修改 `index.md`、`llm.md`、`agent.md`、`knowledge.md`、`about.md`

5. 提交并推送

```bash
git add .
git commit -m "Add new blog post"
git push origin main
```

6. 等待 GitHub Pages / GitHub Actions 自动部署

- 推送到 `main` 后，线上站点会自动重新发布
- 正式发布地址：`https://agent-2026-sophie.github.io/agent_sendiment/`

## 如何新增一篇文章

目前站点按内容类型区分目录：

- `LLM` 文章：放到 `_llm_posts/`
- `Agent` 文章：放到 `_agent_posts/`
- `知识沉淀`：放到 `_knowledge_posts/`

新文章会放到对应目录下的 `年份/月` 子目录中。

文件名格式：

```text
YYYY-MM-DD-title.md
```

例如：

```text
2026-05-05-agent-memory-design.md
```

推荐直接用命令行脚本创建：

```bash
./scripts/new_post.sh llm "agent-memory-design"
./scripts/new_post.sh agent "tool-calling-best-practices"
./scripts/new_post.sh knowledge "llm-learning-path"
```

脚本会自动：

- 根据当前日期创建 `年/月` 目录
- 自动生成日期前缀文件名
- 写入基础 front matter 和正文模板

例如在 2026 年 5 月 5 日执行：

```bash
./scripts/new_post.sh llm "agent-memory-design"
```

会创建：

```text
_llm_posts/2026/05/2026-05-05-agent-memory-design.md
```

如果你不想用脚本，也可以手动新建文件。文章模板可以参考下面这份：

```md
---
title: Agent 记忆系统设计笔记
date: 2026-05-05
author: Sophie
tags: [Agent, Memory, Architecture]
excerpt: 记录 Agent 记忆系统的设计思路、常见方案和工程权衡。
---

## 背景

这里写文章正文。

## 核心问题

这里写你的分析。

## 我的结论

这里写你的判断和总结。
```

## 本地预览与线上部署的区别

- `http://localhost:4000/agent_sendiment/` 是本地预览地址，只能在你自己的电脑上访问
- `https://agent-2026-sophie.github.io/agent_sendiment/` 是正式线上地址，发布后不依赖你的本机运行
- 本机关机、断网，已经发布到 GitHub Pages 的网站仍然可以访问

## 换一台电脑继续维护

如果以后换一台机器，也可以继续维护这个博客。基本流程如下：

```bash
git clone git@github.com:agent-2026-sophie/agent_sendiment.git
cd agent_sendiment
bundle install
bundle exec jekyll serve
```

然后访问：

```text
http://localhost:4000/agent_sendiment/
```

只要新机器安装好了 Ruby、Bundler 和项目依赖，就可以继续写作、预览和发布。

## 本地预览

在仓库根目录执行：

```bash
bundle install
bundle exec jekyll serve
```

本地访问：

```bash
http://localhost:4000/agent_sendiment/
```

## 部署方式

仓库名已设为 `agent_sendiment`，部署到 GitHub Pages 后，访问地址通常为：

```text
https://agent-2026-sophie.github.io/agent_sendiment/
```

GitHub Pages 建议配置：

- Branch: `main`
- Folder: `/ (root)`

## 技术栈

- Jekyll
- GitHub Pages
- HTML
- CSS
- JavaScript

## 后续建议

- 每周更新前沿观察或产品体验
- 每月输出一篇专题长文
- 持续补充知识库页面与模板文章
