---
layout: default
title: 首页
description: 追踪LLM、Agent前沿发展，沉淀个人专业知识，创作技术博客
---

<section class="hero">
  <div class="container">
    <div class="hero-content">
      <span class="hero-eyebrow">AI Blog · LLM · Agent</span>
      <h1>一站式记录 LLM 与 Agent 的前沿观察和技术写作</h1>
      <p>这里不是榜单站，而是一个持续更新的专业博客：记录模型演进、Agent系统设计、工程实践、研究阅读与个人知识沉淀。</p>
      <div class="hero-buttons">
        <a href="{{ '/llm.html' | relative_url }}" class="btn btn-primary">浏览 LLM 专栏</a>
        <a href="{{ '/agent.html' | relative_url }}" class="btn btn-secondary">浏览 Agent 专栏</a>
      </div>
    </div>
  </div>
</section>

<section class="features">
  <div class="container">
    <h2>核心栏目</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🧠</div>
        <h3>LLM 前沿</h3>
        <p>聚焦模型能力演化、训练范式、推理优化、多模态方向与研究论文拆解。</p>
        <a href="{{ '/llm.html' | relative_url }}" class="feature-link">进入专栏 →</a>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🤖</div>
        <h3>Agent 系统</h3>
        <p>记录工作流设计、工具调用、记忆机制、多 Agent 协作与真实应用案例。</p>
        <a href="{{ '/agent.html' | relative_url }}" class="feature-link">进入专栏 →</a>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📚</div>
        <h3>知识库</h3>
        <p>沉淀术语、框架比较、学习路径、方法论与长期可复用的知识卡片。</p>
        <a href="{{ '/knowledge.html' | relative_url }}" class="feature-link">进入专栏 →</a>
      </div>
    </div>
  </div>
</section>

<section class="latest-posts">
  <div class="container">
    <h2>最新文章</h2>
    <p class="section-subtitle">所有内容按照时间更新，首页优先展示最近发布的博客。</p>
    <div class="posts-grid">
      {% assign all_posts = site.llm_posts | concat: site.agent_posts | concat: site.knowledge_posts | sort: 'date' | reverse | limit: 6 %}
      {% for post in all_posts %}
        <article class="post-card">
          <span class="post-category-tag">{{ post.category }}</span>
          <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
          <p class="post-excerpt">{{ post.excerpt | strip_html | truncate: 100 }}</p>
          <div class="post-meta">
            <span>{{ post.date | date: "%Y-%m-%d" }}</span>
          </div>
        </article>
      {% endfor %}
    </div>
  </div>
</section>

<section class="blog-collections">
  <div class="container">
    <h2>你可以持续写的内容类型</h2>
    <div class="trends-grid">
      <div class="trend-card">
        <div class="trend-icon">📰</div>
        <h3>周报 / 月报</h3>
        <p>跟踪模型发布、论文动态、产品功能更新，形成稳定的内容节奏。</p>
      </div>
      <div class="trend-card">
        <div class="trend-icon">🧩</div>
        <h3>专题深挖</h3>
        <p>围绕 RAG、Tool Use、Reasoning、Agent Workflow 等主题持续扩写。</p>
      </div>
      <div class="trend-card">
        <div class="trend-icon">🛠</div>
        <h3>工程实践</h3>
        <p>记录踩坑、方案选型、系统设计与评估方法，形成专业积累。</p>
      </div>
      <div class="trend-card">
        <div class="trend-icon">📒</div>
        <h3>研究笔记</h3>
        <p>把读论文、看源码、做实验得到的结论沉淀为可复用的知识文章。</p>
      </div>
    </div>
  </div>
</section>

<section class="editorial-note">
  <div class="container">
    <div class="editorial-note-card">
      <h2>写作定位</h2>
      <p>这个站点的目标是帮助你长期输出有结构的技术博客，而不是临时堆积信息。你后续只需要往不同栏目里新增文章，首页和栏目页就会自动更新。</p>
      <a href="{{ '/about.html' | relative_url }}" class="btn btn-outline">查看博客定位</a>
    </div>
  </div>
</section>
