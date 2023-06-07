---
title: 利用Lua做游戏脚本
date: 2019-11-14 17:52:06
category:
- game development
---

# 关于脚本
对于游戏脚本有两种解释，一般的解释是“外挂”，也就是自动刷怪等等的那种挂。一种是让脚本和游戏主体沟通，将逻辑单独拎出来的编程技术。我们这里说的不是外挂，说的是如何使用Lua语言做脚本，并且辅助我们自己的游戏主体的编程手段。


# 预备知识
这个例子使用C++和SDL2制作游戏的主体，Lua作为游戏的脚本。另外需要知道Lua和C/C++互相通信的方法，见[这篇博客](https://www.cnblogs.com/RainRill/p/8361011.html)

<!--more-->
# 注意事项
这个例子是在MacOS系统下编写的。由于用到了动态链接库的创建，如果你是Windows系统的话，需要修改动态链接库部分的代码和编译过程。

# 例子的目标
我们的例子很简单，场上有两个方块，红色的是敌人，绿色的是玩家，玩家要保持移动不让敌人追上即可。如果追上了就会弹出游戏结束的对话框，并且关闭游戏：

![截图1](/images/Lua和Cpp交互截图2.png)  

![游戏结束](/images/Lua和Cpp交互截图1.png)

# 让我们开始吧！
首先让我们把主体的代码框架搭出来，下面的main.cpp可以创建一个800x800大小的窗体：
```c++
//main.cpp
#include <string>
#include <SDL2/SDL.h>
#include <iostream>
using namespace std;

SDL_Window* window = nullptr;
SDL_Renderer* render = nullptr;

int main(int argc, char** argv){
    SDL_Init(SDL_INIT_EVERYTHING);
    window = SDL_CreateWindow("lua script", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 800, 800, SDL_WINDOW_SHOWN);
    render = SDL_CreateRenderer(window, -1, 0);
    SDL_Event event;
    bool isquit = false;
    //flag1

    while(!isquit){
        SDL_SetRenderDrawColor(render, 100, 100, 100, 255);
        SDL_RenderClear(render);
        while(SDL_PollEvent(&event)){
            switch(event.type){
                case SDL_QUIT:
                    isquit = true;
                    break;
            }
            //flag2
        }
        //flag3
        SDL_RenderPresent(render);
        SDL_Delay(30);
    }
    SDL_Quit();
    return 0;
}
```

这里的几个flag是我们后面要添加代码的地方。

接下来我们要编写关于人物的类：

```c++
//role.hpp
#ifndef __ROLE_HPP__
#define __ROLE_HPP__
#include <SDL2/SDL.h>
#include <lua.hpp>  //导入lua文件
#include <iostream>
#include <string>
#define WIDTH 50    //方块的宽度
#define HEIGHT 50   //方块的高度
using namespace std;

//敌人和玩家的基类
class Role{
public:
    Role(int nx, int ny);
    //初始化和Lua交互的lua_State栈
    virtual void initLua(string luafile, SDL_Renderer* render);
    //绘制
    virtual void draw(SDL_Renderer* render);
    //获得X和Y坐标
    int getX();
    int getY();
    //析构函数，我们要在这里关闭lua栈
    ~Role();
protected:
    int x;
    int y;
    SDL_Color color;
    int speed;
    lua_State* S;
};

class Player:public Role{
public:
    Player(int nx, int ny);
    //玩家需要接受按键控制，这个是处理按键的函数
    void dealEvent(SDL_Event& event);
};

class Enemy:public Role{
public:
    Enemy(int nx, int ny);
    //这个函数让敌人跟踪玩家
    void follow(Role& role);
};

#endif
```

接下来是实现这些类：
```c++
#include "role.hpp"

Role::Role(int nx, int ny):x(nx), y(ny){
    speed = 5;
    S = nullptr;
}

int Role::getX(){
    return x;
}

int Role::getY(){
    return y;
}

Role::~Role(){
    lua_close(S);
}

void Role::initLua(string luafile, SDL_Renderer* render){
    //首先创建栈并且打开Lua标准库
    S = luaL_newstate();
    luaL_openlibs(S);
    //加载Lua脚本文件
    int error = luaL_loadfile(S, luafile.c_str());
    //判断脚本是否有效
    if(error != LUA_OK){
        cerr<<luafile<<" not found"<<endl;
        lua_close(S);
        return;
    }
    //调用一下初始化函数来初始化Lua栈
    lua_pcall(S, 0, 0, 0);
    //我们的库名称叫做extlib，这里获得库
    error = lua_getglobal(S, "extlib");
    if(error == LUA_TNIL){
        cerr<<"init render in lua failed"<<endl;
        return ;
    }
    //将我们用于绘图的渲染器放到extlib.render变量中
    lua_pushlightuserdata(S, (void*)render);
    lua_setfield(S, -2, "render");
    //将栈清空
    lua_settop(S, 1);
}

void Role::draw(SDL_Renderer* render){
    //找到脚本中的draw函数
    int error = lua_getglobal(S, "draw");
    if(error == LUA_TNIL){
        cerr<<"not found draw() function"<<endl;
        return ;
    }
    //将参数压入栈
    lua_pushinteger(S, x);
    lua_pushinteger(S, y);
    lua_pushinteger(S, WIDTH);
    lua_pushinteger(S, HEIGHT);
    lua_pushinteger(S, color.r);
    lua_pushinteger(S, color.g);
    lua_pushinteger(S, color.b);
    //调用draw函数
    lua_pcall(S, 7, 0, 0);
    //清空栈
    lua_settop(S, 1);
}

Player::Player(int nx, int ny):Role(nx, ny){
    color.r = 0;
    color.g = 255;
    color.b = 0;
    color.a = 255;
    speed = 10;
}

void Player::dealEvent(SDL_Event& event){
    if(event.type == SDL_KEYDOWN)
    switch(event.key.keysym.sym){
        case SDLK_a:
            x -= speed;
            break;
        case SDLK_d:
            x += speed;
            break;
        case SDLK_w:
            y -= speed;
            break;
        case SDLK_s:
            y += speed;
            break;
    }
}

Enemy::Enemy(int nx, int ny):Role(nx, ny){
    color.r = 255;
    color.g = 0;
    color.b = 0;
    color.a = 255;
    speed = 2;
}

void Enemy::follow(Role& role){
    int dx = role.getX();
    int dy = role.getY();
    //找到脚本中的follow函数
    int error = lua_getglobal(S, "follow");
    if(error == LUA_TNIL){
        cerr<<"follow function not in lua file"<<endl;
        return;
    }
    //将参数压入栈
    lua_pushinteger(S, x);
    lua_pushinteger(S, y);
    lua_pushinteger(S, dx);
    lua_pushinteger(S, dy);
    lua_pushinteger(S, speed);
    //调用follow函数
    lua_pcall(S, 5, 2, 0);
    //获得follow函数的返回值，并更新敌人的坐标
    x = lua_tonumber(S, -2);
    y = lua_tonumber(S, -1);
    //清空栈
    lua_settop(S, 1);
}
```

其实调用脚本的方法很简单，就是先找到对应函数，将参数压入栈之后调用这个函数，然后再获得函数的返回值即可（如果有的话）。最后不要忘记将栈清空（如果函数没有返回值的话就不用清空，因为`lua_pcall`会将函数的参数和函数一起弹出栈，如果有返回值的话就要清空，因为lua栈最大只能容纳20个元素（不同机器不一样，但是都不是很大），如果返回值一直驻留在栈里面，会导致后期参数无法入栈）。

接下来我们需要为Lua脚本编写相应的接口，让脚本文件可以调用一些绘图函数：
```c++
//extlib.cpp
#include <lua.hpp>
#include <SDL2/SDL.h>
#include <SDL2/SDL_image.h>
#include <iostream>
using namespace std;

/**
 * @brief 在屏幕上绘制矩形
 * 
 * Lua的参数：
 *  SDL_Renderer渲染器, x, y, w, h, r, g, b
 * 
 * warning:
 *  我们假设所有的绘制函数里面都有渲染器render
 */
extern "C" int drawRect(lua_State* L){
    //函数的第一个参数是渲染器，取出来
    SDL_Renderer* render = (SDL_Renderer*)lua_touserdata(L, 1);
    //取出其他的参数
    const int x = lua_tointeger(L, 2),
              y = lua_tointeger(L, 3),
              w = lua_tointeger(L, 4),
              h = lua_tointeger(L, 5),
              r = lua_tointeger(L, 6),
              g = lua_tointeger(L, 7),
              b = lua_tointeger(L, 8);
    //绘制矩形
    SDL_Rect rect = {x, y, w, h};
    SDL_SetRenderDrawColor(render, r, g, b, 255);
    SDL_RenderDrawRect(render, &rect);
    return 1;
}

//绘制实心矩形
//Lua的参数
//  SDL_Renderer渲染器, x, y, w, h, r, g, b
extern "C" int drawFillRect(lua_State* L){
    SDL_Renderer* render = (SDL_Renderer*)lua_touserdata(L, 1);
    const int x = lua_tointeger(L, 2),
              y = lua_tointeger(L, 3),
              w = lua_tointeger(L, 4),
              h = lua_tointeger(L, 5),
              r = lua_tointeger(L, 6),
              g = lua_tointeger(L, 7),
              b = lua_tointeger(L, 8);
    SDL_Rect rect = {x, y, w, h};
    SDL_SetRenderDrawColor(render, r, g, b, 255);
    SDL_RenderFillRect(render, &rect);
    return 1;
}

//注册函数到函数表
const struct luaL_Reg l[]={
    {"drawRect", drawRect},
    {"drawFillRect", drawFillRect},
    {NULL, NULL}
};

extern "C" int luaopen_extlib(lua_State* L){
    //设置库的名称
    const char* libName = "extlib";
    luaL_newlib(L, l);
    lua_setglobal(L, libName);
    return 1;
}
```

这样的话接口就定义好了。
我们需要将接口编译成动态链接库供脚本使用：
`g++ extlib.cpp -fPIC -shared -o extlib.so ${LUA_CONFIG} ${SDL_CONFIG} -std=c++11`

然后我们就可以编写脚本了：

```lua
--player.lua
require("extlib")

function draw(x, y, w, h, r, g, b)
    extlib.drawRect(extlib.render, x, y, w, h, r, g, b);
end
```
这里玩家的脚本，里面只有一个绘制函数。我们调用了extlib.drawRect函数来实现绘制。

```lua
--enemy.lua
require("extlib")
require("math")

--辅助函数，用于获得向量的大小
function getlen(x, y)
    return math.sqrt(x*x+y*y)
end

--绘制函数
function draw(x, y, w, h, r, g, b)
    extlib.drawFillRect(extlib.render, x, y, w, h, r, g, b)
end

--跟随玩家的函数。返回更新后的坐标
function follow(mx, my, dx, dy, speed)
    deltax = dx-mx
    deltay = dy-my
    len = getlen(deltax, deltay)
    vec = {x=deltax/len, y=deltay/len}
    return mx+vec.x*speed, my+vec.y*speed
end
```

这样整个脚本和人物都做好了。接下来我们将这些东西整合到main函数中：
```c++
//使用Lua作为绘图脚本的一个小例子，绘图引擎是SDL2
#include <lua.hpp>
#include <string>
#include <SDL2/SDL.h>
#include <iostream>
//导入头文件
#include "role.hpp"
using namespace std;

SDL_Window* window = nullptr;
SDL_Renderer* render = nullptr;

//声明的碰撞检函数
bool Collision(Player& p, Enemy& e){
    SDL_Rect rect = {p.getX(), p.getY(), WIDTH, HEIGHT};
    SDL_Point point1 = {e.getX(), e.getY()},
                point2 = {e.getX()+WIDTH, e.getY()},
                point3 = {e.getX()+WIDTH, e.getY()+HEIGHT},
                point4 = {e.getX(), e.getY()+HEIGHT};
    return SDL_PointInRect(&point1, &rect) ||
           SDL_PointInRect(&point2, &rect) || 
           SDL_PointInRect(&point3, &rect) || 
           SDL_PointInRect(&point4, &rect);
}

int main(int argc, char** argv){
    SDL_Init(SDL_INIT_EVERYTHING);
    window = SDL_CreateWindow("lua script", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, 800, 800, SDL_WINDOW_SHOWN);
    render = SDL_CreateRenderer(window, -1, 0);
    SDL_Event event;
    bool isquit = false;

    //flag1 创建敌人和玩家对象，并且读入相应的脚本文件
    Enemy enemy(400, 400);
    enemy.initLua("enemy.lua", render);
    Player player(200, 200);
    player.initLua("player.lua", render);

    while(!isquit){
        SDL_SetRenderDrawColor(render, 100, 100, 100, 255);
        SDL_RenderClear(render);
        while(SDL_PollEvent(&event)){
            switch(event.type){
                case SDL_QUIT:
                    isquit = true;
                    break;
            }
            //flag2 玩家的按键监控
            player.dealEvent(event);
        }
        //flag3 敌人的行动策略，以及绘制敌人和玩家
        enemy.follow(player);
        player.draw(render);
        enemy.draw(render);
        //碰撞检测
        if(Collision(player, enemy)){
            SDL_ShowSimpleMessageBox(SDL_MESSAGEBOX_INFORMATION, "GamOver", "你被追上了", nullptr);
            isquit = true;
        }
        SDL_RenderPresent(render);
        SDL_Delay(30);
    }
    SDL_Quit();
    return 0;
}
```

这样，整个例子就写完了。

# 总结
其实使用lua作为脚本语言很简单，只需要定义好给Lua的接口，然后在文件里调用脚本中相关的函数即可。