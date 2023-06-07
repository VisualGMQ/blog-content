---
title: SDL2-文本输入操作
date: 2019-07-28 00:41:17
category:
- game development
tags:
- SDL2
---
对于SDL的文本输入操作，其wiki还专门给了一个教程：[见这里](http://wiki.libsdl.org/Tutorials/TextInput)
我们按照这个教程来简单说明一下。
<!--more-->
***
**打开输入功能**
首先，如果你想要用户输入文本，你需要使用` SDL_StartTextInput()`函数打开文本输入功能，不想要输入的话使用`SDL_StopTextInput()`来停止输入。
你也可以使用`SDL_IsTextInputActive()`来判断是否打开了文本输入功能。

**获得用户输入的字符**
打开了输入功能之后，系统就可以接收到文本输入事件了，有如下：
* SDL_TEXTINPUT 用户输入文本的事件
* SDL_TEXTEDITING 用户修改文本的事件

我们首先需要使用的是`SDL_TEXTINPUT`。这个事件的event有一个`text`成员，记录了用户输入的字符（UTF-8的）。
这里需要注意的是，如果你使用的是英文，那么就是一次一个字符。但是如果你使用的是中文或者日文这种“**多个按键合成一个字符**”的输入法，那么当你按下空格之后就会一次性输入很多字符。比如你用搜狗输入法打出`huijia`，那么搜狗输入法的输入条会显示`回家`，然后你按下空格确认输入回家，这个时候text就是"回家"而不是"h"或者"huijia"。
![db5889b4aa3791dcd1048552bd5f8c5e.png](evernotecid://CC4AE303-7075-41F1-88CC-9FC46AD06331/appyinxiangcom/20164043/ENResource/p351)
搜狗输入法条

于是你就可以通过这个来获得字符（而且组合键它也可以自动监测到，比如输入大小写）。但是没有办法检测到退格键和回车键，你可以通过键盘事件来检测：
```c++
if(event.type == SDL_KEYDOWN){
    if(event.key.keysym.sym == SDLK_BACKSPACE)
        textinput.pop_back();
    if(event.key.keysym.sym == SDLK_RETURN)
        textinput += '\n';
}
```
这样你就可以得到用户的输入了。

**其他输入法的输入**
需要注意的是**如果你使用中文输入法，那么情况会不大一样**，下面是将中文显示到屏幕上的一段程序的结果，你可以看到和一般文本编辑器不同的地方：

![35d2e58f6141b1e7e3853c783e81be2f.png](evernotecid://CC4AE303-7075-41F1-88CC-9FC46AD06331/appyinxiangcom/20164043/ENResource/p352)

没错，我们在输入的时候居然没有在屏幕上显示。只有我们按下空格键（或者选择你要输入的文本）之后才会显示在屏幕上。也就是说输入法对文本的转换过程是不会触发`SDL_TEXTINPUT`事件的，而是会触发`SDL_TEXTEDITING`。

![3e5aa8d59cc31c820add28ce12789a48.png](evernotecid://CC4AE303-7075-41F1-88CC-9FC46AD06331/appyinxiangcom/20164043/ENResource/p353)
正常的文本编辑器

我们将这种**通过多个键生成一个字符**的方式叫做**组合(Composition)**

这个时候我就要介绍`SDL_TEXTEDITING`这个事件了。
这个事件的event有三个成员：
* text:正在键入的文本，比如“回家的诱惑”对应的就是“hui jia de you huo”（空格也会被检测到哦）
* start:修改的开始处
* length:修改的长度

通过以上的事件就可以制作一个文本输入框了（虽然说还是很有难度的）。

**设置输入法条的位置和大小**
这里还有一个函数可以影响输入法条的位置和大小:`SDL_SetTextInputRect(SDL_Rect* rect)`
通过给出一个SDL_Rect来指定输入法条的位置和宽度。
比如我的rect的x,y为0的时候，就会这样：

![e8a1e52c4e798d62869aafbbd073e2cb.png](evernotecid://CC4AE303-7075-41F1-88CC-9FC46AD06331/appyinxiangcom/20164043/ENResource/p354)

如果指定y=300，会这样：

![f45524358512dc39e0d8df668a342986.png](evernotecid://CC4AE303-7075-41F1-88CC-9FC46AD06331/appyinxiangcom/20164043/ENResource/p355)

可以看到距离明显变长了。

有时候w和h属性并不能影响输入法条，这个要看不同的输入法和不同系统而定了。




