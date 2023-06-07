---
title: SDL2-事件
date: 2019-07-28 00:47:10
category:
- game development
tags:
- SDL2
---
窗体是通过事件驱动的。掌握了事件就可以掌握窗体等的行动。SDL2的事件结构体为SDL_Event.
<!--more-->
***
SDL2的事件处理过程是这样的:
* 首先定义SDL_Event结构体，所有关于事件的信息都存储在这个结构体里面
* 在循环中使用PollEvent或者PeekEvent()函数来获得事件
* 判断结构体的type成员，看他是什么事件，并作出相应判断
大体的代码如下:
```c++
SDL_Event event
while(true){ //game loop
    while(Poll_Event(&event)){   //event loop
        if(event.type==/*event type*/)
        //TODO
    }
    //TODO game processing
}
```
***
**事件结构体SDL_Event**
事件结构体里面首先要掌握的是type成员。这个成员会给出接收到的事件的类型。所有的事件类型[看这里](http://wiki.libsdl.org/SDL_EventType?highlight=%28%5CbCategoryEnum%5Cb%29%7C%28CategoryEvents%29)
其次他有很多的其他成员，具体的成员有什么用处，是根据事件的不同而不同的。比如按下鼠标的话就需要用到button属性，按下按键的话就需要key属性。每个属性又是结构体，含有关于那个事件的信息。
除了type之外，每一个成员都有如下的属性：
* type 标志着这个成员所对应的事件
* timestamp 事件的时间戳
如果不是系统事件的话还会有
* windowID 发生事件的window的ID
***
**事件获取函数**
事件获取函数有两个SDL_PollEvent(),SDL_WaitEvent()。
SDL_PollEvent()函数最常用，他会在有事件的时候给事件结构体填充事件信息。而SDL_WaitEvent()会一直等待事件到来，到来之后会填充结构体。所以一般不会用到SDL_WaitEvent().
事件获取函数的用法都是传入事件结构体就可以了，比如下面这样：
```c++
SDL_Event event;
while(PollEvent(&event)){
    //TODO about event
}
```
***
**判断事件类型**
获得事件之后，需要通过事件结构体的type属性来判断是什么事件，比如用户按下了退出按钮（窗口左上角的❌）会触发退出事件，可以这样写：
```c++
bool isquit=false;

int main(int argc,char** argv){
//Init SDL and Create Window and Renderer
    SDL_Event event;
    while(!isquit){
       while(PollEvent(&event)){
           if(event.type==SDL_QUIT)
               isquit=true;
      }
    }   
    SDL_Quit();
}
```
_接下来列举一些典型的事件_

**窗体事件**
有关于窗体的事件，比如窗体的缩放，是否有焦点什么的都是这个事件:
> SDL_WINDOWEVENT

你监测到这个事件之后，可以通过SDL_Event的window成员获得更近一步的信息，比如:
* type，这个固定的为SDL_WINDOWEVENT，因为你监测到的是这个啊。
* windowID，哪个window触发的
* event，[SDL_WindowEventID](http://wiki.libsdl.org/SDL_WindowEventID)类型，你需要通过这个成员知道到底窗体的什么地方发生事件了，比如是窗体大小改变了还是失去焦点了。
* data1,data2附加的信息。
其中你需要通过event来更进一步知道发生了什么，比如这样:
```c++
while(SDL_PollEvent(&event)){
    if(event.type==SDL_WINDOWEVENT)
     if(event.window.event==SDL_WINDOWEVENT_SIZE_CHANGED)
         SDL_Log("new width:%d,new height:%d",event.window.data1,event.window.data2);
}
```
不是所有的event.window.event都需要用到data1,data2的。比如窗体的关闭事件SDL_WINDOWEVENT_CLOSE就不需要。

关于窗体的事件，wiki上给出了所有的event.window.event取值，并且给出了一个[综合实例](http://wiki.libsdl.org/SDL_WindowEvent)说明了所有的窗体事件的用法。

**程序生命周期事件**
这些事件说明了程序的生命周期，并且这些事件不和事件结构体里面的成员相对应：
* SDL_APP_TERMINATING
* SDL_APP_LOWMEMORY 内存过低的时候
* SDL_APP_WILLENTERBACKGROUND 将要进入背景的时候（失去焦点）
* SDL_APP_DIDENTERBACKGROUND 已经进入背景的时候
* SDL_APP_WILLENTERFOREGROUND 将要到前景的时候（获得焦点）
* SDL_APP_DIDENTERFOREGROUND 已经到前景的时候
* SDL_QUIT 程序退出
比如你可以这么用：
```c++
if(event.type==SDL_APP_WILLENTERBACKGROUND)
    SDL_Log("Will Enter Background!);
```

**键盘事件**
键盘事件有两个:
* SDL_KEYDOWN
* SDL_KEYUP

如果你获得键盘事件，可以通过事件结构体的key成员来获得详细信息。key结构体如下:
* type
* timestamp
* windowID
* state 取值SDL_PRESSED，SDL_RELEASED
* repeat 如果一个按键被重复按下，不为0.否则为0.
* [keysym](http://wiki.libsdl.org/SDL_Keysym) 按下或者弹起的键的编号，这是一个结构体。keysym结构体如下；
    * scancode,[SDL_Scancode](http://wiki.libsdl.org/SDL_Scancode) 结构体，定义了按键码
    * sym，[SDL_Keycode](http://wiki.libsdl.org/SDL_Keycode)结构体，定义了按键码
    * mod，有没有其他的，比如Shift,Ctrl键和这个键一起按下/弹起的。[SDL_Keymod](http://wiki.libsdl.org/SDL_Keymod)结构体

你可以随便用scancode或者sym来确定按下了哪个键，比如这样：
```c++
    if(event.type==SDL_KEYDOWN)
        if(event.key.scancode==SDL_SCANCODE_A)
         //TODO when 'A' pressed
```

_SDL2给出了专门操作按键的头文件，请看“按键操作”笔记_

**鼠标事件**
鼠标事件有四个：
* [SDL_MOUSEMOTION](http://wiki.libsdl.org/SDL_MouseMotionEvent) 鼠标移动
* [SDL_MOUSEBUTTONDOWN](http://wiki.libsdl.org/SDL_MouseButtonEvent) 鼠标按下按钮
* [SDL_MOUSEBUTTONUP](http://wiki.libsdl.org/SDL_MouseButtonEvent) 鼠标按钮弹起
* [SDL_MOUSEWHEEL](http://wiki.libsdl.org/SDL_MouseWheelEvent) 鼠标滚轮

这里每一个事件都对应不同的事件结构体成员，详细的可以点进去看看。
_因为SDL2有专门针对鼠标的操控，所以我们在这里就不详细讲解了。详细请看“鼠标操作”笔记_

**文本输入**
文本输入的事件有两个：
* SDL_TEXTEDITING
* SDL_TEXTINPUT

其中SDL_TEXTEDITING对应事件结构体中的**edit**属性。这个属性有如下三个属性：
* text用户输入的文本
* start当前光标离开始输入处的距离
* length当前光标到输入处的字符长度

SDL_TEXTINPUT事件对应text属性，这个属性只有一个重要的成员变量text，为用户输入的文本。

**需要注意的是，文本输入事件默认是不接收的。用户必须调用SDL_StartTextInput()函数来开启接收这个事件。SDL_StopTextInput()来关闭对这个事件的接收**

***
其他的事件还有游戏杆🕹️事件和游戏手柄🎮事件什么的，那些都不太重要。如果想要了解全部事件[看这里](http://wiki.libsdl.org/SDL_EventType?highlight=%28%5CbCategoryEnum%5Cb%29%7C%28CategoryEvents%29)