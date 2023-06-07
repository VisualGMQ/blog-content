---
title: 'OpenGL-glu,glut,glew等库的区别'
date: 2019-07-28 11:01:09
category:
- game development
tags:
- OpenGL
---
OpenGL中有很多的库，我们今天来说一下这些库的区别。
<!--more-->
**gl**是OpenGL在很早的版本的时候维护的库，里面有很多的opengl函数给用户使用。是opengl最早最原始的库，于窗口无关。
**glu**是在gl上封装的库，通过这个库可以减轻你的opengl编程，不用自己计算变换或者更加容易绘制集合体。但是仍然是窗口无关的。
**glut**和gl，glu完全没有任何关系。其内部包含了opengl函数，并且提供了创建窗体的函数。也就是说glut还自带窗体功能OpenGL
**glfw**和glut一样，在拥有opengl函数的基础上带有窗体功能。
**glew**包含了opengl函数，以及额外的拓展函数。也是于窗口无关的，也就是说他也得有一个GUI引擎来支持。

以上库和其他额外库的各个关系如下：
![gl glu glut及其它](/images/gl-libs.png)

所以OpenGL其实只需要gl库和任意一个支持OpenGL的GUI库就可以制作了。但是还是有很多人选择gl+glut, glut, glew+GUI, glfw的组合