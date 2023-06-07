---
title: 用SDL实现IMGUI
date: 2021-02-08 10:25:20 
category:
- game development
tags:
- SDL2
---

# 什么是IMGUI

我们平常使用的GUI，像是QT和wxWidgets这种，属于保留型GUI(`Retianed Mode GUI`，简称`RMGUI`)，即它们将和GUI有关的状态都保存在内部，如果你想要改变状态的话，需要使用一系列的Set函数去更改。

而本文要介绍的是另一种老旧的，在CLI时代就存在的绘制GUI的方法：立即型GUI(`immediate Mode GUI`，简称`IMGUI`)。这类GUI不采用OO方式实现，而是过程式编程，并且也不会保留内部的状态，在每次绘制的时候都需要用户传入状态。这种类型的更多的适用于显示区域实时刷新的程序里面，例如游戏和CAD等。

举个栗子，如果是RMGUI创建按钮，并且在按钮按下设定事件的代码类似这样：

```c++
Button* button = Button::Create("button1", Point(100, 100), Size(64, 40));
window->SetChild(button);
button->Show();
button->Bind(EVENT_CLICK, [](Event& event){ // 绑定事件
  // your click processing
});
```

这种就是控件所有的状态都在内部，是典型的OO设计。

如果是IMGUI，则可能是这样的代码：

```c++
Point button_position = {100, 100};
Size button_size = {64, 40};
int event = Button(ID_BUTTON1, button_position, button_size); // draw button
if (event == EVENT_CLICK) {
  // your click processing
}
```

没有关于button的对象或者结构体，只有一个Button函数用于绘制Button（控件即是函数），并且返回触发在button上发生的事件。如果你不想显示button只需要不调用Button函数即可。

