---
title: C++处理Json文件(Jsoncpp)
date: 2019-07-28 16:01:01
category:
- language
tags:
- cpp
---
# 使用的库

我们使用的库是`Jsoncpp`库，是一个面向对象的C++库。
<!--more-->

***
# Jsoncpp的使用方法
##使用准备
首先要包含头文件`json.h`，然后要使用命名空间`Json`。（下面为了清晰我们并没有使用Json命名空间）:

```c
#include <json.h>
//using namespace Json;
```

## Jsoncpp对文件的结构
Jsoncpp对文件的结构很简单：**所有的花括号扩起来的都代表一个`Json::Value`，然后里面是键-值对。值可以是任意的基本数据，也可以是Json数组或者另一个Json::Value**：

![json.png](/images/5DAFA975ABB8CB992727B998C4A009DA.png)

## Json文件的写入
Json文件的写入很简单，只要构造`Json::Value`就可以了。
由于Json首先就是以一个大括号（Json对象）开始的，所以我们先声明一个Json::Value:

```c
Json::Value root;
```

然后就可以通过类似map的方法添加键值对了：

```c
root["name"] = Json::Value("VisualGMQ");
root["age"] = Json::Value(20);
```

这个时候的Json文件如下：

```json
{
    "name": "VisualGMQ",
    "age": 20
}
```

如果你想要添加另一个json对象也可以：

```c
Json::Value info;
//给info添加元素
info["school"] = "AnHuiLiGongDaXue";
info["credit"] = "2017303119";
info["male"] = true;
//将info加到root里面
root["info"] = info;
```

这个时候就变为：

```json
{
    "name": "VisualGMQ",
    "age": 20,
    "info": {
        "school": "AnHuiLiGongDaXue",
        "credit": "2017303119",
        "male": true
    }
}
```

如果想要添加数组的话，只需要使用`append()`方法：

```c
root["friend"].append("XianFen");
root["friend"].append("CaiChuanXun");
root["friend"].append("WuTao");
```

最后结果为：

```c
{
    "name" : "VisualGMQ"
	"age" : 20,
	"info" : 
	{
	    "school" : "AnHuiLiGongDaXue"
		"credit" : "2017303119",
		"male" : true,
	},
	"friend" : 
	[
		"XianFen",
		"CaiChuanXun",
		"WuTao"
	],
}
```

如果想要删除，就使用`removeMember()`方法。


接下来应该将Json数据写到文件中。这里有两种方法：
* 使用`FastWriter`和`StyledWriter`将数据变为字符串，然后通过C++IO来写入文件（这个方法已经废弃，使用的话会给出警告，但是却很方便，所以也列了出来）
* 使用`StreamWriterBuilder`和`StreamWriter`来将数据变为字符串，然后通过IO写入文件。

也就是说，**Jsoncpp本身是不能直接写入文件的，而必须先变为字符串，再通过C++原生IO写入文件。**

### 使用`FastWriter`和`StyledWriter`
这两个类的用法其实是一样的：

```c
Json::FastWriter wb;
string str = wb.write(root);
```

首先声明对象，然后调用write方法传入要变为字符串的Json对象（这里传入root表示整个Json对象）就可以得到字符串了。然后通过C++IO就可以写到文件里面去了：

```c
ofstream ofile("ret1.json");
ofile<<str;
ofile.close();
```

结果如下：

```json
{"age":20,"friend":["XianFen","CaiChuanXun","WuTao"],"info":{"credit":"2017303119","male":true,"school":"AnHuiLiGongDaXue"},"name":"VisualGMQ"}
```

 `FastWriter`和`StyledWriter`的区别在于，`FastWriter`是不管格式的，会写的很快（像上面那样）。但是`StyledWriter`会通过缩进来控制格式。

### 使用`StreamWriterBuilder`来写入
首先我们需要一个`StreamWriterBuilder`对象：

```c
Json::StreamWriterBuilder wb;
```

可以从名称看出，wb是一个“Builder”，也就是说他可以产生写入器。
`StreamWriterBuilder`的作用是在写文件之前给出一些配置。配置的话直接通过`[配置名称]=配置`就可以了，比如`wb["useSpecialFloats"] = true;`这样。有如下配置：

* "commentStyle": "None" or "All"代表注释风格
* "indentation": "<anything>"代表前缀，就是标有'$'的这里:
  ```Json
  {
  $$"name" : "VisualGMQ"
	"age" : 20,
	"info" : 
  $${
  $$$$"school" : "AnHuiLiGongDaXue"
  $$$$"credit" : "2017303119",
  $$$$"male" : true,
  $$},
	"friend" : 
  $$[
  $$$$"XianFen",
  $$$$"CaiChuanXun",
  $$$$"WuTao"
  $$],
  }
  ```
  一般我们也不会去改动这个属性，当然这个属性默认为四个空格。
