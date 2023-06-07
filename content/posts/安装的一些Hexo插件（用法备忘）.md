---
title: 安装的一些Hexo插件（用法备忘）
date: 2021-07-14 21:42:42
---

这里是本博客安装的一些Hexo插件，主要是记录下来要怎么用和一些坑，防止后面忘了。

## hexo-github

吧github仓库上面某一个提交的时间线拉出来：

{% github VisualGMQ TinyRenderer3D 00fcea51034d52f2e8ffd7ad63949fba654a2039 %}

## hexo-filter-optimize

可以加快打开博客页面的速度，确实，安了后秒开。就是每次开新页面会闪一下。。。

## hexo-admonition 

!!! warning 这是警告
    这是警告的内容

    用空行结束这个内容

这里是普通文字

## hexo-bilibili-card

增加Bilibili卡片：

{% bilicard BV1kX4y1K7Sa %}

## hexo-bilibili-bangumi

可以给网站增加一个追番列表。当自己的追番列表变化了之后要用

```bash
hexo bangumi -u
```

进行本地的数据更新

## hexo-filter-flowchart

制作一些流程图:

```flow
st=>start: 开始
inputA=>inputoutput: 输入用户名密码
opA=>operation: 数据库查询子类
conditionA=>condition: 是否有此用户
conditionB=>condition: 密码是否正确
opB=>operation: 读入用户信息
e=>end: 登录
st->inputA->opA->conditionA
conditionA(yes)->conditionB
conditionA(no)->inputA
conditionB(yes)->opB->e
conditionB(no)->inputA
```

## hexo-filter-sequence

可以制作一些UML图：

```sequence
Alice->Bob: Hello Bob, how are you?
Note right of Bob: Bob thinks
Bob-->Alice: I am good thanks!
```


