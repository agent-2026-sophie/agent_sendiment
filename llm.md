---
layout: default
title: LLM追踪
description: 追踪大型语言模型的最新进展、性能排行和技术趋势
---

<section class="page-header">
  <div class="container">
    <h1>LLM追踪</h1>
    <p>关注大型语言模型的最新进展、性能排行和技术趋势</p>
  </div>
</section>

<section class="llm-ranking">
  <div class="container">
    <h2>模型排行榜</h2>
    <p class="section-subtitle">基于推理能力的模型排名（2026年4月数据）</p>
    
    <div class="filter-bar">
      <select id="category-filter">
        <option value="all">全部类别</option>
        <option value="logic">推理</option>
        <option value="coding">代码</option>
        <option value="math">数学</option>
        <option value="reading">阅读理解</option>
      </select>
    </div>
    
    <div class="rank-table-container">
      <table class="rank-table full">
        <thead>
          <tr>
            <th>排名</th>
            <th>模型名称</th>
            <th>极限分数</th>
            <th>中位分数</th>
            <th>中位差距</th>
            <th>变更</th>
            <th>测试成本</th>
            <th>发布时间</th>
          </tr>
        </thead>
        <tbody>
          <tr class="top-rank">
            <td>1</td>
            <td>GPT-5.5 (xhigh)</td>
            <td>86.76</td>
            <td>83.96</td>
            <td>3.22%</td>
            <td class="positive">+3.4%</td>
            <td>¥140.62</td>
            <td>26-04-24</td>
          </tr>
          <tr>
            <td>2</td>
            <td>GPT-5.4 (high)</td>
            <td>83.85</td>
            <td>79.56</td>
            <td>5.12%</td>
            <td class="negative">-</td>
            <td>¥52.51</td>
            <td>26-03-06</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Gemini 3.1 Pro (high)</td>
            <td>82.83</td>
            <td>72.16</td>
            <td>12.87%</td>
            <td class="positive">+5.8%</td>
            <td>¥54.84</td>
            <td>26-02-19</td>
          </tr>
          <tr>
            <td>4</td>
            <td>Claude Opus 4.6(Think)</td>
            <td>81.19</td>
            <td>77.23</td>
            <td>4.87%</td>
            <td class="negative">-</td>
            <td>¥161.63</td>
            <td>26-02-06</td>
          </tr>
          <tr>
            <td>5</td>
            <td>DeepSeek V4 Pro(max)</td>
            <td>79.31</td>
            <td>70.49</td>
            <td>11.12%</td>
            <td class="negative">-</td>
            <td>¥33.95</td>
            <td>26-04-24</td>
          </tr>
          <tr>
            <td>6</td>
            <td>Kimi-K2.6 (Think)</td>
            <td>74.91</td>
            <td>57.33</td>
            <td>23.46%</td>
            <td class="positive">+4.8%</td>
            <td>¥25.86</td>
            <td>26-04-20</td>
          </tr>
          <tr>
            <td>7</td>
            <td>GLM-5.1 (Think)</td>
            <td>74.71</td>
            <td>64.37</td>
            <td>13.83%</td>
            <td class="positive">+8.5%</td>
            <td>¥19.90</td>
            <td>26-04-08</td>
          </tr>
          <tr>
            <td>8</td>
            <td>Doubao-Seed-2.0-pro (high)</td>
            <td>73.12</td>
            <td>66.02</td>
            <td>9.72%</td>
            <td class="positive">+23.3%</td>
            <td>¥16.40</td>
            <td>26-02-14</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="llm-trends">
  <div class="container">
    <h2>技术趋势</h2>
    <div class="trends-grid">
      <div class="trend-card">
        <div class="trend-icon">📈</div>
        <h3>模型规模持续增长</h3>
        <p>大型语言模型的参数规模不断扩大，百亿、千亿甚至万亿参数模型成为主流</p>
      </div>
      <div class="trend-card">
        <div class="trend-icon">⚡</div>
        <h3>推理速度优化</h3>
        <p>通过量化、蒸馏、稀疏化等技术，模型推理速度大幅提升</p>
      </div>
      <div class="trend-card">
        <div class="trend-icon">🔄</div>
        <h3>上下文长度突破</h3>
        <p>上下文窗口从k级提升到百万级token，支持更长对话和文档处理</p>
      </div>
      <div class="trend-card">
        <div class="trend-icon">🔌</div>
        <h3>多模态能力增强</h3>
        <p>模型整合文本、图像、音频、视频等多种模态信息</p>
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
      {% empty %}
        <p>暂无LLM相关文章，敬请期待！</p>
      {% endfor %}
    </div>
  </div>
</section>