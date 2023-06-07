---
title: C/C++中的extern,static
date: 2019-09-02 19:41:37
category:
- language
tags:
- cpp
---
这里记录一下`extern`和`static`在C/C++中的用法。
<!--more-->
# static
首先是static，我们都知道在局部变量前使用static会让局部变量的生命周期变为全局变量：
```c++
void inc(){
    static a=0;
    a++;    //这里的a每次都自增一个，而不是每次都是1
}
```

但是static作用在全局变量，或者函数上有什么用呢？

如果static作用在全局变量上，那么这个变量就是专门属于这个文件的，其他文件是不能够访问的：
```c++
//file header.hpp
#ifndef __HEADER_HPP__
#define __HEADER_HPP__
#include <iostream>
using namespace std;

static int a = 0;
static void say(){
	cout<<"hello extern"<<endl;
}

#endif

//file main.cpp
#include <iostream>
#include "header.hpp"
using namespace std;

int main(){
	cout<<i<<endl;
	say();
	return 0;
}
```
编译出错：
```bash
main.cpp:6:8: error: use of undeclared identifier 'i'
        cout<<i<<endl;
              ^
1 error generated.
```
包括函数也是不能调用的。

静态函数和变量的好处就是：
* 此函数/变量之存在于本文件，所以其他文件可以定义同名函数和变量而不会冲突
* 由于此函数/变量只存在于本文件，所以其他文件也没办法使用本函数/变量

# extern
extern的作用是将变量或者函数“导出”。也就是说变量/函数的声明和实现分离:
```c++
//file header.hpp
#ifndef __HEADER_HPP__
#define __HEADER_HPP__
extern int i;

void incI(){
	i++;
}
#endif

//file main.cpp
#include <iostream>
#include "header.hpp"
using namespace std;

int i=3;

int main(){
	cout<<i<<endl;
	incI();
	cout<<i<<endl;
	return 0;
}

//输出
3
4
```
可以看到我们是在`header.hpp`中定义的i，在`main.cpp`中实现（赋值）的i。所以使用`extern`关键字的变量不能够直接赋初值，当然extern也不能和static连用。

函数之所以可以实现和声明分离，就是因为函数其实是默认的extern方式,所以函数需要在头文件中声明。但是如果你在函数前面加上static，那么就不会有extern。

# 参考
[C语言中extern用法详解](https://blog.csdn.net/weixin_40819954/article/details/79725588)
[c语言中static 函数和普通函数的区别？](https://blog.csdn.net/thanklife/article/details/78476737)