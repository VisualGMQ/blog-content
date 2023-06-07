---
title: SDL2-版本获取
date: 2019-07-28 00:39:22
category:
- game development
tags:
- SDL2
---
官方给了很多的版本获取宏和函数，但是我觉得根本没有这个必要，我们这里只介绍一个函数和一个宏，其他的请到[官方文档](http://wiki.libsdl.org/CategoryVersion)去看一看。
***
我们的函数就是`SDL_GetVersion(SDL_version* version)`，宏是`SDL_VERSION(version)`。这两个都需要一个`SDL_version*`，而`SDL_version`是一个结构体，只有三个成员`major`,`minor`,`patch`。所以你只需要这一个函数或者宏就可以得到SDL的版本了。

区别在于：`SDL_VERSION`是获得链接库的版本，而`SDL_GetVersion()`是获得编译的版本。也就是说一个是链接库的版本，一个是头文件的版本。