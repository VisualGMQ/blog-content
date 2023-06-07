---
title: C++ Templates 5-万能引用完美转发
date: 2022-01-23 19:32:54
tags:
- cpp
category:
- language
---

这里是《C++ Tempaltes 2th》的读书笔记

<!--more-->

## 万能引用(Universal Reference)

在模板中，存在一种万能引用模板，其参数是`T&&`：

```cpp
template <typename T>
void foo(T&&);
```

这种引用时可以同时接收左值和右值引用的（不像`T&`只能接受左值引用）：

```cpp
foo(3); // T&& -> int&&;  T -> int
```

当传入一个右值/右值引用时，它会将其推导为**对应的引用**。

```cpp
int a = 32;
const int b = 64;
const int& ra = a;

foo(a);    // T -> int&;        T&& -> int&
foo(b);    // T -> const int&;  T&& -> const int&
foo(ra);   // T -> const int&;  T&& -> const int&
```

注意这里`T`的推导：被推导为`int&或const int&`而不是`int或const int`！

这个规则在转发函数参数时会造成问题：

```cpp
template <typename T>
void foo(T&);  // 针对值引用

template <typename T>
void foo(T&&);  // 针对右值

// 调用foo函数的万能引用模板
template <typename T>
void caller(T&& t) {
    foo(t);
}
```

这个时候，无论t是`T`还是`T&`，t都会被视为`T&`，都会调用左值引用的foo函数（第一个函数）。

## 完美转发

要解决如上的参数转发问题，必须要使用完美转发。

完美转发会保留变量原本的特性：

* 可变变量转发后仍然可变
* const变量转发后仍然为const
* 可移动对象转发后仍然是可移动的

完美转发就一个函数：`std::forward()`，我们需要这么用：

```cpp
template <typename T>
void caller(T&& t) {
    foo(std::forward<T>(t));
}
```

## 使用万能引用的麻烦

使用万能引用的时候，`T`会被视为`T&`，这意味着你没办法在函数体内声明非引用变量：

```cpp
template <typename T>
void foo(T&& t) {
    T x; // ERROR, T -> T&
}

int a = 10;
foo(a);
```

这里由于T会被推断为`int&`，所以这里x的声明是错误的。

## std::move

`std::move`说白了就是一个类似于`static_cast`的强制类型转换，它会将所有的类型强转到右值引用。但是**其本身不会进行移动操作**。

注意以下代码：

```cpp
class String {
public:
    String() = default;
    String(const String&);
    String(String&&);
};


// call
String a;
String b(std::move(a)); // [1]

const String c;
String b(std::move(c)); // [2]
```

这里`[1]`将会调用`String`的拷贝构造函数，这毋庸置疑。

但是`[2]`同时也会调用拷贝构造函数。记住，`std::move`只是将类型强转为右值引用，这意味着其会保留`const`标识，也就是说`[2]`中经过`std::move`之后的类型为`const String&&`，这类型和移动构造函数的类型不符，所以会调用拷贝构造函数。

## std::move和std::forward的区别

他们两个本质上**都是强制类型转换**，只不过`std::move`无条件转换，而`std::forward`是只有参数为右值引用的时候才会转换。