---
title: C/C++对结构体的读写以及操纵内存
date: 2019-07-28 16:01:01
category:
- language
tags:
- cpp
---
这里我们来说一下C/C++如何对结构体进行读写。

我尝试了一下，发现C++自带的FIO好像没有办法做到（也可能是我自己没有找到办法），但是C语言的函数是可以做到的。那么也就意味着C++可以做到了。
<!--more-->
我们首先定义一个结构体：

```c
struct member{
    int a;
    int b;
};

struct data{
    member m1;
    member m2;
    string name;
};
```

如你所见，其中的data结构体就是我们要读写的结构体。接下来我们通过C语言的文件读写来将其写入到data.mem文件中

```c
#include <iostream>
#include <cstdio>
#include <string>
#include "header.hpp"
using namespace std;

int main(int argc,char** argv){
    FILE* file = fopen("data.mem", "wb+");
    if(file == nullptr){
        cout<<"file can't open"<<endl;
        return -1;
    }
    data d;
    d.m1.a=10;
    d.m1.b=20;
    d.m2.a=30;
    d.m2.b=40;
    d.name="VisualGMQ";
    fwrite(&d, sizeof(d), 1, file);
    rewind(file);
    fclose(file);
    return 0;
}
```

其中第8行打开了data.mem文件，然后第19行使用`fwrite`函数进行写入。`fwrite`函数可以直接将任何数据(void*)类型写入文件中。很好很强大。
第9行使用rewind()来保证写入操作执行了。最后关闭文件。

当然，由于我们写入的是二进制数据，所以你打开data.mem也只能看到一些乱码。接下来我们就使用fread函数来直接读取：

```c
#include <iostream>
#include <cstdio>
#include <cstring>
#include "header.hpp"
using namespace std;

int main(int argc,char** argv){
    FILE* file = fopen("data.mem", "rb+");
    if(file == nullptr){
        cout<<"file not open"<<endl;
        return -2;
    }
    data d;
    fread(&d, sizeof(d), 1, file);
    cout<<"read suuccessful"<<endl
            <<"data.m1:"<<endl
            <<"a:"<<d.m1.a<<endl
            <<"b:"<<d.m1.b<<endl
        <<"data.m2"<<endl
        <<"a:"<<d.m2.a<<endl
        <<"b:"<<d.m2.b<<endl
        <<"name:"<<d.name<<endl;
    fclose(file);
    return 0;
}
```

这里和上面不一样的地方就是使用了`fread`函数读取，这个函数也是可以读取任意类型（void*）的。

最后我们来看一下如何对内存进行操作。很简单，我们尝试通过内存拷贝直接将d变量的第一个成员m1拷贝到m中，你可以通过`memcpy`函数实现拷贝：

```c
member m;
memcpy(&m, &d, sizeof(member));
cout<<"strong cast successful"<<endl
        <<"m.a:"<<m.a<<endl
        <<"m.b:"<<m.b<<endl;
```

这样就是直接对内存进行操作了。你可以将内存中的任意数据通过`memset`,`memcpy`等内存操作函数直接操纵。这就是C/C++厉害的地方。