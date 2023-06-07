---
title: Mac下安装i386编译工具
date: 2020-06-11 18:56:15
category:
- 杂项
---

在学习《Orange‘S：一个操作系统的实现》时，作者使用nasm和gcc生成ELF文件，然后使用ld命令链接。但是他是在Linux上做的，Mac系统的gcc（clang）只能生成Mac自己的macho64格式的C中间文件，所以需要安装i386编译工具。

由于书中是在IA32上开发的，所以所有的汇编和C语言都必须编译为32位的ELF，所以我选择了i386系列工具。如果有想要其他架构和平台的，过程也差不多。

参考博客为[Dani Rodríguez的博客](https://www.danirod.es/blog/2015/i386-elf-gcc-on-mac)（好像要翻墙）

<!--more-->

# 下载

首先去GNU下载[binutils](ftp://ftp.gnu.org/gnu/binutils/binutils-2.25.tar.gz)和[GCC工具](ftp://ftp.gnu.org/gnu/gcc/gcc-5.2.0/gcc-5.2.0.tar.gz)：

```bash
wget ftp://ftp.gnu.org/gnu/binutils/binutils-2.25.tar.gz
wget ftp://ftp.gnu.org/gnu/gcc/gcc-5.2.0/gcc-5.2.0.tar.gz
```

然后解压

# 安装

首先声明变量PREFIX:

```bash
export PREFIX=/usr/opt/
```

这个变量说明了最后生成的工具安装在哪里，可以改成你喜欢的路径。

先编译binutils，进入binutils的文件夹，新建build文件夹，进入build文件夹：

```bash
cd binutils-2.25
mkdir build
cd build
```

然后运行configure程序：

```bash
../configure --prefix=$PREFIX \
   --target=i386-elf --disable-multilib \
   --disable-nls --disable-werror
```

这里`--target`说明我们要生成i386-elf类工具，想要其他平台的自行改动。

等待configure好之后，直接运行make，然后安装即可：

```bash
make
make install
```



然后安装GCC。先进入文件夹。

这里要注意，gcc需要`gmp`,`mpc`,`mpfr`,`isl`三个库。这里比较坑的地方时，isl库最新版本没有GCC编译需要的函数，所以光用homebrew安装isl，在编译时还是会报错。

这里建议运行：

```bash
./contrib/download_prerequisites
```

让GCC自己下载并编译需要的第三方库。这应该是一个漫长的等待。

然后新建build文件夹，进入build文件夹：

```bash
cd gcc-5.2.0
mkdir build
cd build
```

configure：

```bash
../configure --prefix=$PREFIX --target=i386-elf \
   --disable-multilib --disable-nls --disable-werror \
   --without-headers --enable-languages=c,c++
```

然后就可以make了：

```bash
make all-gcc install-gcc
make all-target-libgcc install-target-libgcc
```

至此，所有的工具就安装完成了。

# 编译Orange's源码

这里以`/chapter5/b`文件夹下的源码为例：

```bash
nasm -felf32 foo.asm -o foo.o
i386-elf-gcc -c -o bar.o bar.c
i386-elf-ld -s -o bar.bin bar.o foo.o
```

通过使用i386的elf格式工具，可以成功编译出来。