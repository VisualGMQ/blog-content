---
title: SDL2-渲染器SDL_Renderer
date: 2019-07-28 00:32:00
category:
- game development
tags:
- SDL2
---
### SDL2渲染器
***
有了窗口之后，我们还需要有一个渲染器。渲染器用于将图像渲染到窗口上。
<!--more-->
***
**创建渲染器**
通过SDL_CreateRenderer()函数来创建渲染器：
```c++
SDL_Renderer* SDL_CreateRenderer(SDL_Window* window,
                                 int         index,
                                 Uint32      flags)
```
* window:需要为哪个窗口创建渲染器
* index:渲染器驱动需要初始化的渲染器索引。-1为默认渲染器
* flags:渲染器flag，为SDL_RendererFlags枚举类型。有以下四个值
    * SDL_RENDERER_SOFTWARE：软件渲染
    * SDL_RENDERER_ACCELERATED：用硬件加速渲染
    * SDL_RENDERER_PRESENTVSYNC：画面与刷新速率同步
    * SDL_RENDERER_TARGETTEXTURE：渲染器支持纹理渲染
    

一般index都是-1。如果你明确知道自己有其他的渲染器的话，可以用其他值。但是我们一般都是使用-1来用默认渲染器。

**与窗口一起创建渲染器**
你也可以使用SDL_CreateWindowAndRenderer()来连同渲染器一起创建窗口：
```c++
int SDL_CreateWindowAndRenderer(int            width,
                                int            height,
                                Uint32         window_flags,
                                SDL_Window**   window,
                                SDL_Renderer** renderer)
```
但是这里就不能指定窗口的初始坐标和标题了。
***
**Renderer是否有Target**
```c++
SDL_bool SDL_RenderTargetSupported(SDL_Renderer* renderer)
```
返回SDL_bool有两个值：SDL_TRUE,SDL_FALSE，分别对应true和false.
***
**获得RenderDriver个数**
通过SDL_GetNumRenderDrivers()来获得驱动个数。小于0表示失败。
```c++
int SDL_GetNumRenderDrivers(void)
```

**获得RenderDriver信息**
通过SDL_GetRenderDriverInfo()来获得。返回负值表示失败.
```c++
int SDL_GetRenderDriverInfo(int               index,
                            SDL_RendererInfo* info)
```
***
**获得Renderer信息**
通过SDL_GetRendererInfo()获得Renderer信息：
```c++
int SDL_GetRendererInfo(SDL_Renderer*     renderer,
                        SDL_RendererInfo* info)
```
该函数将信息返回到info中，SDL_RendererInfo结构体见[这里](http://wiki.libsdl.org/SDL_RendererInfo)
***
**获得/设置Renderer渲染目标**
通过SDL_Get/SetRenderTarget()函数
```c++
SDL_Texture* SDL_GetRenderTarget(SDL_Renderer* renderer)

int SDL_SetRenderTarget(SDL_Renderer* renderer,
                        SDL_Texture*  texture)
```
其中texture必须为指定了SDL_TEXTUREACCESS_TARGET这个Flag所创建出来的texture。或者给入NULL表示默认texture.
***
**获得Renderer的输出大小**
```c++
int SDL_GetRendererOutputSize(SDL_Renderer* renderer,
                              int*          w,
                              int*          h)
```
这个函数可以获得Renderer的绘制图像的大小。默认为生成的窗体大小。
***
**设置Renderer混合模式**
```c++
int SDL_SetRenderDrawBlendMode(SDL_Renderer* renderer,
                               SDL_BlendMode blendMode)
                              
int SDL_GetRenderDrawBlendMode(SDL_Renderer*  renderer,
                               SDL_BlendMode* blendMode)
```
这里的belnMode为枚举类型：
* SDL_BLENDMODE_NONE:dstRGB = srcRGB
* SDL_BLENDMODE_BLEND:dstRGB = (srcRGB * srcA) + (dstRGB * (1-srcA));dstA = srcA + (dstA * (1-srcA))
* SDL_BLENDMODE_ADD:dstRGB = (srcRGB\*srcA) + dstRGB;dstA = dstA
* SDL_BLENDMODE_MOD:dstRGB = srcRGB * dstRGB;dstA = dstA
***
**将当前的渲染数据绘制到窗体上面**
通过SDL_RenderPresent()来会自豪当前图像数据到窗体上面:
```c++
void SDL_RenderPresent(SDL_Renderer* renderer)
```
***
**销毁Renderer**
使用SDL_DestroyRenderer()销毁：
```c++
void SDL_DestroyRenderer(SDL_Renderer* renderer)
```