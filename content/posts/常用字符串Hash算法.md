---
title: 常用字符串Hash算法
date: 2022-03-30 19:18:16
tags:
- 算法
categories:
- 算法和数据结构
---

本文介绍了常用的字符串Hash算法。

<!--more-->

## 杂项算法

杂项哈希算法是从各个地方搜集来的哈希算法。这里只列出几个有名的，所有的可以看参考中的第一条链接。

所有算法最后都需要将hash值限定在哈希表的长度中。这里默认哈希表长度为`0x80000000`。

### BKDRHash

在《C语言程序设计中提出》：

```cpp
unsigned int BKDRHash(const char* str) {
    unsigned int seed = 131  // 可以是31, 131, 1313, 13131, ...
    unsigned int hash_code = 0;
    while (*str) {
        hash = hash * seed + (*str++);
    }
    return hash & 0x7FFFFFFF;
}
```

### SDBMHash

SDBM项目使用的哈希函数，声称对所有的数据集有很好地分布性。

```cpp
unsigned int SDBMHash(const char* str) {
    unsigned int hash = 0;
    while (*str) {
        hash = (*str++) + (hash << 6) + (hash << 16) - hash;
    }
    return hash & 0x7FFFFFFF;
}
```

### ELFHash

Unix系统上广泛使用的哈希函数。

```cpp
unsigned int ELFHash(char* str) {
    unsigned int hash = 0;
    unsigned int x = 0;
    while (*str) {
        hash = (hash << 4) + (*str++);
        if ((x = hash & 0xF0000000L) != 0) {
            hash ^= (x >> 24);
            hash &= ~x;
        }
    }
    return hash & 0x7FFFFFFF;
}
```

### DEKHash

是高德纳在《程序设计艺术》中提出的：

```cpp
unsigned int DEKHash(char* str) {
    int hash = strlen(str);
    while (*str) {
        hash = (hash << 5) ^ (hash >> 27) ^ (*str ++);
    }
    return hash & 0x7FFFFFFF;
}
```

### Java String Hashcode

这是Java的字符串类的Hash算法，简单实用高效。直接从JDK6里面拿出来的代码：

```cpp
unsigned int JDK6Hash(char* str) {
    int hash = 0;
    while (*str) {
        hash = hash * 31 + *str++;
    }
    return hash & 0x7FFFFFFF;
}
```

## Lookup3



## MD5

MD5一般用在加密方面。MD5总是会产生16字节结果。MD5有如下优点：

* 返回长度总是一样的
* 无法从结果反推
* 有高度离散型，输出结果没有任何规律
* 抗碰撞性，想找到两个完全一样的MD5值是很难的

MD5主要用于如下情况：

* 密码保护：当我们注册账号时， 服务器并不是记录我们的账号密码，而是记录密码的MD5。这样黑客就不能从服务器获得用户密码了。
* 完整性校验：当传输大文件时，由于网络的不稳定，可能导致文件有部分丢失。这时可以先传一下文件的MD5，等客户端收到后校验MD5即可。如果MD5一致则没问题。
* 数字签名：当下载文件时，为了防止被黑客篡改，可以事先发布文件的MD5码和大小，然后用户下载之后再进行校验以确保安全性。
* 云盘秒传：上传大文件的时候，计算文件MD5并且和数据库内的文件MD5对比。如果一致，说明数据库里有此文件，就不用上传了。

MD5算法是个固定算法，算法很繁琐，也没有什么数学原理可说的，这里直接贴一个我认为挺好的视频教程：

{% bilicard BV1u44y1z7t1 %}

## CRC

循环冗余校验码。主要是用在通信领域中校验信息的。

这个算法书上都有讲解，我也不再重复。直接放个视频连接：

{% bilicard BV1V4411Z7VA %}

## 参考

[CSDN 字符串哈希函数](https://blog.csdn.net/chenlycly/article/details/86606641)
