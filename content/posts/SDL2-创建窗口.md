---
title: SDL2-创建窗口
date: 2019-07-28 00:07:17
category:
- game development
tags:
- SDL2
---
一个游戏，如果想要开始的话，必须得先有一个窗口。这里我们先来创造一个窗口。
<!--more-->
***
**SDL_Window结构体**
由于SDL2是C语言写的，所以他没有对象什么的，只有结构体。窗体的结构体是SDL_Window。如果你查阅的是SDL2的官方文档，那么如果他的结构体有提供给你操作的属性，他会直接给你。但是SDL_Window的结构体没有给出任何的属性，所以只能使用函数来操控了。
每一个SDL_Window都代表着一个窗口，如果被正确构造的话。
***
**SDL_CreateWindow**
这个函数会创建一个窗口，他的用法如下：
```c++
SDL_Window* SDL_CreateWindow(const char* title,
                             int         x,
                             int         y,
                             int         w,
                             int         h,
                             Uint32      flags)
```
参数说明如下：

* title。一个字符串，为窗体的标题。
* x，y。表示以整个屏幕为坐标系的窗体位置。
* w，h。表示窗体的大小
* flags。表示窗体的样式，其为SDL_WindowFlags。这个枚举的取值在[这里](http://wiki.libsdl.org/SDL_WindowFlags)
  这个函数返回一个SDL_Window\*的结构体指针。

于是我们就可以使用这个函数来创造一个窗口了：
```c++
SDL_Window* win = SDL_CreateWindow("Hello World",SDL_WINDOWPOS_CENTERED,SDL_WINDOWPOS_CENTERED,700,700,SDL_WINDOW_SHOWN);
```
这里的flags我们给的是SDL_WINDOW_SHOWN，表示创建的之后直接显示窗口。你也可以使用按位或运算来组合多个值，比如SDL_WINOW_FULLSCREEN可以全屏窗口之类的。
***
**窗口动不了或者一闪而过？？？**
如果你的代码仅仅是：
```c++
int main(int argc,char** argv){
    SDL_Window* win = SDL_CreateWindow("Hello World",SDL_WINDOWPOS_CENTERED,SDL_WINDOWPOS_CENTERED,700,700,SDL_WINDOW_SHOWN);
    return 0;
}
```
那么即使创建完成窗口了，由于程序结束了，所以也会一闪而过。
如果你加上了while循环，那么可以保证窗体显示出来，但是会移动不了：
```c++
int main(int argc,char** argv){
    SDL_Window* win = SDL_CreateWindow("Hello World",SDL_WINDOWPOS_CENTERED,SDL_WINDOWPOS_CENTERED,700,700,SDL_WINDOW_SHOWN);
    while(1);
    return 0;
}
```
这是因为还没有事件处理，所以没有办法去移动或者操作。
我们这里仅仅只是创建了一个窗口而已，要怎么显示这个窗口还要到渲染器那一章再说。
***
**获得窗口的状态**
这里还有一些函数来获得窗口的状态：

* SDL_GetWindowFlags()用于获得你设置的flags。你可以使用按位或运算来判断这个窗口的样式:`Uint32 SDL_GetWindowFlags(SDL_Window* window)`
* SDL_GetWindowSize()这个函数获得窗体的大小：`void SDL_GetWindowSize(SDL_Window* window,
                       int*        w,
                       int*        h)
`
* SDL_GetRendererOutputSize()用于获得渲染器渲染的大小： `int SDL_GetRendererOutputSize(SDL_Renderer* renderer,
                              int*          w,
                              int*          h)
`
想必你已经发现了，每个关于窗口的函数都需要SDL_Window\*参数，这是因为这些函数需要知道是对哪个窗体进行操作。
***
**销毁窗体**
由于SDL_CreateWindow()返回的是一个指针，而参数又没有传入指针，所以很明显SDL_CreateWindow()再内部malloc了一个指针，然后返回他。既然是malloc的指针，就必须free掉。但是这里你不可以直接使用free()函数，而需要使用SDL_DestroyWindow()来销毁窗体（其实SDL_DestroyWindow()内部也是使用的free，但是你不要直接用free）：
```c++
void SDL_DestroyWindow(SDL_Window* window)
```
这样这个窗口就被我们销毁了。
***
由于SDL2是C语言编写的，所以会有很多的创造和销毁函数，这些函数最好成对出现（你也可以等着程序结束自动释放资源，但是我极度不建议你这样做），因为程序员产出的内存，程序员要对其负责。
