---
title: Lua拾遗
date: 2022-03-30 22:15:45
tags:
- lua
categories:
- language
---

本文是对Lua语言的回顾复习。顺便作为快速入门Lua的指南。

参考书本《Programming in Lua 4th》

<!--more-->


## 基本知识

Lua是一门弱类型的动态语言（类似Python），拥有很快的速度。

### 变量类型，声明和使用

变量的类型有

* nil - 表示空，将变量置为nil来提示Lua回收此变量内存（删除此变量）
* boolean - `true`和`false`
* number  - 包含了所有数类型（不区分整数和浮点数，但有整数表示形式和浮点数表示形式（有些函数要求不能传入浮点数形式））
* string
* function
* table
* userdata
* thread  - 线程和协程

其中userdata是C语言的数据。

使用`type`函数可以获得类型对应的字符串

和Python一样直接使用即可：

```lua
a = 123
```

使用`local`声明局部变量：

```lua
local a = 123
```

局部变量声明应该用在函数局部变量，不想被其他模块使用的全局变量，不想被其他模块使用的函数，if,while,repeat等块内的局部变量中。

只要不声明为local，那么他们就是在全局中可用的。

### Lua的四则运算

需要注意的是除法和取余：

除法和Python一样，分为整除`//`和浮点除法`/`。

取余是可以对小数进行的：

```lua
x = math.pi
x - x%0.01  --> 3.14
x - x%0.001 --> 3.141
```

这种方法用来保留小数到指定位数。

究其原因是因为Lua对取余的计算公式为

