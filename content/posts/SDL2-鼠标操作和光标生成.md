---
title: SDL2-鼠标操作和光标生成
date: 2019-07-28 00:48:28
category:
- game development
tags:
- SDL2
---
### 鼠标和光标操作
SDL2里面专门有SDL_mouse.h头文件给出了鼠标和光标的操作。
***
**关于光标的操作**
SDL2里面提供了很多关于光标的操作，包括创建光标，显示光标等。
<!--more-->

_创建光标_
```c++
SDL_Cursor* SDL_CreateColorCursor(SDL_Surface* surface,
                                  int          hot_x,
                                  int          hot_y)
```
这个函数通过SDL_Surface指定一个图片，hot_x,hot_y来指定光标的操纵点来创建一个光标。

```c++
SDL_Cursor* SDL_CreateCursor(const Uint8* data,
                             const Uint8* mask,
                             int          w,
                             int          h,
                             int          hot_x,
                             int          hot_y)
```
这个函数创建一个黑白的光标，通过data,mask数组给出光标的像素信息，w,h给出光标大小,hot_x,hot_y给出光标操纵点来创建光标，[这里有一个例子](http://wiki.libsdl.org/SDL_CreateCursor?highlight=%28%5CbCategoryMouse%5Cb%29%7C%28CategoryEnum%29%7C%28CategoryStruct%29)

```c++
SDL_Cursor* SDL_CreateSystemCursor(SDL_SystemCursor id)
```
这个函数创建一个系统自带的光标，其中id有如下取值:
![光标取值](/images/cursor_enum.png)

_设置光标_
创建了光标当然要使用了
```c++
void SDL_SetCursor(SDL_Cursor* cursor)
```

_释放光标_
创建了光标当然要释放了
```c++
void SDL_FreeCursor(SDL_Cursor* cursor)
```

_获得当前光标_
```c++
SDL_Cursor* SDL_GetCursor(void)
```

_获得SDL2默认光标_
```c++
SDL_Cursor* SDL_GetDefaultCursor(void)
```

_显示光标_
```c++
int SDL_ShowCursor(int toggle)
```
给入SDL_ENABLE显示光标，SDL_DISABLE隐藏光标，SDL_QUERY 返回当前光标显示状态。

***
**关于鼠标的操作**

_鼠标事件_
鼠标事件有如下几个：
* SDL_MOUSEMOTION 鼠标移动
* SDL_MOUSEBUTTONDOWN 鼠标按下
* SDL_MOUSEBUTTONUP 鼠标按下
* [SDL_MOUSEWHEEL](http://wiki.libsdl.org/SDL_MouseWheelEvent) 鼠标滚轮

鼠标的事件处理中，`event.button`会存储所有的信息（滚轮事件中成员变量意义可能不一样，请看wiki），包括：
* `button`:按下的按键，可以是
    * SDL_BUTTON_RIGHT
    * SDL_BUTTON_LEFT
    * SDL_BUTTON_MIDDLE
* `x`:鼠标的x位置
* `y`:鼠标的y坐标
* `xrel, yrel`:鼠标的移动距离（仅MOUSEMOTION事件）
* `clicks`:鼠标点击次数。1是单击，2是双击（仅MOUSEDOWN,MOUSEUP事件）
* `direction`：鼠标滚轮的方向（仅MOUSEWHEEL事件）
  

_是否全局追踪鼠标_
```c++
int SDL_CaptureMouse(SDL_bool enabled)
```
这个函数可以让你定义是否全局追踪鼠标。如果你给入了SDL_TRUE，表示全局追踪鼠标。这样即使鼠标事件发生在程序窗体外面也可以监测到。
如果为SDL_FALSE，那么就只能检测到这个程序的鼠标事件。

_获得鼠标状态（按键，位置等）_
```c++
Uint32 SDL_GetMouseState(int* x,
                         int* y)
```
这个函数获得鼠标的局部坐标位置

```c++
Uint32 SDL_GetGlobalMouseState(int* x,
                               int* y)
```
这个函数获得全局鼠标位置（相对于整个屏幕的）

```c++
Uint32 SDL_GetRelativeMouseState(int* x,
                                 int* y) 
```
  这个函数用来获得上次调用这个函数到这次调用函数鼠标的x,y坐标的偏移量。  
  如果想要使用这个函数，你需要通过这个函数来指定是否开启Relative模式：
```c++
int SDL_SetRelativeMouseMode(SDL_bool enabled)
```
传入SDL_TRUE表示开启
或者通过这个函数得到Relative模式的状态:
```c++
SDL_bool SDL_GetRelativeMouseMode(void)
```

这三个函数的返回值都是鼠标的按键状态。你可以使用 **SDL_BUTTON(X)** 宏来获得状态：
SDL_BUTTON(X返回：
* 1：左键按下
* 2：中键按下
* 3: 右键按下

_鼠标的坐标转换_
```c++
int SDL_WarpMouseGlobal(int x,
                        int y)
```
从局部坐标到全局坐标

```c++
void SDL_WarpMouseInWindow(SDL_Window* window,
                           int         x,
                           int         y)
```
从全局坐标到局部坐标