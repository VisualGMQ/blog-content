---
title: SDL2-多窗口
date: 2019-07-28 00:44:56
category:
- game development
tags:
- SDL2
---
SDL不仅是用来写游戏的，其实他的官方网站给他的定义是游戏和GUI界面，也就是说它其实就是一个实现图形用户界面的库。那么肯定可以有多窗口啦。
其实多窗口实现的方式很简单：你只要定义多个窗口，然后每个窗口再给一个Renderer就可以了。然后在循环的时候再调用各自的Renderer函数就可以了。
<!--more-->
这里有一个例子给你看一下：
***
```c++
#include <SDL2/SDL.h>
#include <thread>
#include <iostream>
using namespace std;

void runWindow(int argc,char** argv){
	SDL_Window* win = SDL_CreateWindow("MultiWindow", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 700, 700, SDL_WINDOW_SHOWN);
	SDL_Renderer* render = SDL_CreateRenderer(win, -1, 0);
	SDL_Event event;
	bool isQuit = false;
	SDL_SetRenderDrawColor(render ,255,255,255,255);
	while(!isQuit){
		SDL_RenderClear(render);
		while(SDL_PollEvent(&event)){
			if(event.type == SDL_QUIT)
					isQuit = true;
		}
		SDL_RenderPresent(render);
	}
}

int main(int argc, char** args){
	SDL_Init(SDL_INIT_EVERYTHING);
	SDL_Window* win1 = SDL_CreateWindow("MultiWindow1", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 700, 700, SDL_WINDOW_SHOWN);
	SDL_Window* win2 = SDL_CreateWindow("MultiWindow2", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 700, 700, SDL_WINDOW_SHOWN);
	SDL_Renderer* render1 = SDL_CreateRenderer(win1, -1, 0);
	SDL_Renderer* render2 = SDL_CreateRenderer(win2, -1, 0);
	SDL_Event event;
	bool isQuit = false;
	SDL_SetRenderDrawColor(render2 ,255,255,255,255);
	SDL_SetRenderDrawColor(render1 ,0,255,0,255);
	while(!isQuit){
		SDL_RenderClear(render1);
		SDL_RenderClear(render2);
		while(SDL_PollEvent(&event)){
			if(event.window.event == SDL_WINDOWEVENT_CLOSE)
					isQuit = true;
       }
		SDL_RenderPresent(render1);
		SDL_RenderPresent(render2);
		SDL_Delay(30);
	}
	SDL_Quit();
	return 0;
}
```
最后的结果是这样：
![c6ecf40f2dec41aa58acbf18133ce778.png](evernotecid://CC4AE303-7075-41F1-88CC-9FC46AD06331/appyinxiangcom/20164043/ENResource/p322)
需要注意的是这里的事件处理，我们使用的是event.window。