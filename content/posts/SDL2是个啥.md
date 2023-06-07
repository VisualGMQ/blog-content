---
title: SDL2是个啥
date: 2019-07-27 23:51:30
category:
- game development
tags:
- SDL2
---
​	**SDL2(Simple Direct Media Player 2)** 是一个用于多媒体技术，游戏编程，计算机辅助设计的，一个用于绘图和事件处理的库。大多数人将其看作游戏引擎，包括其官网也是在大力宣传其在游戏编程方面的成果。但是正如DirectX一样，SDL的也被用来制作多媒体或者数据展示等。
&emsp;&emsp;SDL2比起SDL1来说改变的幅度很大，所以我们这里介绍的是SDL2而不是SDL1.最新的SDL应该是2.0.9版本。你可以从[这里下载](http://www.libsdl.org)。
&emsp;&emsp;SDL2是一个跨平台的(Windows, Mac OS X, Linux, iOS, and Android)，由C编写的程序库。也可以使用C++来编写，同时也给出了很多其他语言的支持，比如python的pygame和pygame-SDL。具体的支持[见这里](http://www.libsdl.org/languages.php)。
&emsp;&emsp;和OpenGL不一样，SDL2大部分用来处理2D游戏，但是其内置对OpenGL的原生支持，你也可以用它来编写3D游戏。SDL2是个底层的游戏引擎，这意味着它包含着绘图，时间与事件处理等基本操作，但是不提供帧动画，场景和几何变换等高级的功能，这些功能需要程序员自己利用SDL，数学知识和编程知识进行编写。SDL十分底层，可以用来在其上进行二次开发来制作新的游戏引擎（比如OGRE就是基于SDL2的）。
&emsp;&emsp;如果你想使用高级的游戏引擎，请参阅cocos2dx，Unity3D，Unreal Engine等知名的游戏引擎。这些引擎将大多数游戏编程的元素封装好了便于程序员使用。但是如果你想要从底层开发的话，SDL仍然是一个不错的选择。
&emsp;&emsp;SDL也提供了自身的API文档，你可以参阅[这里](http://wiki.libsdl.org/FrontPage)
