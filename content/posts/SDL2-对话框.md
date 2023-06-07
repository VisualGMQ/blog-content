---
title: SDL2-模态对话框
date: 2019-08-22 22:42:57
category:
- game development
tags:
- SDL2
---
SDL2中想要展示对话框有两种办法：使用`SDL_ShowSimpleMessageBox()`来显示一个简单的对话框，或者使用`SDL_ShowMessageBox()`来显示一个自定义对话框。
SDL2中只能展示模态对话框（就是如果你不点掉它你原本的窗体就不会有响应的对话框）。
<!--more-->

# SDL_ShowSimpleMessageBox()
```c++
int SDL_ShowSimpleMessageBox(Uint32      flags,
                             const char* title,
                             const char* message,
                             SDL_Window* window)
```
* `flag`：是一个`SDL_MessageBoxFlags`枚举类型，可以是`SDL_MESSAGEBOX_ERROR, SDL_MESSAGEBOX_WARNING, SDL_MESSAGEBOX_INFORMATION`其中的一个，用于表示错误信息，警告信息和普通信息（相应的对话框icon和按钮也会改变）
* `title`：UTF-8的对话框标题
* `message`：UTF-8的对话框内容
* `window`：对话框所属的父窗体

这个函数很简单，没什么其他可说的。也是为了简单产生一个对话框。

需要注意的是：**这个函数在使用`SDL_Init()`函数之前就可以使用了，也就是说你可以使用这个函数来显示初始化SDL或者OpenGL是否成功**

# SDL_ShowMessageBox()
```c++
int SDL_ShowMessageBox(const SDL_MessageBoxData* messageboxdata,
                       int*                      buttonid)
```
这个函数可以让你自己定义对话框，其中`buttonid`参数会存储最后按下的按钮的id。
这里主要需要介绍的结构体就是`SDL_MessageBoxData`:
```c++
typedef struct{
    Uint32 flags;                   //就是上面说的SDL_MessageBoxFlags枚举类型
    SDL_Window* window;             //父窗口，可以是NULL
    const char* title;              //标题
    const char* message;            //内容
    int numbuttons;                 //按钮的个数
    const SDL_MessageBoxButtonData* buttons;    //按钮的信息
    const SDL_MessageBoxColorScheme* colorScheme;//对话框颜色的信息
}SDL_MessageBoxData;
```
这里其他的都比较好理解，想要对对话框进行自定义主要还是`SDL_MessageBoxButtonData`和`SDL_MessageBoxColorScheme`两个结构体：
```c++
SDL_MessageBoxButtonData
typedef struct{
    Uint32 flag;        //是0(没有特殊含义)，SDL_MESSAGEBOX_BUTTON_RETURNKEY_DEFAULT(按下回车等于按
    下这个按钮),SDL_MESSAGEBOX_BUTTON_ESCAPEKEY_DEFAULT(按下ESC键等于按下这个按钮)
    int buttonid;       //此按钮的ID，调用函数之后会返回按下按钮的id
    const char* text;   //按钮上的文字
}SDL_MessageBoxButtonData;

typedef SDL_MessageBoxColorScheme SDL_MessageBoxColor[5];   //没错它是另一个结构体数组的别名。。。

//这个结构体就是存储颜色的结构体，只不过专门用在对话框函数上
typedef struct{
    Uint8 r;
    Uint8 g;
    Uint8 b;
}SDL_MessageBoxColor;
```
这里需要说明一下的是`SDL_MessageBoxColorScheme`类型，这个类型其实就是一个包含5个`SDL_MessageBoxColor`元素的数组。而每一个`SDL_MessageBoxColor`又是存储颜色的结构体。那么这5个`SDL_MessageBoxColor`分别代表什么呢？看下方：
```c++
[0]:SDL_MESSAGEBOX_COLOR_BACKGROUND
[1]:SDL_MESSAGEBOX_COLOR_TEXT
[2]:SDL_MESSAGEBOX_COLOR_BUTTON_BORDER
[3]:SDL_MESSAGEBOX_COLOR_BUTTON_BACKGROUND
[4]:SDL_MESSAGEBOX_COLOR_BUTTON_SELECTED
```
没错分别是**背景颜色，文本颜色，按钮框颜色，按钮背景颜色，按钮按下颜色**五个颜色。
所以你到时候自定义就需要按照这五个值的顺序来定义颜色了。

需要注意的是：**你也可以给SDL_MessageBoxColorScheme\*成员赋值NULL，这样系统会采用默认配色。而且有些系统是不能够改变配色的（比如说我的Mac。。。）**

这里就给一个官方的例子吧，比较清晰明了：
```C++
#include "SDL.h"

int main(int argc, char *argv[])
{
    //设置按钮
    const SDL_MessageBoxButtonData buttons[] = {
        { /* .flags, .buttonid, .text */        0, 0, "no" },
        { SDL_MESSAGEBOX_BUTTON_RETURNKEY_DEFAULT, 1, "yes" },
        { SDL_MESSAGEBOX_BUTTON_ESCAPEKEY_DEFAULT, 2, "cancel" },
    };
    //设置对话框颜色
    const SDL_MessageBoxColorScheme colorScheme = {
        { /* .colors (.r, .g, .b) */
            /* [SDL_MESSAGEBOX_COLOR_BACKGROUND] */
            { 255,   0,   0 },
            /* [SDL_MESSAGEBOX_COLOR_TEXT] */
            {   0, 255,   0 },
            /* [SDL_MESSAGEBOX_COLOR_BUTTON_BORDER] */
            { 255, 255,   0 },
            /* [SDL_MESSAGEBOX_COLOR_BUTTON_BACKGROUND] */
            {   0,   0, 255 },
            /* [SDL_MESSAGEBOX_COLOR_BUTTON_SELECTED] */
            { 255,   0, 255 }
        }
    };
    //填充SDL_MessageBoxData结构体
    const SDL_MessageBoxData messageboxdata = {
        SDL_MESSAGEBOX_INFORMATION, /* .flags */
        NULL, /* .window */
        "example message box", /* .title */
        "select a button", /* .message */
        SDL_arraysize(buttons), /* .numbuttons */
        buttons, /* .buttons */
        &colorScheme /* .colorScheme */
    };
    int buttonid;
    //调用函数
    if (SDL_ShowMessageBox(&messageboxdata, &buttonid) < 0) {
        SDL_Log("error displaying message box");
        return 1;
    }
    if (buttonid == -1) {
        SDL_Log("no selection");
    } else {
        SDL_Log("selection was %s", buttons[buttonid].text);
    }
    return 0;
}
```