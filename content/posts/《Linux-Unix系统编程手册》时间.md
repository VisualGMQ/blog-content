---
title: 《Linux/Unix系统编程手册》时间
date: 2019-08-19 23:06:09
category:
- 操作系统
tags:
- Linux
---
# 日历时间

日历时间就是**从Epoch开始计时的时间，以自从Epoch以来的秒数来定义的**。Epoch时间也就是格林威治时间（1900年1月1日零点，又称为**UTC**时间）。

在Linux系统中，存储时间秒数的都是`time_t`系统类型。

<!--more-->

## 获得日历时间

首先是包含在`sys/time.h`中的

```c
int  gettimeofday(struct timeval* tv,struct timezone *tz);
```

第一个参数是一个`timeval`结构体：

```c
struct timeval{
    time_t tv_sec;
    suseconds_t tv_usec;
};
```

用于存储时间。`tc_sec`成员用于存储自Epoch的秒数，`tv_usec`则指出在这个秒数上离现在时间还多出多少**微秒**。也就是说如果将时间全部换算乘秒数，那么有：
$$
nowtime = time_{1900-1-1\ 0:0:0} + tc\_sec + tv\_usec
$$
第二个参数是废弃的，总是应该是`NULL`。



或者使用更加直接粗暴的函数`time()`，这个函数也是个常用函数，用于返回从Epoch到现在的时间。

需要注意的是，`time()`函数如果你给了一个参数`time_t* timeep`，那么秒数会保存到`timeep`中。如果你给NULL，那么会直接返回秒数（出错返回-1）。但是因为返回值更好用，所以我们一般都是直接将参数传为`NULL`。

## 将`time_t`转化为人话

因为`time_t`是自从Epoch的秒数，所以阅读起来很费劲。我们可以通过下面这个函数让其通俗易懂一点：

```c
char* ctime(const time_t* timep);	//给入一个timep，返回一个可读的字符串（包含换行符），返回的值是静态分配的
```

## `time_t`和分解时间的转换

由于`time_t`比较难表示具体的年月日，所以有了`tm`结构体：

```c
struct tm{
    int tm_sec,tm_min,tm_hour,tm_mday,tm_mon,tm_year,tm_wday,tm_yday,tm_isdst	//这里简写了，看的懂就行了
};
```

参数意思一目了然，不解释。

可以通过

```c
struct tm* gmtime(const time_t* timep)  //将日历时间转换为对应于UTC时间的tm
struct tm* gmtime(const time_t* timep)	//将日历时间转换为当地时间
time_t mktime(struct tm* timeptr)	//将tm转化为日历时间
```

## 分解时间和人话之间的转换

接下来是分解时间和打印时间的转换：

```c
char* asctime(const struct  tm* timptr)
size_t strftime(char* outstr, size_t maxsize, const char* format, const struct tm* timeptr)	//outstr:要返回的打印时间的缓冲区。maxsize:outstr的大小。format是相当于printf函数的格式化字符串。返回最后打印时间在outstr中所占的大小。
char* strptime(const char* str,const char* format, struct tm* timeptr);	//strftime的逆函数
```

这里`strftime()`函数其实就是日期打印版本的`sprintf()`



# 时区

Linux所有的时区都是放在文件中管理的，在`/usr/share/zoneinfo`文件夹下。比如日本的`Japan`文件和香港的`Hongkong`文件

如果想要修改时区的话，需要修改**环境变量TZ**（你完全可以用`setenv`等函数改变）。不敢过`TZ`的改变是有格式的：**使用冒号开头，后面是基路径为/usr/share/zoneinfo的时区文件路径，路径分隔符用冒号代替**。比如`/usr/share/zoneinfo/Asia/Hovd`（Hovd时区），那么你就要写`:Asia:Hovd`。如果是不在文件夹里面的时区（比如Hongkong），那么直接`:Hongkong`即可。

# 更新系统时钟

你可以通过下面两个函数更新系统时钟：

```c
int settimeofday(const struct timeval* tv, const struct timezone* tz)//没错是gettimeofday的逆函数
int adjtime(struct timeval* delta, struct timeval* oldtime)//delta指定需要改变的秒和微妙，系统会自我调整
```

其中`settimeofday`是大调整（一般不会用到），`adjtime()`是小调整。

# 进程时间

进程时间是值进程创建之后使用的**CPU数量**。有如下函数获得：

```c
clock_t times(struct tms* buf);
struct tms{
    clock_t tms_utime;
    clock_t tms_stime;
    clock_t tms_cutime;
    clock_t tms_cutime;
};

clock_t clock();
```

一般使用`clock()`函数居多，用于检测算法的运行时间。























