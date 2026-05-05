---
layout: default
title: 知识积累
description: 整理技术笔记、学习资源和行业洞察
---

<section class="page-header">
  <div class="container">
    <h1>知识积累</h1>
    <p>整理技术笔记、学习资源和行业洞察</p>
  </div>
</section>

<section class="knowledge-resources">
  <div class="container">
    <h2>学习资源</h2>
    <div class="resources-grid">
      <div class="resource-card">
        <div class="resource-icon">📚</div>
        <h3>推荐书籍</h3>
        <ul>
          <li>《AI Agents in Action》</li>
          <li>《AI Agent开发与应用》</li>
          <li>《Large Language Models》</li>
          <li>《Hands-On Machine Learning》</li>
        </ul>
      </div>
      <div class="resource-card">
        <div class="resource-icon">🎓</div>
        <h3>在线课程</h3>
        <ul>
          <li>CS61A - 计算机科学导论</li>
          <li>深度学习专项课程</li>
          <li>LLM原理与实践</li>
          <li>Agent开发实战</li>
        </ul>
      </div>
      <div class="resource-card">
        <div class="resource-icon">📝</div>
        <h3>技术博客</h3>
        <ul>
          <li>OpenAI官方博客</li>
          <li>Google AI Blog</li>
          <li>Hugging Face Blog</li>
          <li>李沐深度学习笔记</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="knowledge-notes">
  <div class="container">
    <h2>技术笔记</h2>
    <div class="notes-grid">
      {% for post in site.knowledge_posts %}
        <article class="note-card">
          <span class="note-category">{{ post.category }}</span>
          <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
          <p>{{ post.excerpt | strip_html | truncate: 120 }}</p>
          <div class="note-meta">
            <span>{{ post.date | date: "%Y-%m-%d" }}</span>
          </div>
        </article>
      {% empty %}
        <p>暂无技术笔记，敬请期待！</p>
      {% endfor %}
    </div>
  </div>
</section>

<section class="knowledge-tags">
  <div class="container">
    <h2>知识标签</h2>
    <div class="tags-cloud">
      <span class="tag-item large">LLM</span>
      <span class="tag-item medium">Agent</span>
      <span class="tag-item small">深度学习</span>
      <span class="tag-item medium">Transformer</span>
      <span class="tag-item small">Prompt工程</span>
      <span class="tag-item large">机器学习</span>
      <span class="tag-item small">NLP</span>
      <span class="tag-item medium">计算机视觉</span>
      <span class="tag-item small">多模态</span>
      <span class="tag-item medium">知识图谱</span>
      <span class="tag-item small">强化学习</span>
      <span class="tag-item medium">模型部署</span>
    </div>
  </div>
</section>