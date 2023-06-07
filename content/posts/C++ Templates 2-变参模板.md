---
title: C++ Templates 2-变参模板
date: 2022-01-19 22:32:54
tags:
- cpp
category:
- language
---

这里是《C++ Templates》第二版的读书笔记

<!--more-->

## 变参模板(Variadic Template)

使用方式如下：

```cpp
template <typename... Args>
void foo(Args... args);
```

这里的`Args`被称为`template parameter pack`，而`args`被称为`function parameter pack`。

这里有一个输出每个参数的例子：

```cpp
void Print() {}

template <typename T, typename... Args>
void Print(T value, Args... args) {
    std::cout << value << std::endl;
    Print(args ...);
}


int main() {
    Print(1, 2.18, "string");
}
```

使用模板变参的时候不能够像使用vector一样去遍历，我们只能通过递归的方式处理参数。

这里`Print`调用之后，所有的参数都会被传入`void Print(T, Args...)`中，这会让此函数展开为`void Print<int, int, const char*>(1, 2, "string")`，而1会传给`value`，剩下的参数会传给`args`，所以会输出1。然后此函数再次递归地调用自己，将2输出，再是最后的字符串，直到没有任何参数剩下时，会调用普通的`print(){}`函数结束递归。

如果存在普通参数模板（如`template <typename T> void Print(T value)`），则会在只剩下最后一个参数时调用此模板函数（因为此模板的条件最为精确）。

## sizeof...

在C++11中，可以通过`sizeof ...`操作符得到模板变参的个数：

```cpp
template <typename T, typename... Args>
void Print(T value, Args... args){
    std::cout << "remain paramter num = " << sizeof...(args) << std::endl;
    /* ... */
}
```

或者写`sizeof...(Args)`也可以。

## 折叠表达式(Fold Expression)

C++17开始可以使用折叠表达式来对模板变参进行一些简单操作：

```cpp
template <typename... Args>
auto Sum(Args... args) {
    return (... + args);
}
```

这个式子对所有的参数进行求和。

有如下可能的折叠表达式形式：

| 折叠表达式                 | 如何求值                                           |
| --------------------- | ---------------------------------------------- |
| (... op pack)         | (((pack1 op pack2) op pack3 ... op packN)      |
| (pack op ...)         | (pack1 op (pack2 op (... (packN-1 op packN)))) |
| (init op ... op pack) | (((init op pack1) op pack2) ... op packN)      |
| (pack op ... op init) | (pack1 op (pack2 op (... (packN op init))))    |

看完这个你应该知道为什么他叫*Fold Expression*了，没错，这就是函数式编程中的“折叠”(Fold)。而且还分为左右折叠。

## 实际应用

变参模板用的最多的可能就是将函数参数进行转发了，比如我们可以改良上一篇文章中的内存池，让他通过不同的构造函数构造对象：

```cpp
// in template<typename T> class Pool;
template <typename... Args>
T* Create(Args... args) {
    T* element = new T(args ...);
    /* ... */
}
```

一般都会用`Args&&... args`进行完美转发，这个后面再说。

## 变参表达式

指一些好用的表达式：

```cpp
template <typename... Args>
void AddOne(Args... args) {
    Print(args + args...)
}
```

这个函数会将所有的参数翻倍，即下面两行是等价的：

```cpp
AddOne(1, 2, 3, 4);
Print(1 + 1, 2 + 2, 3 + 3, 4 + 4);
```

甚至可以和数字相加：

```cpp
AddOne(Args... args) {
    Print(args + 1 ...);
}
```

这会将所有的参数+1。

## 变参下标

看看这种用法：

```cpp
template <typename C, typename... Idx>
void PrintElements(const C& container, Idx... idx) {
    Print(container[idx]...);
}
```

下面是一种展开例子：

```cpp
void PrintElements(v, 1, 2, 3, 4) {
    Print(v[1], v[2], v[3], v[4]);
}
```

也可以用非类型模板参数：

```cpp
template <size_t... Idx, typename C>
void PrintElements(const C& container) {
    Print(container[Idx]...);
}
```

## 变参模板类

模板类也可以使用变参，这种方式在C++标准库中屡见不鲜，比如`tuple`的声明：

```cpp
template <typename... Elements>
class Tuple;
```

`Variant`也使用了这种声明。

或者我们可以发挥想象：变参不仅仅可以指定成员变量的类型，它还可以指定基类的类型：

```cpp
template <typename... Bases>
class Child: Bases ... {
};
```

这样就创造了一个集成多个类的模板类。
