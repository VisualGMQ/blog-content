---
title: SDL2-Surface结构体详解
date: 2019-08-23 00:41:54
category:
- game development
tags:
- SDL2
---
`SDL_Surface`是用于存储图像，可以用于图像绘制的结构体。
这里我们来看一下SDL2中的`SDL_Surface`结构体和与其有关的函数操作。
<!--more-->
# SDL_Surface结构体
其实操作`SDL_Surface`的函数有很多，而且都很简单。但是如果不先认识`SDL_Surface`这个结构体的话，函数上的学习会比较困难。
```c++
typedef struct{
    SDL_PixelFormat* format;    //存储着和像素有关的格式                read-only
    int w;                      //图像宽度                          read-only
    int h;                      //图像高度                          read-only
    int pitch;                  //pixels中一行有多少个像素（以Bytes计） read-only
    void* pixels;               //实际的像素数据                        read-write
    void* userdata;             //用户数据，用户可以自己随意存储，读取  read-write
    SDL_Rect clip_rect;         //裁切矩形                          read-only
    int refcount;               //引用计数，一般由SDL函数自己改变
}SDL_Surface;
```
本来还有`Uint32 flags,int locked, void* locked_data, SDL_BlitMap* map`四个属性的，但是这四个属性是SDL内部使用的，所以我们就不去在意了。

接下来对上面列出的每一个属性进行详细的解释。
## format
format属性存储着像素有关的格式，是一个很重要的结构体：
```c++
typedef struct{
    Uint32          format;             //这个说明了像素在内存中存储的方式
    SDL_Palette*    palette;            //调色板（如果没有是NULL）
    Uint8           BitsPerPixel;       //每一个像素使用多少个Bit存储
    Uint8           BytesPerPixel;      //每个像素使用多少个Byte存储
    Uint32          Rmask;              //R分量的掩码
    Uint32          Gmask;              //G分量的掩码
    Uint32          Bmask;              //A分量的掩码
    Uint32          Amask;              //B分量的掩码
    //下面都是内部使用属性
    Uint8           Rloss;
    Uint8           Gloss;
    Uint8           Bloss;
    Uint8           Aloss;
    Uint8           Rshift;
    Uint8           Gshift;
    Uint8           Bshift;
    Uint8           Ashift;
    int             Refcount;
    SDL_PixelFormat* next;
}SDL_PixelFormat;
```
有一些内部属性还是有用的，如果会用到的话我会说。

