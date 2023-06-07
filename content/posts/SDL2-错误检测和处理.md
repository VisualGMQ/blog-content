---
title: SDL2-错误检测和处理
date: 2019-07-28 00:37:14
category:
- game development
tags:
- SDL2
---
SDL错误检测和处理一共就三个函数：
* `SDL_ClearError()`：清除所有错误
* `const char* SDL_GetError()`:获得前一个出错函数产生的错误信息（英文）
* `SDL_SetError(const char* fmt,...)`:设置自己的错误，格式类似printf。（这个函数**总是返回-1**）

SDL的错误处理是这样的：SDL的函数首先会有一个int返回值表示函数是否出错了（一般0为成功，负数表示发生了错误），然后会向错误变量中记录这个错误的文字信息，这个时候你就可以通过`SDL_GetError()`来获得错误了。你也可以通过`SDL_SetError()`来向错误变量中记录自己的错误。`SDL_ClearError()`来清除错误变量记录的内容。