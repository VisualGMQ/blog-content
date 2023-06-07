---
title: gcc生成32位的nasm汇编代码
date: 2020-06-06 14:42:50
category:
- language
tags:
- nasm
- c
---

使用gcc的时候只能产生masm的汇编代码。但是masm不是跨平台的，一般开发的时候都是用nasm进行汇编。但是gcc不能直接生成nasm汇编代码。这里记录了生成nasm汇编代码的方法。

答案来源于[stackoverflow](https://stackoverflow.com/questions/20737947/how-to-generate-a-nasm-compilable-assembly-code-from-c-source-code-on-linux/25731117)。此实验已经在Mac系统上已经尝试成功过。

<!--more-->

# 生成中间文件

首先需要使用gcc生成中间文件：

```bash
gcc -fno-asynchronous-unwind-tables -s -O2 -c -o main.o main.c
```

如果你的电脑不是32位而是64位的话，gcc默认生成的是64位的中间代码，需要加上`-m32`来强制指定32位：

```bash
gcc -m32 -fno-asynchronous-unwind-tables -s -O2 -c -o main.o main.c
```

# 使用objconv转换为nasm汇编代码

然后需要使用`objconv`工具将中间文件转换为nasm汇编代码：

```bash
objconv -fnasm main.o main.asm
```

如果电脑上没有objconv工具，去[这个网站](https://www.agner.org/optimize/)的**Object file converter**一栏下载，或者直接点击[这个下载链接](https://www.agner.org/optimize/objconv.zip)（如果还有效的话）。

下载下来之后解压，里面只有windows的可执行文件。如果想要在Mac或Linux上使用，解压source压缩包，进入解压后的source文件夹，运行`build.sh`编译，完成后会生成objconv文件（纯C++写的，不用安装其他库）。

# 去除错误的和不必要的代码

objconv会生成一些不必要的代码需要去除，主要是：

* 使用`global`定义的函数名称标签
* `.SECTION`一行中的`execute`或`noexecute`，和（如果有需要的话）`align=N`语句
* `default rel`行
* 空的段（如果你想的话）

下面是我写的一个perl小程序，可以自动化将c语言转为32位的nasm汇编语言，并去除多余代码（空的段不会去除）：

```perl
#!/usr/bin/perl

use 5.010;
use utf8;
use strict;

sub ConvertC2Nasm{
    my $filename = shift;
    #$filename = chomp $filename;
    my $output_obj = $filename;
    my $output_asm = $filename;
    $output_obj=~s/c$/o/;
    $output_asm=~s/c$/asm/;
    system("gcc -m32 -fno-asynchronous-unwind-tables -s -O2 -c -o $output_obj $filename");
    system("objconv -fnasm $output_obj $output_asm");
    return $output_asm;
}

sub FixErrorInNasmFile{
    my $filename = shift;
    my @lines;
    open HANDLE, $filename or warn "$filename not exists";
    while(<HANDLE>){
        if($_=~/global .*$/){
            next;
        }
        if($_=~/default rel/){
            next;
        }
        if($_=~/SECTION/){
            $_=~s/execute//g;
            $_=~s/noexecute//g;
        }
        push @lines, $_;
    }
    close HANDLE;
    open HANDLE, ">$filename";
    print HANDLE @lines;
    close HANDLE;
}

while(@ARGV){
    my $filename = shift(@ARGV);
    say "file:$filename";
    FixErrorInNasmFile(ConvertC2Nasm($filename));
}
```

