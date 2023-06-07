---
title: C++处理XML文件(TinyXML2)
date: 2019-07-28 16:01:01
category:
- language
tags:
- cpp
---
# 使用的库

我们使用TinyXML2库来处理XML文件。TinyXML2库是一个完全面向C++的库。是一个易学，轻量级的库。
<!--more-->
***
# TinyXML2的使用方法
## 使用准备
想要使用TinyXML2，你需要包含头文件`tinyxml2.h`，然后使用命名空间`tinyxml2`:

```c
#include "tinyxml2.h"
using namespace tinyxml2;
```

## TinyXML2对XML文件的结构
![xml_intro.png](/images/3BC3CBC68AF4D5C5C9CE913FC2F5EC9E.png)

## 读取和获得XML文件及元素
首先来看一下要读取的XML文本：

```xml
<?xml version="1.0"?>
<story>
    <storyinfo>
        <author>John Fleck</author>
        <datewritten>June 2, 2002</datewritten>
        <keyword>example keyword</keyword>
    </storyinfo>
    <body>
        <headline id="id1">This is the headline</headline>
        <para>This is the body text.</para>
        <!--this is a comment-->
    </body>
</story>
```

首先，TinyXML2通过`XMLDocument`来定义一个XML文件，我们可以这样打开一个XML文件：

```c
XMLDocument doc;
doc.LoadFile("testXML.xml");
```

注意XMLDocument本身的构造函数是不允许直接打开XML文件的。

然后可以使用`RootElement()`的方法来获得根元素（要注意声明不是根元素，根元素是声明下面的第一个元素）。或者使用`FirstChildElement()`来获得第一个子元素（因为现在在文档的开头，所以仍然是根元素）。获得的元素类型是`XMLElement`，可以有`Value()`方法来获得元素的内容（如果没有内容返回名称），`Name()`方法获得元素名称:

```c
cout<<doc.RootElement()->Value()<<endl;
cout<<doc.FirstChildElement()->Value()<<endl;

//story
//story
```

当我们获得XML中的一个元素的时候，我们可以调用其方法来获得和其有关的元素，具体方法如下：

![tinyxmlAPI.png](/images/457DB86284F5D727D18CC87CC8C028C3.png)

`NoChildren()`判断是否有子节点。另外还有`GetLineNum()`来获得当前行号。需要注意的是，我们还有如下函数来获得信息:
* `FirstChild()`
* `LastChild()`
* `NextSibling()`
* `PreviewsSibling()`

这些函数和图中的函数就差一个Element单词。正如函数名所言，带有Element的函数都是会返回`XMLElement`的。但是不带Element的函数返回`XMLNode`，XMLNode是所有XML元素（包括`XMLElement`,`XMLComment`,`XMLAttribute`等）的父类。也就是说如果你使用`doc.FirstChildElement()`函数，指明了获得元素，那么会获得\<story\>标签。但是如果你使用`doc.FirstChild()`，那么会返回声明（`XMLDeclaration`），因为声明才是第一个子节点。

如果不存在某个元素，那么会返回空指针。

有了以上函数，你就可以自由在XML中游走了。

##写XML文件
写XML文件的操作也是封装在XMLNode类中，你可以对任意一个XMLNode的子类进行节点的插入操作。但是要想产生节点，只有通过XMLDocument的工厂函数来创造（不支持直接new）。

![屏幕快照 2019-06-25 上午9.50.24.png](/images/4AA6E837C97B542F7BF0E80316EF9058.png)

也就是说XMLDocument不支持加入属性等，但是可以创建元素。一般我们会首先获得创建的元素，然后对元素的一些属性进行设置，然后再将元素链接到父元素中：

```c
XMLDocument doc;
XMLDeclaration* declaration =  doc.NewDeclaration("version=3.2 encoding=UTF-8");
doc.InsertFirstChild(declaration);
XMLElement* root = doc.NewElement("root");
root->SetAttribute("author", "VisualGMQ");
root->SetAttribute("age", 20);
XMLElement* ele1 = doc.NewElement("data");
ele1->SetText("2019.06.25");
root->InsertFirstChild(ele1);
XMLComment* comment = doc.NewComment("this is a comment");

root->InsertEndChild(comment);
doc.InsertEndChild(root);
doc.SaveFile("ret.xml");
return 0;
	
/*
<?version=3.2 encoding=UTF-8?>
<root author="VisualGMQ" age="20">
    <data>2019.06.25</data>
    <!--this is a comment-->
</root>
*/
```

通过`SaveFile()`函数来保存文件。

通过以上函数，你可以随意创建XML文件了。

## 获得属性元素
TinyXML对元素的获得有一些解析方法，可以将属性解析成各种类型的数据：
* Attribute():直接返回String
* IntAttribute():返回整型
* BoolAttribute():返回布尔类型
* DoubleAttribute():返回double
* FloatAttribute():返回float
* Int64Attribute():64位整型

以方便用户获得不同的数据类型。

## 错误处理
你也可以用下面的函数进行错误处理：
* Error()
* ErrorID()
* ErrorIDToName()
* ErrorLinenum()
* ErrorName()
* ErrorStr()
* ClearError()
* PrintError()

上面的函数只能针对`XMLDocument`来使用。用于在XMLDocument加载xml文件时解析错误而调用的。