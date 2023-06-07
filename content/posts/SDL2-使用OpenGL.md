---
title: SDL2-使用OpenGL
date: 2022-01-23 22:20:18
category:
- game development
tags:
- SDL2
- OpenGL
---

这里说明一下如何在SDL2中使用OpenGL。

<!--more-->

<!--more-->

## SDL + GLEW

这个方法是使用SDL和GLEW两个库。GLEW是用来导入OpenGL函数的。

首先我们需要导入头文件：

```cpp
#define GLEW_STATIC
#include "GL/glew.h"
#include "SDL/SDL.h"
```

这里定义了`GLEW_STATIC`，表示我们要使用glew的静态库。

然后需要配置OpenGL：

```cpp
SDL_Init(SDL_INIT_EVERYTHING);

SDL_GL_SetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3);   //主版本3
SDL_GL_SetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3);   //副版本3
SDL_GL_SetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE);  //核心库

window = SDL_CreateWindow(title.c_str(), SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, width, height, SDL_WINDOW_OPENGL|SDL_WINDOW_SHOWN);

SDL_GL_CreateContext(window);   //将本窗口作为绘制载体

glewExperimental = GL_TRUE;
glewInit(); //初始化glew库，一定要在窗口创建之后初始化
```

这里首先使用`SDL_Init()`初始化了SDL，然后需要使用`SDL_GL_SetAttribute()`函数来给SDL说明使用那个版本的SDL。这里使用的是3.3版的核心库。

然后创建了SDL窗口用于作为绘制的容器。需要注意这里不再需要`SDL_Renderer`，因为我们直接用OpenGL绘制。然后需要使用`SDL_GL_CreateContext()`函数指定这个窗口为绘制载体。

创建窗口的时候要指定`SDL_WINDOW_OPENGL`来启用窗体的OpenGL支持。

最后需要初始化GLEW库，使用`glewInit()`即可。
这里需要注意的是：**在Windows和Linux系统上，你需要在glewInit()之前加上`glewExperimental = GL_TRUE;`语句，不然在Linux上会报核心短转储的错误。在MacOSX下不用。**

## 主循环中的窗口更新

除了上面的配置之外，其他的就和OpenGL一样了，该怎么编写就怎么编写。在主循环中窗口更新的函数是`SDL_GL_SwapWindow()`。

## SDL + 系统OpenGL库

这个方法是使用SDL和系统的OpenGL库。这个方法不需要除SDL外的任何拓展库。缺点是SDL目前只支持到OpenGL4.4版本函数（SDL2.0.14），使用更高版本函数可能还得用GLEW（或者手动加载）

其他的操作和上面一样，但是我们要包含一些其他头文件：

```cpp
#define GL_GLEXT_PROTOTYPES
#include "SDL_opengl.h"
```

然后在编译的时候需要链接系统的OpenGL库。我这里是Mac系统，直接连接的OpenGL.framework:

```cpp
g++ main.cpp `sdl2-config --libs --cflags` -framework OpenGL
```

这样就可以使用了，很简单对吧。

在Windows下应该是连接`opengl32`或`opengl64`库。在Linux下应该是`GL`库。

## 添加SDL没有的OpenGL函数

如果你使用的OpenGL版本过高，导致有一些函数没法使用，但是你又不想引入其他辅助库，那么你可以自己手动引入这些函数。主要的方法是使用

```cpp
void* SDL_GL_GetProcAddress(const char *proc);
```

函数获得OpenGL的函数。

在include了`SDL_opengl.h`的情况下，首先我们要声明自己的函数：

```cpp
// 这里以glGenBuffers()为例
// 首先声明函数指针
typedef void (APIENTRY * GLGENBUFFERSFN)( GLsizei n, GLuint* buffers );
// 然后声明函数
GLGENBUFFERSFN glGenBuffers;
```

然后我们要找到OpenGL函数并赋值给`glGenBuffers`:

```cpp
glGenBuffers = (GLGENBUFFERSFN)SDL_GL_GetProcAddress("glGenBuffers");
// 如果没有找到，检查一下OpenGL拓展内有没有
// 检查ARB拓展
if (!glGenBuffers) {
    glGenBuffers = (GLGENBUFFERSFN)SDL_GL_GetProcAddress("glGenBuffersARB"); 
}
// ARB里面没有就检查一下EXT
if (!glGenBuffers) {
    glGenBuffers = (GLGENBUFFERSFN)SDL_GL_GetProcAddress("glGenBuffersEXT");
}
// 如果还没找到，那就是真没了，报错吧
throw std::runtime_error("can't find glGenBuffers function");
```

可以使用这个方法添加所有SDL原生不支持的OpenGL API。

## 运行时打开OpenGL库

如果你想要运行时打开OpenGL库，你可以使用

```cpp
int SDL_GL_LoadLibrary(const char *path);
```

打开。传入参数为`NULL`时打开默认的库。返回0代表成功。

这个函数必须在初始化Video模块之后，创建支持OpenGL的窗口之前调用。

打开之后需要用上面添加OpenGL函数的方式将你要使用的gl函数找到（所以并不推荐用这种方法），这个时候，你**不**应该包含`SDL_openg.h`，因为他里面有很多gl函数声明，你的声明会和他冲突。

程序结束后不要忘记关闭库：

```cpp
void SDL_GL_UnloadLibrary(void);
```