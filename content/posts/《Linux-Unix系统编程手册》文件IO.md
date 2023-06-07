---
title: 《Linux/Unix系统编程手册》文件IO
date: 2019-08-14 23:32:09
category:
- 操作系统
tags:
- Linux
---

# 文件IO
IO有很多种，其中文件IO最为重要，因为Unix系统中所有的东西都可以被视为文件，所以必须要先学会如何对文件进行操作。
<!--more-->

## 打开文件`open`
> 这个函数在`fcntl.h`中

`open()`系统调用用于打开文件，既可以打开已经存在的文件也可以在文件不存在时创建。最神奇的时他可以在只读模式下创建文件！
```c
int open(const char* pathname, int flags, .../*mode_t mode*/)
```
* 第一个参数是要打开的文件名称（其实也可以是文件夹，管道啊等等）
* 第二个参数是打开的方式：
    ![open_flag](/images/open_flag.png)
* 后面的可选参数是用来指定文件权限的，这里先不说

可以看出flag被分为了三种：
* 第一部分是**文件访问模式标志**，也就是指定打开文件是以读写哪种方式
* 第二部分是**文件创建标志**
* 第三部分是**已打开文件的状态标志**

这里需要注意的是：**文件访问模式标志一次只能用一个，不能通过逻辑或放在一起使用（可以和其他种类的flag逻辑或），因为`O_RDONLY`,`O_WRONLY`,`O_RDWR`的值分别是0，1，2，所以或了之后会发生逻辑错误**。

而且正是因为有了`O_CREAT`标志，让我们可以在读模式下创建文件：`O_RDONLY|O_CREAT`（注意这里`O_CREAT`不是`O_CREATE`）

注意**open函数返回一个_文件描述符_（这里不被称为句柄啊什么的）**

### create函数
在很老的版本中是没有`O_CREAT`标志的，想要创建文件必须先用`create`系统调用。
```c
int create(const char* pathname, mode_t mode)
```

## 读写文件内容read/write
> 这两个函数在`unistd.h`中

这个很简单，和C语言的`fread(), fwrite()`差不多，看一下原型应该就知道怎么用了：
```c
ssize_t read(int fd, void* buffer, size_t count);   //返回读取的字节
ssize_t write(int fd, void* buffer, size_t count);  //返回写入的字节
```

## 关闭文件close
> 这个函数在`unistd.h`中

这个也简单:
```c
int close(int fd)
```

## 改变文件偏移量lseek
也就是移动文件指针啦，使用`lseek`函数：
```c
off_t lseek(int fd, off_t offset, int whence)   //返回当前指针位置
```
* 第二个参数是偏移量
* 第三个参数取值如下：
    * `SEEK_SET`相对于文件头
    * `SEEK_CUR`相对于当前位置
    * `SEEK_END`相对于最后

### 文件空洞
值得注意的是：**就算lseek将偏移量移动到文件末尾后面去了，write函数照样可以写入。那么文件结尾到write函数写之间空出的这块地方被称为`文件空洞`。**文件空洞**不占用任何磁盘空间**，只是名义上文件变大了（如果你用`ll`命令查看的话），如果下次写入在文件空洞内，那么kernel才会为其分配存储单元，也就是说你会看到文件没有变大，但是磁盘空间变小的奇特情况。
在大多Unix系统下内存以**块**分配（通常是1024倍数），如果文件空洞大小落在块边界，那么不会分配，但是如果落在块内，那么会直接分配内存，多出来的地方用0代替。