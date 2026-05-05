---
layout: default
title: 知识积累
description: 博客的长期知识库，整理学习路径、方法论和可复用资料
---

<section class="page-header">
  <div class="container">
    <h1>知识库</h1>
    <p>沉淀长期有价值的内容，把碎片输入整理成可复用的专业资产。</p>
  </div>
</section>

<section class="knowledge-resources">
  <div class="container">
    <h2>知识库分区</h2>
    <div class="resources-grid">
      <div class="resource-card">
        <div class="resource-icon">�</div>
        <h3>概念卡片</h3>
        <ul>
          <li>术语解释与差异辨析</li>
          <li>核心技术路线图</li>
          <li>概念之间的关系梳理</li>
          <li>适合快速查阅与引用</li>
        </ul>
      </div>
      <div class="resource-card">
        <div class="resource-icon">🧭</div>
        <h3>学习路径</h3>
        <ul>
          <li>入门到进阶的路线设计</li>
          <li>书籍、课程、论文整理</li>
          <li>适合不同背景读者</li>
          <li>便于持续补充更新</li>
        </ul>
      </div>
      <div class="resource-card">
        <div class="resource-icon">�</div>
        <h3>写作模板</h3>
        <ul>
          <li>模型观察模板</li>
          <li>论文拆解模板</li>
          <li>系统复盘模板</li>
          <li>实验记录模板</li>
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
      {% else %}
        <p>暂无技术笔记，敬请期待！</p>
      {% endfor %}
    </div>
  </div>
</section>

<section class="knowledge-tags">
  <div class="container">
    <h2>常驻主题标签</h2>
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
