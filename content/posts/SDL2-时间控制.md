---
title: SDL2-时间控制
date: 2019-07-28 00:44:22
category:
- game development
tags:
- SDL2
---
时间控制函数在SDL_timer.h中
<!--more-->
***
**延时**
```c++
void SDL_Delay(Uint32 ms)
```
延时ms个毫秒。这个函数广泛用在游戏编程中用于延时


**时钟控制**
_添加时钟_
```c++
SDL_TimerID SDL_AddTimer(Uint32            interval,
                         SDL_TimerCallback callback,
                         void*             param)
```
* interval：每次触发回调函数的时间间隔
* callback：回调函数，必须以`Uint32 my_callbackfunc(Uint32 interval, void *param)`的形式编写并且返回值为interval。
* param：用户自定义数据。

这个函数返回添加的时钟ID


_移除时钟_
```c++
SDL_bool SDL_RemoveTimer(SDL_TimerID id)
```
和Windows编程一样，时钟不提供暂停机制。如果想要暂停必须通过删除来达到目标。

**精确时间**
```c++
Uint32 SDL_GetTicks(void)
```
这个函数获得SDL2库初始化以来的毫秒数。这个函数用于在游戏编程里面精确计算经过的时间长度。

**用于比较时间的宏**
```c++
SDL_TICKS_PASSED(A, B)
```
如果时间A已经经过时间B了，那么返回true。否则返回false