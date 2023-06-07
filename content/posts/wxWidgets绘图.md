---
title: wxWidgets绘图
date: 2019-08-13 10:14:27
category:
- GUI
tags:
- wxWidgets
---

wxWidgets的绘图是采用MVC模式，你必须通知它要绘图了他才会绘制图形。
<!--more-->
# 绘图DC

首先wxWidgets给出了多个绘图DC：

* `wxPaintDC`：用于在重绘事件中绘制
* `wxClientDC`:在重绘事件之外的情况下绘制
* `wxBufferedDC`和`wxBufferedPaintDC`:分别对应`wxClientDC`和`wxPaintDC`的双缓冲绘制DC
* `wxMemoryDC`：双缓冲绘制的底层DC，在内存中绘制的DC。

绘图DC中有绘图函数和绘图要用到的`wxPen,wxBrush,wxFont`等属性设置。其实和Windows的绘图API差不多。

# 绘图过程

## 重绘过程

重绘过程会触发`wxEVT_PAINT和EVT_NC_PAINT`事件，使用`wxPaintDC,wxBufferedPaintDC`。以下事件会触发重绘过程：

* 自动事件：
  * 程序初始化界面显示
  * 窗口最小化后再重新出现。
  * 窗口改变大小
  * 窗口被挡住了
* 手动事件：
  * 调用窗口（一般是wxPanel）的`Refresh()`或者`ReflashRect()`方法

一般都需要将事件处理函数绑定到`wxEVT_PAINT`事件中。

## 其他绘制过程

用于在非重绘事件中绘制，比如你鼠标按下拖动绘制一条线的时候。使用`wxClientDC,wxBufferedDC`。

# 绘制代码

```c++
#include <wx/wx.h>
#include <string>
#include <iostream>
using namespace std;

class Canva:public wxPanel{
public:
    Canva(wxFrame* parent):wxPanel(parent, wxID_ANY, wxDefaultPosition, wxSize(800, 800)){
    }
    //绘图函数，所有的绘图功能都得在这里进行
    void OnPaint(wxPaintEvent &event) {
        wxClientDC dc(this); //首先获得wxPaintDC
        dc.SetPen(*wxBLUE_PEN);
        dc.DrawLine(wxPoint(0, 0), wxPoint(100, 100));
        dc.SetBrush(*wxGREEN_BRUSH);
        dc.SetPen(*wxGREY_PEN);
        dc.DrawRectangle(wxPoint(200, 200), wxSize(100, 200));
        //对文字需要特殊的操作才能改变外貌
        dc.SetTextForeground(wxColour(200, 100, 100));   //改变字体颜色
        dc.SetFont(wxFontInfo(20).Bold());
        dc.DrawText("this is a text", wxPoint(100, 100));
        wxInitAllImageHandlers();
        dc.DrawBitmap(wxBitmap("img.bmp", wxBITMAP_TYPE_ANY), wxPoint(300, 300));
    }
private:
    wxDECLARE_EVENT_TABLE();
};

wxBEGIN_EVENT_TABLE(Canva, wxPanel)
    EVT_PAINT(Canva::OnPaint)   //画布事件绑定
wxEND_EVENT_TABLE()

class MyFrame:public wxFrame{
public:
    MyFrame(string title):wxFrame(nullptr, -1, title, wxDefaultPosition, wxSize(500, 500)){
        canva = new Canva(this);
        canva->Show();
    }
private:
    Canva* canva;
    wxDECLARE_EVENT_TABLE();
};

wxBEGIN_EVENT_TABLE(MyFrame, wxFrame)
wxEND_EVENT_TABLE()

class MyApp:public wxApp{
public:
    virtual bool OnInit();
private:
    MyFrame* frame;
};

bool MyApp::OnInit(){
    frame = new MyFrame("drawShape");
    frame->Show();
    return true;
}

IMPLEMENT_APP(MyApp);
```

这里在Canva的OnPaint方法中绘制，首先获得`wxPaintDC`，然后使用DC的方法来绘制，可以绘制直线，折线，曲线，圆，矩形，文字等等。通过`SetPen()`函数来设置画笔（轮廓的样式），通过`SetBrush()`来设置画刷（填充的样式）。

但是画笔和画刷不能对文字产生效果，文字另有自己的函数。通过`SetTextForeground()`来设置文字的前景色，通过`SetFont()`函数来设置文字。详细请看API文档。

或者也可以通过`Clear()`函数清除所有的绘制，或者通过`SetClippingRegion()`来设置区域进行局部绘制，通过`DestroyClippingRegion()`删除之前指定的区域。



## 绘制图片

绘制图片首先需要使用`wxInitAllImageHandlers()`函数来初始化图片管理器，然后使用DC的`DrawBitmap`即可，像上面的代码

```c++
dc.DrawBitmap(wxBitmap("img.bmp", wxBITMAP_TYPE_ANY), wxPoint(300, 300));
```

需要注意的是:**虽然wxBitmap的名称是Bitmap，但是并不是只能绘制bmp，如果将第二个参数设置为这里的`wxBITMAP_TYPE_ANY，那么是可以加载JPEG,PNG等格式的图片的`**。

# 参考

[CSDN wxWidgets教程](https://blog.csdn.net/wyansai/article/details/51175599)

[简书 wxWidgets绘图教程](https://www.jianshu.com/p/6420be9dae01)

