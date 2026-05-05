---
layout: default
title: 首页
description: 追踪LLM、Agent前沿发展，沉淀个人专业知识，创作技术博客
---

<section class="hero">
  <div class="container">
    <div class="hero-content">
      <h1>探索AI的无限可能</h1>
      <p>追踪LLM、Agent前沿发展，沉淀专业知识，分享技术洞见</p>
      <div class="hero-buttons">
        <a href="/llm" class="btn btn-primary">LLM追踪</a>
        <a href="/agent" class="btn btn-secondary">Agent技术</a>
      </div>
    </div>
  </div>
</section>

<section class="features">
  <div class="container">
    <h2>网站模块</h2>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🧠</div>
        <h3>LLM追踪</h3>
        <p>关注大型语言模型的最新进展、性能排行和技术趋势</p>
        <a href="/llm" class="feature-link">了解更多 →</a>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">🤖</div>
        <h3>Agent技术</h3>
        <p>探索智能体架构、应用案例和开发实践</p>
        <a href="/agent" class="feature-link">了解更多 →</a>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon">📚</div>
        <h3>知识积累</h3>
        <p>整理技术笔记、学习资源和行业洞察</p>
        <a href="/knowledge" class="feature-link">了解更多 →</a>
      </div>
    </div>
  </div>
</section>

<section class="latest-posts">
  <div class="container">
    <h2>最新文章</h2>
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

<section class="llm-rank-preview">
  <div class="container">
    <h2>LLM排行榜</h2>
    <p class="section-subtitle">基于推理能力的模型排名（2026年4月数据）</p>
    <div class="rank-table-container">
      <table class="rank-table">
        <thead>
          <tr>
            <th>排名</th>
            <th>模型名称</th>
            <th>极限分数</th>
            <th>中位分数</th>
            <th>发布时间</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>GPT-5.5 (xhigh)</td>
            <td>86.76</td>
            <td>83.96</td>
            <td>26-04-24</td>
          </tr>
          <tr>
            <td>2</td>
            <td>GPT-5.4 (high)</td>
            <td>83.85</td>
            <td>79.56</td>
            <td>26-03-06</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Gemini 3.1 Pro (high)</td>
            <td>82.83</td>
            <td>72.16</td>
            <td>26-02-19</td>
          </tr>
          <tr>
            <td>4</td>
            <td>Claude Opus 4.6(Think)</td>
            <td>81.19</td>
            <td>77.23</td>
            <td>26-02-06</td>
          </tr>
          <tr>
            <td>5</td>
            <td>DeepSeek V4 Pro(max)</td>
            <td>79.31</td>
            <td>70.49</td>
            <td>26-04-24</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="text-center mt-4"><a href="/llm" class="btn btn-outline">查看完整排行榜 →</a></p>
  </div>
</section>