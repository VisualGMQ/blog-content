---
title: Unix编译汇编程序
date: 2019-08-09 00:30:50
category:
- language
tags:
- asm
---
我们写了一个Linux汇编程序，要怎么去编译呢。
<!--more-->

# 普通文件编译

## as,ld编译链接

首先我们可以使用`as`汇编器和`ld`链接器，比如对于下面的代码:

```assembly
#cpuid.asm中
.section .data
output:
    .ascii "The processor Vendor is xxxxxxxxxxxx\n"
.section .text
.globl _start
_start:
    #首先调用cpuid指令获得cpu信息
    movl $0, %eax
    cpuid

    #将信息放入字符串output中
    movl $output, %edi
    movl %ebx, 24(%edi)
    movl %edx, 28(%edi)
    movl %ecx, 32(%edi) 

    #调用终端服务输出字符串
    movl $4, %eax
    movl $1, %ebx
    movl $output, %ecx  #字符串开头放在exc中
    movl $37, %edx  #字符串长度放在edx中
    int $0x80

    #程序返回
    movl $1, %eax
    movl $0, %ebx
    int $0x80
```

我们可以先用`as`编译成中间文件：

```bash
as -o cpuid.o cpuid.asm
```

然后链接：

```assembly
ld -o cpuid cpuid.o
```

然后就可以运行了。

## gcc编译连接的问题

书上还说可以直接使用`gcc`编译，但是程序入口要是`main`而不是`_start`。但是经过测试发现按照书上的方法是不行的。因为当时书上的代码是在32位系统下运行的，我们这里是64位的，不能够编译。在网上查找了很多方法也都无济于事(比如加上-m32，安装库啊什么的都不行)。所以这里就不介绍使用`gcc`编译的过程了。老老实实使用`as`和`ld`吧



# 带有C库的文件编译

如果你想要使用C库函数的话，那么你得这样编译：

```assembly
as --32 -o file.o file.asm
ld -m elf_i386 -dynamic-linker /lib/ld-linux.so.2 -o file -lc file.o
```

这里由于我们使用的是32位汇编，所以在编译的时候需要加上`--32`指定是32位的。然后在链接的时候由于用到了c库所以需要用`-lc`来链接c库，然后还要`-dynamic-linker /lib/ld-linux.so.2`链接ld-linux.so.2库，然后由于这两个库都是64位的，所以还要`-m elf_i386`指定以32位形式链接。

# 参考链接

[汇编 bash: ./cpuid: Accessing a corrupted shared library](https://blog.csdn.net/li740207611/article/details/53966612)



























