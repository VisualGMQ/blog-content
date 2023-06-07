---
title: 《Linux/Unix系统编程手册》进程和程序
date: 2019-08-17 23:32:09
category:
- 操作系统
tags:
- Linux
---
# 进程和程序

首先要区分一下进程和程序

* 进程：进程是内核定义的抽象的实体，包含用以执行程序的各种资源
* 程序：程序是文件，里面存放的信息告诉内核如何创建一个进程

也就是说，程序其实和进程不是一个概念。程序是一个用以描述进程的文件，包括

* 二进制文件标识：描述进程的元信息，现在的Linux系统一般都是`ELF`格式
* 机器语言指令：也就是代码，将要存放在汇编语言中的`.text`段中
* 程序入口地址：也就是对应汇编中的`_start`标号地址
* 符号表和重定位表：描述函数和变量的位置和名称，将要存放于`.data .bbs`段中
* 共享库和动态链接信息：记录了链接库的信息
* 其他信息

<!--more-->

# 进程号和父进程号

使用

```c
pid_t getpid()
```

获得当前进程号，使用

```c
pid_t getppid()
```

获得当前进程的父进程号。

注意**这两个函数都一定会执行成功，总是返回0**



所有的进程都是由`init`进程（进程号为1）的父进程创建的。



# 进程的内存布局

当内核打开一个程序的时候，会自动创建一个进程，进程包含的内容其实在Unix汇编中以及提到过了：

* 文本段`.text`
* 初始化数据段`.data`
* 未初始化数据段`.bbs`
* 栈
* 堆：运行时动态为变量分配的内存空间

# 虚拟内存

虚拟内存会将程序使用的内存切割成小型的，固定大小的“页”。相应的会将RAM以页为单位分割。同一时刻只有部分内存放在页中，其他不用的内存放在**交换区**中（也就是磁盘上).这样就会导致程序使用的内存甚至超出了RAM的大小（多出的部分放在交换区中）。

# 栈和栈帧

函数调用和返回会在栈上新增加一个栈帧（里面存放着参数等信息），当函数调用完毕之后会将栈帧从栈上移除。

![栈帧](/images/栈帧.png)



# 命令行参数小技巧

我们都知道C语言里面有`argc, **argv`两个命令行参数，而且`argv[0]`总是程序的名称，这里有一个小技巧（也是`gzip,gunzip,zcat`使用的）：通过文件名称来让同一个程序执行不同的操作。

因为连接档运行之后`argv[0]`的名称也是连接档的，所以我们可以写类似下面的程序：

```c
#include <stdio.h>
void gzipfunc(){
    //...
}
void gunzipfunc(){
    //...
}
void zcatfunc(){
    //...
}

int main(int argc, char** argv){
    if(strcmp(argv[0], "gzip")==0)
        gzipfunc();
    else if(strcmp(argv[0], "gunzip")==0)
        gunzipfunc();
    else if(strcmp(argv[0], "zcat")==0)
        zcatfunc();
    return 0;
}
```

没错可以根据不同的名称执行不同的功能，但是最后其实都是一个程序哦，只不过其他的不同名的程序是连接档罢了。



# 环境列表

环境列表其实就是存储环境变量的列表啦。只不过里面的环境变量都是以**变量名=变量值**来定义的。

子进程会将父进程的环境列表拷贝一份，这也就是为什么终端需要一个`.bashrc .profile`这种文件来存放环境变量的原因了，通过终端打开的程序都会获得终端的环境列表的一份拷贝，这也是进程之间传递信息的一种方式。

## 从程序中访问环境列表

### 通过environ变量

C中提供了全局变量`environ`存储着本进程的环境列表,他是一个`char**`类型的，最后以`NULL`结尾的列表。

```c
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <errno.h> 
extern char** environ;

int main(int argc, char** argv){ 
    printf("10 environ variables in enviroment list:\n");
    for(;i<10&&environ[i]!=NULL;i++)
        printf("%s\n", environ[i]);
    return 0; 
}
```

结果：

