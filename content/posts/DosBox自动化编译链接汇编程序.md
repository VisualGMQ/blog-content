---
title: DosBox内自动化编译链接汇编程序
date: 2019-08-09 00:30:50
category:
- language
---

无论是在Mac下还是Windows下，在DosBox里（或者cmd）将汇编程序变为exe文件总是要先masm和link，而这两个工具总是要用户自己输入文件名称。什么？你说windows下可以用Makefile？我知道，但是如果是像我这样的Mac用户在DosBox里面生成的话会很麻烦（最重要的是DosBox里面不支持make命令。。。）。所以这里提出一个方法来自动化生成。
<!--more-->

## 自动化生成

虽然DosBox下没有make工具，但是有批处理程序啊。我们可以使用批处理程序来自动化构建，比如我现在想要构建`./codes/new/hello.asm`，那么我们可以这样做：

```bash
::写在make.bat文件下
masm codes\new\hello.asm codes\new\build\hello.obj;
link codes\new\build\hello.obj;
copy hello.exe codes\new\build\hello.exe
delete hello.exe
cls
```

第一行通过使用masm来得到hello.obj文件。

第二行通过link命令链接hello.obj文件，需要注意的是，这个时候生成的hello.exe在当前目录下。你问我为什么不像masm一样直接给出输出文件？我也想，但是link这个程序既不像masm一样的格式指定输出文件，也没有-o这样的指令，最蛋疼的是连帮助文档都没有（如果你输入`masm -h`可以看到其帮助文档）。所以只有先生成在当前目录下了。

第三行通过copy函数将当前目录的hello.exe文件拷贝到你指定的目的地下，第四行再删除当前目录的hello.exe文件。你问我为什么不直接使用`move`指令？我不知道你们的DosBox有没有，反正我的DosBox里面没有这个指令。。。

最后一行清屏，你要是不想也可以去掉这一行

因为批处理文件会首先将要执行的命令输出出来，然后再执行，这样显得文本很乱。你可以在开头使用`@echo off`命令关闭命令输出：

```bash
@echo off
echo "start compil"
masm codes\new\hello.asm codes\new\build\hello.obj;
echo "start link"
link codes\new\build\hello.obj;
copy hello.exe codes\new\build\hello.exe
delete hello.exe
```

这里不要用中文，会出现乱码。



## 自动化删除

有了make程序怎么能没有clean程序呢！假设我们所有的代码都放在`./codes/build/`目录下，那么我们可以这样写：

```bash
::放在clean.bat中
delete codes\new\build\*.* 
```

注意这里最后必须是`*.*`，和Unix系统不一样。



## 更进一步的make.bat

我们还可以使用变量到make.bat中：

```bash
::这是注释
@echo off
set SRC_PATH=codes\new	::set来设置变量的值
set BUILD_PATH=codes\new\build
echo "start compile"
masm %SRC_PATH%\hello.asm %BUILD_PATH%\hello.obj;	::通过%varname%来使用变量
echo "start link"
link %BUILD_PATH%\hello.obj;
copy hello.exe %BUILD_PATH%\hello.exe
delete hello.exe
```

这样就可以防止重复修改编译和生成路径了