---
title: wxWidgets快速回顾
date: 2019-08-12 23:44:58
category:
- GUI
tags:
- wxWidgets
---

# 介绍

wxWidgets是一个C++GUI库，用于创建跨平台的GUI程序。而且的确很好用，学习起来也很简单（至少比GTK+和QT简单多了）。

如果你学习过Windows API编程或者Java的Swing编程的话应该可以很快上手这个库，里面的命名和一些专业词汇都和Windows API很像很像，用法分类上几乎和Swing差不多。
<!--more-->
# Hello World

首先还是我们最最熟悉的Hello World：

## 显示窗口

```c++
#include "wx/wx.h"	//头文件，不是全部的，其他附加的控件需要额外引用，布局器需要额外引用
using namespace std;

//步骤一：继承wxApp并且重写方法
class myApp:public wxApp{
public:
    virtual bool OnInit() override {
        wxFrame* frame = new myFrame(nullptr, wxID_ANY, "hello world");
        frame->Show();
        return true;
    }
};

//步骤二：调用宏实例化myApp类。
IMPLEMENT_APP(myApp);
```

wxWidgets是一个纯粹的面向对象的。你必须继承`wxApp`类来作为当前要运作的类，并且重写里面的`bool OnInit()`方法（wxApp初始化的时候会调用，一切初始化过程都需要写在里面）。在这里我们实例化了窗体类`wxFrame`，并且调用了`Show()`方法来显示出来。

然后使用宏`IMPLEMENT_APP`来让wxWidgets实例化myApp类并且运行起来。这个时候我们的GUI界面运作就交给wxWidgets管理啦。

通过上面的步骤就会有一个窗体在屏幕上显示了。

和Swing不同，窗体初始化之后不需要指定退出的方式，wxWidgets自己给出了默认退出方式（按下关闭按钮即可）。

## 事件管理

事件管理的话就不能使用原来的`wxFrame`了，我们需要继承并且实现自己的功能：

```c++
#include <wx/wx.h>
#include <iostream>
using namespace std;

//第一步：继承wxApp
class myApp:public wxApp{
public:
	virtual bool OnInit();
};

//第二步：继承myFrame
class myFrame:public wxFrame{
public:
		myFrame(const wxString& title,const wxSize& size);
  //事件处理函数
		void OnSize(wxSizeEvent& event){
			cout<<"resized"<<endl;
			wxSize size = event.GetSize();
			cout<<"new width is:"<<size.GetWidth()<<" new height is:"<<size.GetHeight()<<endl;
		}
    void OnButton(wxCommandEvent& event){
			cout<<button->GetLabel()<<endl;
		}
private:
  //第三步：声明事件表
		wxDECLARE_EVENT_TABLE();
};

//第四步：处理事件
wxBEGIN_EVENT_TABLE(myFrame,wxFrame)
	EVT_SIZE(myFrame::OnSize)
	EVT_BUTTON(button1, myFrame::OnButton)
wxEND_EVENT_TABLE()

enum ButtonID{
	button1
};

myFrame::myFrame(const wxString& title,const wxSize& size)
		:wxFrame(nullptr,-1,title,wxDefaultPosition,size){
		wxButton* button = new wxButton(this, button1, "this is a button");
		button->Show();
		CreateStatusBar();
		SetStatusText( "Welcome to wxWidgets!" );
}

bool myApp::OnInit(){
		myFrame* frame = new myFrame("hello world",wxSize(400,400));
		frame->Show(true);
		return true;
}

//第五步：实现myApp
wxIMPLEMENT_APP(myApp);
```

这里`myApp`做的事情还是一样的：实例化Frame然后显示。但是这里的Frame是我们继承`wxFrame`的`myFrame`，继承的第一件事就是调用父类的构造方法（在成员初值列中调用了），然后在构造函数里面加了一个按钮和一个状态条（`CreateStatusBar`）。

**事件处理主要的地方在于两步：**

