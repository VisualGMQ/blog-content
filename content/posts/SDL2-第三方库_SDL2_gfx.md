---
title: SDL2第三方库：SDL2_gfx
date: 2019-09-22 00:42:57
category:
- game development
tags:
- SDL2
---
这个库是非官方的第三方库，官网在[这里](http://www.ferzkopp.net/wordpress/2016/01/02/sdl_gfx-sdl2_gfx/)。
在线API文档在[这里](http://www.ferzkopp.net/Software/SDL2_gfx/Docs/html/index.html)
<!--more-->

# gfx库简介
SDL2_gfx库用主要用于以下三件事：
* 绘制图形（包括原本SDL不直接支持的圆，椭圆，圆角矩形（实心的和空心的）等等等）和文字（很简单的英文文字）
* 对`SDL_Surface`进行变换，包括旋转，缩放
* 控制帧率

其实我觉得主要还是他对绘制图形方面的支持（因为SDL_Surface不是很常用了，帧率的控制我们自己几行代码也能控制）比较好。

## 绘制图形
你可以直接跳到其API文档里面的SDL2_gfxPrimitives.h文件部分（[直接跳转](http://www.ferzkopp.net/Software/SDL2_gfx/Docs/html/_s_d_l2__gfx_primitives_8h.html)），会看到各种各样的绘制图形的函数。函数都是直接使用render绘制，直接指定颜色和坐标。函数太多了，而且API很详细，所以大家自己去看吧。

需要注意的是：**绘制之后，render的颜色会一直被改变。所以在使用gfx库的时候要在每次的循环前加上`SDL_SetRenderDrawColor()`设置清屏颜色**。而且绘制字符的函数很垃圾，有必要的时候还是用`SDL_ttf`和`SDL_FontCache`库吧。

## 对SDL_Surface进行变换
这一部分直接API文档吧:[直接跳转](http://www.ferzkopp.net/Software/SDL2_gfx/Docs/html/_s_d_l2__rotozoom_8h.html)

## 控制帧率
首先你需要声明一个`FPSmanager`结构体，这个结构体里面会存储有关帧率的信息：
```c
FPSmanager manager;
```

然后你需要初始化这个结构体：
```c
SDL_initFramerate(&manager);
```

然后，如果有必要，你需要指定帧率（不指定默认30FPS)：
```c
SDL_setFramerate(&manager);
```

最后，在主循环中，不要使用`SDL_Delay()`函数延时，使用它给的`SDL_framerateDelay()`函数延时。这个函数会帮助你控制帧率：
```c
SDL_framerateDelay(&manager);
```

# 小声BB
其实在SDL1的时候有一个GUIlib可以绘制GUI控件的，但是SDL2的时候没了（难道是还没有开发出来？？？），很遗憾啊，现在GUI要自己写了。