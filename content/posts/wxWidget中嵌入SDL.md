---
title: wxWidget中嵌入SDL
date: 2022-03-03 15:46:33
tags:
- SDL2
- wxWidgets
category:
- GUI
---

本文介绍了如何在wxWidget库里面使用SDL绘制东西。

<!--more-->

## wxWidget嵌入SDL

### 基本的wxWidget程序

首先我们给一个基本的wxWidget3的窗体程序：

```cpp
#include "SDL.h"
#include <wx/wxprec.h>
#ifndef WX_PRECOMP
    #include <wx/wx.h>
#endif

constexpr int WindowWidth = 480;
constexpr int WindowHeight = 320;

class MyCanva: public wxPanel {
public:
    MyCanva(wxFrame* parent): wxPanel(parent) {
    }
};

class MyFrame: public wxFrame {
public:
    MyFrame(): wxFrame(nullptr, wxID_ANY, "Embed SDL in wxWidget", wxDefaultPosition, wxSize(WindowWidth, WindowHeight)) {
        MyCanva* canva = new MyCanva(this);
    }
};

class MyApp: public wxApp {
public:
    bool OnInit() override {
        MyFrame* window = new MyFrame;
        window->Show();
        return true;
    }

    int OnExit() override {
        return 0;
    }
};


wxIMPLEMENT_APP(MyApp);
```

运行之后应该会显示一个窗体。

这个窗体是在`MyApp`里面使用了`MyFrame`，然后在`MyFrame`中放了一个`MyCanva`。

之所以放`MyCanva`是因为`wxPanel`可以自动绘制，而`wxFrame`不能自动调用`OnPaint`方法。

### 初始化SDL和创建SDL窗口

然后我们要初始化SDL，在`MyFrame`的构造函数中：

```cpp
bool OnInit() override {
    SDL_Init(SDL_INIT_EVERYTHING);
    MyFrame* window = new MyFrame;
    window->Show();
    return true;
}
```

接下来我们需要将`MyCanva`的窗口数据给SDL，让SDL管理他的数据，这样我们才能让SDL进行绘制：

```cpp
MyCanva(wxFrame* parent): wxPanel(parent) {
    sdl_window = SDL_CreateWindowFrom(GetHandle());
    if (!sdl_window) {
        wxLogMessage("SDL window create failed: %s", SDL_GetError());
    } else {
        renderer = SDL_CreateRenderer(sdl_window, -1, 0);
        if (!renderer) {
            wxLogMessage("SDL renderer create failed: %s", SDL_GetError());
        }
        SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);
    }
}
```

这里主要使用了`SDL_CreateWindowFrom`方法从`MyCanva`已经创建好的窗体中拿到数据。

**注意**：`sdl_window`和`renderer`是全局变量。

### 使用SDL进行绘制

接下来我们要使用SDL在`MyCanva`上进行绘制，只需要在其`OnPaint`事件中绘制即可：

```cpp
 void OnPaint(wxPaintEvent& event) {
    SDL_SetRenderDrawColor(renderer, 100, 100, 100, 255);
    SDL_RenderClear(renderer);
    SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);
    SDL_RenderFillRect(renderer, &rect);
    SDL_RenderPresent(renderer);
}
```

这里`rect`也是全局变量（`SDL_Rect`类型）。不要把其移动到`MyCanva`的`public`部分，然后在下文的按钮事件中使用类似`canva->rect.x = xxx;`的代码，这样会产生总线错误（但应该可以使用wxWidget在控件之间共享变量的方法，不过这方面我没接触过）。

然后我们注册这个函数到`OnPaint`事件：

```cpp
MyCanva(wxFrame* parent): wxPanel(parent) {
    Bind(wxEVT_PAINT, &MyCanva::OnPaint, this);

    // ...
```

完成之后你应该会在屏幕中看到一个红色方块。

### 使用定时器逐帧绘制

`OnPaint`事件只会在特定的情况下调用（比如窗口打开时，被遮挡时和缩放时等），如果你想要编写游戏，需要让其按照某一间隔进行不停地绘制，这里我们可以使用定时器事件做到这一点：

```cpp
// 在MyCanva类中

// 将要绑定到定时器事件的函数，Refresh用于强制触发一次OnPaint事件
void OnTimer(wxTimerEvent& event) {
    Refresh();
}

MyCanva(wxFrame* parent): wxPanel(parent) {
    Bind(wxEVT_PAINT, &MyCanva::OnPaint, this);
    // 绑定函数到定时器事件
    Bind(wxEVT_TIMER, &MyCanva::OnTimer, this);

    // 创建定时器
    wxTimer* timer = new wxTimer(this);
    // 开启定时器，以30毫秒为间隔
    timer->Start(30);
    // ...
}
```

## 使用其他控件

我们的`MyCanva`现在可以视为一个纯纯的SDL窗口，接下来我们在窗体中增加两个按钮left和right，点击left小方块会向左移动，点击right小方块会向右移动。

我们需要在`MyFrame`中增加，不要在`MyCanva`中增加。因为按钮也是绘制上去的，现在我们的`MyCanva`已经被SDL管控，绘制上去的按钮会被SDL的绘制覆盖掉。

而`MyFrame`和`MyCanva`不在一个层，wxWidget会帮我们正确地绘制按钮。

```cpp
class MyFrame: public wxFrame {
public:
    MyFrame(): wxFrame(nullptr, wxID_ANY, "Embed SDL in wxWidget", wxDefaultPosition, wxSize(WindowWidth, WindowHeight)) {
        MyCanva* canva = new MyCanva(this);
        wxButton* button1 = new wxButton(this, ID_LeftBtn, "move right", wxPoint(0, 0));
        Bind(wxEVT_BUTTON, [&](wxCommandEvent& e){
                    rect.x -= 10;
                }, ID_LeftBtn);

        wxButton* button2 = new wxButton(this, ID_RightBtn, "move right", wxPoint(100, 0));
        Bind(wxEVT_BUTTON, [&](wxCommandEvent& e){
                    rect.x += 10;
                }, ID_RightBtn);
    }

private:
    enum {
        ID_LeftBtn = 1,
        ID_RightBtn,
    };
};
```

结果如下：

![SDL嵌入wxWidget结果图](/assets/SDL嵌入wxWidget结果图.png)

### 存在的问题

因为一开始我们使用`SDL_CreateWindowFrom`函数获得了窗口的数据，但这时窗口数据同时被wxWidget和SDL所拥有，这意味着当程序退出时，SDL和wxWidget会将这同一个窗口销毁两次，从而产生段错。

我的解决方法是不添加`SDL_Quit`这样SDL就不回去销毁窗口。但我不知道会不会因此导致SDL的其他部分内存泄漏。

### 完整的代码

完整的代码在[这里](/codes/embed_sdl_in_wxwidget.cpp)

## 参考

[如何在wxWidgets窗口内嵌入SDL窗口_viking_xie的博客-CSDN博客](https://blog.csdn.net/viking_xie/article/details/105786324)
