---
title: OpenGL-关于创建窗口的解释
date: 2019-07-28 10:59:39
category:
- game development
tags:
- OpenGL
---
我们首先需要明白，OpenGL这个玩意只管一件事，就是画图，除了画图之外这玩意什么都不管。包括创建窗口，事件响应，甚至包括图像的旋转和平移什么的都不会去管，他只会画图。
那么问题就来了，我们Hello world里面的窗口是哪里来的呢？
<!--more-->
先来看看Hello world里面的代码：
```c++
#include <iostream>
#include <glad/glad.h>
#include <GLFW/glfw3.h>
using namespace std;

int main(int argc, const char * argv[]) {
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
    
    GLFWwindow* window = glfwCreateWindow(400, 400, "Hello World", nullptr, nullptr);
    if(window == nullptr){
        glfwTerminate();
        cout<<"window create failed"<<endl;
    }
    glfwMakeContextCurrent(window);
    
    if(!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)){
        cout<<"glad load failed"<<endl;
    }
    glViewport(0, 0, 400, 400);
    
    while(!glfwWindowShouldClose(window)){
        glClearColor(0.2f, 0.3f, 0.3f, 0.1f);
        glClear(GL_COLOR_BUFFER_BIT);
        
        glfwSwapBuffers(window);
        glfwPollEvents();
    }
    
    glfwTerminate();
    return 0;
}
```
这些代码只是创建了一个空白的窗口（我没有把自适应窗体大小的代码贴上去，那个在这里不重要）。其实这里面的OpenGL函数只有如下几个：
* `glViewport()`
* `glClearColor()`
* `glClear()`

没错只有三个，那么你看到的这么多代码是做什么的呢？这些其他的代码，除了
```c++
if(!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)){
        cout<<"glad load failed"<<endl;
    }
```
这几行是glad库用于找到OpenGL函数的函数入口之外，其他的所有代码都是glfw库用来配置OpenGL环境和产生一个供OpenGL绘图的窗口的。所以我说OpenGL这个玩意只会画图，窗口什么的是glfw来做的。也就是说glfw其实不是OpenGL函数库里面的东西。他其实是一个GUI库。

但是一到绘图部分，就完全是OpenGL的函数了，包括清除屏幕的`glClearColor()`,`glClear()`函数都是OpenGL函数。

所以这一部分还是很迷惑人的。如果你使用SDL为OpenGL产生一个窗口的话，一样需要先配置OpenGL（指定版本号），然后创建一个兼容OpenGL的窗口，然后所有的绘图都交给OpenGL来处理。

所以说，OpenGL这个玩意其实不能单独使用，它必须有一个GUI库或者游戏引擎的支持才可以发挥它的实力（不然哪有地方给他绘图呢？）

**注意：在使用gladLoadGLLoader之前你必须通过glfwMakeContextCurrent函数指定窗口。不然galdLoadGLLoader函数会返回错误。**