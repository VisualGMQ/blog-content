---
title: C/C++宏
date: 2019-07-28 16:01:01
category:
- language
tags:
- cpp
---
C/C++宏的用法有很多，让我们来全面的了解\#define语句
<!--more-->

\#define语句的真正用法是文本的简单替换。可以用来定义有参宏，无参宏和各种乱七八糟宏。

***
### 有参宏和无参宏的定义

```c
#define print(str) std:cout<<str<<endl;
#define split() cout<<"******************"<<endl;
```

很简单对吧，你可以传入任意的文本进去，宏会帮你替换，比如

```c
print(a);
```

会被替换成

```c
std::cout<<a<<endl;
```

当然呢如果要想可以运行的话需要有变量a
***
### 定义常量
宏也可以定义常量，其实我个人认为他是定义“常数”，因为它定义的常量在内存中并不占据空间。而是const定义的才占有空间。因为宏是简答替换嘛，所以也没什么可说的

```c
#define PI 3.1415926
```

***
### 宏里面的特殊符号
宏里面是可以使用特殊符号的，比如#,##,#@,\四个符号。

#### \#符号
\#符号是用来将有参宏里的参数变成字符串的。比如`#define macro(varname) #varname`这个宏，如果你调用`macro(hello)`会返回字符串"hello"。

#### \#\#符号
\#\#符号是将有参宏里面的变量和其他变量或者字符绑在一起的。比如宏`#define macro(str1,str2) str1##str2`调用`macro(a,b)`会产生ab。但是不会加上双引号，因为只是绑在一起，不是变成字符串。也可以和字符绑在一起：
`#define macro(a) x##a`调用`macro(2)`产生x2。

#### \#@符号
这个符号将后面的变量加上单引号，其实和\#符号差不多，只不过加上的是单引号

#### \\符号
换行符号，如果宏太多一行写不下可以在行末使用这个换行。但是\\后面除了换行符之外不可以有别的字符，连空格都不可以。

有了这些特殊符号，我们可以写出很多很方便的宏，比如:

```c
#define logvar(varname) std::cout<<#varname<<":"<<varname<<endl;
```

这个用来调试变量，输出变量名和变量的值

```c
#define CREATE_PUB_VAR(type,name,initvalue) \
public:\
    type name = initvalue;
```

这个用于在类里面声明一个public变量并给出初值。

#### 连接字符串的方式
你只需要将两个字符串放在一起（或者代表字符串的宏），就可以连接这两个字符串:
```c++
#define STR "this is " "MACRO" //STR="this is MACRO"
#define MSG "[info]" STR //MSG="[info] this is MACRO"
```
需要注意的是两个字符串之间必须有空格

***
#### 编译器预定义的宏
编译器自己也定义过一些宏：
* 通用宏
> `__FUNC__`:当前行存在哪一个函数里面
> `__DATE__`:最后一次编译的日趋
> `__TIME__`:最后一次编译的时间
> `__FILE__`:这个文件的文件名称
> `__LINE__`:这个宏所在的行号
> `_TIMESTAMP_`：最后一次修改当前文件的时间戳

这些一般都是通用的，但是如果是不同的编译器的话，还会给出一些有关操作系统和语言的宏：
* 关于操作系统
>`__APPLE__`:苹果系统会给出这个宏表示编译代码的编译器在苹果公司的系统上，但是没有说明是在MacOS还是IOS上，所以你还需要包含苹果系统的头文件"TargetConditionals.h"，这个头文件里面有一些宏供你使用：
>    `TARGET_OS_X`:MacOS系统
>    `TARGET_OS_IPHONE`:IOS系统
> 还有很多的其他的宏就不一一列举了，具体见[这里](https://blog.csdn.net/u011374318/article/details/79464815)
>
>`__linux`,`linux`,`__linux__`:表示是linux系统，不同的编译器给出的宏不一样，基本上在这三个之内
>`WIN32`,`__WIN32`,`__WIN32__`:表示windos系统
>`__ANDROID__`:安卓系统
>`__MINGW32__`:MINGW编译器
>`__ORBITS__`:PS4平台
>`__CYGWIN__`:cygwin编译器
>`_MSC_VER`:vc++
>`__BORLANDC__`:BorlandC编译器
>`__JETBRAINS_IDE__`:jetbrains公司的IDE（一般都是CLION啦），这个宏本身的值表示是哪一版的IDE。

接下来就是关于语言的宏
* 关于语言的宏
> __cplusplus:表示使用C++编译，其中__cplusplus这个宏本身的值就代表了使用的C++标准：
>   c++98: 199711
>   c++03: 199711
>   c++11: 201103
>   c++14: 201402
>   c++17: 201703
> 对于微软，你需要判断这个宏 `_MSVC_LANG`

* 其他有意思的宏
> `__COUNTER__`:这个宏会随着它的每次出现而自增1，初始值为0.
比如你这么写：

```c
cout<<__COUNTER__<<endl;
cout<<__COUNTER__<<endl;
cout<<__COUNTER__<<endl;
cout<<__COUNTER__<<endl;
```

那么会输出

```c
0
1
2
3
```

> `__has_include()`这个宏里面放入头文件，他会检查你的头文件搜索路径中有没有这个文件。系统路径使用\<\>，自定义路径使用””，比如：

```c
#if __has_include(<iostream>)
    cout<<"iostream is in include path"<<endl;
#endif
```