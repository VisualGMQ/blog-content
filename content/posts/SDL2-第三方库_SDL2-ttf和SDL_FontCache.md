---
title: SDL2第三方库：SDL2_ttf库和SDL_FontCache
date: 2019-09-22 00:42:57
category:
- game development
tags:
- SDL2
---
TTF库的文档在[这里](https://www.libsdl.org/projects/SDL_ttf/docs/SDL_ttf.pdf)。
FontCache库的github地址在[这里](https://github.com/grimfang4/SDL_FontCache)。
<!--more-->

# SDL2_ttf库介绍
SDL本身是没有绘制文字的功能的。但是官方给出了SDL2_ttf拓展库，让程序员可以绘制文字。注意SDL2_ttf只能够处理ttf文件。

## SDL2_ttf库的使用流程
1. 初始化库`TTF_Init()`，不需要参数
2. 使用库：
    * 使用`TTF_OpenFont()`函数打开一个字体文件，会返回一个`TTF_Font*`。
    * 使用绘制函数`TTF_RenderText_Solid()`将字体转换为`SDL_Surface*`。
    * 将`SDL_Surface*`转化为`SDL_Texture*`绘制到指定位置。
    * 关闭字体描述符`TTF_CloseFont()`。
3. 关闭库`TTF_Close()`

## SDL2_ttf库的使用
基本上可以分为三大函数：
* 打开字体函数
* 设置/获得字体函数
* 将文字转换为`SDL_Surface*`

打开子图和设置/获得字体属性的函数就不说了，手册里面说的很清楚

### 将文字转换为`SDL_Surface*`
ttf库是不能直接绘制的，必须将字体转换为surface。这里的转换函数大体分为：
* `TTF_RenderXXX_Solid()`:直接转换
* `TTF_RenderXXX_Shaded()`:转换为有阴影的（质量高，效率低）
* `TTF_RenderXXX_Blended()`：使用混合转换（质量最高，效率最低）

其中XXX可以是`Text, UTF8, UNICODE, Glyph`，分别代表从文本，UTF8字体，Unicode字体和轮廓转换。

# SDL_FontCache库
SDL_ttf库虽然可以绘制文字，但是非得先转化为Surface，然后再绘制。而且对字体的控制也不是很容易。这里强力推荐一个github上的库`SDL_FontCache()`库，十分好用。

## SDL_FontCache库的使用
1. 首先使用`FC_CreateFont()`创建一个字体描述符`FC_Font*`
2. 然后使用`FC_LoadFont()`载入一个字体
3. 然后使用`FC_Draw()`就可以绘制了，直接绘制到目标地点哦。
4. 使用完之后使用`FC_FreeFont()`释放描述符就OK了

这个库是不是相比来说很快很简单呢？而且官方说这个库比SDL2_ttf更快哦。