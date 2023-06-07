---
title: C++ Templates 3-一些细节
date: 2022-01-19 22:32:54
tags:
- cpp
category:
- language
---

这里是《C++ Templates 2th》的读书笔记

<!-- more -->

## 使用模板时的一些小知识

`typename`关键字用于告诉编译器接下来的东西是类型而不是其他，比如：

```cpp
template <typename T>
void foo() {
    typename Class::InnerType a;
    /* ... */
}
```

这里明确说明`InnerType`是`Class`内的类型，而不是静态成员变量或其他。

使用`a{}`的方式对变量进行零初始化：

```cpp
template <typename T>
void foo() {
    T a{};
}
```

基本数据类型会被初始化，bool初始化为false，数值类型初始化为0。C++11之前用`a()`的方式。

继承了模板类的子类，在调用父类的成员函数时需要显式地使用`this`或者`Base<T>::`:

```cpp
template <typename T>
class Base {
public:
    void DoSomething();  
};

template <typename T>
class Derived: public Base<T> {
public:
    void DoMyself() {
        this->DoSomething();
        // or use Base<T>::DoSomething();
    }  
};
```

**全特化的函数被视为全局函数而非模板函数**。这意味着在头文件中全特化某个模板函数时需要将这个函数声明为`inline`：

```cpp
template <typename T>
void foo() {
    std::cout << "template foo" << std::endl;
}

template <>
inline void foo<int>() {
    std::cout << "int foo" << std::endl;
}
```

某些时候需要使用`template`关键字显式指定要调用的是模板成员函数：

```cpp
std::cout << instance.template foo<int>(3) << std::endl;
```

这里如果不加`template`，编译器会将`<`视为小于的逻辑运算。

使用`auto`关键字来使用泛型Lambda：

```cpp
[](auto a, auto b) { return a + b; }
```

模板参数模板（Template Template Parameter）

指模板参数是一个模板，比如：

```cpp
template <typename T, typename Cont>
class A {
public:
    Cont container;
};
```

这里我们要存储的元素类型是`T`，容器的类型时`Cont`，但是我们使用的时候得指定容器内元素的类型：

```cpp
A<int, std::vector<int>> a;
```

我们想这样写：

```cpp
A<int, std::vector> a;
```

让C++自动推断容器元素类型。这个时候容器就必须变为模板参数模板：

```cpp
template <typename T,
              template <typename Elem, typename Allocator = std::allocator<T>>
              class Cont>
class A {
public:
    Cont<T> container;
};
```

这里要注意的是多出来的`Allocator`模板参数，因为`std::vector`的模板声明为：

```cpp
template<
    class T,
    class Allocator = std::allocator<T>
> class vector;
```

它是有两个模板参数的，所以如果我们要用`std::vector`作为其容器的话就必须将两个参数都适配上，这就是为什么`Allocator`也要写的原因。

上面的代码中`Elem`和`Allocator`都没有用到，没用到的模板参数可以省略名字：

```cpp
template <typename T,
              template <typename, typename = std::allocator<T>>
              class Cont>
class A;
```