* 首先通过`wxDECLARE_EVENT_TABLE()`宏在类中创建一个事件列表（这个宏会给类创建一个成员变量用于存放事件，叫做事件列表）
* 然后在类外部通过`wxBEGIN_EVENT_TABLE(thisclass, parentclass),wxEND_EVENT_TABLE()`这对宏来表示我现在要在这个里面创建事件函数了（这里thisclass是要产生事件的类，parentclass是其父类）。然后在这对宏里面调用`EVT_XXXX`宏来处理事件。不同的事件宏不一样，参数也不一样。但是一般如果是窗口事件的话直接给出处理函数就行了，如果是窗口里面组件的事件的话一般要先给出组件的ID然后给出事件处理函数。

这里`OnSize`函数会在控制台输出窗体改变大小之后的值，`OnButton`会在按下按钮的时候在控制台显示按钮上面的文字。

## 结尾

可能你会说：你这里许多new为什么没有delete呢？这是因为wxWidgets重写了控件的`new`运算符，导致其可以自动管理，不需要我们delete的。如果你想要删除的话使用`Destroy()`函数



## 官方的快速指南

官方的快速指南的确快啊，代码都没有直接就一面讲完了，翻译过来如下：

> 想要开始一个wxWidgets程序，你需要继承wxApp类并且重写其OnInit()方法。
> 一个程序必须有一个顶级窗口，像是wxFrame或者wxDialog。每一个框架包含一个或者多个wxPanels, wxSplitterWindow等其他类的实例。
> 你可以给框架一个wxMenuBar,wxToolBar,wxStatusBar和wxIcon来将窗口变的更加正规。
> wxPanel用来放置控件（所有控件继承自wxControl）用来和用户交互，像是 wxButton, wxCheckBox, wxChoice, wxListBox, wxRadioBox, 和 wxSlider
> wxDialog的实例也可以用于控件，它们的优点是不需要单独的框架。
> 可以选择一种方便的通用对话框类，如wxMessageDialog和wxFileDialog，而不是创建对话框并使用项填充它。
> 绘图从来不是直接绘制在窗口上，而是绘制在DC上。wxDC是wxClientDC, wxPaintDC, wxMemoryDC, wxPostScriptDC, wxMemoryDC, wxMetafileDC 和 wxPrinterDC的基类，如果你的绘图函数含有一个wxDX参数的话，你可以给出上面列举出的任意一个DC，这样你就可以使用同一份代码在不同的设备（硬件）上就行绘制了。你可以使用wxDC的成员函数进行绘制，像是wxDC::DrawLine,wxDC::DrawText。用画笔(wxBrush)和钢笔(wxPen)控制窗口的颜色(wxcolor)。
> 要获得事件，您需要向窗口类声明中添加一个wxDECLARE_EVENT_TABLE宏，并放置一个wxBEGIN_EVENT_TABLE…wxEND_EVENT_TABLE块来实现事件处理。在这些宏之间，添加事件宏，将事件(例如鼠标单击)映射到成员函数。这些可能会覆盖预定义的事件处理程序，如wxKeyEvent和wxMouseEvent。
> 大多数现代应用程序将有一个在线的超文本帮助系统;为此，您需要wxHelp和wxHelpController类来控制wxHelp。
> GUI应用程序并不都是图形化的。列表和哈希表的需求由wxList和wxHashMap来满足。毫无疑问，您将需要一些独立于平台的文件和目录，并且您会发现使用wxPathList维护和搜索路径列表非常方便。有许多操作系统方法和其他功能。

# wxWidgets总结

## 命名方式

* 所有的控件前面和事件枚举类型都会加上`wx`，所有的成员函数都是每个单词大写的。

* 所有的事件函数(包裹在`wxBEGIN_EVENT_TABLE`,`wxEND_EVENT_TABLE`中的)都以`EVT_`开头，所有的事件枚举类型都以`wxEVT_`开头

* 绘图的话首先要取得DC（Device Context，没错是windowsAPI中的词汇），然后调用DC的成员函数绘制，所以所有的DC类最后都是以DC结尾的。