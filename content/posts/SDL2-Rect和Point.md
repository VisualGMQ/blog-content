---
title: SDL2-Rect和Point
date: 2019-07-28 00:45:26
category:
- game development
tags:
- SDL2
---
SDL_Rect和SDL_Point都是SDL中用于表示几何图像的基本元素。让我们来深入了解一下这两个结构体吧。
<!--more-->
***
**SDL_Rect**

**Rect的内容**
SDL_Rect用于表示矩形，其结构很简单，只有四个属性：
* int x
* int y
* int w
* int h

这四个属性表示了左上角点的坐标和矩形的大小。

**Rect相关的函数**
关于Rect的函数很多，主要用于碰撞检测的有：
* `SDL_HasIntersection`用于判断两个矩形是否相交
* `SDL_IntersectRect`这个函数不仅会判断是否相交，其第三个参数还可以获得相交之后的矩形
* `SDL_IntersectRectAndLine`这个函数判断矩形和线段是否相交，由于SDL中没有线段的结构体，所以都是将端点坐标作为参数传入
* `SDL_PointInRect`这个函数判断点是否在矩形内

还有一些计算几何的函数：
* `SDL_EnclosePoints`找到能够包含一系列点的最小矩形
* `SDL_RectEmpty`判断矩形是否有面积
* `SDL_RectEquals`判断两个矩形是否一样（判断四个属性是否相等）
* `SDL_UnionRect`获得两个矩形组合之后的大矩形
***
**SDL_Point**
SDL_Point用于表示点。

**Point的内容**
很简单，两个属性：
* int x
* int y

**Point的函数**
* `SDL_EnclosePoints`
