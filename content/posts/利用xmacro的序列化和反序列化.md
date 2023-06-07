---
title: 利用xmacro的序列化和反序列化
date: 2021-01-21 20:25:33
category:
- 计算机网络
tags:
- cpp
---

本文介绍了如何使用宏自动创建序列化和反序列化函数的方法。

<!--more-->

# 吐槽

在C/C++中进行序列化向来是个令人头痛的事情。虽然有ProtoBuf的支持，但在编写小软件的时候还是不想使用庞大的ProtoBuf啊。语言本身不支持序列化的原因主要还是没有反射。虽然说可以手写编译期反射的代码，但是网上哪些花里胡哨的模板元编程代码我压根看不懂。。。

不过我这两天找到了使用宏自动创建序列化函数的方法，使用被称为xmacro的技术。

# 正文

## 什么是xmacro

> **X-MACRO**是一种可靠维护代码或数据的并行列表的技术，其相应项必须以相同的顺序出现。它们在至少某些列表无法通过索引组成的地方（例如编译时）最有用。此类列表的示例尤其包括数组的初始化，枚举常量和函数原型的声明，语句序列和切换臂的生成等。**X-MACRO**的使用可以追溯到1960年代。它在现代C和C ++编程语言中仍然有用。
>
> **X-MACRO**应用程序包括两部分：
>
> 1. 列表元素的定义。
> 2. 扩展列表以生成声明或语句的片段。
>
> 该列表由一个宏或头文件（名为LIST）定义，该文件本身不生成任何代码，而仅由一系列调用宏（通常称为“ X”）与元素的数据组成。LIST的每个扩展都在X定义之前加上一个list元素的语法。LIST的调用会为列表中的每个元素扩展X。

这些定义可能较为难懂，没得事，看下面实现序列化代码的方法自然就懂了。

## 实现序列化

### 目标

我们的目标是，通过编写这一段宏定义：

```c++
#define serialize_name Student
#define serialize_body \
    field_string(name, "VisualGMQ") \
    field_int(age, 22) \
    field_double(height, 170.0)
```

编译器可以自动帮我们产生

```c++
// 结构体的定义
struct Student {
    char* name = "VisualGMQ";
    int age = 22;
    double height = 170.0; 
  
    // 以及序列化函数（这里就先序列化成一个描述结构体的字符串，要想序列化为二进制原理是一样的）
    string Serialize();
};
```

### serialize_tool.hpp

首先我们需要定义一些工具宏，用于帮助我们定义结构体内的成员:

```c++
#define field_int(name, ...)
#define field_double(name, ...)
#define field_string(name, ...)
```

这些宏是空宏，因为下文中我们还需要覆盖这些宏的功能。

### serialize_achieve.hpp

在这个文件中我们来完成代码的生成部分。

首先要想生成代码，用户必须**提前定义**表示结构体名称的`serialize_name`宏，以及结构体内部字段的`serialize_body`宏:

```c++
#if !defined(serialize_name) || !defined(serialize_body)
#error "please include serialize_tools.hpp,then define your serialize_name, serialize_body,then include this file"
#endif
```

如果用户没有定义，直接报编译时错误。

接下来就是xmacro发挥用途的时候了。xmacro其实就是通过不断地`#undef`和`#define`宏，让相同的宏在不同的地方展开成不一样的代码。

首先我们需要对`field_int(name, ...)`类宏展开成`int name = {__VA_ARGS__}`，我们可以

```c++
#undef field_int	// 首先nudef掉serialize_tool.hpp中的定义
#define field_int(name, ...) int name = {__VA_ARGS__};	// 给出新的定义
```

我们这边的确更改了`field_int`宏的含义，但是我们需要再一次使用`serialize_body`才能展开：

```c++
#undef field_int
#define field_int(name, ...) int name = {__VA_ARGS__};
serialize_body	// 现在会将serialize_body宏内的所有field_int展开为变量声明。
```

其他的`field_xxx`同理。

接下来我们需要将`field_int(name, ...)`展开成`ss << name `的情况，这里ss是stringstream的实例。

```c++
string Serialize() {  // 在函数内展开
  stringstream ss;	// 创建ss
  
#undef field_int
#define field_int(name, ...) ss << #name "=" << name << endl;	// 定义展开，这里#name会将name变为字符串。
serialize_body	// 展开serialize_body内的所有field_int
}
```

这样序列化函数就完成了，反序列化也是同样的道理。

最后不要忘记`#undef serialize_body`和`#undef serialize_name`以及`#undef field_int`，以免下一次用户定义失败。

### 完整的代码

`serialize_tool.hpp`:

```c++
#define field_int(name, ...)
#define field_double(name, ...)
#define field_string(name, ...)
```

`serialize_achieve.hpp`

```c++
#include <sstream>
#include <string>
using std::stringstream;
using std::string;
using std::endl;

// 如果用户没有定义基本的描述宏，报错
#if !defined(serialize_name) || !defined(serialize_body)
#error "please include serialize_tools.hpp,then define your serialize_struct,then include this file"
#endif

// 开始生成
struct serialize_name {
// 生成变量声明
#undef field_int
#define field_int(name, ...) int name = {__VA_ARGS__};

#undef field_double
#define field_double(name, ...) double name = {__VA_ARGS__};

#undef field_string
#define field_string(name, ...) double name = {__VA_ARGS__};

serialize_body

// 生成Serialize函数
string Serialize() {
    stringstream ss;
#undef field_int
#define field_int(name, ...) ss << #name "=" << name << endl;

#undef field_double
#define field_double(name, ...) ss << #name "=" << name << endl;

#undef field_string
#define field_string(name, ...) ss << #name "=" << name << endl;

serialize_body
    return ss.str();
}
};

// undef 所有的宏
#undef field_int
#undef field_double
#undef field_string
#undef serialize_name
#undef serialize_body
```

注意这两个文件都不要加`#ifndef XX`,`#define XX`这种防止重复包含的宏。因为这个文件就是要重复包含的。

然后是使用：

```c++
// 产生第一个结构体
#include "serialize_tools.hpp"

#define serialize_name Student
#define serialize_body \
    field_string(name, "VisualGMQ") \
    field_int(age, 22) \
    field_double(height, 170.0) \

#include "serialize_achieve.hpp"

// 产生第二个结构体
#include "serialize_tools.hpp"

#define serialize_name Foo
#define serialize_body \
    field_double(value, 32.0)

#include "serialize_achieve.hpp"


int main(int argc, char** argv) {
    Student student;
    std::cout << student.Serialize();
    Foo foo;
    std::cout << foo.Serialize();
    return 0;
}
```

运行结果如下：

```bash
name=VisualGMQ
age=22
height=170

value=32
```

# 参考

[文章-宏的高级用法：X-MACRO](https://my.oschina.net/mizhinian/blog/4833400)

[视频-C++编译期反射](https://www.bilibili.com/video/BV16Z4y1T7ec?from=search&seid=8149804935780875447)

