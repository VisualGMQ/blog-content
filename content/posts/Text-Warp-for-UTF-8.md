---
title: Text Warp (for UTF-8)
date: 2021-07-25 16:37:28
tags:
- 杂项
category:
- game development
---

本文介绍了如何对UTF-8编码的字符串进行Warp。  

Text Warp是游戏和GUI开发中不可或缺的一个技术，说白了就是自动换行：给定一个长度，当你渲染的字符串超过这个长度时需要自动从下一行开始渲染。  
对ASCII码组成的字符串进行Warp很简单，但是对于UTF-8的编码就会麻烦一点。  

首先要了解UTF-8编码的编码方式。它是不定长编码，编码方式如下：  

|字符所在的十六进制区间|编码方式|
|:----|----:|
|0x0000 0000 - 0x0000 007F|0xxx xxxx|
|0x0000 0080 - 0x0000 07FF|110x xxxx 10xx xxxx|
|0x0000 0800 - 0x0000 FFFF|1110 xxxx 10xx xxxx 10xx xxxx|
|0x0001 0000 - 0x0010 FFFF|1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx|

第一个区间就是普通的ASCII码，因为ASCII码总是小于127，即最高位是空着的，所以就使用最高位是否为1来表示编码是否为UTF-8.  

举个栗子，“中”字的UTF-8码是

```bash
E4 B8 AD
```

转换成二进制就是

```bash
1110 0100 1011 1000 1010 1101
```

这个长度是表格中的第三行（其实只要看最左边4位就可以判断），我们从中将所有的标志位去掉，就是：  

```bash
1110 0100 1011 1000 1010 1101
去掉标志位：
     0100   11 1000   10 1101
= 0100 1110 0010 1101 = 0x8F2B
```

显然`0x8F2B`位于区间`0x0800 - 0xFFFF`中，这就验证成功了。  

有了这些基本知识，我们就可以从一串字符串中得到UTF-8编码了：  

```c++
// 这个函数从str的idx位置处解析一个UTF-8字并返回
std::string ParseOneUTF8(const std::string& str, int idx) {
    std::string result;
    if ((str[idx] & 0xF0) == 0xF0) {
        result.push_back(str[idx++]);
        result.push_back(str[idx++]);
        result.push_back(str[idx++]);
        result.push_back(str[idx++]);
    } else if ((str[idx] & 0xE0) == 0xE0) {
        result.push_back(str[idx++]);
        result.push_back(str[idx++]);
        result.push_back(str[idx++]);
    } else if ((str[idx] & 0xC0) == 0xC0) {
        result.push_back(str[idx++]);
        result.push_back(str[idx++]);
    } else {
        result.push_back(str[idx++]);
    }
    return result;
}
```

这样Text Warp也就好做了:  

```c++
// 这里最后的参数是表示一行的最大字符数
std::vector<std::string> WarpUTF8(const std::string& str, int maxCharNum) {
    int size = 0;
    int idx = 0;
    std::vector<std::string> result;
    std::string line;

    while (idx < str.length()) {
        auto utf8Char = ParseOneUTF8(str, idx);
        line += utf8Char;
        idx += utf8Char.length();
        size++;
        if (size >= maxCharNum) {
            result.push_back(line);
            line.clear();
            size = 0;
        }
    }
    if (!line.empty())
        result.push_back(line);
    return result;
}
```

Unicode也是一样，只要找到了其编码方式就可以解析。  
关于编码，推荐个B站视频：  

{% bilicard BV1gZ4y1x7p7 %}
