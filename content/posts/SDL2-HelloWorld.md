---
title: SDL2-HelloWorld
date: 2019-07-28 00:12:31
category:
- game development
tags:
- SDL2
---
这里我们先来一个Hello World来看看什么是SDL。这一部分可能比较多。
<!--more-->

***
**SDL2的配置**
下载安装之后需要配置SDL。具体的配置方法在[这里](http://lazyfoo.net/tutorials/SDL/01_hello_SDL/index.php)
SDL的教程比较好的是Lazy Foo的博客，地址在[这里](http://lazyfoo.net/tutorials/SDL/index.php)
或者你可以看SDL官方写的书《SDL Game Development》
***
**Hello World**
这里给出SDL2的Hello World。这个Hello World的功能是产生一个700x700的窗口，背景是绿色的，并且会绘制一幅图片在上面：
![xionggui](/images/window.png)

现在来看看这个Hello World：
```c++
#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <iostream>
using namespace std;
const int WIDTH=700;
const int HEIGHT=700;
const int DELAYTIME=30;
SDL_Window* mainwindow = nullptr;
SDL_Renderer* render = nullptr;
SDL_Surface* surface = nullptr;
SDL_Texture* texture = nullptr;
SDL_Event event;
SDL_Rect imgRect,destRect;
bool isquit=false;

bool init();
void renderScreen();
void handleEvent();
void update();
void clean();

int main(int argc,char** argv){
    if(init()==false){
        SDL_Log("Init faliled");
            return -1;
    }
    SDL_Log("Init success");

    while(isquit==false){
        renderScreen();
        update();
        SDL_Delay(DELAYTIME);
    }
    SDL_Log("Window is quit\n");
    clean();
    SDL_Log("SDL quit");
    return 0;
}

bool init(){
	if(SDL_Init(SDL_INIT_EVERYTHING)<0){
    	cerr<<"SDL2 can't be init!";
    	return false;
    }
    mainwindow = SDL_CreateWindow("hello world",SDL_WINDOWPOS_CENTERED,SDL_WINDOWPOS_CENTERED,WIDTH,HEIGHT,SDL_WINDOW_RESIZABLE);
    if(mainwindow==nullptr){
    	cerr<<"can't create window!";
    	return false;
    }
    render = SDL_CreateRenderer(mainwindow,-1,0);
    if(render == nullptr){
    	cerr<<"can't create renderer!";
    	return false;
    }
    surface = IMG_Load("1.jpeg");
    if(surface==nullptr){
    	cerr<<"1.jpeg is not found";
    	SDL_Log("img is not loaded");
    }else{
    	texture = SDL_CreateTextureFromSurface(render,surface);
    	SDL_QueryTexture(texture,nullptr,nullptr,&imgRect.w,&imgRect.h);
    	destRect=imgRect;
    	imgRect.x=imgRect.y=0;
    	SDL_Log("the image width and height is:%d,%d",imgRect.w,imgRect.h);
	}
	return true;
}
   
void renderScreen(){
		SDL_RenderClear(render);
		SDL_SetRenderDrawColor(render,0,200,0,255);
}

void handleEvent(){
	while(SDL_PollEvent(&event)){
		if(event.type == SDL_QUIT)
			isquit=true;
	}
}

void update(){
	handleEvent();
	destRect.x=destRect.y=100;
	SDL_RenderCopy(render,texture,&imgRect,&destRect);
	SDL_RenderPresent(render);
}

void clean(){
	SDL_FreeSurface(surface);
	SDL_DestroyTexture(texture);
	SDL_DestroyWindow(mainwindow);
	SDL_Quit();
}
```
这里将不同的功能放入了不同的函数，以便代码的阅读。这个代码的结构大体如下：
初始化SDL2，创建窗体，创建渲染器，窗体事件循环，程序结束清理

***
**包含头文件**
首先是两行的包含头文件的代码：
```c++
#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <iostream>
using namespace std;
```
包含了每次使用SDL都必须的头文件SDL.h。以及SDL2拓展库SDL_image.h。SDL_image.h不属于标准SDL里面。但是因为标准SDL的图像读取函数Load_Image只能读取bmp,jpeg。所以使用SDL_image.h的IMG_Load()来读取。还包含了C++的iostream，并且使用了命名空间std。
***
**变量的声明**
声明了一些变量：
```c++
const int WIDTH=700;
const int HEIGHT=700;
const int DELAYTIME=30;
SDL_Window* mainwindow = nullptr;
SDL_Renderer* render = nullptr;
SDL_Surface* surface = nullptr;
SDL_Texture* texture = nullptr;
SDL_Event event;
SDL_Rect imgRect,destRect;
bool isquit=false;
```
WIDTH和HEIGHT是生产窗体的大小，DEKAYTIME表示游戏一帧的延时时间。接下来以SDL开头的就是SDL自己的结构体，分别代表窗口，渲染器，表面，纹理，事件和矩形结构。最后声明一个bool变量来判断游戏是否结束。
***
**接下来是一些函数的前置声明：**
```c++
bool init();
void renderScreen();
void handleEvent();
void update();
void clean();
```
***
**init()函数**
```c++
bool init(){
	if(SDL_Init(SDL_INIT_EVERYTHING)<0){
		cerr<<"SDL2 can't be init!";
		return -1;
	}
	mainwindow=SDL_CreateWindow("hello world",SDL_WINDOWPOS_CENTERED,SDL_WINDOWPOS_CENTERED,WIDTH,HEIGHT,SDL_WINDOW_RESIZABLE);
	if(mainwindow==nullptr){
		cerr<<"can't create window!";
		return -1;
	}
	render = SDL_CreateRenderer(mainwindow,-1,0);
	if(render == nullptr){
		cerr<<"can't create renderer!";
		return -1;
	}
	surface = IMG_Load("1.jpeg");
	if(surface==nullptr){
		cerr<<"1.jpeg is not found";
		SDL_Log("img is not loaded");
	}else{
		texture = SDL_CreateTextureFromSurface(render,surface);
		SDL_QueryTexture(texture,nullptr,nullptr,&imgRect.w,&imgRect.h);
		destRect=imgRect;
		imgRect.x=imgRect.y=0;
		SDL_Log("the image width and height is:%d,%d",imgRect.w,imgRect.h);
	}
	return 1;
}
```
首先是初始化函数init。里面发生了以下的事情：

1. SDL_Init()。每次使用SDL的时候都必须调用这个函数来进行初始化，这样才可以使用SDL引擎。这里传入SDL_INIT_EVERYTHING来表示初始化SDL的每个部分。如果初始化失败会返回小于0的数值。
2. SDL_CreateWindow()。用于创建以个窗体，返回一个SDL_Window\*的指针。其中的参数分别表示窗体的标题，初始x，y坐标，初始大小（宽度和高度）以及窗体类型。这里入的参数说明是一个700x700，显示在屏幕中央的可变大小的窗体。
3. SDL_CreateRenderer()。创建一个渲染器，返回一个SDL_Renderer\*。每个窗体都需要一个渲染器用于渲染图像。这个函数的第一个参数是为哪个窗体创建渲染器。后面的-1和0默认。
4. IMG_Load()。这个是SDL_image.h头文件里的函数，用于读入一个图像并且放在surface里面。这个函数可以读取几乎任何的图像格式，而不像SDL2自带的Load_Image()只能够读取bmp和jpg。
5. SDL_Log()。存在在if语句里面的日志函数，用法和printf()函数一样，用于在控制台输出格式化的日志。
6. SDL_CreateTextureFromSurface()。从surface创建一个texture。返回SDL_Texture\*。参数分别是对应的渲染器和surface。
<br/>
**Surface和Texture的区别**
Surface是表面，是SDL1的产物，用于绘制图像，但是其占用的是内存，完全由CPU绘制。Texture是纹理，是SDL2新增的结构体，放在显存里面，用GPU加速。SDL2推荐的是Texture。但是目前Texture只可以通过Surface来进行构造。
<br/>
7. SDL_QueryTexture()。查询Texture。这个函数可以或者Texture的一些信息。这里获得了其大小。
***
**renderScreen()函数**
这个函数用于渲染窗体
```C++
void renderScreen(){
		SDL_RenderClear(render);
   		SDL_SetRenderDrawColor(render,0,200,0,255);
}
```
1. SDL_RenderClear()。用Renderer的颜色来清空窗口。
2. SDL_SetRenderDrawColor()。设置Render的颜色。这里给了绿色。这个颜色带有第四个参数alpha值。
***
**handleEvent()函数**
用于事件循环
```c++
void handleEvent(){
	while(SDL_PollEvent(&event)){
   		if(event.type == SDL_QUIT)
   			isquit=true;
   	}
}
```

使用了SDL_PollEvent()函数来获得事件。如果是SDL_QUIT（退出）事件，就置isquit=true来退出循环。
***
**update**
用于更新游戏状态
```c++
void update(){
	handleEvent();
   	destRect.x=destRect.y=100;
   	SDL_RenderCopy(render,texture,&imgRect,&destRect);
   	SDL_RenderPresent(render);
} 
```

1. 首先调用了handleEvent()函数来进行事件处理
2. 83行置图像最终要绘制的x，y坐标为(100，100)
3. SDL_RenderCopy()。用于将Texture绘制到窗体上，但是不可以旋转和翻转图像（如果想要旋转和翻转需要使用SDL_RenderCopyEx()）。参数分别为渲染器，纹理，要绘制的图像区域和目的地。
4. SDL_RenderPresent()。将当前窗体绘制出来。
***
**clean()**
游戏结束后的清除。
```c++
void clean(){
   	SDL_FreeSurface(surface);
   	SDL_DestroyTexture(texture);
   	SDL_DestroyWindow(mainwindow);
	SDL_Quit();
}
```
这个函数里面清除了一些游戏资源，包括surface，texture，window。并且调用SDL_Quit()退出了SDL引擎。

