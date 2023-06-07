---
title: 《Linux/Unix系统编程手册》编程注意事项
date: 2019-08-14 23:06:09
category:
- 操作系统
tags:
- Linux
---

# kernel

kernel（核）是Unix操作系统内提供服务的东西，所有的进程想要完成什么操作都必须对kernel进行申请。

## 系统调用和C库函数

kernel直接提供的操作被称为**系统调用（System Call）**，比如后面说的`open, close, read`等函数。
像C语言的`fopen,fclose`等函数就不是系统调用，我们称这种函数为C库函数，是在系统调用之上进行封装的函数。

**所有的系统调用都是`原子操作`**。也就是说所有的系统调用在线程中都是安全的，不可被分割的。这对于多线程编程来说至关重要，需要牢记。这也就是为什么在多线程中广泛使用系统调用而不是C库函数。
但是系统调用由于需要内核的处理，所以效率比较低，占用资源比较多。

<!--more-->

![Unix系统调用](/images/Unix系统调用.png)

# 错误处理

由于Linux/Unix操作系统是使用C语言编写的，所以其库函数也没有什么异常之类的，都是使用返回值来捕捉异常。对于异常捕捉有如下几点：

* 对于系统调用
  * 大多数函数如果出错的话会返回-1
  * 有一些函数是一定会成功的，比如用于返回当前线程id的`getpid()`
  * 有一些系统调用即使成功了也会返回-1
* 对于C库函数调用
  * 具体函数具体对待

对于系统调用，在`sys/errno.h`文件中有一个`errno`变量，每当系统调用出错的时候，会将`errno`变量设为一个正常数（比如`EINTR`之类的，以`E`打头）来表示出现的错误类型。但是当系统调用成功的时候却不会重置为0，所以在对某个操作进行错误判断的时候要手动将`errno`置0，然后待系统调用完成之后再查看`errno`的值。这也是**检查系统调用是否出错的最可靠最通用的方法。**

C还提供了一些位于`stdio.h`中的库函数，通过`errno`变量来进行错误处理：

* `int perror(const char* msg)`用于在`errno!=0`的时候打印出msg和errno值对应的错误
* `char* strerror(int errnum)`需要将错误号传入，然后会返回对应的错误描述字符串。这里的返回值是静态的，不能只给一个指针。

# 系统类型

Unix编程的时候会看到很多如`size_t,time_t,gid_t`这种系统使用typedef定义的类型。之所以定义这些类型，是为了兼容性。如果你都使用int的话，假设在A系统上int是32位， B系统上int是18位的，那么你的程序就可能因为int长度的原因出错。所以Unix在必要的时候会返回用typedef定义的系统类型，不同的系统中会有不同的定义（比如32位A系统是`typedef unsigned char size_t`，16位B系统是`typedef int size_t`)

# 其他的可移植问题

对于协同结构体如

```c
struct sembuf{
    unsigned short sem_num;
    short          sem_op;
    short          sem_flg;
};
```

在初始化的时候不要用列表初始化方式：

```c
struct sembuf sem={32,1,0};
```

而要用一位一位的方式初始化：

```c
strucy sembuf sem;
sem.sem_num = 32;
sem.sem_op = 1;
sem.sem_flg = 0;
```

因为在不同的Unix系列系统中同一个结构体的成员顺序不一定一样，比如在B系统中可能是

```c
struct sembuf{
    unsigned short sem_num;
    short          sem_flg;
    short          sem_op;
};
```

如果用列表初始化就吧1赋值给sem_flg了。
