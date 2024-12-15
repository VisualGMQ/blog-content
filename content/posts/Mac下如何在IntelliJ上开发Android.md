---
title: Mac下如何在IntelliJ上开发Android
date: 2020-09-30 19:02:09
category:
- 杂项
---

这里介绍如何在Mac下使用IntelliJ来开发Adnroid程序。因为自己已经安装了IDEA了，所以就不打算再安装Android Studio了。

<!--more-->

# 第一步：下载安卓的SDK（使用sdkmanager）

要想开发安卓程序，必须首先下载安装安卓的SDK。这里我选择使用`sdkmanager`来安装。

## 下载sdkmanager

首先到[这个网站](https://www.androiddevtools.cn/)去下载（是国内的镜像网站，会快很多）。

下载好之后解压出tools文件夹，放到你喜欢的地方，并且将环境变量`PATH`设置为tools文件夹的根目录和`/bin`目录，其中bin目录下面就有我们的sdkmanager.

## 安装安卓SDK和其它工具

现在可以使用`sdkmanager`来安装安卓工具了。首先使用`sdkmanager --list`来查看现在可以安装的工具:

![sdkmanager --list](https://s2.ax1x.com/2020/02/19/3EVNGV.png)

这里`Installed packages`代表你已经安装的工具或SDK，`Avaliable Packages`代表可以安装 的工具。

如果你只是使用IDEA+Java/Kotlin开发的话，那么只安装SDK就可以了，向下拉会看到以`platforms`打头的包：

```
platforms;android-10              | 2            | Android SDK Platform 10
platforms;android-11              | 2            | Android SDK Platform 11
platforms;android-12              | 3            | Android SDK Platform 12
platforms;android-13              | 1            | Android SDK Platform 13
platforms;android-14              | 4            | Android SDK Platform 14
platforms;android-15              | 5            | Android SDK Platform 15
platforms;android-16              | 5            | Android SDK Platform 16
platforms;android-17              | 3            | Android SDK Platform 17
platforms;android-18              | 3            | Android SDK Platform 18
platforms;android-19              | 4            | Android SDK Platform 19
platforms;android-20              | 2            | Android SDK Platform 20
platforms;android-21              | 2            | Android SDK Platform 21
platforms;android-22              | 2            | Android SDK Platform 22
platforms;android-23              | 3            | Android SDK Platform 23
```

差不多这样的，就是代表Android的SDK版本（每一个系统对应一个SDK），想要安装的话直接`sdkmanager "platforms;android-17"`即可（注意这里的双引号不能少，包名替换成你自己想要的包名）。然后sdkmanager就会帮你自动安装了。

如果你想要使用`C++`的话还需要安装ndk，自己在`sdkmanager --list`里面找就行了。

# 第二步：在IDEA中导入安卓配置

首先打开IDEA，在欢迎界面点这个：

![IDEA配置](https://s2.ax1x.com/2020/02/19/3EZ5lT.png)

然后就会进入这个界面，点击左侧菜单栏的SDKs，然后点击`+`创建一个Android SDK配置：

![配置](https://s2.ax1x.com/2020/02/19/3Ee9ne.png)

这个时候会弹出一个对话框让你选择SDK的位置。SDK是安装在`tools`同名的文件夹下，在`platform`里面。但是我们要选择tools和platforms所在文件夹，这样IDEA会自动找到这个文件夹下的所有SDK和sdkmanager，方便以后自动配置:

![SDK选择](https://s2.ax1x.com/2020/02/19/3EejEj.md.png)

然后你就可以选择你的SDK进行开发了：

![选择SDK](https://s2.ax1x.com/2020/02/19/3EmZ5R.png)

选好点击OK完成配置。

# 第三步：开发安卓应用

这个时候再点击IDEA的`create new project`，并且选择`Android`即可开始开发。

创建工程之后，在第一次配置可能会遇到这种错误：

```
ERROR: The newly created daemon process has a different context than expected.
Java home is different.
Expecting: '/Applications/IntelliJ IDEA CE.app/Contents/jdk/Contents/Home' but was: '/Library/Java/JavaVirtualMachines/jdk1.8.0_152.jdk/Contents/Home'.
Please configure the JDK to match the expected one.
Open JDK Settings
```

解决办法是关掉这个工程，然后再IDEA欢迎界面点击`Import Project`来导入你的安卓工程，在导入的时候会让你选择gradle，一定点击`Use default gradle wrapper`，然后OK即可：

![reload project](https://s2.ax1x.com/2020/02/19/3EuUu8.png)

# 第四步安装安卓模拟器

到了这一步之后会发现没有办法转安卓模拟器。这个时候你需要安装插件`genymotion`，只需要在**Reference->Plugin**里面查找并安装即可。安装完毕后就可以创建和使用安卓模拟器了
