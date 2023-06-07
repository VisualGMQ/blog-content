---
title: C++强枚举类型
date: 2019-08-13 22:15:37
category:
- language
tags:
- cpp
---

强枚举类型是C++11新增加的功能。其实强枚举类型和Java中的枚举类型有点像：

* 不能够隐式转换为整数转换

并且还有比较新的特性：

* 可以指定底层数据类型。原本所有的enum底层都是int类型，但是现在你可以指定除了`wchar_t`类型之外的所有整型类型作为底层数据了。
* 获得枚举常量必须通过`::`来获得
<!--more-->

比如：

```c++
#include <iostream>
using namespace std;

enum class Type{
    TYPEA = 1,
    TYPEB,
    TYPEC
};

enum class Class: unsigned char{
    CLASSA=2,
    CLASSB,
    CLASSC
};

int main(){
    Type type = Type::TYPEA,
        type2 = Type::TYPEB;
    int value = int(type);
    type = Type(2);
    //cout<<type<<endl;
    //int value = type;
    //Class c = CLASSA;
    Class c = Class::CLASSA;
    cout<<(type<type2)<<endl;
    return 0;
}
```

这里直接输出`type`是不行的，因为以往的非强类型都是隐式转换为整型再输出的。也不能直接赋值给整型。但是可以使用强制转换再整型和强枚举之间转换。
可以看到`Class c = CLASSA;`也是不行的，只能通过域解析符来获得，加强了作用域。

其实强枚举类型的底层不再是int，而是类。也就是说强枚举类型其实是用类实现的，要不然怎么叫`enum class`呢。
