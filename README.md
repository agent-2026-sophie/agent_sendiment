# agent_sendiment

一个围绕 `LLM`、`Agent`、模型评测与个人研究沉淀构建的 Jekyll 静态博客。

线上地址：

```text
https://agent-2026-sophie.github.io/agent_sendiment/
```

## 项目定位

这个仓库用于维护一个可长期更新的个人技术博客，而不是排行榜、数据看板或临时 Demo。

- 追踪 LLM、Agent、模型评测等方向的前沿进展
- 发布专题文章、研究笔记、工程复盘与方法总结
- 通过 Markdown 维护内容，通过 layout 统一渲染页面结构
- 使用 GitHub Actions 自动构建并发布到 GitHub Pages

## 当前功能

- 首页以时间线方式展示所有文章
- 侧边栏提供站点导航、年度更新热度图、GitHub/Gmail 链接
- 侧边栏支持展开和收起
- 搜索以悬浮层形式打开，输入关键词并按 Enter 后执行全文搜索
- 搜索结果会匹配文章正文，并高亮命中的搜索词
- 文章数量、单篇字数、总字数、更新热度图均由真实文章内容自动计算
- CSS/JS 使用构建时间版本参数，降低 GitHub Pages 或浏览器缓存导致的样式不同步问题

## 站点结构

- `index.md`
  首页，使用 `home` layout，展示文章时间线和搜索入口。
- `llm.md`
  模型栏目页，绑定 `_llm_posts/`。
- `agent.md`
  Agent 栏目页，绑定 `_agent_posts/`。
- `evals.md`
  评测栏目页，当前标题为“评测”，绑定 `_evals_posts/`。
- `about.md`
  关于页面，使用通用页面布局并保留侧边栏。

主要布局文件：

- `_layouts/default.html`
  全站基础 HTML、CSS/JS 引入、页头和页脚。
- `_layouts/home.html`
  首页时间线、搜索数据渲染。
- `_layouts/collection.html`
  模型、Agent、评测等栏目页。
- `_layouts/post.html`
  文章详情页。
- `_layouts/page.html`
  普通页面布局。

主要组件：

- `_includes/header.html`
  顶部标题区域。
- `_includes/sidebar.html`
  导航、更新热度图、社交链接。
- `_includes/footer.html`
  动态年份、作者、文章数和总字数。

## 内容目录

当前可见栏目对应的文章目录：

- `_llm_posts/`
  模型、LLM、推理、部署、论文和产品观察。
- `_agent_posts/`
  Agent 架构、工作流、工具使用、记忆系统和工程实践。
- `_evals_posts/`
  模型评测、评估方法、评测集、指标和实验记录。

文章按 `年/月/文件.md` 组织，例如：

```text
_llm_posts/2026/04/2026-04-24-gpt55-release.md
_agent_posts/2026/04/2026-04-20-agent-framework-comparison.md
_evals_posts/2026/04/2026-04-15-llm-learning-path.md
```

## 新增文章

文件名建议使用：

```text
YYYY-MM-DD-title.md
```

文章 front matter 示例：

```md
---
title: 主流 Agent 框架对比分析
date: 2026-04-20
author: Sophie Wu
tags: [Agent, Framework, Architecture]
excerpt: 对比分析当前主流的 AI Agent 开发框架，帮助开发者选择合适的工具。
---

## 背景

这里写文章背景。

## 核心分析

这里写正文。

## 总结

这里写结论。
```

也可以使用脚本创建部分类型的文章：

```bash
./scripts/new_post.sh llm "gpt55-release"
./scripts/new_post.sh agent "agent-framework-comparison"
./scripts/new_post.sh evals "benchmark-notes"
```

脚本支持 `llm`、`agent`、`evals` 三类，会自动写入对应 collection 目录。

如果想删除特定博客，先定位文章文件：

```bash
find _llm_posts _agent_posts _evals_posts -name "*keyword*.md"
```

确认文件路径后删除，例如：

```bash
rm _evals_posts/2026/04/2026-04-15-llm-learning-path.md
```

然后提交并推送：

```bash
git add -A
git commit -m "Remove blog post"
git push origin main
```

## 本地预览

首次使用先安装依赖：

```bash
bundle install
```

启动本地预览：

```bash
bundle exec jekyll serve
```

浏览器访问：

```text
http://localhost:4000/agent_sendiment/
```

如果修改了 `_config.yml`，需要重启 `bundle exec jekyll serve`，因为 Jekyll 本地服务通常不会自动重新加载配置文件。

## 发布流程

日常更新推荐流程：

```bash
git pull origin main
bundle exec jekyll serve
git add .
git commit -m "Update blog"
git push origin main
```

推送到 `main` 后，`.github/workflows/pages.yml` 会自动触发 GitHub Actions：

1. 拉取仓库代码
2. 配置 GitHub Pages
3. 安装 Ruby 和 Bundler 依赖
4. 执行 `bundle exec jekyll build`
5. 上传 `_site` 产物
6. 部署到 GitHub Pages

GitHub Pages 设置应使用：

- Source: `GitHub Actions`
- Workflow: `.github/workflows/pages.yml`

不要再使用旧的 `Branch: main` / `Folder: / (root)` 分支发布方式，否则可能和 Actions 部署产物不一致。

## 本地与线上差异

- 本地地址 `http://localhost:4000/agent_sendiment/` 只在自己的电脑上可访问。
- 线上地址 `https://agent-2026-sophie.github.io/agent_sendiment/` 由 GitHub Pages 托管。
- `git push` 成功后，还需要等待 GitHub Actions 构建和部署完成。
- GitHub Pages 和浏览器可能缓存静态资源；如果线上看起来还是旧样式，优先尝试 `Cmd + Shift + R` 强制刷新或使用无痕窗口。
- 当前 CSS/JS 链接已带 `?v={{ site.time }}` 构建版本参数，后续 push 后资源缓存问题会减少。

## 换电脑维护

在新机器上继续维护：

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

只要安装好 Ruby、Bundler 和项目依赖，就可以继续写作、预览和发布。

## 技术栈

- Jekyll
- Liquid
- GitHub Pages
- GitHub Actions
- HTML
- CSS
- JavaScript
