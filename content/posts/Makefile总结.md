---
title: Makefile总结
date: 2019-08-13 14:24:09
category:
- 构建工具
tags:
- Cmake&make

---

这是学习Makefile的总结

<!--more-->

# 目标

Makefile的目标名称不是随便取的：

```makefile
exe:main.o
    g++ main.o -std=c++11
main.o:defs.h
.PHONY:clean
clean:
    -rm *.o exe
```

这里如果你第二个目标不是`main.o`的话，那么后面是没有办法自动推导出`main.cpp`和`g++ -c main.cpp`这种的。

make总是执行第一个目标，然后根据依赖来执行其他目标。

# 伪目标

伪目标跟在`.PHONY`后面，用于执行一些指令：

```makefile
.PHONY:clean
clean: 
    -rm *.o exe
```

.PHONY后面也可以是多个伪目标，伪目标也可以有依赖项：

```makefile
main:main.o
    g++ main.o -o main -std=c++11
exe:exe.o
    g++ exe.o -o exe -std=c++11
main.o:
exe.o:
.PHONY:clean all
clean:
    -rm *.o exe
all:main exe
```

这样执行`make all`的话会制动执行main和exe目标

# 变量

变量用`=`声明，用`:=`附加数据，用`${}`使用：

```makefile
OBJ=main.o
OBJ:=exe.o #现在是main.o exe.o
SRC=main exe
main:main.o
    g++ main.o -o main -std=c++11
exe:exe.o
    g++ exe.o -o exe -std=c++11
main.o:
exe.o:
.PHONY:clean all
clean:
    -rm *.o exe
all:${SRC}
```

变量会在指定的地方准确的展开。

# 带第三方库的编译

一般我们可以这样写：

```makefile
main:main.cpp
    g++ main.cpp -o main `wx-config --libs --cflags` -std=c++11
.PHONY:clean
clean:
    -rm main
```

这是没有办法写成自动推导的，最多写成这样：

```makefile
drawShape:drawShape.o 
    g++ drawShape.o -o drawShape `wx-config --libs` -std=c++11
drawShape.o:
    g++ drawShape.cpp -c `wx-config --cflags` -std=c++11
.PHONY:clean
clean:
    -rm drawShape *.o
```

这里我们必须通过直接写出编译指令来找到头文件。所以这里就不能用自动推导了。
