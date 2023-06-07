---
title: SDL2-初始化
date: 2019-07-28 00:11:29
category:
- game development
tags:
- SDL2
---
初始化并非只有`SDL_Init`一个函数。让我们来看看还有其他什么函数
<!--more-->
***
**SDL_Init**
`SDL_Init`函数很简单，其参数为要初始化的模块（SDL有很多模块，像是时间模块SDL_INIT_TIMER,声音模块SDL_INIT_AUDIO,显示模块SDL_INIT_VIDEO等）。你也可以通过`SDL_INIT_EVERYTHING`来初始化所有模块。具体模块如下：
* SDL_INIT_TIMER
* SDL_INIT_AUDIO
* SDL_INIT_VIDEO
* SDL_INIT_JOYSTICK 摇杆模块
* SDL_INIT_HAPTIC 压力模块，用于移动端
* SDL_INIT_GAMECONTROLLER 游戏手柄模块
* SDL_INIT_EVENTS 事件模块

有了这些控制符，你可以在节省资源的情况下使用任意模块。
这个函数成功会返回0，失败返回一个小于0的数。

**SDL_InitSubSystem**
这个函数和SDL_Init()函数差不多，可以在你使用SDL_Init()之后再次初始化你要的模块。

**SDL_QuitSubSystem**
这个函数是对应`SDL_InitSubSystem, SDL_Init`函数的，用于关闭已经初始化的模块。

**SDL_WasInit**
判断模块是否初始化。其参数为一个flag（从SDL_INIT_xx中选择）表示你想要知道哪个模块的信息。如果你传入0回返回所有初始化模块的按位或运算的结果，那么你可以这样得到模块初始化信息：
```c++
Uint32 subsystem_init = SDL_WasInit(SDL_INIT_EVERYTHING);

if (subsystem_init & SDL_INIT_VIDEO) {
    printf("Video is initialized.\n");
} else {
    printf("Video is not initialized.\n");
}
```
或者直接传入模块，那样如果初始化回返回非0值：
```c++
if (SDL_WasInit(SDL_INIT_VIDEO) != 0) {
    printf("Video is initialized.\n");
} else {
    printf("Video is not initialized.\n");
}
```

**SDL_Quit**
SDL_Quit会强制退出所有的模块。

***
接下来要说的是一些模块独立的初始化函数。这些初始化函数初始化的模块不能够被`SDL_Quit`或者`SDL_QuitSubSystem`函数关闭，必须调用相应的函数来关闭：
* `SDL_VideoInit(const char* driver_name)`初始化Video模块，传入驱动名称，NULL为默认驱动。对应关闭函数`SDL_VideoQuit`
* `int SDL_AudioInit(const char* driver_name)`初始化Audio模块（用法同SDL_VideoInit），关闭函数`SDL_AudioQuit`

