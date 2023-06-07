---
title: 从C++到Java:容器
date: 2020-8-4 19:02:09
category:
- language
tags:
- Java
---

这里记录了Java容器的使用

<!--more-->

和C++ STL一样。Java也带有了很多的容器，使用方法也很简单。

# 容器之间的关系

要搞懂C++容器，首先要知道容器之间的关系，下面是各个容器的继承图：

![Java集合类图](https://s2.ax1x.com/2020/02/01/1GQPyj.png)

可以看到这个关系非常错综复杂。上面的大部分都是接口和抽象类，只有少部分的实体类。这些实体类就是我们要用到的。

总体来说，容器分为两种：以Collection为根的容器和以Map为根的字典。

# 容器的使用

其实容器的使用也很简单，严格按照图上的关系来使用就可以了。比如如果你想要使用线性表，你可以`ArrayList<Integer> alist = new ArrayList<>();`，或者`List<String> alist = new ArrayList();`都可以哦。然后就可以更具不同的容器进行不同的操作了。



具体的各个容器的使用参考[廖老师的教程](https://www.liaoxuefeng.com/wiki/1252599548343744/1265109905179456)