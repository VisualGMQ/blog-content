---
title: Nim使用OpenGL
date: 2021-08-26 18:30:47
tags:
- OpenGL
category:
- language
---

这里说明了Nim如何使用OpenGL

<!-- more -->

## Nimble换源

因为我们要下载`SDL2`和`OpenGL`的支持，所以可以考虑将Nimble换成国内源。方法如下：  
首先到[Nimble官网](https://github.com/nim-lang/nimble)clone他的代码下来。  
然后进入到`src/nimblepkg/download.nim`文件中，将

```nim
if modUrl.contains("github.com") and modUrl.endswith("/"):
  modUrl = modUrl[0 .. ^2]
```

换成

```nim
if modUrl.contains("github.com"):
  modUrl = modUrl.replace("github.com","github.com.cnpmjs.org")
  if modUrl.endswith("/"):
   modUrl = modUrl[0 .. ^2]
```

其实就是将github换成国内的镜像网站[github.com.cnpmjs.org](github.com.cnpmjs.org)，顺便说一句，平时github登不上去了也可以上这个网站访问。  
然后重新编译nimble，到nimble的根目录下执行

```bash
nimble build
```

就会生成`nimble`可执行文件了。然后将文件放到`/usr/local/bin/`下就可以执行了。  
我的习惯是重命名为`nimble-zh`然后再放。  
以后每次下载包使用这个nimble就会很快了。

## 使用OpenGL

我是使用`SDL2`搭建窗口，你也可以使用你熟悉的库。  

首先安装`SDL2`和`OpenGL`的包，`OpenGL`包的官网在[这里](https://nimble.directory/pkg/opengl)

```bash
nimble install sdl2 opengl
```

然后OpenGL的API是什么，在Nim中就怎么用就行了，这里给个清屏的例子：

```nim
import sdl2
import opengl

if isMainModule:
    sdl2.init(INIT_EVERYTHING)
    defer: sdl2.quit()

    # 设置OpenGL版本
    discard glSetAttribute(SDL_GL_CONTEXT_MAJOR_VERSION, 3)
    discard glSetAttribute(SDL_GL_CONTEXT_MINOR_VERSION, 3)
    discard glSetAttribute(SDL_GL_CONTEXT_PROFILE_MASK, SDL_GL_CONTEXT_PROFILE_CORE)

    let window = sdl2.createWindow("test SDL2", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 400, 300, SDL_WINDOW_SHOWN or SDL_WINDOW_OPENGL)
    defer: sdl2.destroyWindow(window)

    var glContext = glCreateContext(window)
    defer: glDeleteContext(glContext)

    # 根据OpenGL包的文档，这一句必须加在创建窗口后，加载拓展前
    loadExtensions()

    if glContext.isNil:
        raise newException(Exception, "gl context create failed")

    var shouldClose = false
    var event = sdl2.defaultEvent;
    while not shouldClose:
        while sdl2.pollEvent(event):
            case event.kind:
            of sdl2.QuitEvent:
                shouldClose = true
            else:
                discard

        # 清屏
        glClearColor(0.1, 0.1, 0.1, 1)
        glClear(GL_COLOR_BUFFER_BIT)

        # 绘制屏幕
        glSwapWindow window
        delay 30
```

## 参考教程

[SCIFX](https://scifx.github.io/posts/1623156612/)
