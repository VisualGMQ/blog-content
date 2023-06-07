---
title: SDL2-Texture
date: 2019-08-26 10:25:20 
category:
- game development
tags:
- SDL2
---
SDL2以来的，相对于SDL1的一大改变就是添加了`SDL_Renderer`和`SDL_Texture`，这两个结构体和对应的函数。这两个结构体用于进行软件加速以便于更快更好地绘制出图形，其使用方法也比`SDL_Surface`要简单（至少不用底层修改像素来绘制几何图形了）。

其实`SDL_Texture`是基于`SDL_Surface`的，有很多东西都很相似。SDL2较SDL1的优点就是，其`SDL_Texture`是运行在GPU上的，SDL会视情况使用D3D或OpenGL，效率更高。
<!--more-->

# 创建
创建`SDL_Texture`有两种方法：
* `SDL_CreateTexture()`：直接创建一个Texture
* `SDL_CreateTextureFromSurface()`：从一个Surface上创建一个Texture

其实第二个函数底层包含了第一个函数的调用。那么我们就先从第一个函数入手看看如何创建：
```c++
SDL_Texture* SDL_CreateTexture(SDL_Renderer* renderer,
                               Uint32        format,
                               int           access,
                               int           w,
                               int           h)
```
首先需要一个`SDL_Renderer*`，然后需要指定format和access，format就和`SDL_Surface`的`format->format`成员一样（就是RGB8A888那种），access是Texture新增加的：
* `SDL_TEXTUREACCESS_STATIC`:很少改变的texture
* `SDL_TEXTUREACCESS_STREAMING`:常改变的
* `SDL_TEXTUREACCESS_TARGET`:可以被设置为render的目标的

一般都会使用第三个。
然后就是宽和高了。

这样就可以得到一个Texture了。

接下来你可以通过`SDL_RenderDrawxxx`系列函数在Texture上绘制图形（要先设定为render的目标）。如果你想要从底层走的话有这个函数：
```c++
int SDL_UpdateTexture(SDL_Texture*    texture,
                      const SDL_Rect* rect,
                      const void*     pixels,
                      int             pitch)
```
这里的`rect`表示需要更新的大小（为NULL更新全部），然后是更新的像素信息pixels和一行的像素个数pitch（以字节计）。
通过上面这个函数，我们也可以将Surface的内容放到Texture上：
```c++
SDL_Surface* surface = SDL_LoadBMP("image.bmp");

SDL_Texture* texture = SDL_CreateTexture(render, surface->format->format, SDL_TEXTUREACCESS_TARGET|SDL_TEXTUREACCESS_STATIC, surface->w, surface->h);
SDL_UpdateTexture(texture, nullptr, surface->pixels, surface->pitch);
SDL_FreeSurface(surface);
```

上面的过程其实和函数`SDL_CreateTextureFromSurface()`的作用是一样的：
```c++
SDL_Texture* SDL_CreateTextureFromSurface(SDL_Renderer* renderer,
                                          SDL_Surface*  surface)
```

这样就从Surface到Texture了。

# 其他函数操作
关于Texture的操作都是很简单的。
## 获得Texture信息
首先Texture不能像Surface一样直接获得成员，所以我们有函数来获得信息：
```c++
int SDL_QueryTexture(SDL_Texture* texture,
                     Uint32*      format,
                     int*         access,
                     int*         w,
                     int*         h)
```
format,access,w,h都会以参数形式返回。
## 设置渲染方式
如果不将渲染方式设置为Blender方式的话，透明色将不起作用：
```c++
int SDL_SetRenderDrawBlendMode(SDL_Renderer* renderer,
                               SDL_BlendMode blendMode)
```
其中blendMode:
* `SDL_BLENDMODE_NONE`:dstRGBA = srcRGBA
* `SDL_BLENDMODE_BLEND`:dstRGB = (srcRGB * srcA) + (dstRGB * (1-srcA));dstA = srcA + (dstA * (1-srcA))
* `SDL_BLENDMODE_ADD`:dstRGB = (srcRGB * srcA) + dstRGB;dstA = dstA
* `SDL_BLENDMODE_MOD`:dstRGB = srcRGB * dstRGB;dstA = dstA

同样你可以通过`SDL_GetRenderDrawBlendMode()`函数来获得渲染方式。

## 改变颜色和透明度
可以使用
```c++
int SDL_SetTextureAlphaMod(SDL_Texture* texture,
                           Uint8        alpha)
```
来设置透明度，当Texture被渲染的时候，会执行这个公式：`srcA = srcA * (alpha / 255)`。
这个函数可以来让透明度更加显眼。

同理对RGB也有：
```c++
int SDL_SetTextureColorMod(SDL_Texture* texture,
                           Uint8        r,
                           Uint8        g,
                           Uint8        b)
```
计算公式如出一辙：`srcC = srcC * (color / 255)`

这个函数可以帮助你凸显RGB三分量中的一种，比如我可以将r设置为255，将g和b设置为0:
![凸显R值](/images/凸显R值.png)