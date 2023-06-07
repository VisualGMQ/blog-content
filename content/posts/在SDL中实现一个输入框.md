---
title: 在SDL中实现一个输入框
date: 2021-09-21 15:47:43
tags:
- SDL2
category:
- GUI
---

<video src="/assets/2021-09-21  Inputbox效果.mov" width="100%" height="100%" controls="controls">
</video>

这几天做游戏的时候要用到GUI。但是SDL2本身是没有GUI组件，所以得自己做一个。  
上面的视频就是目前完成的东西，有窗口，滚动条，按钮，Label和输入框。因为在输入框这里卡了很久，所以打算写一篇博客记录一下如何实现。  

## 封装UTF8 String

首先要注意的是，SDL2中用户输入的字符是UTF8类型，所以我们需要首先封装一份针对UTF8编码的string。  
关于UTF8编码的说明可以参考[这篇文章](https://visualgmq.gitee.io/2021/07/25/Text-Warp-for-UTF-8/)，这里直接把实现的代码给出来了[encoding.hpp](/codes/encoding.hpp),[encoding.cpp](/codes/encoding.cpp)。  

简单介绍一下`utf8string`，它的接口仿照`std::string`，可以将`std::string`，`char*`中的每个UTF8编码抽取出来独立存储。这样`utf8string`的基本字符就是UTF8字符，方便我们对每一个UTF8字符进行操作。

### 为什么不使用Unicode

Unicode以16位为一个字符，会涉及到大小端问题（高8位和低8位的顺序）。而UTF8则和大小端无关，转换起来较为方便。

### 为什么不使用`wstring`

`wstring`中的`wchar_t`的位数最低是16位，具体由编译器决定，这意味着没有办法保证`wchar_t`能够装下最长能到达4Byte的UTF-8编码。而且如果你用

```c++
std::wstring s = L"中文";
```

这里的s内装载的是Unicode字符，而不是UTF8。  

当然你可以不使用UTF8编码而使用Unicode，这样你就不需要封装一个`utf8string`而是使用`wstring`。至于将UTF8转换成Unicode，你可以借助`libiconv`库转换。  
我这里因为已经实现了`utf8string`了，所以我就用UTF8编码了。

## 实现InputBox

**注：以下所有代码都是将我工程中的代码进行简化的结果（去除了不相干的类和函数），所以可能无法直接运行，这里主要是要有代码才好说明。**  
首先来看看InputBox类的声明：

```c++
class InputBox {
public:
    InputBox(int id, int lenPixel);
    ~InputBox();
    void EventHandle(const SDL_Event&);
    void Render() override;

private:
    utf8string text_;  // encoding.hpp 中的对UTF8操作的string

    SDL_Texture* textTexture_ = nullptr;

    SDL_Rect rect_; // InputBox所在的矩形

    /* Black和White是预先定义的`constexpr SDL_Color`，
       分别是黑色(0, 0, 0, 255)，和白色(255, 255, 255, 255) */
    SDL_Color borderColor_ = Black;
    SDL_Color bgColor_ = White;
    SDL_Color textColor_ = Black;
    int cursor_ = 0;    // 当前光标在哪个字符上
    int lineX_ = 0;     // 当前光标应该绘制的x坐标（相对于InputBox）

    // 这三个函数后面会解释
    void tryGenTextures();
    void resetTextTexture();
    int getUTF8FontWidth(TTF_Font* font, const utf8string::OneUTF8& c);
};
```

整个的难点和解决方法在于：
1. SDL2是如何接收输入的。这一部分很多人搞不清，官方的API文档也没怎么说。
   解决方法：这里附上[官方教程](https://wiki.libsdl.org/Tutorials-TextInput)，后面也会提到。
2. SDL2接收输入的是UTF8编码，存在`char*`中，这样当我们按下退格键或左右移动光标时，必须得判断当前光标所在的文字所占char的个数。
   解决方法：使用`utf8string`
3. 判断当前是否在使用输入法条。如果在使用输入法条，那么退格键和左右键将不能删除输入框中的字符和移动光标。
4. 输入法框的位置问题。如不调用`SDL_SetTextInputRect()`函数，输入法的提示框会在屏幕左上角。
   解决方法：调用`SDL_SetTextInputRect()`

### SDL2的输入问题

想要开启SDL的文字输入，必须调用`SDL_StartTextInput()`函数。并且需要配合`SDL_StopTextInput()`进行关闭。  
开启输入后，每次你输入时，SDL根据情况都会发送两个事件：
* `SDL_TEXTINPUT`:成功输入文字，比如输入法在英文模式下输入英文，或者在中文模式下按下空格确认文字时。简单来说，就是**当你的输入法条出现时，不会发送这个事件。只有当你在输入法条中完成了每个词的拼写，按下空格/回车时（输入法条会消失）才会触发这个事件**
* `SDL_TEXTEDITING`:编辑文字时。在输入法条中选词/编辑词时。这个时候每按下按键都会触发这个事件。

`SDL_TEXTINPUT`事件发生时：
* `event.text.text`中将会记录下输入的字符串(UTF8编码)。

`SDL_TEXTEDITING`事件发生时：
* `event.edit.text`中会记录你现在正在编辑的字符串
* `event.edit.start`中会记录你输入法条的中的光标在第几个字符处。

这里我不打算绘制正在编辑的字符串，那样会将事情搞得更复杂（你可以自己尝试，不难，就是有点烦）。而且输入法条中本身就会显示正在编辑的字符串：  

![输入法条](/assets/输入法条.png)

基于此，就可以实现一部分`EventHandle()`函数了：

```c++
void InputBox::EventHandle(const SDL_Event& e) {
    // 当鼠标在InputBox内并且按下了按键，我们就打开输入，否则关闭
    if (e.type == SDL_MOUSEBUTTONDOWN) {
        SDL_Point mousePoint = {e.motion.x, e.motion.y};
        if (SDL_PointInRect(&rect_, &mousePoint)) {
            SDL_StartTextInput();
        } else {
            SDL_StopTextInput();
        }
    }

    if (e.type == SDL_TEXTINPUT) {
        text_ += e.text.text;  // 得益于utf8string，它会自动将std::string的UTF8转换。
    }
}
```

### 记录光标所在字符序号

当用户按下左右键时，可以移动光标。  
光标所在的字符用`cursor_`变量表示。`cursor_ = 0`表示没有字符，`cursor_ = 1`表示输入框内的第一个字符。  
输入字符的实现如下：

```c++
void InputBox::EventHandle(const SDL_Event& e) {
    ...

    if (e.type == SDL_TEXTINPUT) {
        char* inputText = e.text.text;
        text_ += inputText;  // 得益于utf8string，它会自动将std::string的UTF8转换。
        // 在cursor_处插入字符
        utf8string str(inputText);
        text_.insert(text_.begin() + cursor_, str);
        cursor_ += str.size();
    }
}
```

### 判断当前是否在使用输入法条

接下来需要实现按下左右键进行移动光标。但是这里有个问题。如果现在用户在编辑输入法条中的问题，按下左右键其实是移动了输入法条中的光标，输入框本身的光标不应该移动。  
这就导致我们必须判断用户现在是否在使用输入法框。  
方法是使用`isEditing`的全局变量记录是否在使用输入法框，具体的代码如下：  

```c++
if (e.type == SDL_TEXTEDITING) {
    if (strlen(e.edit.text) == 0) {
        context.isEditing = false;
    } else {
        context.isEditing = true;
    }
}
if (e.type == SDL_TEXTINPUT) {
    context.isEditing = false;
}
```

当接收到`SDL_TEXTEDITING`时用户是在使用输入法条。接收到`SDL_TEXTINPUT`就是不在使用输入法条。但是注意**当你将输入法条内的所有字符删掉之后，他仍然会给你发一个`SDL_TEXTEDITING`，这个时候其text的长度为0**，所以还要对这一点进行判断。  

### 进行光标的移动和退格键删除字符

这一点就比较容易了：

```c++
void InputBox::EventHandle(const SDL_Event& e) {
    ...

    if (type == KEYDOWN) {
        const auto& key = e.key.keysym.sym;
        if (key == SDLK_BACKSPACE &&
            !isEditing) {  // 按下退格删除字符
            if (cursor_ != 0) {
                text_.erase(text_.begin() + (-- cursor_));
            }
        }
        if (!isEditing) {
            if (key == SDLK_LEFT) { // 按下左键左移光标
                if (cursor_ > 0) {
                    cursor_ --;
                }
            }
            if (key == SDLK_RIGHT) {  // 按下右键右移光标
                if (cursor_ < text_.size()) {
                    cursor_ ++;
                }
            }
        }
    }
}
```

### 绘制光标的注意事项

需要注意的是，如果你绘制文字的字体不是*等宽字体*的话，中文和英文的宽度是不一样的，这意味着不能简单地通过如下代码得到光标的位置：  

```c++
int cursorLineX = rect.x + cursor_ * FONT_PT;
```

一般而言，中文的宽度是英文的两倍。但是这里我提出一种通用的解决方法，就是使用`lineX_`变量记录当光标的X坐标，每次移动光标，删除/增加字符的时候都判断一下修改的字符所占的Pixel，然后修改`lineX_`。  
这里可以通过`TTF_SizeUTF8()`来判断字符串生成图像的大小，而不需要真正的生成图像。

```c++
void InputBox::EventHandle(const SDL_Event& e) {
    ...

    if (e.type == SDL_TEXTINPUT) {
        char* inputText = e.text.text;

        // 得到字符的宽度
        int w;
        TTF_SizeUTF8(font, inputText, &w, nullptr);
        lineX_ += w;

        text_ += inputText;  // 得益于utf8string，它会自动将std::string的UTF8转换。
        // 在cursor_处插入字符
        utf8string str(inputText);
        text_.insert(text_.begin() + cursor_, str);
        cursor_ += str.size();
    }

    if (type == KEYDOWN) {
        const auto& key = e.key.keysym.sym;
        if (key == SDLK_BACKSPACE &&
            !isEditing) {  // 按下退格删除字符
            if (cursor_ != 0) {

                // 减去删除字符的长度
                lineX_ -= getUTF8FontWidth(GuiContext.font,
                               text_[-- cursor_]);

                text_.erase(text_.begin() + cursor_);
            }
        }
        if (!isEditing) {
            if (key == SDLK_LEFT) { // 按下左键左移光标
                if (cursor_ > 0) {
                    // 减去左边字符的长度
                    lineX_ -= getUTF8FontWidth(GuiContext.font,
                               text_[-- cursor_]);
                }
            }
            if (key == SDLK_RIGHT) {  // 按下右键右移光标
                if (cursor_ < text_.size()) {
                    // 增加右边字符的长度
                    lineX_ += getUTF8FontWidth(GuiContext.font,
                               text_[cursor_ ++]);
                }
            }
        }
    }
}
```

而这里的`getUTF8FontWidth()`的实现如下：  

```c++
// OneUTF8是std::array<char, 4>，是utf8string的基本单位。
int InputBox::getUTF8FontWidth(TTF_Font* font, const utf8string::OneUTF8& c) {
    auto str = UTF8ToString(c); // 将UTF8转化为std::string，在`encoding.hpp`中有声明
    int w;
    TTF_SizeUTF8(font, str.c_str(), &w, nullptr); // 得到宽度
    return w;
}
```

### 让输入法条在输入框的下方

如果不使用`SDL_SetTextInputRect()`函数，输入法条将会出现在左上方。这里只要将输入框的`rect_`传给他就行了。
