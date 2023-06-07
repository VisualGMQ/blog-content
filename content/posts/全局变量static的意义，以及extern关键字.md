---
title: 全局变量static的意义，以及extern关键字
date: 2019-07-28 16:01:01
category:
- language
tags:
- cpp
---
## 全局的static

我们都知道static变量的用法：函数里面代表在函数结束的时候不销毁变量，类里面代表这个变量或者方法属于整个类。那么对于全局的static变量来说这意味着什么呢？

<!--more-->

我们先看一看下面的代码：

```c
//header.hpp
#ifndef __HEADER__
#define __HEADER__
int headervar = 10;
#endif

//classA.hpp
#ifndef __CLASSA__
#define __CLASSA__
#include "header.hpp"
class classA{
public:
    classA():data(headervar){};
private:
    int data;
};
#endif

//classB.hpp
#ifndef __CLASSB__
#define __CLASSB__
#include "header.hpp"
class classB{
public:
    classB():data(headervar){};    
private:
    int data;
};
#endif
```

这里我们首先有一个头文件header.hpp，这个头文件里面只有一个变量headervar。接下来classA.hpp和classB.hpp都要使用这个头文件里面的变量。然后我们在写一个main函数：

```c
#include "classA.hpp"
#include "classB.hpp"
#include <iostream>
using namespace std;

int main(){
    classA a;
    classB b;
    return 0;
}
```

这里看上去好像没有什么问题，但是如果你编译main函数的话会发生错误。她会说headervar变量在classA和classB里面重复了。
但是我们都知道，我们已经使用了#ifndef宏来保证头文件不被重复包含了。那么错误在哪里呢？其实就是在headervar不是static的。
当多个文件包含一个头文件的时候，这个头文件里面的全局变量需要是static的。这样才可以保证整个源代码里面只有一份变量。
所以全局static的作用是**保证整个源代码里面只有这一个变量**

## extern关键字
extern关键字的意思是“被这个关键字修饰的变量或者函数可以在其他文件中寻找定义”。
比如说，下面代码一定是不能通过的，编译器会说出现了重复的变量:

```c
//file1.hpp
int i = 20;

//file1.cpp
#include "file1.hpp"
int i = 30;
```

但是如果你在i的前面加上extern，那么就可以这样写：

```c
//file1.hpp
extern int i;

//file1.cpp
#include "file1.hpp"
int i = 20;
```

这里extern表示i的定义可以在其他文件中找到。所以我们可以在file1.cpp中给他一个定义。
使用extern关键字之后，后面必须是变量或者函数的声明，不能给出定义（所以这里的`extern int i`也不能赋值）。定义需要在其他的文件中给出。

可能你会有疑问：我以前写的时候也是头文件里面声明，实现文件里面定义的函数啊，不用加上extern关键字的:

```c
//file1.hpp
void print(string msg);

//file1.cpp
void print(string msg){
    cout<<msg<<endl;
}
```

的确是这样。但是如果你加上了extern关键字，你就可以在任意的实现文件里实现：

```c
//file2.cpp
void print(string msg){
    cout<<msg<<endl;
}
```

而不是局限于同名的实现文件。这是static不能够做到的。虽然static的范围也是所有包含他的文件，但是它的定义必须在和声明文件配套的实现文件中实现。

我们可以在各种库的源代码中看到这些写法，将函数的声明冠以extern关键字，然后在其他文件名称毫不相干的地方完善函数体。

### extern的第二种用法
你也可以通过`extern "C"`来说明下面的函数使用C语言的编译规则来编译。比如这样：

```c
extern "C"{
    void print();
    void Log();
}
```