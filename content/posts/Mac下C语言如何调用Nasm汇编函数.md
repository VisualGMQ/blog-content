---
title: Mac下C语言如何调用Nasm汇编函数
date: 2020-06-08 16:11:55
category:
- language
tags:
- c
- asm
---

参考博客[Luca's Blog](https://x3ro.de/linking-assembly-with-c-on-os-x/)

<!--more-->

使用nasm编写函数的时候，函数开头需要有标号（就是这个函数的名称，开头必须是一个下划线），并且标号要用`global`声明为全局的，并且函数最后一行得使用`ret`返回：

```assembly
global _idio
section .text
_idio:
	;todo somthing
	ret
```

然后C语言需要声明extern类型的函数:

```c
extern void idio();

int main(){
  idio();
  return 0;
}
```

具体的函数返回值和参数取决于你的汇编代码。

编译的时候Nasm需要使用`-fmacho64`来编译为Mac系统的64位机器语言：

```bash
nasm -fmacho64 idio.asm -o idio.o
```

返回值的话汇编语言中需要将返回值放到rax中：

```assembly
global _idio
section .text
_idio:
	mov rax, 20
	ret
```

```c
extern int idio();

int main(){
  printf("%d", idio());
  return 0;
}
```

C语言输出20。

函数参数的话，取决于你使用的C语言编译器和平台。我这里是MacOS系统上的GCC编译器，前六个参数分别放在`rdi`,`rsi`,`rdx`,`rcx`,`r8`,`r9`寄存器中：

```assembly
global _add
section .text
_add:
	mov rax, 0
	add rax, rdi
	add rax, rsi
	add rax, rdx
	ret
```

```c
int add(int a, int b, int c);	//a参数放入rdi，b参数放入rsi，c参数放入rdx
```

具体什么类型的编译器和平台对应什么参数，见[wiki X86 calling convertions](https://en.wikipedia.org/wiki/X86_calling_conventions#List_of_x86_calling_conventions)

