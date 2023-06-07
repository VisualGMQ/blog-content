---
title: C++ Template 6-auto推导
date: 2022-03-19 14:49:18
tags:
- cpp
category:
- language
---

这里是《C++ Templates 2th》的读书笔记。

本文中一部分来自于《Effective Morden C++》。

<!--more-->

## auto自动推导的推导法则

`auto`推导的法则和模板推导是一样的（除了一个例外），`auto`就像模板参数`T`，比如：

```cpp
auto a = 32;           // 推导为 int
const auto b = 33;     // 推导为int，整个的类型是const int
const auto& c = 34;    // 推导为int, 整个的类型是const int&
```

对于最复杂的右值引用，情况同理：

```cpp
int x = 32;
const int cx = 33;
int& rx = 34;

auto&& a = x;    // 推导为int&
auto&& b = cx;   // 推导为const int&
auto&& c = rx;   // 推导为const int&
auto&& d = 32;   // 推导为int&&
```

特例是在使用花括号初始化的时候：

```cpp
auto a1(32);
auto a2 = 32;
auto a3 = {32};
auto a4{32};
```

前两种是普通的初始化方法，会产生和预期一样的结果。后两种是C++11之后的花括号初始化语法，会产生问题。

问题在于这里`auto`会被自动推导为`std::initializer_list<int>`而不是`int`。所有花括号初始化都会被`auto`推导成`std::initializer_list<T>`。

与之相对的，模板则不会这么做：

```cpp
template <typename T>
void Func(T t) {
    // ...
}

Func({1, 2, 3, 4});    // Error，无法推导参数类型
```

所以你必须显式指定传入`initializer_list`：

```cpp
template <typename T>
void Func(std::initializer_list<T> list) {}
```

## 作为参数和返回值的auto自动推导

在`C++14`及以后，可以使用`auto`作为函数的参数和返回值。这个时候**auto推导使用的是模板参数推导规则而不是原本的auto推导规则**：

```cpp
auto createInitList() {
    return {1, 2, 3};        // Error，无法推导出返回值类型
}

auto func = [](const auto& value) { std::cout << value << std::endl; };
func({1, 2, 3, 4});    // Error，无法推导参数类型
```

