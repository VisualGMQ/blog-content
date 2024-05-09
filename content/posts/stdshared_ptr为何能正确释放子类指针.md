---
title: std::shared_ptr为何能正确释放子类指针
date: 2023-10-23T09:53:16+08:00
tags:
- cpp
category:
- language
---

本文简述了`std::shared_ptr`可以通过在父类析构函数非虚的情况下，通过父类指针正确释放子类的特点，以及一个简单实现。

<!--more-->

## 现象

今天在知乎上看到了这个问题，就记录一下：

首先，对于两个类：

```cpp
class Parent {
public:
    ~Parent() {
        std::cout << "parent" << std::endl;
    }
};

class Child: public Parent {
public:
    ~Child() {
        std::cout << "child" << std::endl;
    }
};
```

如果父类析构函数不是虚函数，那么使用父类指针指向子类并析构不会调用子类的析构函数（因为没有虚函数表，找不到子类的析构函数）：

```cpp
Parent* p = new Child{};
delete p;

// 输出 parent
```

但是`std::shared_ptr`是可以做到正确释放的：

```cpp
std::shared_ptr<Parent> p = std::make_shared<Child>(new Child{});
p.reset();
```

因为`std::shared_ptr`内部存储了子类的信息，可以正确释放。

## 简单实现

我们自己要实现`std::shared_ptr`的话可以将指针从父类转换成子类，然后调用子类的析构函数来正确析构：

```cpp
template <typename T>
class DestructWithBases final {
public:
    template <typename U>
    struct traits {
        static void destruct(T* ptr) {
            delete (static_cast<U*>(ptr));
        }
    };

    template <typename U>
    DestructWithBases(U* u): value_(u), destruct_(traits<U>::destruct) { }

    ~DestructWithBases() {
        destruct_(value_);
    }

    T* operator->() {
        return value_;
    }

private:
    T* value_; 
    void(*destruct_)(T*);
};
```

这里`traits::destruct`会将父类指针转换为对应子类，然后析构。在构造函数时将对应函数记录下来即可（拷贝和移动构造也要记录，但是我懒得写了）