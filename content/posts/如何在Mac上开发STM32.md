---
title: 如何在Mac上开发STM32
date: 2019-08-28 16:00:10
category:
- 单片机
tags:
- STM32
---
这两天心血来潮，想在此重拾一下单片机。于是从STM32开始。但是以前的单片机开发都是在虚拟机上的Windows环境下使用Keil开发的，现在磁盘空间只有5G了，也没有办法装虚拟机了。。。所以就研究了一下如何在Mac上开发STM32.

网上有很多方法，比如下载arm-none-eabi-gcc编译器使用Makefile进行工程构建啊，或者直接下载STM32CubeIDE软件来进行构建。但是我最后还是选择了使用vscode来作为开发环境，因为vscode上配置最简单（其实STM32CubeIDE好像也挺简单的，但是那个固件库我死活下不下来。。。）
<!--more-->

# 使用PlatformIO IDE开发
首先去vscode下搜索**PlatformIO IDE**这个插件：

![PlatformIO IDE](/images/PlatformIO_IDE.png)

安装好之后左边的快捷栏里面会有一个蚂蚁头的图标，点击之后选择Open就可以打开PlatformIO IDE的界面了：

![PlatformIO_start](/images/PlatformIO_start.png)

![PlatformIO_mainpage](/images/PlatformIO_mainpage.png)

然后选择**New Project**，会弹出对话框让你填入项目名称，开发板和开发板的库：

![PlatformIO_Project](/images/PlatformIO_Project.png)

点击finish之后就可以开始开发啦，令人惊讶的是居然提供Arduino的库，这样编写起来会方便很多。

![PlatformIO_code](/images/PlatformIO_code.png)

# 使用ST-Link下载器下载
编写好代码之后就可以开始下载了。我这里使用的是ST-Link下载器下载。

![ST-LINK端口](/images/ST-LINK端口.png)

首先要打开开发板的原理图，找到**SWDIO**和**SWCLK**两个端口，然后将ST-Link上的SWCLK和SWDIO链接到对应的位置上，3.3V和GND连接到对应的位置上即可。我这个板子上直接有一个JTag/SW下载口，我就直接用了：

![STM32下载方法](/images/STM32下载方法.png)

然后点击vscode中最下方的对勾来编译工程，点击指向右边的箭头来下载程序即可：

![PlatformIO_Tools](/images/PlatformIO_Tools.png)