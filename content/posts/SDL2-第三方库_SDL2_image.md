---
title: SDL2第三方库：SDL2_image库
date: 2019-09-22 00:42:57
category:
- game development
tags:
- SDL2
---
SDL2除了自己本身的SDL2库，官方和其他开发者为了补充相应的内容，给出了很多有用的库。这里就来看一下适用范围最广的SDL2_image库。

所有的官方拓展库可以在[这里](https://www.libsdl.org/projects/)找到。
<!--more-->

# SDL2_image库
由于SDL2本身只有`SDL_LoadBMP()`函数，只能够载入位图，所以官方给出了`SDL_image`库，允许SDL2加载其他各种格式的图片资源。可以加载`BMP, GIF, JPEG, LBM, PCX, PNG, PNM, SVG, TGA, TIFF, WEBP, XCF, XPM, XV`。
其文档在[这里](https://www.libsdl.org/projects/SDL_image/docs/SDL_image.pdf)

## 使用流程
使用的流程十分简单：
1. 首先使用`IMG_Init()`函数初始化SDL_Image库。这里也需要像`SDL_Init()`函数一样给入flag。flag有`IMG_INIT_JPG, IMG_INIT_PNG, IMG_INIT_WEBP, IMG_INIT_GIF`。可以使用按位或来传入多个。默认可以载入位图。
2. 使用`IMG_Load()`函数载入图像。
3. 关闭SDL_image库`IMG_Quit()`

## 主要函数
主要的函数分为两种：载入图片的函数，判断图片函数，存储图片函数和错误处理函数。

### 载入图片
一般最通用的函数是`IMG_Load()`，可以载入你在`IMG_Init()`里面立的flag相关的图片。
或者使用`IMG_Load_RW()`来从raw资源载入图片。raw资源可以通过`SDL_RWFromFile()`函数获得。但是一般不这样做（直接IMG_Load不就行了）。

而且还有各种`IMG_LoadXXX_RW()`函数用于读取特定格式的raw资源，比如`IMG_LoadPNG_RW()`函数。这些函数基本上没什么用。

### 判断图片资源
所有的判断函数都是`IMG_isXXX()`形式，其中XXX是你的图片格式的大写。比如`IMG_isCUR(),IMG_isJPG()`。所有的判断函数的参数都是`SDL_RWops*`，可以使用`SDL_RWFromFile()`获得。

这些图片判断函数的作用在于，如果你的图片的后缀名不是平常的后缀名（比如.png被改成.xxx了），你可以使用这些函数判断你的图片的类型。

### 存储图片
你可以使用`IMG_SaveJPG(), IMG_SavePNG()`函数来保存图片。对于jpg图片会有一个额外的“质量”参数。
需要注意的是存储图片的函数在文档里没有被提及，但是确实是存在的。

### 错误处理
通过`IMG_SetError(), IMG_GetError()`函数获得和设置错误。