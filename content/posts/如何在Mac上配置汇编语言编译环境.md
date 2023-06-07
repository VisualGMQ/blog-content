---
title: 如何在Mac上配置汇编语言编译环境
date: 2019-08-09 00:08:58
category:
- language
---

《汇编语言》书上使用的方法是在windows下的命令行执行`masm`和`link`等工具，但是Mac上并没有这些工具。所以这里我们只能自己想办法了。
<!--more-->
## 下载工具

首先我们需要下载工具，首先需要下载DosBox，这个各个平台都有版本，网址在[这里](https://www.dosbox.com/download.php?main=1)。

然后需要下载哪些要用到的工具（包括masm，link，debug等）。有人说，Mac下不是有`nasm`工具可以直接使用吗？没错，但是nasm的使用方式和需要的语法和masm有些地方不一样，对于像我这种初次学习汇编的人来说还是老老实实选择masm吧。网上这些工具比较难找，我这里所有工具都放在[百度网盘](https://pan.baidu.com/s/1G7MyjnZddRcX5x3r8U1vjw)了。链接失效了请发邮件(2142587070@qq.com)给我，我会及时补在这个链接里的。

## 使用工具

下载完DosBox并安装之后，你应该有了这样一个图标：

![DosBox](/images/DosBox.png)

然后将汇编工具解压到一个目录下，比如`~/Documents/program/asmtools/`下

然后打开DosBox，输入下面这个命令来将你的路径挂载到c盘：

```bash
MOUNT c ~/Documents/program/asmtools/
```

然后将路径切到c盘（后面就和windows下的命令提示符一样操作了）：

```bash
c:
```

输入`dir`命令，回车之后就可以看到那些工具了。

## 编译和链接一个汇编代码

注意：**DosBox只能识别名称长度小于等于8的文件（后缀不算），如果大于其文件名称会有所改动。**

接下来编译和链接一个汇编代码吧，首先输入`masm`来打开masm程序，然后根据提示输入你的.asm文件，要输出的.obj文件等：

![masm](/images/masm.png)

注意在DosBox下路径分隔符是`\`而不是`/`

然后再使用`link`命令链接成exe文件：

![link](/images/link.png)

这样你就可以在`./codes/new/`文件夹下看见hello.exe文件了。

***

## 参考文献

[百度经验](https://jingyan.baidu.com/article/4e5b3e1914d4dc91901e2434.html)