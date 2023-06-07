---
title: 在Android中嵌入SDL2
date: 2021-11-19 11:52:09
category:
- 杂项
tags:
- SDL2
---

这里说一下如何将SDL编译为App。参考文档是SDL源码下的`docs/README-android.md`。

## 前期准备

需要准备：

* android sdk工具和ndk工具
* JDK8（更高的应该也可以）
* SDL2的源代码（这里使用的是SDL2\_2.0.14版本）
* make，CMake（如果你用的Android Studio或者Gradle就不需要CMake和make）
* Gradle（最新版本就行，我这里是7.2）

<!--more-->

### Android SDK和NDK工具的配置

不会的看[这里](https://visualgmq.gitee.io/2020/09/30/Mac%E4%B8%8B%E5%A6%82%E4%BD%95%E5%9C%A8IntelliJ%E4%B8%8A%E5%BC%80%E5%8F%91Android/)。  
最近MacOS上好像不能用sdk-manager了，直接下载SDK和NDK解压，然后设置环境变量就行了。  

要求 SDK >= 26, NDK >= r15c

要设置如下四个环境变量：

```bash
> echo $ANDROID_NDK_HOME $ANDROID_NDK_ROOT $ANDROID_SDK_ROOT $ANDROID_HOME

/Users/visualgmq/Library/Android/sdk/ndk/21.0.6113669/
/Users/visualgmq/Library/Android/sdk/ndk/
/Users/visualgmq/Library/Android/sdk/
/Users/visualgmq/Library/Android/sdk/
```

再给出目录结构，按照这个配就行了，用sdk-manager安装更方便：

``` text
sdk
 |
 |-- android-ndk-r20b
 |-- ndk
 |    |-- 21.0.6113669
 |-- platform-tools
 |-- build-tools
 |    |-- 27.0.3
 |-- tools
 |
 ...
```

## 配置安卓工程

### 使用SDL自己的脚本自动生成

进入SDL源码下的`build-scripts/`，里面有个`androidbuild.sh`。执行这个文件就可以帮你自动生成工程了。  
这个文件有两个执行方法：  

```bash
androidbuild.sh com.yourcompany.yourapp < sources.list
androidbuild.sh com.yourcompany.yourapp source1.c source2.c ...sourceN.c
```

第一个参数是你的包签名。后面的参数是你的源文件（你也可以将文件名称写在sources.list中然后用第一条命令给他）。  
源文件我建议将头文件和源文件都给他，不然它会找不到头文件。

执行结果：

```bash
> ./androidbuild.sh com.visualgmq.test ../mysrc/main.c
To build and install to a device for testing, run the following:
cd /Users/visualgmq/Documents/program/playground/SDL2-2.0.14/build/com.visualgmq.test
./gradlew installDebug
```

它会给你提示，说在`../build/`下面已经生成了`com.visualgmq.test`工程了，进去后`./gradlw installDebug`就可以了。  
这里的gradlw命令会编译之后直接真机运行，如果你只是想编译打包成APK，那么请使用`gradlw build`。

### 手动配置工程

自动生成的方法只有拥有Bash环境才能执行，Windows下不行。而且我们也需要搞清楚到底发生了什么，以便于更好地自定义工程。  

1. 首先将SDL源码根目录下的`android-project`目录拷贝出来，这个就是你的Android工程目录（可以随意改名）。
2. 然后将SDL源码link到Android工程目录下的`app/jni`目录下，或者直接将SDL源码下的`include`,`src`,`Android.mk`文件拷贝到`app/jni/SDL`目录下。

这是基本配置，然后你要根据使不使用CMake来进行配置:

#### 不使用CMake的工程

1. 打开`app/jni/src/Android.mk`

    ```makefile
    LOCAL_PATH := $(call my-dir)

    include $(CLEAR_VARS)

    LOCAL_MODULE := main

    SDL_PATH := ../SDL

    LOCAL_C_INCLUDES := $(LOCAL_PATH)/$(SDL_PATH)/include

    # Add your application source files here...
    LOCAL_SRC_FILES := YourSourceHere.c

    LOCAL_SHARED_LIBRARIES := SDL2

    LOCAL_LDLIBS := -lGLESv1_CM -lGLESv2 -llog

    include $(BUILD_SHARED_LIBRARY)
    ```

    将`SDL_PATH := ../SDL`修正为你刚刚link的SDL源码目录。
2. 增加你的源文件和头文件：`Android.mk`中的`LOCAL_SRC_FILES`变量就是你的源文件名称。这里改成你自己的源文件。头文件的搜索目录要加到`LOCAL_C_INCLUDES`中。  
   注意源文件要放在`app/jni/src`目录下。

#### 使用CMake的工程

1. 打开`app/build.gradle`，将里面的`ndkBuild`部分注掉(20~24行，43~45行)，然后将`cmake`部分解注(25~30行，46~48行)。
2. 编辑`app/jni/CMakeLists.txt`来适配你的工程。这里有一些注意点：
    * 注意11行`add_subdirectory(SDL)`指定了你刚刚link或copy过来的SDL源码目录，要改成一样的名字。
    * 你真正的工程CMakeLists在`app/jni/src`下。

## 编译工程，生成APK，真机调试

如果你使用Android Studio，那你直接用AS打开工程就可以了。  
如果你用的gradle，那：  

```bash
gradlw build # 编译工程并生成APK
gradlw clean # 清理工程
gradlw installDebug   # 编译生成APK，然后将Debug APK真机调试
gradlw installRelease # 编译生成APK，然后将Release APK真机调试
```

## 其他对工程的DIY

### 自定义App名称和包名

1. 将`app/src/main/AndroidManifest.xml`中的`package="org.libsdl.app"`一行设置为你自己的包名。
2. 然后在`app/src`下创建一个和包名一样的路径以及一个java文件（例如`com/gamemaker/game/MyGame.java`)
3. 在`MyGame.java`中增加如下内容：

    ```java
    package com.gamemaker.game;
    
    import org.libsdl.app.SDLActivity;
    
    /**
     * A sample wrapper class that just calls SDLActivity
     */ 
    
    public class MyGame extends SDLActivity { }
    ```

