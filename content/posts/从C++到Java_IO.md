---
title: 从C++到Java:IO
date: 2020-08-05 19:02:09
category:
- language
tags:
- Java
---

这里记录了Java文件IO和控制台IO的使用方法。

<!--more-->

# IO类图

IO分为两种：字节流和字符流。字节流就是每次读取以字节为单位。字符流就是每次读取都以字符为单位。

## 字节流

![InputStream](https://img-blog.csdn.net/20150714211311360?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

![outputstream](https://img-blog.csdn.net/20150714211402139?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

所有的字节流IO的父类都是`InputStream`和`OutputStream`。

## 字符流

![Reader](https://img-blog.csdn.net/20150714212939572?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

![Writer](https://img-blog.csdn.net/20150714212915569?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

所有的字符流的IO的基类全都是`Reader`和`Writer`。

# 将IO流应用于控制台输入输出

## 输入

对于`InputStream`，其最重要的接口方法就是`read()`，那么我们可以这样写：

```java
InputStream stream = new DataInputStream(System.in);
int a = 0;
try {
  while ((a = stream.read()) != -1) {
    System.out.print((char) a);
  }
} catch (IOException e) {
  e.printStackTrace();
}
```

`read()`方法会返回当前读取的数据长度（0~255），没有数据返回-1.

## 输出

输出的话我们有`System.out.print()`系列函数。

# 将IO流用于文件

## File类

首先我们需要有一个描述文件的类，就像C/C++文件句柄一样。`File`类就是这样一个类。可以给它一个路径来创建一个文件句柄:

```java
File file = new File("~/Documents/program");
```

但是这个类不会自己判断文件或者文件夹是否存在，你可以使用`exists()`函数判断。它还有很多其他实用的函数，比如`getAbsolutePath()`得到给定的路径的绝对路径，或者调用`createNewFile()`或者`mkdir()`来创建位于此路径的文件和文件夹。

## 文件IO

有了File类，我们再对照上面的图，可以看到我们可以使用`FileInputStream`类对文件读，`FileOutputStream`对文件写：

```java
File file = new File("./test.txt");
        if (!file.exists())
            try {
                file.createNewFile();
            } catch (Exception e) {
                e.printStackTrace();
            }
        try {
            OutputStream ostream = new FileOutputStream(file);
            char[] b = { 'h', 'e', 'l', 'l', 'o' };
            for (char c : b)
                ostream.write((int) c);
        } catch (Exception e) {
            e.printStackTrace();
        }
        try {
            InputStream istream = new FileInputStream(file);
            int i = 0;
            while ((i = istream.read()) != -1)
                System.out.println((char) i);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
```

这里先写文件再读文件。



或者你也可以使用字节流，用法都一样，只不过换一个类：

```java
File file = new File("./test.txt");
if (!file.exists())
  try {
    file.createNewFile();
  } catch (Exception e) {
    e.printStackTrace();
  }
try {
  OutputStreamWriter ostream = new FileWriter(file);
  ostream.write("hello");
  ostream.flush();	//这里使用flush表示立刻写入，不然可能再下面读取的时候还没有写入。
} catch (Exception e) {
  e.printStackTrace();
}
try {
  InputStreamReader istream = new FileReader(file);
  char[] buffer = new char[10];
  istream.read(buffer, 0, 10);
  System.out.println(buffer);
} catch (Exception e) {
  e.printStackTrace();
}
```







