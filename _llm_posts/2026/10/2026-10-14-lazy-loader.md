---
title: 懒加载
date: 2026-10-14
author: Sophie
tags: [通识]
excerpt: 懒加载（Lazy Loading）就是：先不加载暂时用不到的东西，等需要时再加载。
---
**懒加载（Lazy Loading）就是：先不加载暂时用不到的东西，等需要时再加载。**  
严格来说，*Lazy Loading* 是这种策略，*Lazy Loader* 是实现它的加载器或组件。

比如，一个网页里有很多图片，你刚打开时只看得到顶部几张。懒加载会先加载眼前需要的图片，等你滚动到接近下面的图片时，再加载它们，而不是一开始就全部下载。

```html type="renderer"
<html style="margin:0;padding:0;">
<title>懒加载的工作方式</title>
<div style="width:100%;box-sizing:border-box;padding:16px;font-family:system-ui,sans-serif;color:#243447;background:transparent;">
  <div style="font-size:16px;font-weight:700;margin-bottom:14px;">网页图片加载 · 示意</div>
  <div style="padding:12px;border-left:4px solid #778899;background:#f3f5f7;margin-bottom:12px;">
    <div style="font-size:14px;font-weight:600;margin-bottom:8px;">立即加载</div>
    <div style="font-size:15px;line-height:1.8;">打开页面 → 下载所有图片 → 展示页面内容</div>
  </div>
  <div style="padding:12px;border-left:4px solid #178778;background:#eef8f5;">
    <div style="font-size:14px;font-weight:600;margin-bottom:8px;">懒加载</div>
    <div style="font-size:15px;line-height:1.8;">打开页面 → 先加载当前需要的图片</div>
    <div style="margin:10px 0 10px 16px;padding-left:14px;border-left:2px dashed #92b9b1;font-size:14px;line-height:1.8;color:#526b66;">下方图片暂不下载<br>↓ 用户滚动，图片接近可视区域</div>
    <div style="font-size:15px;line-height:1.8;">再下载对应图片 → 显示图片</div>
  </div>
</div>
</html>
```

它不只用于图片，也常用于：
- **功能模块**：点击“打开编辑器”时，才加载编辑器的代码。
- **数据**：展开某条记录的详情时，才请求详细数据。
- **对象**：第一次使用某个对象时，才创建或初始化它。

**好处**是减少启动时的工作，让首屏或启动更快，避免浪费流量、内存等资源。**代价**是第一次使用被延迟加载的内容时，可能需要等待，所以要处理好加载中和失败的状态。

一句话记忆：**不是不加载，而是把加载推迟到需要的时候。**
