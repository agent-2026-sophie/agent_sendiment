---
layout: default
title: Agent技术
description: 面向博客写作的 Agent 专栏，聚焦系统设计、应用案例与工程实现
---

<section class="page-header">
  <div class="container">
    <h1>Agent 专栏</h1>
    <p>从概念走向系统设计，持续记录 Agent 的架构、工作流与落地经验。</p>
  </div>
</section>

<section class="agent-intro">
  <div class="container">
    <div class="intro-content">
      <div class="intro-text">
        <h2>这个栏目写什么？</h2>
        <p>这里不是概念罗列页，而是围绕 Agent 的真实设计问题来写文章：任务拆解怎么做、工具调用如何编排、记忆如何设计、系统如何评估、产品如何落地。</p>
      </div>
      <div class="agent-diagram">
        <div class="diagram-box">
          <div class="box-header">🧠 写作框架</div>
          <div class="box-content">
            <div class="component">问题定义</div>
            <div class="component">系统结构</div>
            <div class="component">执行流程</div>
            <div class="component">失败案例</div>
            <div class="component">评估方法</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="agent-frameworks">
  <div class="container">
    <h2>推荐写作方向</h2>
    <div class="frameworks-grid">
      <div class="framework-card">
        <div class="framework-icon">🧭</div>
        <h3>系统架构</h3>
        <p>写单 Agent、多 Agent、Planner-Executor、事件驱动等模式的优缺点。</p>
        <div class="framework-tags">
          <span>Architecture</span>
          <span>Workflow</span>
        </div>
      </div>
      <div class="framework-card">
        <div class="framework-icon">🧰</div>
        <h3>工具使用</h3>
        <p>写 Tool Calling、Browser Use、代码执行、检索增强等能力如何协同。</p>
        <div class="framework-tags">
          <span>Tools</span>
          <span>Execution</span>
        </div>
      </div>
      <div class="framework-card">
        <div class="framework-icon">🧠</div>
        <h3>记忆与状态</h3>
        <p>写短期记忆、长期记忆、用户画像、上下文裁剪和状态恢复策略。</p>
        <div class="framework-tags">
          <span>Memory</span>
          <span>State</span>
        </div>
      </div>
      <div class="framework-card">
        <div class="framework-icon">📏</div>
        <h3>评估与可靠性</h3>
        <p>写成功率、稳定性、观测性、失败恢复与产品级约束的实践经验。</p>
        <div class="framework-tags">
          <span>Eval</span>
          <span>Reliability</span>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="agent-applications">
  <div class="container">
    <h2>适合长期更新的系列内容</h2>
    <div class="applications-grid">
      <div class="app-card">
        <div class="app-icon">📝</div>
        <h3>框架评测</h3>
        <p>持续对比不同 Agent 框架的设计理念和适用边界。</p>
      </div>
      <div class="app-card">
        <div class="app-icon">🧪</div>
        <h3>实验记录</h3>
        <p>输出 Prompt、Agent Loop、工具策略的实验笔记和复盘。</p>
      </div>
      <div class="app-card">
        <div class="app-icon">🏗</div>
        <h3>系统复盘</h3>
        <p>拆解一个 Agent 产品背后的系统结构和关键权衡。</p>
      </div>
      <div class="app-card">
        <div class="app-icon">📚</div>
        <h3>论文解读</h3>
        <p>梳理 Agent 领域重要论文和方法演进。</p>
      </div>
      <div class="app-card">
        <div class="app-icon">💥</div>
        <h3>失败案例</h3>
        <p>专门写 Agent 为什么失控、卡住、胡编或无法执行。</p>
      </div>
      <div class="app-card">
        <div class="app-icon">🚀</div>
        <h3>产品落地</h3>
        <p>分析 Agent 在办公、研发、客服、搜索等场景的可行性。</p>
      </div>
    </div>
  </div>
</section>

<section class="agent-posts">
  <div class="container">
    <h2>Agent相关文章</h2>
    <div class="posts-list">
      {% for post in site.agent_posts %}
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
        <p>暂无Agent相关文章，敬请期待！</p>
      {% endfor %}
    </div>
  </div>
</section>
