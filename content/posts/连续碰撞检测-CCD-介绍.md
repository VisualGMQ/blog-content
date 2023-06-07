---
title: 连续碰撞检测(CCD)介绍
date: 2022-03-02 22:04:22
tags:
- game development
category:
- game development
---

这里介绍了物理引擎中使用的连续碰撞检测的一些知识。

<!--more-->

## 连续碰撞检测

众所周知，物理引擎中模拟物理效果并不难，难就难在碰撞检测。一般的碰撞检测是每帧检测一下自己的包围盒有没有和其他物体的包围盒相交，但当存在高速物体时容易出现穿墙的情况。

连续碰撞检测(CCD)则旨在解决这个问题，它主要做两件事情：

* 避免穿墙情况

* 计算出影响时间（time of impact - TOI），即物体碰到墙的时间

连续碰撞检测有很多很多的方法：

* 超采样（SuperSampling）：和其名字一样，比如你的游戏FPS是60，那我在物理引擎迭代的时候就用FPS120，FPS180的速率去迭代，这样能一定程度上防止物体速度过快导致穿墙。但显然这种方法运行起来很慢。

* 二分法（Bisection）：如果一个物体在第i帧处有碰撞但在第i+1帧处没有碰撞，那么我们要寻找在第i+0.5帧处有没有碰撞，如果没有，再寻找i+0.25和i+0.75处有没有碰撞，以此类推，直到数值足够小为止。这个算法没办法避免穿墙，因为它要求第i帧处有碰撞。但是我们可以修改这个条件，让他不管有没有碰撞都检测一下。

* 射线投射法（Ray casting）：有很多很小的高速物体，比如子弹，使用上面的方法会很消耗资源。这里就可以使用射线投射法。从上一帧的位置向下一帧投射一条射线（或者将上一帧和下一帧的位置连起来称为一条线段），然后判断射线是否与其他物体相交。这适用于子弹和慢速物体。

* 光线投射到一般的凸物体上：大多数情况下，所涉及的形状是凸的（因为与凹形相比，凸形在碰撞检测中要快得多）。Gino van den Bergen开发了一种迭代算法，可以计算两个凸形状（凸壳，球体，胶囊，盒子，...，所有凸形状！）的CCD。它的工作原理是在配置空间障碍物 （CSO） 上执行基于 GJK 的光线投射。在论文"[针对一般凸物体的光线投射与连续碰撞检测的应用"中对此进行了描述](http://www.dtecta.com/papers/unpublished04raycast.pdf)。如果你不知道GJK，CSO是什么算法，可以看看这本书 *《Collision Detection in Interactive Environments》, Gino van den Bergen著*，或者直接去啃[GJK的论文](http://web.eecs.umich.edu/~grizzle/GilbertFest/Gilbert(58).pdf)

* 保守推进法（Conservative Advancement）：上面讲述的方法都不能处理旋转体，而本算法可以很好地处理，可以看 [Continuous Collision Detection for Non-Convex Polyhedra](http://graphics.ewha.ac.kr/fast/)这篇文章以及 [Continuous Collision Detection and Physics](http://www.continuousphysics.com/BulletContinuousCollisionDetection.pdf)这篇文章

## 参考

[Continuous Collision Detection (Background Information)](https://digitalrune.github.io/DigitalRune-Documentation/html/138fc8fe-c536-40e0-af6b-0fb7e8eb9623.htm#!)
