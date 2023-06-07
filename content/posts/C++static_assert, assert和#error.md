---
title: C++中的static_assert, assert和#error
date: 2020-6-13 19:02:09
category:
- language
tags:
- cpp
---

这里介绍C++中用于断言的三种方式
<!--more-->

# static_assert

`static_assert`是C++11最新的关键字。用于**静态断言**，其用法如下：

```c++
static_assert(布尔常量表达式, 消息)
static_assert(布尔常量表达式)
```

如果给出了消息参数，那么当布尔常量表达式为`false`的时候会输出消息。

# assert

这是C/C++共同拥有的断言方法，在`cassert`文件中

```c++
assert(表达式)
```

如果表达式为0会终止程序并且输出一些提示信息（**注意是表达式为0而不是表达式为false**）。

这里需要注意的是：**assert是仿函数宏（也就是形如`#define f(x)`这种），你这样写`assert(b==false)`是不行的，必须用括号将表达式扩起来才行写`assert((b==false))`。**

而且根据`assert`的实现，如果你在程序中定义了`NDEBUG`宏，那么assert函数会什么也不做（当然你得在包含`cassert`之前声明）。这样我们就可以方便的在调试模式和非调试模式下切换了。

# \#error

这个也是C/C++共用的，属于预处理命令：

```c++
#error 信息
```

这个宏只要一出现就会在预编译阶段在有#error的这一行阻止程序，所以你会看到编译器给你在#error处报一个错。

使用方法的话一般是和`#ifdef`, `#ifndef`搭配使用：

```c++
#ifndef MAC
#error 不是Mac电脑
#endif
```

这里如果不是Mac电脑我们就不允许编译。