---
title: SDL2-绘制文本
date: 2019-07-28 00:40:18
category:
- game development
tags:
- SDL2
---
SDL本身是不支持文本的绘制的，如果你想要绘制文本的话你需要包含其第三方库`SDL_ttf`，下载网址在[这里](https://www.libsdl.org/projects/SDL_ttf/)
顺带一提，SDL官方的所有拓展库都可以在[这里](https://www.libsdl.org/projects/)找到，这个网址同时还有很多很多的学习资源（包括第一版DOOM的源代码）

<!--more-->
***
**使用SDL_ttf**
和SDL_image一样，首先得初始化，然后结束的时候需要释放：
* TTF_Init()
* TTF_Quit()

这两个函数都没有参数。

接下来我们需要加载字体文件，使用`TTF_OpenFont`函数来打开。第一个参数是字体文件，第二个参数是加载过后字体的大小：
```c++
TTF_Font* font = TTF_OpenFont("font.ttc", 24);
```

接下来你就可以通过`SDL_Surface* surface = TTF_RenderUTF8_Blended();`函数来得到一个有文字的SDL_Surface\*了。这个函数第一个参数是`TTF_Font*`，第二个参数是文字，第三个参数是颜色。

其实这里有很多的绘制文字的参数。但是由于我们使用的是中文，所以我们选择了`RenderUTF8_Blended()`。具体的函数名称有一下格式：
**TTF_Render<encoding>_<type>**
这里encoding为编码的方式，type为渲染的类型，分别可以是：
encoding:
* Glyph
* Text 普通文字
* UTF8
* UNICODE

type可以是
* 没有， 代表用最普通的方式渲染
* Blended，高级的渲染方式
* Solid，实体的
* Shaded，有阴影的，会有额外的参数来指定阴影
* Blended_Wrapped:最高级的渲染方式，最清晰，最慢

其中各个选项的效率从大到小依次为：
Blended_Wrapped Blended Shaded Solid 无
同样，效率越低，渲染出来的文字清晰度越高。

然后你就可以通过SDL_BlitSurface或者转换成SDL_Texture来绘制到屏幕上了。

最后你需要关闭已经打开的字体文件:
`TTF_CloseFont()`。
***
**使用SDL_FontCache绘制文字**
虽然SDL_ttf是SDL官方开发的库，但是效率不是很高，而且也不是很好用。主要有以下几个缺点：
* 不能够解析字符串中的\t和\n \b等字符，也就是说如果你想要换行的话还得重新给一个Surface
* 效率很低，如果你想要每一帧都渲染不同的文本的话，那么你需要下面这个循环：
```c++
//循环中
SDL_Surface* surface = TTF_RenderUTF8_Blended(font, textinput.c_str(), color);
if(surface != nullptr){
    SDL_Texture* texture = SDL_CreateTextureFromSurface(render, surface);
    SDL_Rect dstrect;
    dstrect.x = 0;
    dstrect.y = 0;
    dstrect.w = surface->w;
    dstrect.h = surface->h;
    SDL_RenderCopy(render, texture, nullptr, &dstrect);
    SDL_DestroyTexture(texture);
    SDL_FreeSurface(surface);
}
```
可以看到每一帧都要生成和释放surface和texture。效率很低。

这里我们使用`SDL_FontCache`，这不是SDL官方开发的，但是可以解析特殊字符，以及可以直接使用`SDL_Renderer*`进行绘制，不需要生成繁琐的surface和texture，而且还支持一些特殊的字体样式（如粗体和斜体等），而且使用了缓存技术提升了效率。

`SDL_FontCache`的github地址在[这里](https://github.com/grimfang4/SDL_FontCache)
这个库的文件很少，只有一个SDL_FontCache.c和一个SDL_FontCache.h文件。你可以将.c文件编译成链接库，或者直接和源代码一起编译。
**需要注意的是：**
* **SDL_FontCache使用的是纯C，其中有些代码不能直接和C++11代码在一起编译，你需要拆分开来编译，也就是说**
  
    ```g++
    g++ textinput.cpp  SDL_FontCache.c -o textinput `sdl2-config --libs --cflags` `pkg-config --libs --cflags SDL2_ttf` -std=c++11
    ```
    **是不行的，你必须将.c文件分开编译：**
    ```g++
    gcc ./SDL_Cache/SDL_FontCache.c -c `sdl2-config --libs --cflags` `pkg-config --libs --cflags SDL2_ttf`
    g++ textinput.cpp  SDL_FontCache.o -o textinput `sdl2-config --libs -std=c++11
    ```
* **SDL_FontCache.h文件需要SDL2和SDL_ttf文件，而且它是这样包含的:**

    ```g++
    #include "SDL.h"
    #include "SDL_ttf.h"
    ```
    **所以如果你的SDL2和SDL_ttf的路径和他的不一致的话，你可以进.h文件改一下源码**
    

接下来就是使用SDL_FontCache库了。官方有一个例子，我们来看一下：
```c++
FC_Font* font = FC_CreateFont();  
FC_LoadFont(font, renderer, "fonts/FreeSans.ttf", 20, FC_MakeColor(0,0,0,255), TTF_STYLE_NORMAL);  
...
FC_Draw(font, renderer, 0, 0, "This is %s.\n It works.", "example text"); 
...
FC_FreeFont(font);
```
首先通过`FC_CreateFont()`来创建一个文字句柄。
然后通过`FC_LoadFont()`函数来加载一个字符文件，其中第四个参数是SDL_Color用于指定颜色，但是它自己有`FC_MakeColor()`函数来直接生成一个颜色。第五个参数是字体的样式，可以是`TTF_STYLE_ NORMAL,BOLD,ITALIC,OUTLINE,STRIKETHROUGH,UNDERLINE`中的一个
然后直接通过`FC_Draw()`函数就可以绘制出来了，无需变为texture，而且`FC_Draw()`是类似printf的风格，可以用占位符的。
最后当你用完了可以使用`FC_FreeFont()`函数释放掉。

这个库还有很多的函数，但是由于没有文档只有源代码，所以在这里我也就不分析了，有兴趣可以自己看看源码，.c文件也就两千多行。