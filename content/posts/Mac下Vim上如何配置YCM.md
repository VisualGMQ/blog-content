---
title: Mac下在Vim上配置YCM
date: 2020-05-25 12:56:55
category:
- vim
---

这里说明如何在Mac下配置YouCompleteMe插件（Linux上应该也一样的）

<!--more-->

在安装YCM之前确保你的电脑有`Cmake`，`make`,`npm`，`python`和C/C++编译工具。

首先下载插件，随便你是手动下载还是使用插件管理器。我这里使用的Vundle下载，在vimrc中加入如下行并运行`PlugInstall`：

```vimscript
Plugin 'ycm-core/YouCompleteMe'
```

等待下载，下载完成之后，进入YouCompleteMe的文件夹（一般在`~/.vim/bundle/youcompleteme`下），运行

```bash
python3 ./install --all
```

这里`--all`是安装所有的语言补支持p，具体有`C/C++`,`Java`,`Rush`,`JavaScript`等。如果你想装几种语言支持，请看[文档](https://github.com/ycm-core/YouCompleteMe#macos)。

运行之后可能会提示你缺少仓库，根据提示在终端输入：

```bash
git submodule update --init --recursive
```

它会帮你把子模块全部下载，耐心等待即可。

下载安装之后，再次运行

```bash
python3 ./install --all
```

这个时候会有第一个坑：他可能不能够将所有的子模块都下载下来！我这里是没有下载`cregex`库，所以我在运行的时候，他总是在编译ycmd的时候告诉我`cregex`库没有CMakeLists.txt文件。

解决办法是到`third_party/ycmd/third_party/`下去一个一个检查模块。每个模块放在不同的文件夹下，进去看看文件夹里面有没有文件。我这里就是只有cregex文件夹，然后文件夹里面没有文件。。。

找到空文件夹之后就可以将模块手动下载进来了，这里可以通过git来找到模块的github地址，比如cregex模块，先进入cregex文件夹，然后

```bash
git remote -v
```

就可以看到结果了：

```bash
origin	https://github.com/ycm-core/regex.git (fetch)
origin	https://github.com/ycm-core/regex.git (push)
```

可以看到`https://github.com/ycm-core/regex.git`是其github仓库。

等到你的所有子模块都OK的时候，就可以再次运行`python3 ./install.py --all`了，然后他又会下载文件，耐心等待即可。

全部安装完成之后你就可以开始使用自动补全了。