4. 改`AndroidManifest.xml`中的`<activity android:name="SDLActivity"`中的`SDLActivity`改为你的类名（这里是`MyGame`）。

### 更改App的图标

替换`app/src/main/res`下所有文件夹中的`ic_launcher.png`就可以了。

### 使用STL

如果你要使用C++ STL，在`app/jni/Application.mk`中解注`APP_STL := c++_shared`一行。

## 编码的注意事项

### 资源加载

在`app/src/main/assets`文件夹下的东西会被视为资源一并打包到APK中。可以使用`SDL_rwops.h`中声明的函数来读取。

### 暂停App

如果你设置了`SDL_HINT_ANDROID_BLOCK_ON_PAUSE`Hint，这样当App暂停时事件循环也会自动暂停。  
当App继续执行时，SDL将尝试自动恢复GL上下文。 在现代设备(Android 3.0及以上)中，这将最有可能获得成功。但是在一些老设备上会失败。

### 窗口的创建和大小

创建窗口的正确姿势：

```c++
SDL_CreateWindowAndRenderer(0, 0, 0, &window, &render);

// 或者

SDL_CreateWindow("", 0, 0, 0, 0, SDL_WINDOW_SHOWN);
```

总之你不应该给窗口标题和大小。窗口的大小是由你的设备屏幕决定的，你应当在窗口创建成功后使用`SDL_GetWindowSize()`来获得大小。

### 退出程序的正确姿势

1. 在`main`函数中返回。
2. 可能有什么操作导致你的程序要关闭，这个时候会发送一个`SDL_QUIT`事件给你。

注：**不要使用exit()函数退出！这不是合法的退出方法。**

### 设置横屏

App默认是竖屏显示，使用`SDL_SetHint(SDL_HINT_ORIENTATIONS, "LandscapeLeft LandscapeRight")`即可横屏显示。

## 加载第三方库

**这里只说明如何通过CMake加载。**  

打开`app/jni/CMakeLists.txt`，可以发现他已经给我们写好了：  

```cmake
# Compilation of companion libraries
# add_subdirectory(SDL_image)
# add_subdirectory(SDL_mixer)
# add_subdirectory(SDL_ttf)
```

意思就是说你要用什么库，就将这些库的源代码放在`app/jni`下，然后对相应的行解注（放置方法就和SDL一样，你也可以link过来）。  
需要注意的是，第三方库的代码请从github上的`sdl-org`用户下进行下载，那个是SDL最新的代码。在`liblsdl.org/projects/`下下载的代码中有些不包含`CMakeLists.txt`。

<!-- ## 加载第三方库 -->

<!--
```makefile
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := main

SDL_PATH := ../SDL
SDL_image_PATH := ../SDL_image

LOCAL_C_INCLUDES := $(LOCAL_PATH)/$(SDL_PATH)/include $(LOCAL_PATH)/$(SDL_image_PATH)

# Add your application source files here...
LOCAL_SRC_FILES := main.cpp

LOCAL_SHARED_LIBRARIES := SDL2 SDL2_image

LOCAL_LDLIBS := -lGLESv1_CM -lGLESv2 -llog

include $(BUILD_SHARED_LIBRARY)
```
-->