有关IMGUI最火的库就是[Dear IMGUI](https://github.com/ocornut/imgui)，可以先去试着用一用。

IMGUI在目前游戏的应用属于“文艺复兴”，因为这种GUI方式最早是在CLI界面中使用的，直到后面的OO出现才被用的比较少。但是仍旧很有应用价值。

一般的RMGUI虽然好用，但是存在如下的缺点：

* 一般都很很庞大
* 自己从0开始造轮子的话很困难，当游戏中只需要一些小的GUI时，花时间去造RMGUI费时费力。
* 存储额外的，重复的状态。比如我要共享一份文本在各个TextEditor中，我就需要调用每个TextEditor的SetText方法让他们将这份文本拷贝一份到自己的内部。

而IMGUI实现起来则非常简单（通过本文即可实现一个小的IMGUI），而且各个控件之间的耦合非常低（毕竟控件不存储状态，自然就不需要控件本身和其他控件主动交互，耦合度大大的低），很容易拓展。

当然IMGUI也有缺点，那就是写的代码很杂乱：因为IMGUI自己不存储状态，这意味着所有的状态需要用户自己设置，写到最后代码中各种if让代码很凌乱。而且各种控件的代码摆在一起，让人头晕目眩。而且很难使用布局文件来自动布局。当然，用得好也是很强的，Unity的GUI就是IMGUI。

我的建议是，如果你的游戏一开始并没有考虑到使用GUI，但是后面出现了不多的GUI需求，也找不到合适的RMGUI搭配游戏的话（我就是这样），可以自己造一个小的IMGUI。如果是确定游戏或引擎中有大量的GUI需求，还是推荐用RMGUI。

<!-- more -->

# 开始编写IMGUI

对于IMGUI的介绍就到此为止，接下来我们着手用SDL2实现一个小的IMGUI。这部分内容也可以容易地使用其他绘图库实现。我这里用C++17作为编程语言，不过不会过多地涉及到C++的语法，大部分的语法是和C相通的（毕竟不使用OO），并且假设你对SDL2很熟悉。

本文的参考教程是[Sol:IMGUI Turorial](http://sol.gfxile.net/imgui/index.html)，但是他是用SDL1写的。

## GUIState

首先我们需要一个GUIState结构体来存储整个IMGUI的状态：

```c++
typedef unsigned int IDType;  // 定义ID的类型
struct EventType {  // 定义事件的类型
    EVENT_NOTHING,
    EVENT_CLICK     // 后面定义你需要的事件
};

struct UIState {
    SDL_Point mouse_position;
    bool mouse_down;
    IDType hot_item;
    IDType active_item;
} uistate = {{0, 0}, false, 0, 0};  	// 这是全局变量
```

里面包含了当前鼠标的位置，鼠标按键是否按下（我这里只检测鼠标左键，其他的按键请按需添加）。`hot_item`是**当前鼠标悬浮在上面的控件ID**，`active_item`是**当前被按下的控件ID，不管鼠标现在是否在上面，只要在上面按下了没松开就记录下来**。

然后我们要在我们的游戏循环里设置这些值：

```c++
while (!is_quit) {
    SDL_SetRenderDrawColor(render, 200, 200, 200, 255);
    SDL_RenderClear(render);
    while (SDL_PollEvent(&event)) {
        if (event.type == SDL_MOUSEMOTION) {
            uistate.mouse_position.x = event.motion.x;
            uistate.mouse_position.y = event.motion.y;
        }
        if (event.type == SDL_MOUSEBUTTONDOWN) {
            if (event.button.button == SDL_BUTTON_LEFT) {
                uistate.mouse_down = true;
            }
        }
        if (event.type == SDL_MOUSEBUTTONUP) {
            if (event.button.button == SDL_BUTTON_LEFT) {
                uistate.mouse_down = false;
            }
        }
        if (event.type == SDL_QUIT)
            is_quit = true;
    }
    SDL_RenderPresent(render);
    SDL_Delay(30);
}
```

## 第一个控件，Button

现在我们来创建第一个控件：Button，这代表着一个按钮。

```c++
EventType Button(SDL_Renderer* render, IDType id, int x, int y, int w, int h, SDL_Color color, SDL_Color press_color);
```

我们的Button有一个ID，标识其位置和大小的xywh，显示的颜色color以及被按下时显示的颜色press_color。

这个函数的实现如下：

```c++
SDL_Rect rect = {x, y, w, h};
SDL_SetRenderDrawColor(render, color.r, color.g, color.b, 255);
if (SDL_PointInRect(&uistate.mouse_position, &rect)) { 
    uistate.hot_item = id; // 如果鼠标悬浮在上面，就设置hot_item为id
    if (uistate.active_item == 0 && uistate.mouse_down) { // 如果鼠标按下，设置active_item为id
        uistate.active_item = id;
    }
}
if (uistate.active_item == id)	// 如果按下了，就改变颜色
     SDL_SetRenderDrawColor(render, press_color.r, press_color.g, press_color.b, 255);
SDL_RenderFillRect(render, &rect);
if (uistate.active_item == id)
    return 1;
return 0;
```

这个函数做了三件事：

*   通过鼠标的状态更改了GUIState
*   绘制了Button
*   返回了触发的Button事件

那么这个时候我们就可以这样使用我们的button：

```c++
if (Button(render, ID_BUTTON1 /*全局的enum*/, 100, 100, 64, 40, {200, 0, 0, 255}, {0, 200, 0, 255}) == EVENT_CLICK) {
    cout << "button clicked" << endl;
} 
```

这个时候窗口上会有一个button，按下之后会变成蓝色的。不过不会变回去。我们需要在游戏循环的开头和结尾进行一些处理：

```c++
void imgui_prepare() {	// 放在所有控件之前
    uistate.hot_item = 0;
}

void imgui_finish() {  // 放在所有控件之后
    if (!uistate.mouse_down) {
        uistate.active_item = 0;
    }
}
```

就完成了，效果如下：



<img src="https://i.loli.net/2021/02/08/zJ3kXc9p7e1Plin.gif" alt="button image" style="zoom:50%;" />

这里有个缺点：当一直按着Button的时候会一直输出"button clicked"。你可以在Button函数里对一直按下的情况作出处理。这里就不进行处理了。

## 再来一个控件，SlidBar

通过上面的Button的例子，想必你已经了解了基本控件的编写方法，我们这里再编写一个滑动条作为例子：

```c++
EventType SlidBar(SDL_Renderer* render, IDType id, int x, int y, int len, int min, int max, int& value) {
    const int h = 20;	// 这个是纵向的滑动条，这里是滑动条的高度
    const int button_len = 16; // 滑动条中按钮的边长
    int draw_len = len - button_len; // 滑动条实际要绘制的长度
    SDL_Rect rect = {x, y, len, h};
    if (SDL_PointInRect(&uistate.mouse_position, &rect)) {
        uistate.hot_item = id;
        if (uistate.active_item == 0 && uistate.mouse_down) {
            uistate.active_item = id;
        }
    }
    if (uistate.active_item == id) {
        value = (uistate.mouse_position.x - x)/(float)(draw_len)*(max-min)+min;
        if (value < min)
            value = min;
        if (value > max)
            value = max;
    }
    // 绘制
    SDL_Color bg_color = {100, 100, 100, 255};
    SDL_Color button_color = {50, 50, 50, 255};
    SDL_Color board_color = {0, 0, 0, 255};
    SDL_SetRenderDrawColor(render, bg_color.r, bg_color.g, bg_color.b, bg_color.a);
    SDL_RenderFillRect(render, &rect);
    SDL_SetRenderDrawColor(render, board_color.r, board_color.g, board_color.b, board_color.a);
    SDL_RenderDrawRect(render, &rect);

    int pos_x = x+(value-min)/(float)(max-min)*draw_len;
    SDL_Rect button_rect = {pos_x, y+2, button_len, button_len};
    SDL_SetRenderDrawColor(render, button_color.r, button_color.g, button_color.b, button_color.a);
    SDL_RenderFillRect(render, &button_rect);

    return EVENT_NOTHING;
}
```

效果如下：

![SlidBar](https://i.loli.net/2021/02/08/vHjDhQZmIPlgncz.gif)

## 自动生成的ID

每次增加控件都需要声明一个全局的ID，着很麻烦。接下来就编写一个自动生成ID的宏：

```c++
#ifdef START_ID
#define GEN_ID() (IDType)((START_ID)+(__LINE__))
#else
#define GEN_ID() (IDType)(__LINE__)
#endif
```

这个宏使用`__LINE__`获得行号，然后将行号变为ID。如果你定义了一个`START_ID`，我们将从START_ID处开始计数，这个START_ID可以有效避免其他模块的ID的重复。

这个限制就是不能在一行内使用多次`GEN_ID()`，不过对于我们这种简单的足够了。

## 按键的处理

最后我们尝试添加按键的处理。首先需要在UIState中增加有关成员：

```c++
// 增加如下字段
    IDType kbd_item;
    SDL_Keycode key;
} uistate = {{0, 0}, false, 0, 0, 0, SDLK_UNKNOWN};

```

`kbd_item`记录了按键焦点所在的item。`key`则记录了当前按键。

然后在游戏循环中注册一下新的成员：

```c++
if (event.type == SDL_KEYDOWN) {
    uistate.key = event.key.keysym.sym;
}
if (event.type == SDL_KEYUP) {
    uistate.key = SDLK_UNKNOWN;
}
```

这里要注意一个缺点：如果帧率低的话会导致按键的遗漏（因为我们是在事件循环外面处理的按键）。

然后更改一下SlidBar（这里不打算给Button添加按键事件了）：

```c++
const int move_step = 1; // 按下一次按键移动的数值

// 这里改成这样
if (uistate.active_item == id) {
    value = (uistate.mouse_position.x - x)/(float)(draw_len)*(max-min)+min;
}
if (uistate.kbd_item == id) {
    if (uistate.key == SDLK_LEFT)
        value -= move_step;
    if (uistate.key == SDLK_RIGHT)
        value += move_step;
}
if (value < min)
    value = min;
if (value > max)
    value = max;
```

效果如下：

![SlidBar2](https://i.loli.net/2021/02/08/KqxL5wi2Wk6HcEJ.gif)

# 结束

本文到这里就结束了，如果需要更多的控件你可以自己再去编写。可以看到IMGUI写起来是很快的，我也十分乐意在游戏中去使用它。

# 所有的代码

下面是本文涉及的所有代码，只用到了SDL2，没有用到其他附加库。

```c++
#include <iostream>

#include "SDL.h"
using namespace std;

constexpr int WindowWidth = 800;
constexpr int WindowHeight = 600;

#ifdef START_ID
#define GEN_ID() (IDType)((START_ID)+(__LINE__))
#else
#define GEN_ID() (IDType)(__LINE__)
#endif

typedef unsigned int IDType;

enum EventType {
    EVENT_NOTHING,
    EVENT_CLICK
};

enum {
    ID_UNKONOW = 0,
    ID_ANY,
    ID_BUTTON1,
    ID_SLIDBAR1
};

struct UIState {
    SDL_Point mouse_position;
    bool mouse_down;

    IDType hot_item;
    IDType active_item;
    IDType kbd_item;
    SDL_Keycode key;
} uistate = {{0, 0}, false, 0, 0, 0, SDLK_UNKNOWN};

EventType Button(SDL_Renderer* render, IDType id, int x, int y, int w, int h, SDL_Color, SDL_Color);
EventType SlidBar(SDL_Renderer* render, IDType id, int x, int y, int len, int min, int max, int& value);

void imgui_prepare();
void imgui_finish();

int value = 20;

int main(int argc, char** argv) {
    SDL_Init(SDL_INIT_VIDEO|SDL_INIT_EVENTS);
    SDL_Window* window = SDL_CreateWindow("sdl imgui",
                SDL_WINDOWPOS_CENTERED,
                SDL_WINDOWPOS_CENTERED,
                WindowWidth, WindowHeight,
                SDL_WINDOW_SHOWN);
    SDL_Renderer* render = SDL_CreateRenderer(window, -1, 0);
    bool is_quit = false;
    SDL_Event event;

    while (!is_quit) {
        SDL_SetRenderDrawColor(render, 200, 200, 200, 255);
        SDL_RenderClear(render);
        imgui_prepare();
        while (SDL_PollEvent(&event)) {
            if (event.type == SDL_MOUSEMOTION) {
                uistate.mouse_position.x = event.motion.x;
                uistate.mouse_position.y = event.motion.y;
            }
            if (event.type == SDL_MOUSEBUTTONDOWN) {
                if (event.button.button == SDL_BUTTON_LEFT) {
                    uistate.mouse_down = true;
                }
            }
            if (event.type == SDL_MOUSEBUTTONUP) {
                if (event.button.button == SDL_BUTTON_LEFT) {
                    uistate.mouse_down = false;
                }
            }
            if (event.type == SDL_KEYDOWN) {
                uistate.key = event.key.keysym.sym;
            }
            if (event.type == SDL_KEYUP) {
                uistate.key = SDLK_UNKNOWN;
            }
            if (event.type == SDL_QUIT)
                is_quit = true;
        }
        EventType event = Button(render, ID_BUTTON1, 100, 100, 64, 40, {200, 0, 0, 255}, {0, 200, 0, 255});
        if (event == EVENT_CLICK) {
            cout << "button clicked" << endl;
        }
        SlidBar(render, ID_SLIDBAR1, 100, 300, 300, 0, 100, value);
        cout << "slid " << value << endl;
        SDL_RenderPresent(render);
        imgui_finish();
        SDL_Delay(30);
    }

    SDL_Quit();
    return 0;
}

EventType Button(SDL_Renderer* render, IDType id, int x, int y, int w, int h, SDL_Color color, SDL_Color press_color) {
    SDL_Rect rect = {x, y, w, h};
    SDL_SetRenderDrawColor(render, color.r, color.g, color.b, 255);
    if (SDL_PointInRect(&uistate.mouse_position, &rect)) {
        uistate.hot_item = id;
        if (uistate.active_item == 0 && uistate.mouse_down) {
            uistate.active_item = id;
        }
    }
    if (uistate.active_item == id)
        SDL_SetRenderDrawColor(render, press_color.r, press_color.g, press_color.b, 255);
    SDL_RenderFillRect(render, &rect);
    if (uistate.active_item == id)
        return EVENT_CLICK;
    return EVENT_NOTHING;
}

EventType SlidBar(SDL_Renderer* render, IDType id, int x, int y, int len, int min, int max, int& value) {
    const int h = 20;
    const int button_len = 16;
    const int move_step = 1;
    int draw_len = len - button_len;
    SDL_Rect rect = {x, y, len, h};
    if (SDL_PointInRect(&uistate.mouse_position, &rect)) {
        uistate.hot_item = id;
        if (uistate.active_item == 0 && uistate.mouse_down) {
            uistate.active_item = id;
            uistate.kbd_item = id;
        }
    }
    if (uistate.active_item == id) {
        value = (uistate.mouse_position.x - x)/(float)(draw_len)*(max-min)+min;
    }
    if (uistate.kbd_item == id) {
        if (uistate.key == SDLK_LEFT)
            value -= move_step;
        if (uistate.key == SDLK_RIGHT)
            value += move_step;
    }
    if (value < min)
        value = min;
    if (value > max)
        value = max;

    SDL_Color bg_color = {100, 100, 100, 255};
    SDL_Color button_color = {50, 50, 50, 255};
    SDL_Color board_color = {0, 0, 0, 255};
    SDL_SetRenderDrawColor(render, bg_color.r, bg_color.g, bg_color.b, bg_color.a);
    SDL_RenderFillRect(render, &rect);
    SDL_SetRenderDrawColor(render, board_color.r, board_color.g, board_color.b, board_color.a);
    SDL_RenderDrawRect(render, &rect);

    int pos_x = x+(value-min)/(float)(max-min)*draw_len;
    SDL_Rect button_rect = {pos_x, y+2, button_len, button_len};
    SDL_SetRenderDrawColor(render, button_color.r, button_color.g, button_color.b, button_color.a);
    SDL_RenderFillRect(render, &button_rect);

    return EVENT_NOTHING;
}

void imgui_prepare() {
    uistate.hot_item = 0;
}

void imgui_finish() {
    if (!uistate.mouse_down) {
        uistate.active_item = 0;
    }
}
```