```bash
10 environ variables in enviroment list:
PATH=/home/visualgmq/bin:/home/visualgmq/.local/bin:/usr/local/Trolltech/Qt-4.8.7/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
XDG_VTNR=7
MANPATH=/usr/local/Trolltech/Qt-4.8.7/man:
XDG_SESSION_ID=c1
CLUTTER_IM_MODULE=xim
XDG_GREETER_DATA_DIR=/var/lib/lightdm-data/visualgmq
SHELL=/usr/bin/zsh
QT_LINUX_ACCESSIBILITY_ALWAYS_ON=1
QTDIR=/usr/local/Trolltech/Qt-4.8.7
GTK_MODULES=gail:atk-bridge:unity-gtk-module
```

这里只输出了前10个环境变量。



或者通过增加`main`函数的参数来直接获得!

```C
int main(int argc, char** argv, char* envs[]){
  //...
}
```

![没想到吧!](/images/没想到吧表情包.gif)



### 通过函数获得或修改

#### 获得

可以通过`char *getenv(const char* name)`函数获得环境变量，参数是环境变量的名称，返回对应的值。

注意：

* 程序不应该修改此函数返回的值
* 允许使用静态分配的缓冲区返回结果

#### 修改

通过

```c
int putenv(char* string)	//失败返回0
int setenv(const char* env, const char* value, int overwrite)	//失败返回-1
```

来修改环境变量

`putenv()`通过写入`name=value`形式来创建变量。如果变量存在会覆盖。

需要注意的是，函数不会拷贝参数，也就是说string参数后续改变会影响到环境变量，所以不应该是使用在栈上分配的字符串数组作为参数（一旦被改变会引起逻辑错误）。



`setenv()`不需要在`env,value`参数之间加上`=`，通过`overwrite`参数指定如果变量存在是否覆盖（0不覆盖，非0覆盖）



#### 清除

使用

```c
int clearenv();
```

函数即可，其实内部就是`environ=NULL`语句。



# 非局部跳转

> 需要引用setjmp.h

非局部跳转就是从一个函数跳到另一个函数。其实在函数内部跳转已经有`goto`语句了。同goto语句一样，非局部跳转语句不提倡被使用（其实我自从离开了C语言教程之后还真没见过代码里面有goto的。。。）



执行非局部跳转的话，首先你得有一个变量来保存跳转之前的状态，方便跳转之后返回原点，这个变量的类型是`jmp_buf`。

然后需要跳转函数，`int setjmp(jmp_buf env)`函数将env传入进去保存当前的程序信息，以便于跳转。`int longjmmp(jmp_buf env, int val)`函数会依据env参数保存的信息跳转回去，并且让对应的`setjmp`函数返回`val`值。



这里尤其需要注意一下`setjmp`函数的返回值。当你使用`setjmp`函数之后如果返回0代表成功了，然后此时的程序信息保存在env变量中。接下来如果你执行了`longjmp(env, value)`函数，那么会跳转回`setjmp`函数处，兵器`setjmp`函数会**再次返回**，返回值为`longjmp`指定的value。

也就是说，value参数其实是为了方便程序员从`setjmp`函数处判断是哪个函数跳转回来的。

例子:

```c
#include <stdio.h>
#include <unistd.h>
#include <setjmp.h>

jmp_buf env;

void f2(){
    longjmp(env, 2);    //跳回17行
}

void f1(){
    longjmp(env, 1);    //跳回17行
    f2(); 
}

int main(int argc, char** argv){
    int ret = setjmp(env);
    switch(ret){
        case 0:
            printf("called setjmp()\n");
            f1();
            break;
        case 1:
            printf("jumped to f1()\n");
            break;
        case 2:
            printf("jumped to f2()\n");
            break;
    }
    return 0;
}
```

这里首先调用了`setjmp`然后对返回值判断，第一次`setjmp`返回0代表成功了，那么我们就进入`case 0`调用`f1()`函数。在`f1()`函数中执行了`longjmp()`函数跳转回`setjmp`处，这个时候`setjmp`会返回1,于是输出`jumped to f1()`。由于`f2()`的调用在`longjmp`下面，所以函数跳转回去并没有执行`f2()`

```bash
called setjmp()
jumped to f1()
```

















