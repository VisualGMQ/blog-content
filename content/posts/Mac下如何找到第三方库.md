---
title: Mac下如何找到第三方库
date: 2019-07-30 12:26:42
category:
- 杂项
---

Mac下找到第三方库有很多的办法，让我们一起来看一看吧。
<!--more-->
***

# 使用cmake找库

如果你使用的是cmake来构建工程的话，那么你可以在cmake中使用`find_package`函数来找到对应的库。这一点请看我的“CMake基础语法汇总”一文。

# 使用pkg-config

第二种方法和Linux系统一样，你可以使用pkg-config来找到库。比如说我使用homebrew安装了SDL_image库，那么我就得写

```bash
pkg-config --libs --cflags SDL_image
```

其中，如果你加上了`—libs`选项，这个命令会帮助你找到链接库，如果你加上了`—cflags`命令会帮助你找到头文件。

你也可以同时指定多个：

```bash
pkg-config --libs --cflags SDL_image SDL_ttf armadillo
```



如果发现pkg-config没有找到库，但是自己确实安装了库的话，你需要根据pkg-config的提示将.pc文件的路径放到环境变量里面:

```bash
> _posts pkg-config --libs --cflags opencv4
Package opencl was not found in the pkg-config search path.
Perhaps you should add the directory containing `opencv4.pc'
to the PKG_CONFIG_PATH environment variable
No package 'opencv4' found
```

这里提示我们放入`PKG_CONFIG_PATH`变量中，首先我们需要找到库的`.pc`文件

## 如何寻找.pc文件

### 源码编译

如果你是下载源代码手动编译的话，那么一般.pc文件都会在build文件夹下的pkgconfig文件夹里面，或者在build/lib里面。将这个文件夹路径放到PKG_CONFIG_PATH中就可以了：

```bash
export PKG_CONFIG_PATH=$PKG_CONFIG_PATH:/usr/local/Cellar/opencv/4.1.0_2/lib/pkgconfig
```

![pkg-config](/images/pkg-config.png)



如果没有就在其他文件夹里面找一找，一般都在build文件夹下面

### homebrew下载

如果你是用homebrew下载的话，一般homebrew下载的文件都会在`/usr/local/Cellar`文件夹下，去文件夹下先找到你的库所在文件夹，然后一般会有pkg-config文件夹，将这个文件夹的路径放到PKG_CONFIG_PATH中就OK了。



## 使用pkg-config对XCode工程的好处

如果你擅长使用pkg-config的话，就算不是命令行编译，对使用XCode工程也有好处。你可以先用pkg-config命令找到要找的库的库目录和头文件目录，然后将这两者粘贴到XCode的`header search path`和`library search path`中即可让XCode找到库。

# 直接使用framework
Mac有一个好处就是，如果你的库可以编译成framework（后缀.framework），那么你可以直接使用这个framework而不需要一步一步查找libs和header file。
**注意，后缀是.framework而不是.dylib，两者的图标一模一样**

![framework](/images/framework.png)

## 终端编译
如果你是用的是编译器，你可以在后面加上`-framwork`命令来指定framework：

```bash
g++ hello_triangle.cpp -o build/triangle `sdl2-config --libs --cflags` `pkg-config --libs --cflags glew` -framework OpenGL -std=c++11
```
这里就直接使用OpenGL framework来编译，无需寻找OpenGL的库和头文件了。

## XCode
XCode也可以做到，在general一栏下面，就有添加framework，如果它列表里面没有给出framework，你可以点击`add other framework`，然后按住`command+shift+g`来打开路径栏输入路径找到库。

![xcode](/images/xcode.png)

Mac系统自带OpenGL,OpenCL等库，可以直接使用。

# 特殊查找方式
有些库你安装之后，它有自己的工具帮助你查找。比如wxWidgets和SDL2分别使用如下命令查找:
```bash
sdl2-config --libs --cflags
wx-config --libs --cflags
```
这种一般官方的说明文档里面会有