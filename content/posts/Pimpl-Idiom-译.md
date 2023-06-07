---
title: Pimpl Idiom(译)
date: 2021-10-08 14:58:19
tags:
- cpp
category:
- language
---

本文翻译了部分的[Pimple Idiom](http://wiki.c2.com/?PimplIdiom)文章，其讲述了C++中`Pimpl`的用法。

<!--more-->

`Pimpl Idiom`（Pimpl习语），也被称为`compilation firewall`（编译防火墙）和`Cheshire Cat technique`（切西尔猫技术），是一个“私有实现”的技术，仅用于C++和静态编译类型语言。  

优点：
* 当改变类的私有成员时不需要重新编译依赖这个类的文件。这会使编译速度提高，并且可以缓和[脆弱二进制接口](http://wiki.c2.com/?FragileBinaryInterfaceProblem)问题。
* 头文件中不需要`#include`任何在类私有成员中使用的类，所以可以增加编译速度
* 这有点像SmallTalk自动处理类的方式...更纯粹的封装

缺点：
* 开发者要为此做更多的工作
* 对`protected`和`public`这种子类可以接触到的成员不管用
* 可能会使代码更难阅读，因为有一些信息会不在头文件中
* 由于要使用指针间接指向类的实例，所以运行时性能略有降低，特别是调用虚函数的时候(CPU的分支预测可能无法起到作用)。

如何做：
* 将所有的`private`成员放到一个结构体中
* 将这个结构体的定义放在`.cpp`文件中
* 在头文件中，给出这个结构体的前置声明
* 类的构造函数需要创建这个结构体的实例，并且在析构函数中析构他（如果你没有使用智能指针的话）
* `operator=`和拷贝构造函数要能够正确地拷贝这个结构体，或者直接禁用这些函数

---

接下来是译者举的例子（原文中莫得例子）  

首先来看一个类一般的实现方法：

```c++
// Person.hpp

class Person {
public:
    Person(const std::string& name, int age, float height);
    ~Person() = default;

    inline const std::string& GetName() const { return name_; }
    inline int GetAge() const { return age_; }
    inline float GetHeight() const { return height_; }

private:
    std::string name_;
    int age_;
    float height_;
};
```

如果我们想要给`Person`增加一个`school`成员，这样就会修改`Person`类，也就是修改了`Person.hpp`文件，这样所有包含了`Person.hpp`文件的文件就需要重新编译。  
但是使用`Pimpl`技术可以避免重新编译：  

```c++
// Person.hpp

struct Data; // 私有成员结构体的前置声明

class Person {
public:
    Person(const std::string& name, const std::string& school, int age, float height);
    ~Person() = default;

    const std::string& GetName() const;
    const std::string& GetSchool() const;
    int GetAge() const;
    float GetHeight() const;

private:
    std::unique_ptr<Data> pimpl_; // 使用指针指向私有成员的结构体
};



// Person.cpp

// 定义私有成员结构体
struct Data {
    std::string name;
    int age;
    float height;
    std::string school;
};

// 实现Person的成员函数

Person::Person(const std::string& name, const std::string& school, int age, float height) {
    // 首先给pimpl_分配内存
    pimpl_ = std::make_unique<Data>();
    pimpl_->name = name;
    pimpl_->school = school;
    pimpl_->age = age;
    pimpl_->height = height;
}

const std::string& Person::GetName() const {
    return pimpl_->name;
}

// 其他的Getter和Setter函数一样实现，就不在此赘述了
```

这样由于你每次修改`Person`的`private`成员的时候，其实都是修改`Data`成员，而`Data`成员是在`.cpp`文件中的，其他包含了`Person.hpp`的文件无法看到，所以不会重新编译。

---

下面节选了一些网友的评论：

来自**JohnCarter**的评论：

> 有一个更好的理由去使用这项技术：在创建单元测试的时候。假设你有一个包含了很大成员的对象：
>
> ```c++
> class A {
>  private:
>   BigScaryMonster orc;
>   BiggerScarierMonster troll;
>  };
> ```
>
> 如果你包含了`A.h`，你需要编译和连接这大的吓人的东西，尽管他们是私有的的。这会导致你链接`BigScaryMonster.o`和`BinggerScarierMonster.o`以及这个文件。  
> 你可以创造一个不含这两个成员的MockA来代替A进行测试。然而，如果你在单元测试中不小心包含了其他的包含了`BigScaryMonster.h`和`BiggerScarierMonst.h`的头文件时，他仍会拖慢你的编译速度。而你的单元测试其实只需要看到MockA就够了。  
> 这个时候就可以用Pimpl:
>
> ```c++
> struct AImp;
> class A {
> public:
>   // Same public interface as A, but all delegated to concrete implementation.
> private:
>   AImp * pimpl;
> };
> ```
>
> 这样就可以避免上述问题带来的编译时长。

来自**FernandoRamos**的评论：

> 还有一件事使它成为一个非常有用的习惯用法，那就是它为您提供了一种从第三方库继承功能而不向类用户传递任何对该库的依赖关系的方法。只需让您的XImpl类继承第三方库类。因为依赖项仅在.cpp文件中，而不是头文件中。
