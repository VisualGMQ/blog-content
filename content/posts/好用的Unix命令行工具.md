---
title: 好用的Unix命令行工具(持续更新)
date: 2019-10-10 22:47:09
category:
- 杂项
---
这里记录了各种好用的Linux命令
<!--more-->
# convert
convert工具可以转换图像的格式，包括很多的图像格式（PG, BMP, PCX, GIF, PNG, TIFF, XPM和XWD等）

使用的方法很简单：
```bash
convert src.xxx dst.xxx
```
就可以将src.xxx转化为dst.xxx了，比如`convert image.jpg image.png`将image图像转化从jpg转化为png格式。

在你使用libpng等库的时候，可能会出现这个警告：
```bash
libpng warning: iCCP: known incorrect sRGB profile
```
这个是因为你的图片里面有一些格式不对，这个时候你可以`convert image.png image.png`来将格式整理为最规范的。就不会报警告啦。

这个命令甚至还可以旋转，缩放图像：
```bash
convert -resize 1024x768  xxx.jpg   xxx1.jpg    //改变成1024x768
convert -sample 50%x50%  xxx.jpg  xxx1.jpg      //缩小为原来的一半
convert -rotate 270 sky.jpg sky-final.jpg       //旋转270度
```

有了这个再也不用打开软件去转换图片了，直接一个命令搞定全部。

## 参考

[Linux之convert命令](https://www.iteye.com/blog/zlb1986-778054)

# tmux

这个工具可以让一个窗口开启多个会话。

简单来说就是，当你使用终端的时候，如果有程序在执行的时候关闭终端，那么这个程序也会被关闭。但是使用tmux可以讲程序和会话分离，即使终端窗口关闭了也可以保证程序不关闭。

## 参考

[阮一峰大神的介绍](http://www.ruanyifeng.com/blog/2019/10/tmux.html)

# musikbox

使用ncursors库做界面的，CUI的音乐播放器。在没有GUI界面的Linux系统上十分好用，得劲的一批:

![github官方图片](https://raw.githubusercontent.com/clangen/clangen-projects-static/master/musikcube/screenshots/osx.png)

github地址：[github地址](https://github.com/clangen/musikcube)

