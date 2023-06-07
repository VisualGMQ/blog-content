---
title: SDL2-平台检测和CPU信息
date: 2019-07-28 00:43:39
category:
- game development
tags:
- SDL2
---
SDL2提供了平台系统检测和CPU信息检测
***
**平台检测**
平台检测只有一个函数，包含在SDL_platform.h文件中:
```C++
const char* SDL_GetPlatform(void)
```
返回值为C字符串，取值如下：
* Windows
* Mac OS X
* Linux
* iOS
* Android
***
**CPU信息检测**
有关CPU信息检测[详见这里](http://wiki.libsdl.org/CategoryCPU)