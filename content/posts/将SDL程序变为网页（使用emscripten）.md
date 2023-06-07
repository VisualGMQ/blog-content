---
title: 将SDL程序变为网页（使用emscripten）
date: 2021-08-02 19:39:34
tags:
- SDL2
category:
- 杂项
---

本文介绍了如何使用emscripten来将SDL程序编译成网页。

<!-- more -->

# 准备工作

## 什么是emscripten？

`emscripten`是一个用于WebAssembly的一套编译工具，基于LLVM。  
WebAssembly(wasm)，即网页汇编，说白了，就是用在Web上的汇编语言。WebAssembly的优点是速度快，他可以将C/C++代码转换成wasm代码，所以能够提升不少效率。  
不过我这里主要是为了将C++代码变成网页啦，不管效率。  

## 安装emscripten

安装方法见[官网](https://emscripten.org/docs/getting_started/downloads.html)

# 编写一个Demo

## wasm的SDL和普通SDL的区别

编写wasm的SDL程序和平时的不太一样，我们需要在程序内部指定我们的游戏主循环，这样Web端才能帮我们更新游戏:

```c++
// 首先包含emscripten的头文件
#include "emscripten.h"

// 这是主循环的函数声明
void mainloop();

// 使用这个函数来设置主循环，这个循环是异步的
emscripten_set_main_loop(mainloop, -1, 1);
```

其中最主要的就是这两个函数：

```c++
void emscripten_set_main_loop_arg(em_callback_func func, void* arg, int fps, int simulate_infinite_loop);
void emscripten_set_main_loop(em_callback_func func, int fps, int simulate_infinite_loop);
```

看参数名字就知道他们是什么意思了。`fps`如果是负数，则使用浏览器的`requestAnimationFrame`机制来更新。`simulate_infinite_loop`总应当是1，以便于浏览器执行循环。  
如果你要给mainloop传参，就用第一个函数，别忘了改变mainloop的声明：`void mainloop(void* args);`  
每个程序只能有一个主循环。如果需要用其他的主循环，需要先将前面的关闭。  
有关这个函数的详细说明，请看[这里](https://emscripten.org/docs/api_reference/emscripten.h.html)

## Demo

Demo的文件在[这里](/codes/wasm_sdl_demo.cpp)

编译的方式有两种，第一种是用emscripten自带的SDL：

```bash
em++ wasm_sdl_demo.cpp -s WASM=1 -s USE_SDL=2 -o index.html
```

注意输出的是html。`USE_SDL=2`代表要使用SDL2。  
emscripten会自己去下载对应的SDL，如果你觉得太慢的话也可以将SDL的源码自己clone下来，然后看他`docs/README-emscripten.md`文件来自己手动编译成wasm所需的SDL。编译的过程还挺快的。  

编译好的网页在这里[Demo](/other_pages/wasm_sdl_demo/index.html)

## 常用的编译选项

再看一个完整的Makefile：

```makefile
CXX = em++
SDL_DEP = -s WASM=1 -s USE_SDL=2
SDL_IMAGE_DEP = # -s USE_SDL_IMAGE=2 -s SDL2_IMAGE_FORMATS='["png", "jpg", "bmp"]'
ASSET_PRELOAD = --preload-file assets
SRC = $(wildcard ./*.cpp)

index.html: $(SRC)
    $(CXX) $^ ${SDL_DEP} ${SDL_IMAGE_DEP} ${ASSET_PRELOAD} -o $@ -std=c++17

.PHONY:clean run
clean:
    -rm index.html
    -rm *.wasm
    -rm *.js
    -rm *.o

run:
    emrun --port 8080 .
```

想要使用其他SDL库，请使用`-s USE_SDL_XXX=2`。这里第三行设置了`SDL_image`依赖。

第四行则是预加载资源文件，这里预加载`assets`资源文件夹。

运行命令使用`emrun --port 8080`，它会开启一个本地服务器然后运行你的网页。如果不开启服务器直接运行网页，且你没有预加载资源，那么资源可能无法被读取。

## 将网页放到Hexo上

这里有个坑，但不是所有的主题都是这样：在发布页面的时候请静止Hexo渲染含有wasm的页面，不然wasm会失效。

## 另一个完整的小游戏

[舞狮](https://visualgmq.gitee.io/projects/lion_dance/a.html)是一个完整的小游戏，你可以将此作为参考。
