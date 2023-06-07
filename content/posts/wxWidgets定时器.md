---
title: wxWidgets定时器
date: 2019-08-13 10:07:32
category:
- GUI
tags:
- wxWidgets
---

定时器在wxWidgets中和其他的控件其实是一样的，只不过定时器不显示出来就是了：
<!--more-->

```c++
#include <wx/wx.h>
#include <iostream>
#include <string>
using namespace std;

//定时器ID
enum TimerID{
    timer1
};

class MyFrame:public wxFrame{
public:
    MyFrame(string title):wxFrame(nullptr, wxID_ANY, title){
        timer = new wxTimer(this, timer1);  //产生一个wxTimer实例
        timer->Start(1000);
    }

    //Timer函数
    void OnTimer(wxTimerEvent& event){
        cout<<"timer triggered"<<endl;
    }
private:
    wxTimer* timer;
    wxDECLARE_EVENT_TABLE();
};

wxBEGIN_EVENT_TABLE(MyFrame, wxFrame)
    EVT_TIMER(timer1, MyFrame::OnTimer) //绑定到定时器函数
wxEND_EVENT_TABLE()

class MyApp:public wxApp{
public:
    bool OnInit(){
        frame = new MyFrame("timer");
        frame->Show();   
        return true;
    }
private:
    MyFrame* frame;
};

IMPLEMENT_APP(MyApp)
```

这里首先声明一个定时器变量timer，然后使用构造函数创建（构造函数第一个参数是定时器所属的窗体，第二个参数是ID）。然后在事件列表里面指定`EVT_TIMER`事件就可以了。



定时器还有一些控制方法：

* `Start()`开始定时器
* `IsRunning()`是否已经开始运行
* `StartOnce()`只运行一次
* `Stop()`停止运行