### format
首先是`format`属性，他的值是`SDL_PixelFormatEnum`枚举类型里面的一个。看了这个枚举类型相信你就知道这个属性是做什么的了，完整的在[这里](http://wiki.libsdl.org/SDL_PixelFormatEnum)：
* `SDL_PIXELFORMAT_RGB332`
* `SDL_PIXELFORMAT_ARGB4444`
* `SDL_PIXELFORMAT_RGBA8888`
* `SDL_PIXELFORMAT_UYVY`

没错这一个个枚举常量就是表示像素点在内存中的存储方式，比如我们最熟悉的`SDL_PIXELFORMAT_RGBA8888`就是表示本像素有四个分量`R,G,B,A`，并且这四个分量的存储顺序是`RGBA`，每个分量占8Bits。那么以此类推，`SDL_PIXELFORMAT_ABGR8888`就是`A`分量在最前面存储，`R`分量在最后存储。`SDL_PIXELFORMAT_RGB332`就是只有三个分量`R，G，B`，并且`R`占3Bits，`G`占3Bits，`B`占2Bits。
YUV颜色空间同理。

这里还有比较特殊的`SDL_PIXELFORMAT_INDEX8`，其实这个是指只有RGB三分量，每个分量8位的存储方式，如果有对应的枚举类型的话应该命名为SDL_PIXELFORMAT_RGB888。

如果你想要以人类可读的方式查看自己的surface是怎么存储图像的话，这里有一个`const char* SDL_GetPixelFormatName(Uint32 format)`函数，你可以把`format`放进去，他会返回给你一个和枚举类型一模一样名称的字符串。

### palette
这个是调色板，也是一个枚举类型：
```c++
typedef struct{
    int         ncolors;    //指出调色板里面有多少颜色
    SDL_Color*  colors;     //颜色数组
}SDL_Palette;
```

调色板有说明用呢？这里还得说一下位图的存储方式。需要注意的是：**SDL_Surface本身只能存储位图数据（因为其官方只给了SDL_LoadBMP()函数来加载位图，而没有函数去加载其他格式的图片），虽然有SDL_Image库，但那是第三方的不算在讨论范围内**，所以我们首先得搞清楚调色板在位图中的用途。

#### 调色板在位图中的用途
位图里面也有一个称为调色板的东西，和SDL_Surface里面的很像，具体作用是这样的：
首先位图中每个像素可以由8Bits, 16Bits, 32Bits, 64Bits等长度的位存储。其中**小于24位的位图需要调色板，大于等于24位的位图没有调色板（所以如果你的Surface->BitsPerPixel>=24的话palette属性就是NULL）**。之所以有调色板是为了减少存储空间设计的。

在我们的印象中，图片应该是这样存储的（假设以RGB888格式存储）：

![图像存储方式](/images/图像存储方式.png)

这也是OpenCV这种库存储的方式：以R，G，B三种分量值的循环来存储。

对于BitsPerPixels>=24的位图的确是这样存储的，但是这样存储的话每个像素点就要花费$24(或者更多)\*3=72bits$。那么计算机科学家就想出，能不能有一种方法在不减少像素的情况下存储少量的数据。这个方法就是调色板。

调色板中记录了这个图片中所有要用到的颜色（对于256色位图，就会记录256色），这也就是`ncolors`属性的作用。然后会将所有属性以`RGBxxx`(例子里面是RGB888)的方式存储在`colors`属性中。
然后原本的像素就不再以`RGB888`方式存储了，其会存储一个索引，这个索引指向`colors`属性中的颜色：

![24位以下位图的存储](/images/24位以下位图的存储.png)

这样本来一个像素点需要3\*8=24位的，现在只要8位就OK了，虽然加了调色板，但是每个像素减少了3倍大小。

所以：**如果像素以24位一下存储，像素存储的是其值在调色板中的索引，如果以24位以上（包括24位）存储那么直接存储颜色数据，没有调色板**

### BitsPerPixel,BytesPerPixel
这两个属性就是表示像素点以多大的内存空间存储。

### 掩码
掩码的话是这样的：
1. 如果是带有调色板的位图（24位以下），那么掩码默认为0（因为颜色值都存储在调色板中了）
2. 如果是没有调色板的位图，那么如果想要得到其像素点存储的颜色值，需要先和掩码做逻辑和运算。以`RGBA8888`格式为例：假设一个像素点的值是`0xEA124256`，想要取出来R分量，首先和`Rmask`（这里是`0xFF000000`）做逻辑和，得到`0xEA000000`，然后就需要用到一些内部属性了：再将结果右移`Rshift`，再左移`Rloss`长度即可得到最后的值。也就是说整个过程可以这样写：
    ```c++
    temp = pixel & fmt->Rmask;
temp = temp >> fmt->Rshift;
temp = temp << fmt->Rloss;
red = (Uint8)temp;
    ```

## 宽度和高度
这个没什么好说的，就是图像的宽度和高度。

## pitch
这个值保存着一行有多少个像素（以Bytes计），比如你的图像是`RGB888`存储的，假设`pitch=24`，由于是24位以下的位图，所以每个像素用8位保存，也就是每个像素用1Byte保存，那么一行就是24个像素。

因为图像虽然显示是二维的，但是在内存中保存是一维的，所以必须知道一行存储了多少像素我们才能遍历整个点。

## pixels
这个就是实际存储像素值的数组，24位以下存储调色板索引，24位以上直接存值

## userdata
这个用户可以自己随意放入数据或者读取数据，默认为NULL。

## clip_rect
这个是在你使用`SDL_BlitSurface()`这样的绘图函数时，指定实际会绘制到目的地的图像范围。
可以使用`SDL_SetClipRect()`来改变，默认为全部图片.

## refcount
这个是引用计数，是SDL函数在对Surface操作的时候会设置，我们不用关心。

# 对SDL_Surface结构体的操作
接下来要展示以下如何对`RGB888`存储的`SDL_Surface`进行操作。我们会在上面绘制一条线，并且将绘制了线的图像保存下来。

首先我们要有一个符合格式的位图：

![1.bmp](/images/1.bmp)

然后我们开始操作：
```c++
#include <SDL2/SDL.h>
#include <iostream>
using namespace std;

int main(int argc, char** argv){
    SDL_Init(SDL_INIT_EVERYTHING);
    SDL_Surface* img = SDL_LoadBMP("./1.bmp");
    
    //这里判断图片是不是加载成功，以及是不是8位的
    if(!img || img->format->BitsPerPixel!=8){
        cerr<<"load 8 bits image failed"<<endl;
        return -1;
    }

    //这里创造一个和原图像一样格式的surface
    SDL_Surface* surface = SDL_CreateRGBSurface(img->format->format, img->w, img->h, 8, 0, 0, 0, 0);
    if(!surface){
        cerr<<"create surface failed"<<endl;
        return -1;
    }

    //这里将原图像的调色板赋值给surface，不然我们的surface没有调色板没办法绘图
    SDL_SetSurfacePalette(surface, img->format->palette);

    //接下来的循环遍历img中的所有点，一一赋值给surface，并且在行列相等的时候改变颜色索引
    for(int i=0;i<img->w;i++){
        for(int j=0;j<img->h;j++){
            Uint8 index = *((Uint8*)img->pixels + j*img->pitch + i);    //这里由于是8位存储，所以要转换为Uint8
            if(i!=j)
                *((Uint8*)surface->pixels + j*surface->pitch + i) = index;
            else
                *((Uint8*)surface->pixels + j*surface->pitch +i) = 20;  //改变颜色索引
        }
    }

    //调用函数保存图像
    SDL_SaveBMP(surface, "result.bmp");

    //释放图像
    SDL_FreeSurface(img);
    SDL_FreeSurface(surface);
    SDL_Quit();
    return 0;
}
```
最后保存的图像是：

![result.bmp](/images/result.bmp)