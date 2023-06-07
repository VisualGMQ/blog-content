---
title: CMake拓展应用
date: 2019-09-16 15:45:15
category:
- 构建工具
tags:
- cmake&make
---
cmake拓展应用

<!--more-->

## 使用CMake产生不同形式的编译文件

默认情况下是产生Makefile文件，但是你可以选择系统支持的编译文件。
首先在终端输入
```bash
cmake --help
```
在输出信息的最下面会有当前支持的编译文件格式：
```bash
Generators

The following generators are available on this platform (* marks default):
* Unix Makefiles               = Generates standard UNIX makefiles.
  Ninja                        = Generates build.ninja files.
  Xcode                        = Generate Xcode project files.
  CodeBlocks - Ninja           = Generates CodeBlocks project files.
  CodeBlocks - Unix Makefiles  = Generates CodeBlocks project files.
  CodeLite - Ninja             = Generates CodeLite project files.
  CodeLite - Unix Makefiles    = Generates CodeLite project files.
  Sublime Text 2 - Ninja       = Generates Sublime Text 2 project files.
  Sublime Text 2 - Unix Makefiles
                               = Generates Sublime Text 2 project files.
```

这里前面有\*的就是默认的文件格式，我这里是Unix的Makefile。
如果想要改变输出的编译文件，需要加上`-G`选项：
```bash
cmake -GXcode .
cmake -G"Sublime Text 2 - Unix Makefiles" . 
```

## cmake编译工程的其他方式
我们最熟悉的就是两种方式：在工程目录下使用`cmake .`和创建一个build目录，进入之后使用`cmake ..`。

其实你也可以在含有`CMakeCache.txt`文件的文件夹下执行`cmake .`来编译。比如在`build`文件夹下。`CMakeCache.txt`文件本身就是存储着cmake编译信息，减少重复编译时间的文件。

或者你可以使用`cmake [-S source_file_path] [-B build_path]`来编译。其中-S指令指定了CMakeLists.txt文件所在位置（一般是不写-S指令的，直接写出路径就可以了），-B指定要将编译结果放在哪个文件。这样你以后就可以写
```bash
cmake . -B build
```
而不需要写三条语句了。

## cmake生成工程时的有趣选项

### --graphviz
`--graphviz=<filename>`选项很有意思，他会给你生成一个用graphviz软件（dot语法）描述的文件，文件名称是filename。这个文件描述的图片描述了你生成的可执行文件。

### --system-information
`--system-information=<filename>`会生成系统信息。系统信息里面包含了这个系统中链接库的后缀，可执行文件的后缀等。

## 编译二进制文件
一般我们都是先`cmake ..`，然后cmake生成了Makefile，再使用`make`编译。

然后又有多少人知道，直接make只是编译所有的目标，你还可以在后面指定目标名称来进行单独编译呢？
目标的名称就是你CMakeLists.txt中语句`add_excutable()`的第一个参数。

还有一个冷知识：但是cmake自己也可以编译，使用的是`cmake --build`命令。只不过没人用就是了。

## 安装
一般都是使用`sudo make install`安装的。但是这里有一个很烦人的问题：如果我在`cmake ..`的时候指定错了安装目录，那我还得先清理build文件夹，然后再重新`cmake ..`。这个时候这个`cmake --install`指令就有用了。

`cmake --install`本身也可以安装文件（比如`cmake --install .`），但是更好的用途是使用`--prefix`选项再次定义CMAKE_INSTALL_PREFIX变量来改变安装路径:
```bash
cmake --install --prefix /usr/local/GMQ/include .
```