> a % b == a - ((a // b) * b)

### 逻辑运算符

`>`，`<`，`>=`，`<=`，`==`，`~=`

### 类型转换

很奇怪的是，我们可以用按位或运算符来将浮点数类型转化为整数类型：

```lua
2^53     --> 9.007199254741e+15 (float)
2^53 | 0 --> 9007199254740992   (integer)
```

### 字符串

字符串存储Unicode字符。

字符串使用`#`来获得长度：

```lua
a = "hello"
#a          --> 5
```

使用` ..`来连接：

```lua
"hello " .. "world" --> hello world
```

**注意：连接的语法是` ..`（有一个空格在前面），没有此空格会报错。**

Lua也会将其他类型在连接时隐式转换为字符串。

使用单引号和双引号的结果是一样的（都**不会**忽略转义符）

长字符串使用`[[`包裹：

```lua
page = [[
<html>
<head>
    <title> review Lua </title>
</html>
</head>
]]
```

和Perl一样，Lua会在运算时如果可能，会将字符串转换为数字（不能转换会报错）：

```lua
"10" + 1    --> 11
"11qqa" + 1 --> Error!
```

可以使用`tonumber()`函数强制转换，无法转换返回`nil`。

同理，非字符串可以通过`tostring()`转换到字符串。

### Table

Table是Lua中非常非常重要的数据结构。其本身的表现像个字典和数组的混合体：

```lua
a = { name = "visualgmq", age = 12321 }

a.name  -- 使用成员访问的格式访问
a['name'] -- 使用字典格式访问


b = { "apple", "juice", "orange" }

b[1] --> apple
b[2] --> juice
b.1  --> Error! 不能使用成员访问格式
```

注意下标从**1**开始！

Table的本质正如其名称：是个哈希表。当查询表内不存在的元素时会返回nil，这意味着你可以查询任意值而不产生运行时异常：

```lua
a[0] --> nil
a['unknown key'] --> nil
a[-1] --> nil
```

注意到不像Python，lua没有对负数进行特化。

同理，可以直接通过如下形式插入行键值：

```lua
a['type'] = 'lua file'
```

当键和普通值混在一起时，普通值的按顺序编排下标：

```lua
a = {11, 22, 33, key1 = 1, 44, key2 = 2}

值  下标
11   1
22   2
33   3
key1 无
44   4
key2 无
```

从表中移除值可以通过将其赋值为`nil`来实现。

由于Table本质上是哈希表，所以对其的遍历是无序的。

### 循环

首先是for-each循环：

```lua
t = {10, "hello", type = "lua"}

for k, v in pairs(t) do
    print(k, v)
end

--> 1    10
--> 2    hello
--> type lua
```

如果想让k只是下标，请将`pairs`用`ipairs`替换：

```lua
for k, v, in ipairs(t) do
    print(k, v)
end

--> 1    10
--> 2    hello
--> 3    lua
```

然后是区间循环：

```lua
for k = start_value, stop_value, step do
    doSomething()
end
```

循环是在闭区间`[start_value, stop_value]`内进行的。

除此之外还有while和repeat-until循环：

```lua
while condition do
    doSomething()
end
```

```lua
repeat
    doSomething()
until condition
```

**注意：循环只有break和goto，没有continue！我们可以用repeat-until仿一个：**

```lua
for i = 0, 10 do
    repeat
        if i == 2 then
            break
        end
        print(i)
    untile true
end
```

或者使用`goto`：

```lua
for i = 0, 10 do
    if i == 2 then
        goto label
    end
    print(i)
    :: label ::
end
```

注意label的语法：``:: label-name ::``

### 条件判断

```lua
if condition1 then
    doSomething1()
elseif condition2 then
    doSomething2()
else
    doOther()
end
```

### 函数

函数定义：

```lua
function FuncName(arg1, arg2, ..., argn)
    doSomething
end
```

使用可变参数：

```lua
-- ... 用来声明可变参数
function FuncName(arg1, ...)
    for k, v in {...} do -- 将可变参数当做表来遍历
        print(k, v)
    end
    local args = {...} -- 捕获不定参数列表
    print(#args)       -- 和操作列表一样操作不定参数

    -- 或者使用select来对不定参数操作
    local len = select('#', ...) -- 获得长度
    local first = select(1, ...) -- 获得第一个元素
end
```

匿名函数：

```lua
a = function(arg) print(arg) end
```

返回多值的函数：

```lua
function MultiRet() 
    return 1, 2
end

first, second = MultiRet()
```

函数内部的局部变量必须使用`local`声明，不然在函数第一次调用后这些非local变量将会留存下来，在外部也可使用（和Js一样）。

## 高阶知识

### 闭包Closures

在Lua中函数也是一等公民，函数可以像变量一样传递来传递去。同样地Lua也会对尾递归优化。所以说Lua有函数式编程范式。

闭包使用函数表示，其实他就是函数，不过是一种特定情况下的函数：

函数内部拥有函数，并且此函数使用了外层函数的变量时，这个函数就叫闭包：

```lua
function get_addone_func()
    local i = 0
    return function()
        i += 1
        return i
    end
end
```

这时我们调用`get_addone_func`得到内部的闭包，然后我们再调用闭包会发生什么事情？

在C++中因为i已经被销毁了所以会产生未定义行为。

Lua中使用”上值(upvalue)“来保存闭包使用的外层变量。并且不同的闭包保存的变量是不一样的（相当于拷贝了此变量）：

```lua
f1 = get_addone_func()
f2 = get_addone_func()

print(f1())     -- f1的upvalue中存着i，输出1
print(f1())     -- 输出2

print(f2())     -- f2是新的闭包，存的i和f1的不是一个i，输出1
print(f2())     -- 输出2
```

### 模块和包

使用`require`来导入模块：

```lua
local m = require 'math' -- 或者 require('math')

print(m.pi)
```

一定要用变量接收`require`返回值（其本质上是获得一个表，后面看到如何定义自己的包时会了解到），不像Python那样可以直接用模块名。


编写自己的模块的方法：

本质上是将所有需要导出的函数，变量都放在一个表里，然后返回这个表：

```lua
local MyModule = {} -- 定义要返回的表

M.version = 0.1.0'  -- 增加常量

function M.about() {    -- 增加函数
    return "MyModel version " .. M.version
}

return MyModule  -- 返回表
```

### 元表和元数据

元表（metatable）是实现高级功能的重要部分。

所有的实例都可以拥有元表。`Table`和`userdata`有自己独立的元表，其他类型中，每个类型都只有一个元表，所有此类型的实例都共享这一个元表（或者没有元表）。

使用`getmetatable(instance)`来获得原表，使用`setmetatable(instance, metatable)`来设置实例的元表。

元表中有很多元方法，比如`__index`,`__newindex`,`__add`等：

|元方法|功能|
|--|--|
|`__index`|通过键访问table的时候，如果没有此键，会在其metatable中的`__index`属性中寻找（如果此属性是个表的话），或者调用此元方法（如果是函数的话）|
|`__newindex`|当给不存在的键赋值时，会调用此方法。如果键存在则不会调用|
|`__add`|使用`+`操作符时会调用|
|`__sub`|使用`-`操作符时会调用(表示减法时)|
|`__mul`|使用`*`操作符时会调用|
|`__div`|使用`/`操作符时会调用|
|`__idiv`|使用`//`操作符时会调用|
|`__mod`|使用`%`操作符时会调用|
|`__unm`|使用`-`操作符时会调用(表示取反的时候)|
|`__concat`|使用`..`操作符时会调用|
|`__eq`|使用`==`时|
|`__lt`|使用`<`时|
|`__le`|使用`<=`时|
|`__shl`|调用左移运算时|
|`__shr`|调用右移运算时|
|`__tostring`|用于更改表的输出行为|
|`__call`|当此表以函数形式调用时（如`myTable(param)`）会调用此函数|

### 面向对象编程

#### 面向对象的函数调用法

首先是面向对象的函数调用法：

```lua
Person = {name = 'lua leaner'}
function Person:introduce()
    print(self.name)
end

```

使用`:`来定义成员方法，在调用此方法时，会隐含一个参数`self`表示调用者本身。

但需要注意的是，虽然会隐含此`self`，但如果你不传入的话它是不会自动传入的：

```lua
-- 正确调用
Person.introduce(Person)

-- 错误调用
Person.introduce()
```

要想让其自动传入，需要使用`:`：

```lua
Person:introduce() -- 等价于 Person.introduce(Person)
```

需要注意，定义函数时使用`:`和调用函数时使用`:`没有关联，你可以定义普通函数却使用`:`调用法，或者反过来：

```lua
function Person.introduce(self)
    print(self.name)
end

Person.introduce(Person)
-- 或者
Person:introduce()
```

#### 模拟面向对象

首先是成员封装，这个不必多言，使用表可轻松搞定：

```lua
Person = { name = 'learner' }

function Person:introduce()
    print('Person:', self.name)
end
```

这里注意的是构造函数。因为Lua的表是传引用的，我们构造新对象时必须使用其他方法，其中一种方法是设置元表：

```lua
function Person:new()
    local o = {}
    setmetatable(o, {__index = self})
    return o
end

-- 调用
new_person = Person:new()
```

注意堆元表的设置：回想`__index`元方法的功能：如果查询此表时没有对应键，则在此元方法中查找。我们这里的`__index`是个表，所以他直接在此表中查找，也就是在`Person`表中查找。

现在Person返回的表结构如下:

```text
表内容：{}
元表内容：{__index = {name = 'leaner'}}
```


然后是继承，可以通过重写子类元表的`__index`键值：

```lua
Child = {age = 123}

function Child:new()
    local o = {}
    setmetatable(self, {__index = Person})
    setmetatable(o, {__index = self})
    return o
end
```

这是一个嵌套的设置，最后返回的o的结构如下：

```text
表：{}
元表：{__index = {age = 123,
                  __index = {name = 'learn'}
                  }
      }

即
{__index = Child}

Child的元表 {__index = Person}
```

这就是个元表的嵌套。继承就是将父类的表放到子类元表的`__index`元方法中。


通过上述步骤，就可以明白教程中实现继承的方法了：

```lua
Person = {name = 'learner' } -- 首先定义父类的数据
function Person:GetNam() return self.name end -- 定义父类的方法

function Person:new(o)
    o = o or {}   -- 如果o不是空，我们要保留o中的元素（为了后面的继承）
    setmetatable(o, {__index = self}) -- 设置元表的__index为自己
    return o
end


-- 然后是子类Child
Child = Person:new({age = 123}) -- 从父类创建子类，并且定义了新的子类成员age

--[[
此时Child的内容为：

表：{age = 123}
元表：{__index = Person}

这样就即保留了Child的成员，又可以查找到Person的成员
--]]

-- 子类的构造方法
function Child:new(o)
    o = o or {}
    setmetatable(o, {__index = self})
    return o
end
```

注意，由于Lua的灵活性，实现OO不仅这一种方法，你完全可以使用自己的方法实现OO。

### 协程

协程，即相互协同的程序。协程有点类似线程，他有自己的栈，局部变量，并且和其他协程共享全局变量。与线程不同的是，线程可以同时执行，协程则是一个接一个的执行，在同一时间只能有一个协程在执行，并且只有在明确要求此协程放弃执行的时候才会转到下一个协程去执行。

协程就是协程，不是线程。

CPU执行单位是线程，不是什么协程。

协程，是同步执行，不是并行，只是切了一个上下文了，为你保存原来的上下文而已。

切到第二个协程时，原来的协程处于挂起状态。

CPU不知道协程，协程也不是CPU创建的。协程是用户在线程上创建的“用户态线程”。

使用`coroutine.create(func)`来创建一个协程，使用`coroutine.resume(co)`来执行一个协程。

协程在创建完成后默认是暂停状态。

也可以使用`coroutine.wrap(func)`来返回一个函数，只要你调用了此函数，就会进入协程。

使用`coroutine.status(co)`获得协程状态：

```lua
co = coroutine.create(function() print('coroutine!') end)
print(coroutine.status(co))  -- suspend
coroutine.resume(co)

print(coroutine.status(co))  -- dead
```

对已经dead的协程使用resume会返回false。

使用`coroutine.yield()`来挂起当前协程，即主动暂停当前协程的运行，转去执行其他协程:

```lua
co1 = coroutine.create(
function()
    print('co1 start')
    coroutine.yield()
    print('co1 end')
end)

co2 = coroutine.create(
function()
    print('co2 start')
    coroutine.yield()
    print('co2 end')
end)

coroutine.resume(co1)

--[[
输出
co1 start
true
--]]

coroutine.resum(co2)

--[[
输出
co2 start
true
--]]

coroutine.resume(co1)

--[[
输出
co1 end
true
--]]
```

`yield`可以有参数，参数是调用`resume`后的返回值：

```lua
co = coroutine.create(
function(a)
    print('a')
    a=a+1
    coroutine.yield(a)
end)

coroutine.resume(co, 1) -- 返回(true, 1)

-- 打印 2，然后协程暂停


coroutine.resume(co, 100) -- 返回(true, 2)
```

第一次调用`resume`时，参数就会被传入协程并保存。所以在此后再调用`resume`，无论传入什么样的参数都会被忽略，他只会用内部保存的参数。

#### 协程在IO多路复用中的优势

在网络程序中，我们会打开很多的socket。socket会做很多的IO操作。

阻塞式IO，会将需要读取的socket放入队列中等待IO，在此期间运行其他线程。这种情况下一个socket只能由一个线程管理。

非阻塞式IO，IO不会导致阻塞，但是需要频繁检查IO是否有数据，会增加CPU空耗时间。

IO多路复用，由操作系统提供支持，把需要等待的socket放入监听集合，通过一次系统调用同时监听多个socket，有socket需要处理时就拿出来处理。这也是现在大多的网络程序使用的方法。

IO多路复用的主要函数是`select`，`poll`和`epoll`。


但是即使是IO多路复用也有问题。这个时候协程可以在这种环境中发挥很好的功用。

每当监听的socket有新的连接诞生了，就为此新连接创建一个协程指向处理函数，每当需要等待IO时就主动让出，这样效率就会大大提高。

## Lua和C交互

## 参考

《Programming in Lua 2th》

[博客园-风雨缠舟-Lua的闭包详解](https://www.cnblogs.com/zzy-frisrtblog/p/5864209.html)

[博客园-会飞的斧头-lua线程和协程](https://www.cnblogs.com/xingchong/p/10322779.html)
