---
title: Unix汇编介绍
date: 2019-08-09 00:30:50
category:
- language
tags:
- asm
---
# 介绍

在学习完Dos系统的16位8086汇编语言之后，继续学习在Linux系统上的32位汇编语言。
<!--more-->

# 32位汇编和16位汇编的一些区别

## 寄存器名称的区别

所有通用寄存器名称前面都需要有`e`，也就是说寄存器名称现在变为：

`eax,ebx,ecx,edx,edi,esi,esp,ebp`

特用寄存器名称没有变，也就是:`ss,cs,ds`

需要注意的是，32位寄存器没办法像16位寄存器那样分成两个：

![32位寄存器](/images/32位寄存器.png)

但是16位的规则仍然适用。

## 指令种类

汇编语言中的指令有两种：

* AT&T指令：由AT&T下的Bell实验室开发，我们用的就是这种指令

* intel指令：由intel公司开发，在8086汇编语言中用的就是这种指令

## AT&T指令和intel的区别

首先是移动指令：

```assembly
#AT&T  Intel
movl    mov lword ptr	#移动32位数据/寄存器
movw	mov word ptr	#移动16位数据/寄存器
movb	mov byte ptr	#移动8位数据/寄存器
movq	mov qword ptr	#在64位系统中移动64位数据/寄存器
```

可以看出AT&T的指令比较精简。

然后是移动的方向，在Intel中，我们是将后面的参数移动到前面去，但是在AT&T中是将前面的参数移动到后面去，而且如果是立即数的话必须加上`$`，如果是寄存器的话必须加上`%`:

```assembly
movl $0x32, %eax	#将0x32放入eax寄存器中
movl %eax, %ebx		#将eax寄存器的值放入ebx中
```



还有很多的指令都是在后面加`l,b,w`来指定传输数据的字节数，比如：

```assembly
pushl
```

## movx指令详细解释

对于movx指令（x可以使l,w,b,q），先看看下面几个例子：

```assembly
movl $12, %eax	#将12送入eax
movl %eax, %ebx	#将eax值送入ebx
movl $output, %eax	#将标号处地址送给eax
movl %eax, (%ebx)	#将eax的值送到ebx存储的地址所指的内存上
movl (%eax), %ebx	#将eax所指内存的值送给ebx
```

这里标号后面会说道，最主要的是最后两个指令。其实用一个图就可以解释了：

![寄存器指针](/images/寄存器指针.png)

也就是说，在你不加上括号的时候，其使用的是寄存器内的值。加上括号的话，会将寄存器视为指针，从而使用寄存器指向的地址的值。

# Linux汇编的Hello World

Linux汇编的Hello World和Dos的Hello World也不一样，先来看看代码:

```assembly
.section .data
text:
    .ascii "hello world!\n"
.section .text
.globl _start
_start:
    #调用中断服务直接输出
    movl $4, %eax	#中断子程序号eax需要存放4
    movl $1, %ebx	#中断子程序号ebx需要存放1
    movl $text, %ecx	#将字符串的开头地址放入ecx
    movl $13, %edx	#将字符串长度放入edx
    int $0x80	#执行0x80号中断来输出字符串到控制台

    movl $1, %eax
    movl $0, %ebx
    int $0x80
```

首先，在Linux下写汇编的框架如下：

```assembly
.section .data	#数据存放的地方，这里的数据会放到程序里面
#...
.section .bss	#数据存放的地方，这里的数据是程序在运行的时候动态分配的，所以不会放到程序里面，因而也就不能有初始值
#...
.section .text	#代码存储的地方
.globl _start	#指定汇编程序的入口，相当于C语言的main
_start:	#开始编写代码
#...代码
    movl $1, %eax
    movl $0, %ebx
    int $0x80
```

最后的三句话相当于8086里面的

```assembly
mov ah, 4cH
int 21H
```

也就是程序返回。只不过在Linux下程序返回的中断服务编号不是21H，子程序的编号也不是4C而已。



可以看出来，Linux汇编是使用`.section`来定义段的，而且不需要使用`assume`来将寄存器和段绑定（因为段的名称固定就是`.data .bss .text`，所以会默认绑定）。

而且这里还有一个入口标签`_start`，一般默认的就是`_start`，如果在编译的时候不是`_start`会报错（也有办法在编译指令中指定入口标签，见**编译**）



### .data段

在`.data`中我们的代码如下:

```assembly
text:
    .ascii "hello world!\n"
```

这里使用了伪指令`.ascii`来定义一个字符串。在Linux汇编中有很多这样方便的伪指令，比如`.asciz`会在定义字符串的最后加上`\0`，`.int`定义多个整数，`.float`定义多个小数等，主要用法和`.ascii`差不多：

```assembly
value:
	.int 9
pi:
	.float 3.14159
```

这里的text，value，pi都是标号，用于指向定义的数据的开头地址：

![段内内存分配.png](/images/段内内存分配.png)



同理，对于`movl`指令也有不同的作用:

```assembly
movl $value, %eax	#将9的内存地址放入eax中
movl value, %eax	#将9放入eax中
```



### .bss段

bss段里面可以使用`.comm .lcomm`来定义内存空间（会在程序运行的时候加载）：

```assembly
.section .bss
.lcomm buffer 100
```

这里定义了标号为`buffer`的内存空间，有100字节。

`.lcomm`声明的内存空间只属于这个程序，在全局范围内不能使用。

`.comm`声明的空间在全局范围内可以使用。



### .text段

也就是代码段，一般会先使用`.globl`来定义此程序入口点，然后编写代码，最后返回。











