---
title: C++和Lua的交互
date: 2019-08-31 14:03:01
category:
- language
tags:
- cpp
- lua
---
Lua这个语言常常作为游戏引擎的游戏脚本，用于控制人物逻辑。一般Lua在游戏引擎中需要和其他语言进行沟通，而由于Lua是使用纯C写的语言，所以Lua当然也可以和C/C++沟通。
<!--more-->

# C++，Lua沟通的方式
C++和Lua沟通的方式其实是在内存中维护一个栈。需要注意的是：**栈顶的index是-1，栈底的index是1**：

![Lua虚拟栈](/images/Lua虚拟栈.png)

也就是说，在这个图里你可以通过-3和5来指定同一个元素。

然后通过一些lua提供的API函数，Lua会将其变量，函数，表等放入栈中，然后C/C++再通过lua的API从栈中提取出来。同样C/C++也可以使用Lua的API将元素放入栈中供Lua使用。也就是说这个栈其实就是一个暂存，用于Lua和C/C++交流的通道。

# C++调用Lua
## 头文件
首先需要知道要包含的头文件：
> lua.hpp

这个头文件需要注意一下，如果你打开头文件，会发现里面是：
```cpp
extern "C" {
#include "lua.h"
#include "lualib.h"
#include "lauxlib.h"
}
```
其实是包含了三个文件。那么如果你使用的是C语言，就直接包含这三个文件就可以了。

## 预备步骤
首先我们有如下的Lua文件：
```lua
str = "I am so cool"  
tbl = {name = "shun", id = 20114442}  
function add(a,b)  
    return a + b  
end
```

首先我们需要初始化一个内存栈来作为交流中介：
```cpp
lua_State* state = luaL_newstate();
```
使用`luaL_newstate()`函数创建一个栈，栈的结构体就是`lua_State*`。

然后需要将Lua文件和这个栈关联起来，不然怎么知道是和哪个Lua文件通信呢：
```cpp
int luafile = luaL_loadfile(state, "hello.lua");
```

然后使用`lua_pcall()`初始化栈（或者说将luafile中的信息记录出来）：
```cpp
luafile = lua_pcall(state, 0, 0, 0);
```

以上就是预备步骤了。

## 获得数据
接下来需要获得数据。获得数据的方法是使用API让Lua把数据（变量）放入栈中，然后C/C++再获得：
```cpp
lua_getglobal(state, "str");
if(lua_isstring(state, -1))
    cout<<lua_tostring(state, -1)<<endl;
```
首先使用`lua_getglobal()`获得全局变量`str`。这个时候Lua就会把变量str的值放入栈中了。接下来使用`lua_isstring()`函数来判断栈顶元素是不是字符串（第二个参数是栈中元素的index，这里只有一个元素str所以直接在栈顶），如果是，则使用转换函数`lua_tostring()`来返回这个变量（同样第二个参数也是index）。

需要注意的是：**使用转换函数获得元素值之后是不能自动将这个元素从栈中删除的，想要删除需要使用`void  lua_remove (lua_State *L, int idx);`来移除idx上的值**

也有其他的函数：
* `int   lua_gettop (lua_State *L);`            //返回栈顶索引（即栈长度）  
* `void  lua_settop (lua_State *L, int idx);`   //设置栈索引                
* `void  lua_pushvalue (lua_State *L, int idx);`//将idx索引上的值的副本压入栈顶  
* `void  lua_insert (lua_State *L, int idx);`   //弹出栈顶元素，并插入索引idx位置  
* `void  lua_replace (lua_State *L, int idx);`  //弹出栈顶元素，并替换索引idx位置的值

获得表的操作有点麻烦，你需要首先使用`lua_getglobal()`函数将表放到栈中，然后使用`lua_getfield()`来将里面的字段放到栈中，然后再从栈里面获得字段值：
```cpp
lua_getglobal(state, "tbl");
lua_getfield(state, -1, "name");
lua_getfield(state, -2, "id");
cout<<lua_tostring(state, -2)<<endl;
cout<<lua_tonumber(state, -1)<<endl;
```
这里首先使用`lua_getglobal()`将tbl放在栈顶，然后使用`lua_getfield()`将tbl中的name属性入栈，再将id入栈，这样栈里面按顺序就是`id, name, tbl`三个值。所以这里的`lua_tostring()`作用在-2上。

## 调用函数
函数不能够直接通过转换函数，只能直接调用。
首先一样先让Lua将函数放到**栈顶**：
```cpp
lua_getglobal(state, "add");
```
然后你需要将函数要用到的参数压入栈中：
```cpp
lua_pushinteger(state, 2);
lua_pushinteger(state, 7);
```
然后使用函数`lua_call();`来调用函数：
```cpp
lua_call(state, 2, 1);
```
这个函数第二个参数是表示这个函数需要多少个参数，第三个参数是这个函数会返回多少个参数（Lua函数可以返回多参数）。然后Lua就会从栈里面获得参数和函数，然后调用，并且将返回值压入栈：
```cpp
if(lua_isnumber(state, -1))
    cout<<"2+7="<<lua_tonumber(state, -1)<<endl;
```
输出当然是`2+7=9`。

# Lua调用C++函数
想要在Lua中调用C/C++函数，我们可以首先将C/C++编译为链接库，然后在Lua中调用。（其实还有一种在C++代码中调用Lua，使用Lua调用C++代码的方法，但是好像没什么用，就不说了）

首先我们需要编写一个库：
```c++
#include <lua.hpp>
#include <iostream>
using namespace std;

//由于是C++文件，但是Lua是纯C写的，所以我们需要使用extern "C"导出成纯C的编译方式。
extern "C" int say(lua_State* L){
	const char* str = luaL_checkstring(L, 1);   //使用luaL_check<type>()函数从栈中获得参数
	cout<<str<<endl;
	return 1;
}

extern "C" int addNum(lua_State* L){
	int num1 = luaL_checknumber(L,1);
	int num2 = luaL_checknumber(L,2);
	lua_pushnumber(L, num1+num2);   //这里将计算的结果作为返回值压入栈中
	return 1;
}

//这个luaL_Reg是用来注册C/C++函数的
const struct luaL_Reg mylibs[]={
    //{函数在Lua中的名称， 函数在C/C++中的名称}
	{"say", say},
	{"addNum", addNum},
	{NULL, NULL}    //最后一对函数注册是NULL,说明已经到底了没有函数了
};

//这是Lua唯一的库函数获取函数，以luaopen_xxx来命名，在Lua中也要写require xxx
extern "C" int luaopen_mylib(lua_State* L){
    //下面是一系列常规步骤，将函数名称和函数压入栈中
	const char* libName = "mylib";
    luaL_newlib(L,mylibs);
    lua_pushvalue(L,-1);
    lua_setglobal(L,libName);
	return 1;
}
```

然后要生成动态链接库mylib.so：
```bash
g++ -bundle -undefined dynamic_lookup -o mylib.so main.cpp  `pkg-config --libs --cflags lua ` -std=c++11
```

然后你就可以在Lua中使用这库了：
```lua
require "mylib"

mylib.say("hello c++")
mylib.addNum(2,3)

--输出:
hello c++
5.0
```

# 参考
[Lua与C++交互详解](https://www.cnblogs.com/slysky/p/7890738.html)
[Mac下Lua调用C生成的so文件](https://blog.csdn.net/themagickeyjianan/article/details/78493913)