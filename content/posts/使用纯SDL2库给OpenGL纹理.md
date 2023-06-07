---
title: 使用纯SDL2库给OpenGL纹理
date: 2019-10-7 10:59:39
category:
- game development
tags:
- OpenGL
---

在[Learning-OpenGL](https://learnopengl-cn.github.io/)的教程中，作者是使用stbi_image这个单头文件库来加载纹理的。当时我就在想：SDL2这么强大，自己应该也可以加载纹理数据的吧。所以就做了一些尝试。
<!--more-->

其实stbi_image从图片文件获得了下面的信息：
* 图片的数据（纯像素数据，不包括头数据）
* 图片的大小
* 图片的通道

那我想我们也可以使用SDL2_image库来实现。

首先把图片加载进来：
```c++
SDL_Surface* surface1 = IMG_Load("resource/Block.png");
```

然后把数据，大小拿到手：

```c++
int width, height, channel;
width = surface1->w;
height = surface1->h;
unsigned char* data = (unsigned char*)surface1->pixels;
```

关于通道的话，surface本身并没有存储通道，但是我们可以计算出来：
```c++
channel = surface1->pitch/surface1->w;
```

这个地方不清楚的请参考我的“SDL-Surface结构体详解”。

这样所有的东西都获得了，就可以绑定纹理了。

需要注意的是：**和stbi_image库一样，载入的图片是反过来的，你需要通过一些手段把它翻转。**