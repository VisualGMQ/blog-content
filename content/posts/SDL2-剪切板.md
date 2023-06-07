---
title: SDL2-剪切板
date: 2019-07-28 00:36:29
category:
- game development
tags:
- SDL2
---
SDL操作剪切版的函数很简单：
* `char* SDL_GetClipboardText(void)`：获得剪切板内容
* `SDL_bool SDL_HasClipboardText(void)`：判断剪切板内是否有内容
* `int SDL_SetClipboardText(const char* text)`：将文字放入剪切板（返回0成功，返回负值失败）