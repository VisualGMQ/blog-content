---
title: C++17 filesystem
date: 2021-1-3 19:02:09
category:
- language
tags:
- cpp
---

C++17新出了filesystem库用于对文件和目录进行操作。在以前使用C++的时候，一旦遇到要遍历目录的操作都得用Unix函数，而且还必须考虑和Windows的兼容性，可以说C++在这一方面做的很差。但是C++17中的filesystem解决了这个问题。

其CppReference在[这里](https://zh.cppreference.com/w/cpp/filesystem)

<!--more-->

# 使用需要包含的头文件等

首先，如果你的编译器支持C++17的话，可以直接包含filesystem:

```cpp
#include <filesystem>
```

官方存在以下说明：

> 使用此库可能要求额外的编译器/链接器选项。 9.1 前的 GNU 实现要求用 -lstdc++fs 链接，而 LLVM 9.0 前的 LLVM 实现要求用 -lc++fs 链接。

我的是clang 10.0.0，测试不需要连接库。

如果你的编译器不支持C++17，或者由于某种原因总是用不了的话，可以使用Boost库中的filesystem。因为C++17的filesystem就是从Boost库中拿过来的，所以用法都一样（不过要安装Boost库）。

要想使用filesystem，需要使用命名空间（Boost库可能不一样）

```c++
using namespace std::filesystem;
```

为了方便，在下面的代码中我都会有这个语句：

```c++
namespace fs = std::filesystem;
```

用fs命名空间代替std::filesystem。

# 使用方法

大体上包含这些内容：

* 类：表示路径的`path`类，表示文件实体的`directory_entry`类，以及用于遍历目录的`directory_iterator`和`recursive_directory_iterator`类
* 对文件操作的函数：创建文件，创建链接，删除文件，移动文件，拷贝文件，复制文件，重设文件大小等
* 对目录操作的函数：创建目录，删除目录等
* 得到文件系统信息的函数

首先来看类

## 文件系统异常类filesystem_error

文件系统的所有函数，基本上只会抛出这种异常。

## path类

path类用于表示一个路径（不一定要是存在的，其本质上是存储着字符串然后对字符串进行各种操作，所以其实和文件系统毫不相干，也不会提供检查文件存在等）：

```c++
fs::path p("./");	//当前路径
```

想要得知path表示的路径是否存在，使用`fs::exists()`函数：

```c++
if(!fs::exists(p))
    cout<<p<<" exists"<<endl;
```

使用`operator/()`可以合并两个path或者path和字符串（自动在两者之间添加分隔符）

## directory_entry类

通过传入一个path类对象，可以得到一个`directory_entry`类。这个类是和磁盘上文件或文件夹实体对应的类。

通过成员函数`exists()`来判断是否存在对应的文件/文件夹实体。通过`is_XXX`系列函数判断其指向的类型：

| 函数 | 用途 |
| ---- | ---- |
| [is_block_file](https://zh.cppreference.com/w/cpp/filesystem/directory_entry/is_block_file) | 检查 directory_entry 是否代表阻塞设备      |
| [is_character_file](https://zh.cppreference.com/w/cpp/filesystem/directory_entry/is_character_file) | 检查 directory_entry 是否代表字符设备      |
| [is_directory](https://zh.cppreference.com/w/cpp/filesystem/directory_entry/is_directory) | 检查 directory_entry 是否代表目录          |
| [is_fifo](https://zh.cppreference.com/w/cpp/filesystem/directory_entry/is_fifo) | 检查 directory_entry 是否代表具名管道      |
| [is_other](https://zh.cppreference.com/w/cpp/filesystem/directory_entry/is_other) | 检查 directory_entry 是否代表*其他*文件    |
| [is_regular_file](https://zh.cppreference.com/w/cpp/filesystem/directory_entry/is_regular_file) | 检查 directory_entry 是否代表常规文件      |
| [is_socket](https://zh.cppreference.com/w/cpp/filesystem/directory_entry/is_socket) | 检查 directory_entry 是否代表具名 IPC 接头 |
| [is_symlink](https://zh.cppreference.com/w/cpp/filesystem/directory_entry/is_symlink) | 检查 directory_entry 是否代表符号链接      |

通过`file_size()`得到文件大小（不可对目录使用），使用`hard_link_count()`得到文件对应的硬链接大小，使用`last_write_time()`得到文件最后修改时间。使用`path()`获得表示的路径。

如果在操作的时候目录内容改动了，通过`refresh()`来更新类对象的内容。

## 遍历文件夹下的文件和文件夹

如果想要遍历的话，可以使用`directory_iterator`（用于单层遍历）或`recursive_directory_iterator`（用于递归遍历）。这里用递归遍历做例子：

```c++
fs::recursive_directory_iterator rec_it(p);
for(auto it=fs::begin(rec_it);it!=fs::end(rec_it);it++)
  cout<<it->path()<<endl;
```

可以通过传递path或者字符串来构建一个类对象。通过`fs::begin()`和`fs::end()`获得其迭代器，迭代器中包含的是对应目录下文件或文件夹的`directory_entry`对象。

## 对目录的创建，删除，拷贝等

创建文件没有直接的函数，因为你完全可以通过标准IO操作来创建文件，其他的操作如下：
|函数|功能|
|---|---|
| [copy](https://zh.cppreference.com/w/cpp/filesystem/copy)    | 复制文件或目录   |
| [copy_file](https://zh.cppreference.com/w/cpp/filesystem/copy_file) | 复制文件内容     |
| [copy_symlink](https://zh.cppreference.com/w/cpp/filesystem/copy_symlink) | 复制一个符号链接 |
| [create_directory/create_directories](https://zh.cppreference.com/w/cpp/filesystem/create_directory) | 创建新目录       |
| [create_hard_link](https://zh.cppreference.com/w/cpp/filesystem/create_hard_link) | 创建一个硬链接   |
| [create_symlink/create_directory_symlink](https://zh.cppreference.com/w/cpp/filesystem/create_symlink) | 创建一个符号链接 |
| [remove](https://zh.cppreference.com/w/cpp/filesystem/remove) | 移除一个文件或空目录 |
| [removeall](https://zh.cppreference.com/w/cpp/filesystem/remove) | 移除一个文件或递归地移除一个目录及其所有内容 |
| [resize_file](https://zh.cppreference.com/w/cpp/filesystem/resize_file) | 以截断或填充零更改一个常规文件的大小 |

