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

新增文章时，文件名使用 `YYYY-MM-DD-title.md` 格式。

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
