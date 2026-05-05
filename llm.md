---
layout: default
title: LLM追踪
description: 面向博客写作的 LLM 专栏，记录模型进展、研究解读与工程实践
---

<section class="page-header">
  <div class="container">
    <h1>LLM 专栏</h1>
    <p>记录模型演化、论文阅读、训练推理、应用落地与个人判断。</p>
  </div>
</section>

<section class="llm-trends">
  <div class="container">
    <h2>适合持续写作的主题</h2>
    <div class="trends-grid">
      <div class="trend-card">
        <div class="trend-icon">🔍</div>
        <h3>模型发布观察</h3>
        <p>记录重要模型版本更新、能力边界、价格变化与个人试用结论。</p>
      </div>
      <div class="trend-card">
        <div class="trend-icon">📄</div>
        <h3>论文拆解</h3>
        <p>用博客形式解释论文动机、关键方法、实验设计与值得关注的细节。</p>
      </div>
      <div class="trend-card">
        <div class="trend-icon">⚙️</div>
        <h3>推理与部署</h3>
        <p>聚焦上下文、延迟、吞吐、成本和服务化落地中的工程权衡。</p>
      </div>
      <div class="trend-card">
        <div class="trend-icon">🧪</div>
        <h3>评测与方法论</h3>
        <p>输出自己的评估框架，而不是简单转载数据表或排行榜结论。</p>
      </div>
    </div>
  </div>
</section>

<section class="knowledge-resources">
  <div class="container">
    <h2>写作建议</h2>
    <div class="resources-grid">
      <div class="resource-card">
        <div class="resource-icon">1</div>
        <h3>先写判断</h3>
        <p>每篇文章优先输出你的核心观点，再补充事实、对比与证据。</p>
      </div>
      <div class="resource-card">
        <div class="resource-icon">2</div>
        <h3>再写证据</h3>
        <p>把实验、引用、截图、推理过程组织成可复查的结构。</p>
      </div>
      <div class="resource-card">
        <div class="resource-icon">3</div>
        <h3>最后沉淀模板</h3>
        <p>把高质量文章逐步固化成你自己的写作模板和分析框架。</p>
      </div>
    </div>
  </div>
</section>

<section class="llm-posts">
  <div class="container">
    <h2>LLM相关文章</h2>
    <div class="posts-list">
      {% for post in site.llm_posts %}
        <article class="post-item">
          <span class="post-category">{{ post.category }}</span>
          <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
          <p>{{ post.excerpt | strip_html | truncate: 150 }}</p>
          <div class="post-meta">
            <span>{{ post.date | date: "%Y-%m-%d" }}</span>
            {% if post.tags %}
              {% for tag in post.tags %}
                <span class="tag">{{ tag }}</span>
              {% endfor %}
            {% endif %}
          </div>
        </article>
      {% else %}
        <p>暂无LLM相关文章，敬请期待！</p>
      {% endfor %}
    </div>
  </div>
</section>
