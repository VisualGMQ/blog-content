---
title: 从Python到Lua快速入门
date: 2019-08-10 23:17:34
category:
- language
---
# 序言
这份笔记记录的是从python到Lua，一个小时内入门Lua的教程。最好先熟悉python。
<!--more-->
# Lua的使用方法
首先你需要从官网上下载Lua：[官网](http://www.lua.org)

安装好Lua之后，和Python一样你可以直接在终端输入`Lua`打开Lua的交互式界面：

![屏幕快照 2019-05-07 下午11.18.30.png](/images/B40A7661A1EA71558D4A51F8D504588A.png)

需要注意的是，lua交互界面只能通过Ctrl+C或者函数`os.exit()`来退出。

如果你想要执行脚本文件的话，也是和python一样直接使用`lua filename`就可以了：

![屏幕快照 2019-05-07 下午11.22.05.png](/images/674A518ADE120D4ABE76165CB3A09545.png)

Lua文件的后缀名为`.lua`

# Lua的注释
Lua的行注释为`--`，块注释为`--[`,`--]`

# 基本数据类型和流程控制
## 变量
Lua和Python一样，变量无需声明直接使用，变量区分大小写。
需要注意的是，如果在Lua中使用了没有给出值的变量，会返回`nil`，nil相当于python的`None`。
而且在Lua中，除了遵循变量命名规范之外，所有以`_`开头的，后面为因为字母的（比如`_VERSION`）都会被视为系统内置变量。所以我们起名字的时候不要开头为一个下划线。

## 局部变量和全局变量
如果是局部变量，前面需要加`local`，如果是全局变量就不需要加。
**但是在Lua里，只有加了local的是局部变量，也就是说即使在函数或者循环内部的变量，如果前面没有加上local都算是全局变量！出了函数体或者循环等封闭空间外面还是可以使用这个变量**

## Lua的基本数据类型
`number, boolean, string, function, userdata, thread, table, nil`
其中number又包含`integer, double`。没有float。
boolean类型的取值为`true`,`false`。

和python一样，Lua也将函数视为数据类型function。thread是线程类型，userdata是Lua从C语言中获得的数据类型。因为Lua可以和C/C++原生嵌套使用，所以会又这样的类型。table相当于数组，后面会说明。

### string类型
string类型可以使用`'`或者`"`扩起来。这里需要注意的是，和python不一样，Lua中的string类型使用`..`进行连接，在字符串开头使用`#`获得字符串长度：

![屏幕快照 2019-05-07 下午11.30.45.png](/images/DCC21F119C2151CC4162D0E62D193B70.png)

你也可以使用`[[`,`]]`来扩起字符串，这样字符串中的特殊字符不会被转译。

#### 字符串函数
又很多字符串操作函数。注意**下面的函数中string不能省略，而且就是string，而不是要替换其他字符串**
* string.upper(argument):
字符串全部转为大写字母。
* string.lower(argument):
字符串全部转为小写字母。
* string.find (str, substr, [init, [end]])
在一个指定的目标字符串中搜索指定的内容(第三个参数为索引),返回其具体位置。不存在则返回 nil。
* string.gsub(mainString,findString,replaceString,num)
在字符串中替换,mainString为要替换的字符串， findString 为被替换的字符，replaceString 要替换的字符，num 替换次数（可以忽略，则全部替换）
* string.reverse(arg)
字符串反转
* string.format(...)
返回一个类似printf的格式化字符串
这个格式化方法和python一样，比如`string.format("this is %s", "a guy")`
* string.char(arg) 和 string.byte(arg[,int])
char 将整型数字转成字符并连接， byte 转换字符为整数值(可以指定某个字符，默认第一个字符)。
* string.len(arg)
计算字符串长度。
* string.rep(string, n)
返回字符串string的n个拷贝
* string.gmatch(str, pattern)
回一个迭代器函数，每一次调用这个函数，返回一个在字符串 str 找到的下一个符合 pattern 描述的子串。如果参数 pattern 描述的字符串没有找到，迭代函数返回nil。
* string.match(str, pattern, init)
string.match()只寻找源字串str中的第一个配对. 参数init可选, 指定搜寻过程的起点, 默认为1。 
在成功配对时, 函数将返回配对表达式中的所有捕获结果; 如果没有设置捕获标记, 则返回整个配对字符串. 当没有成功的配对时, 返回nil。

#### 表
表的类型是table。相当于数组。使用`{}`扩起来就可以了：

```c
a = {"stu1", "kil2", "pol3"}
```

你可以通过下标来找到内部的值。但是注意**下标从1开始**：

```lua
a[1] --stu1
a[3] --pol3
```

其实表是一个键值对，相当于python中的字典。其默认的键值对是这样：

```lua
a = {1:"stu1", 2:"kil2", 3:"pol3"}
```

这也就解释了为什么下标从1开始。
你也可以像python一样，动态添加元素：

![屏幕快照 2019-05-07 下午11.50.37.png](/images/21394E3F93876848464D3F593E35A407.png)

你也可以在初始化的时候指定键，键如果是字符串的话不需要加上双引号，如果是数字的话需要加上`[]`

![屏幕快照 2019-05-07 下午11.54.04.png](/images/D333186084605B3B2DCE094991932DCC.png)

如果表的键是字符串的话，你也可以使用`table.key`的形式来添加或者获得元素：

```lua
a = {}
a.name = "Visual" --等价于a["name"] = "Visual"
```

你也可以使用`#`放在表的前面来获得表中的元素。需要注意的是：**#获得的表的元素，其下标一定是要从1开始的连续下标，#会找到表中键为1的键，然后向后查找连续的键（2，3，4），每找到一个就会加1**。也就是说下面这些都会返回0:

```lua
t = {[2]=2,[3]=[3]}
t = {name="A", age=17}
```

而下面这些会返回非0值：

```lua
t = {name="a", age=123, [1]=10, [2]=20} --返回2
t = {[1]=10, [2]=20,[3]=30} --返回3
t = {name="a", [1]=1, [2]=2, [3]=3, [5]=7, [6]=7} --返回3
```

由于表的键值对可以是任何的东西，你也可以使用函数来当作值：

```lua
t = { fn = function() print("hello") end} --传入了一个匿名函数
```

使用`t:fn()`或者`t.fn()`来访问即可。

##### 表的操控函数
同样的，下面的`table`不可以被替换：
* table.concat (table [, sep [, start [, end]]]):
concat是concatenate(连锁, 连接)的缩写. table.concat()函数列出参数中指定table的数组部分从start位置到end位置的所有元素, 元素间以指定的分隔符(sep)隔开。
* table.insert (table, [pos,] value):
在table的数组部分指定位置(pos)插入值为value的一个元素. pos参数可选, 默认为数组部分末尾.
* table.remove (table [, pos])
返回table数组部分位于pos位置的元素. 其后的元素会被前移. pos参数可选, 默认为table长度, 即从最后一个元素删起。
* table.sort (table [, comp])
对给定的table进行升序排序。

#### 运算符
##### 数学运算符
`+,-,*,/,%,^(幂),//(整除)`
##### 逻辑运算符
和python一样,除了`~=(不等于)`。
需要说明的是。在赋值语句中，所有的非boolean量不可以自动转换为boolean量，就算是nil也不行。同样boolean也不会自动转换为其他量。
在条件判断中，只有nil是false，其他的所有值都会转换为true。
##### 关系运算符
`and or not`
这里需要注意一下关系运算符的返回值。
关系运算符的返回值不一定是`true`或者`false`。如果是not的话，的确会返回`true`或者`false`。但是and会让or不是这样。
and会根据短路原则，从表达式左边看向右边。并且如果在看到变量x的时候就已经确定表达式值的话，就会单击x。比如：
```lua
nil and "Hello" --返回nil
"Hello" and nil --返回nil
```
你也可以认为会返回从左往右的第一个为nil的值。如果所有值都不是nil的话，会返回最右边那个值。

or的话也是遵循短路原则，和and一样，比如：
```lua
nil or "Hello" --返回"Hello"
"Hello" or nil --返回"Hello"
"Hel1" or "hel2" --返回"Hel1
```
也就是说他会从左向右返回第一个不为nil的元素。如果所有元素都为nil就返回nil。
##### 位运算符
和C/C++一样。（左移右移也一样）

## 流程控制
注意Lua中只有`break`没有continue
### while循环和repeat...until循环
while循环的语法如下：

```lua
while(statement)do
--codes
end
```

repeat...until循环就是当条件为真的时候停止循环。这是从VB里面抄来的：

```lua
repeat
--codes
until(statement)
```

### for循环
for循环有两种，普通的for循环和for_each循环。
#### 普通for循环

```lua
for i=exp1,exp2,exp3 do
--codes
end
```

i的初值为exp1，循环到exp1，步长为exp3，exp3可以不写，默认为1。
用C++的话，相当于：

```lua
for(int i=exp1;i<exp2;i+=exp3){}
```

#### 遍历for循环
这种循环和python一样，比如遍历表：

```lua
for i,v in pairs(t) do
end
```

这里使用`pairs()`函数来将表t中的键和值连接成对。

### if语句

```lua
if(statement1)
then
--code1
[elseif(statement2)]
[then]
--code2
[else]
--code3
end
```

这个也是从VB抄来的。

### 变量可见性
请看下面的代码：

```lua
 x = 10                -- 全局变量
 do                   
   local x = x         -- 新的x
   print(x)            --> 10
   x = x+1
   do                 
     local x = x+1     -- 另一个x
     print(x)          --> 12
   end
   print(x)            --> 11
 end
 print(x)              --> 10  (全局的那个)
```

也就是说，使用local在局部范围内声明变量其实是创建了一个新的变量。如果你使用变量的话如果内部没有local变量，那么还是使用的全局变量。

# 函数
函数的声明格式如下:

```lua
[local] function funcname(args1, args2, args3, ...)
    --codes
    --return value
end
```

参数可以是很多个，和python一样，你可以return多个值。但是这里要注意：**和python不一样，返回多个值不代表你可以用一个变量去承接，如果你只有一个变量去承接多个返回值的话，Lua不会默认那个变量为表，而是将第一个返回值给那个变量**，像这样：

```lua
local function fn()
    return 1,2,3
end

a = fn() --a=1
a,b = fn() --a=1, b=2
a,b,c=fn() --a=1,b=2,c=3
a,b,c,d=fn() --a=1,b=1,c=3,d=nil
```

函数参数**不能**有默认值

函数可以有不定参数，通过`...`来指定：

```lua
function fn(...)
end
```

最扯的是这个`...`就是不定值，你如果想要获得不定值就要对这个`...`迭代。但是必须要先将其变成表（因为在Lua中只有表可以 迭代）：

```lua
funnction fn(...)
    local args={...} --变成表
    for i,v in pairs(args) do
        print(v)
    end
end

fn(1,4,2,6)
--1426
```

 如果函数只有一个参数，并且这个参数为表的话，我们可以省略括号：

```lua
#!/usr/local/bin/lua
function fn(param)
    print(param)
end

fn{1,4,2}
```

# 传值与传引用
和python一样，只有对象才能传引用。在Lua中table类型就相当于对象一样，所以只有table类型是传引用，通过赋值运算符也是浅拷贝。

# 包
## 导入包
和python一样，可一个Lua文件都可以被视为一个包。
导入包的函数为`require()`。需要注意的是Lua的包搜索路径在环境变量`LUA_PATH`中。比如：

```c
require("model") --Lua会在LUA_PATH中找名称为model.lua的文件  
```

你也可以给导入的包取别名，只需要使用变量赋值就可以了：

```c
local m = require("model") --model的别名为m
```

## 声明包
包其实是一个表。只不过在文件的最后部分你需要写上`return 包名`，比如这样:

```lua
-- model.lua中
model = {}

model.constant = "this is a constant"

function model.func1()
    print("this is func 1")
end

function model.func2()
    print("this is func2")
end

local function func3()
    print('this is a local function')
end

return model

-- main.lua中
#!/usr/local/bin/lua
require("model")

model.func1()
model.func2()
print(model.constant)

--[
结果:
this is func 1
this is func2
this is a constant
--]
```

也就是说，导入包其实是导入文件中的那个表。注意**函数前标有local的是局部函数，不能再包外面使用的**

# 文件IO
Lua的文件IO也很简单，分为简单模式和完全模式。

首先是打开文件的操作：

```c
file = io.opne(filename[, openmode])
```

其中参数和python，C/C++一样。openmode是打开方式，可以是"w,w+,r,r+,b"等。

## 简单模式

简单模式一次只能打开一个文件，像是这样：

```c
file = io.open("test.txt", "r+") --打开文件
io.input(file) --将file放入io.input中表示接下来要对这个文件读取，如果是写入就放入io.output()中
print(io.read()) --读出一行并输出，如果是写的话就是io.write()
io.close()
```

也就是说，在简单模式下我们必须将文件放入`io.input`或者`io.output`中才可以读取，这也就是为什么一次只能使用一个文件的原因。

## 完全模式
完全模式在打开文件之后，通过文件返回值就可以直接对文件操作：

```c
file = io.open("test.txt", "r+")
print(file:read()) --通过 file:read()来读取，或者file:write()可以写入
file:close() --通过file:close()来关闭
```

没错，通过`file:operator()`就可以直接对文件读取了，不需要放入io中。

# 错误处理
由于Lua是纯C写的，而C没有错误处理功能，所以Lua也没有，要想使用错误处理只能通过下面的办法：
* 使用`assert(statement)`函数抛出运行时错误，这一点和C一样
* 使用`error(msg[, level])`函数终止当前函数运行，并且打印错误信息。他会打印msg参数，并且level参数有三个等级：
  * Level=1[默认]：为调用error位置(文件+行号)
  * Level=2：指出哪个调用error的函数的函数
  * Level=0:不添加错误位置信息
* 使用`xpcall, pcall`函数提前检测函数是否会发生错误

这里需要对最后两个函数说明一下。`xpcall`和`pcall`需要 传入一个函数，以及这个函数需要的参数。他会先自己运行这个函数。如果函数有错误会返回false和erroinfo，没有错误返回true（但是出了错不会产生异常）。xpcall的话多一个参数，用于在有错误的时候自动处理：

```c
#!/usr/local/bin/lua
local function test(n)
    print(n)
    assert(false)
end

if(pcall(test, 6)) then
    print("no error")
else
    print("error")
end

--[输出
6
error 
--]

#!/usr/local/bin/lua
local function test(n)
    print(n)
    assert(false)
end

if(xpcall(test, function() print("this is error handle function") end,6)) then
    print("no error")
else
    print("error")
end

--[输出
6
this is error handle function
error
--]
```

需要注意的是，这里你不能使用除零错误，因为Lua里面有针对无限大的关键字`inf`，如果除零的话会返回inf而不是报错。

元表也是一个表，他可以作为一个表附着在另一个表上，并且提供一些功能和值。

# 设置/获取元表
设置和获取元表的函数为

```lua
setmetatable(dsttable, metatable)
getmetatable(table)
```

通过`setmetatable`可以将metatable放座位dsttable的元表，然后这个函数返回新生成的表（你可以不接受这个返回值，因为这个操作本身就已经改变了dsttable了）
通过`getmetatable`可以获得table的元表

# 元表的用途
元表只有一个作用：
* 在发生某些操作时出发mt中的元方法。

其实就是给本来的表添加元方法。

所谓元方法，就是针对表的操作而自动触发的方法。

# 元方法的编写
## __index元方法
当你通过键来访问 table 的时候，如果这个键没有值，那么Lua就会寻找该table的metatable（假定有metatable）中的__index 键。如果__index包含一个表格，Lua会在表格中查找相应的键。比如说这样：

```lua
#!/usr/local/bin/lua
mt = {__index = {name="VisualGMQ", age=19}}
t = {height = 17, width = 1}
setmetatable(t, mt)
print(t.name)

--结果 VisualGMQ
```

可以看到t中是没有name这个键的，所以在元表mt中查找了。

如果`__index`是一个函数的话，Lua会调用那个函数，并且会把表和查询的键作为参数传过去：

```lua
#!/usr/local/bin/lua
mt = {__index = function(tb, key)
    print(key, " is not exists in", tb)
end}
t = {height = 17, width = 1}
setmetatable(t, mt)
print(t.name)

--[结果
name	 is not exists in	table: 0x7fcbc44071f0
ni
--]
```

## __newindex
 这个元方法在插入不存在的键的时候会调用。会将表，键和值当作参数传入：

```lua
#!/usr/local/bin/lua
mt = {__newindex = function(tb, key, value)
    print(key, " is not exists in", tb)
    print("insert", value)
    rawset(tb, key, value)
end}
t = {height = 17, width = 1}
setmetatable(t, mt)
t.name = "VisualGMQ"

--[结果
name	 is not exists in	table: 0x7fb420c06da0
insert	VisualGMQ
--]
```

通过调用`rawset()`函数可以给原来的表插入键值对。

## 运算式元方法
有`__add(+), __sub(-), __mul(*), __div(/), __mod(%), __unm(取反), __concat(..连接), __eq(==),__lt(<),__le(<=)，__pow(^),__gc(变量销毁时调用)`
这些元方法都会将运算符左右的两个表传入函数中（如果是单目运算符就传入一个表）。

### __tostring
使用print函数打印表的时候会调用这个元方法。这个方法传入调用表到函数里。

### __call
这个元方法是当表作为函数形式的时候会调用：

```lua
#!/usr/local/bin/lua
mt = {__call= function(tb, param)
    print(param)
end}
t = {height = 17, width = 1}
setmetatable(t, mt)
t(32)
t({1,2,3})
t(false)

--[
32
table: 0x7fb1cec06fc0
false
--]
```
# 面向对象

面向对象语言必然有面向对象的三大特性：封装，继承，多态。
Lua中的面向对象是靠表完成的。

## 封装
这个很显然了，在包一节就已经说过了：

```lua
Shape = {}
Shape.style = "circle" --封装变量

--封装函数
function Shape.area()
end
```

当然你也可以通过`function Shape:are()`来声明。对于函数来说，使用`:`会额外传入一个`self`参数代表自身，这个和python一样。但是`.`是不会传入的：

```lua
shape = {}
function shape:area()
    print(self)
end


function shape.fn()
    print(self)
end

shape.area()
shape:area()
shape.fn()
shape:fn()
--[结果
nil
table: 0x7fbf0f500200
nil
nil
--]
```

可见。只有通过`:`定义并且通过`:`调用的函数才会传入self，其他的均不会传入self。

你可能会疑惑如何定义构造函数。其实使用元表就可以了：

```lua
#!/usr/local/bin/lua
person = {}

function person:new(name, age, height)
    self.__index = self
    o = setmetatable({}, self)
    o.name = name
    o.age = age
    o.height = height
    return o
end
```

这里我们来详细说明一下，首先定义一个空表。然后我们暂时将构造函数的名称成为`new`，在new函数里面首先`self.__index = self`，然后将self设置为元表。这样的话我们后面如果调用了不存在的函数，就会在self里面找，就可以找到结果了。这一步其实就是强制如果没有函数就在自己的self中找。如果找不到那么就结束查找。
然后就是使用`self.xxx`来设置变量了。

接下来我们来设置一些成员函数：

```lua
function person:getName()
    return self.name
end

function person:getAget()
    return self.age
end

function person:print()
    print(self.name, self.age, self.height)
end
```

这些函数都必须是`:`声明的，因为我们要用到self。
因为要用到self，所以我们也必须通过`:`调用：

```lua
p = person:new("VisualGMQ",17,170)
p:print()
```

这样就完成了一个类。

如果你还想加入析构函数，就指定`self.\_\_gc`吧。

## 继承
继承也很简单：

```lua
child = person:new()
  o = person:new("Visual", 170, 28) --调用父类的构造函数并且得到一个父类的对象
  setmetatable(self, person) --将父类作为子类的元表。这样我们就可以调用父类继承的函数了。
  o = setmetatable(o, self) --再将本类作为o的元表，这样我们就可以使用子类的方法了。
  self.__index = self --如果没有函数，就在自己的类里面查找
  return o  --返回实例
end
```

上面的代码造成了这样一个情况：

![屏幕快照 2019-05-12 下午2.42.34.png](/images/369987A2F8D7C071D6D0F4CA96D06F63.png)


这样有一个什么情况呢，当我们调用了child的方法， 比如print()，这个时候会在`self`中查找这个方法。我们当然有这个方法，所以会调用child:print()方法。这样子类就重写了父类的方法了。
如果我们在child对象中调用`getName()`方法的时候，首先会在self中找，但是self中没有这个方法，那么就会在self 的元表中找。self 的元表我们已经动议为person了，所以就会在person中找，这样就会找到父类的getName()方法，这样就可以找到父类的方法了。这就是方法的继承。成员变量也是同样的道理。