* "enableYAMLCompatibility": false or true代表是否兼容Yaml，如果为true会在格式上有一些改变
* "dropNullPlaceholders": false or true丢弃null值。
* "useSpecialFloats": false or true如果为true，那么Nan就会记为"NaN"，float类型的INFINITY也会被记为"Infinity"
* “precision":小数的精度，默认为17.

你可以用`setDefaults()`函数来将设置变为默认的。或者通过`validate()`来判断此StreamWriterBuilder的配置是否正确。

配置好之后，你有两种选择来将Json数据变为字符串：

* 直接变为字符串
  通过调用`Json::writeString`方法来变为字符串：
  ```c++
  string str = Json::writeString(wb, root);
  ```
* 产生写入器，然后通过写入器变成字符串:
  ```c++
  Json::StreamWriterBuilder swb;
  Json::StreamWriter* sw = swb.newStreamWriter();
  ofstream ofile("ret1.json");
  sw->write(root, &ofile);
  ofile.close();
  ```
  这里通过swb的`newStreamWriter()`创建一个写入器sw，然后通过其（也是仅有的）`write`方法写入ofile流中。
  写入器的第二个参数是ostream\*，也就是说你可以写到文件流中，也可以直接写到输出流中。这里就比第一种方法要 更具有灵活性了。

## Json文件的读取
Json文件的读取也有两个方法：使用`CharReaderBuilder`，`CharReader`或者`Reader`来读取。
需要说明的是，Json也不支持直接从文件中解析Json文件。你应该使用C++IO先将文件读到字符串中，然后再给Jsoncpp解析：

```c
ifstream ifile("test.json");
ifile.seekg(0, ios::end);
int len = ifile.tellg();
ifile.seekg(0, ios::beg);
char buffer[1024] = {'\0'};
ifile.read(buffer, len);
//数据存储在buffer里
```

### 使用`Reader`来读取
和`Writer`一样，Reader也已经被抛弃了。但是用起来还是很顺手。用法其实和Writer差不多：

```c
Reader rd;
Json::Value root;
rd.parse(buffer, root, false);
```

首先声明Reader对象，然后调用`parse`函数，第一个参数是要解析的文本字符串，第二个参数是解析完成之后返回的Json::Value，第三个参数表示是否也解析注释。如果为false则会丢弃注释。

然后你就可以使用Json::Value来获得元素了。

### 使用`CharReaderBuilder`，`CharReader`读取
其实和写入一样，首先通过`CharReaderBuilder`来设置一些读取设置，然后通过`newCharReader()`函数构造一个CharReader，然后解析获得一个Json::Value：

```c
Json::CharReaderBuilder crb;
Json::CharReader* cr = crb.newCharReader();
Json::Value root;
JSONCPP_STRING err;
cr->parse(&buffer[0], &buffer[len], &root, &err);   //返回true解析完成，false解析失败
```

但是CharReader解析Json有一个很麻烦的事情，就是它的parse函数需要传入要解析文本的第一个字符和最后一个字符，来确定要解析哪一段。这样你就必须在读取json文件的时候顺便将文本长度读取出来（或者你直接用strlen(buffer)也可以）。
`parse`函数第一个参数是开始解析的文本，最后一个参数是结束的文本，第三个参数是要返回的Json::Value，最后一个参数是错误信息。

至于CharReaderBuilder的设置，有如下值：
* "collectComments": false or true  是否解析注释，如果allowComments参数为false就无视这个设定
* "allowComments": false or true  是否允许注释
* "strictRoot": false or true 严格要求根元素为数组或者Json对象（严格遵循json格式）
* "allowDroppedNullPlaceholders": false or true 是否丢弃null值
* "allowNumericKeys": false or true 是否允许解析数学类型的键
* "allowSingleQuotes": false or true  是否连同键值对左右的`"`符号一并保留。
* "stackLimit": integer 超出integer大小的话会抛出异常
* "rejectDupKeys": false or true如果为true，当json对象中有重复的键时`parse`函数会返回false
* "allowSpecialFloats": false or true是否允许Nan和Infinity

### 通过Json::Value来获得键值
我们得到了Json::Value，就需要通过Json::Value来获得信息。
先是如下的函数来帮我们判断这个Json::Value对象包含的值类型：
`isNull, isBool, isInt, isInt64, isUInt, isUint64, isIntegral, isDouble, isNumeric, isString, isArray, isObject`。
然后你可以通过这些判断来调用一下函数获得对应的值：
`asInt, asInt64, asUInt, asUInt64, asLargestInt, asLargestUInt, asFloat, asDouble, asBool, asString, asCString`。
或者通过`isMember()`来判断某个键在不在此Value中。
如果你事先已经知道了是什么类型的值，你也可以直接通过下标运算来获得。
或者你也可以通过`get()`函数来获得，第一个参数是要获得值的键名，第二个参数为Json::Value，指出如果键不存在的默认返回值。

你也可以通过`size()`函数得到数组的大小或则会json对象的值个数。
通过`empty()`来判断数组和对象是否为空。
通过`isValidIndex()`来判断下标是否越界。

你也可以通过`toStyledString()`来返回整个字符串。