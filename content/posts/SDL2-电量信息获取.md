---
title: SDL2-电量信息获取
date: 2019-07-28 00:42:57
category:
- game development
tags:
- SDL2
---
获取电量的函数只有一个：
```c++
SDL_PowerState SDL_GetPowerInfo(int* secs,
                                int* pct)
```
SDL_PowerState是一个枚举常量，取值如下：
* SDL_POWERSTATE_UNKNOWN，无法得知信息
* SDL_POWERSTATE_ON_BATTERY，靠电池运作，没插电
* SDL_POWERSTATE_NO_BATTERY，插电，没有电池
* SDL_POWERSTATE_CHARGING，充电中
* SDL_POWERSTATE_CHARGED，插电，且电池充满了。

其中参数secs表示电量还可以运作多长时间，pct表示还有百分之多少的电量。函数通过这两个参数返回信息。