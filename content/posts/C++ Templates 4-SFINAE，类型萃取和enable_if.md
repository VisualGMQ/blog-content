---
title: C++ Templates 4-SFINAE,类型萃取和enable_if
date: 2022-01-23 13:10:54
tags:
- cpp
category:
- language
---

这里是《C++ Templates 2th》的读书笔记。

<!--more-->

## SFINAE

为*Substitution Failure Is Not An Error*的简写，意味着“替换失败并不是个错误”。

假设我们现在有这样的代码：

```cpp
class Buffer {
public:
    void Append(char c, size_t repeat);        // [1]
    void Append(const char* c, size_t len);    // [2]

    template <typename Iter>
    void Append(Iter begin, Iter end);         // [3]
};
```

[1]的功能是在buffer中放入repeat个字符c。

[2]的功能是将字符串c放入buffer中。

[3]的功能是给入迭代器begin和end，将其间所有数据放入buffer。

接下来我们看一下这个使用方法：

```cpp
Buffer buffer;
int ch = getchar();
buffer.Append(ch, 10);
```

这里我们的本意是让其调用[1]，往buffer里放10个ch。但是编译器会调用[3]，因为[3]更符合参数为`int, int`的情况。

这里我不想让这种情况发生，那么我们可以这样写：

```cpp
template <typename Iter,
          typename = typename std::enable_if<
            !std::is_integral<Iter>::value>::type>
void Append(Iter begin, Iter end);         // [3]
```

这里就不得不介绍一下`enable_if`和`is_integral`了。

`is_integral`只有一个模板参数T，并且有一个静态成员`bool value`。当T为整数类型时，`value`为true，否则为false。说白了他就是用来判断类型是否为整数的模板类。

`enable_if`有两个模板参数数`enable_if<bool, typename T = void>`，和一个类型别名`using type = XXX`。如果bool为true，则`enable_if`的`type`成员为T，否则不存在这个成员。

那么再回来看这个模板。当我们传入两个整型的时候，`std::_is_integral<Iter>::value`将会返回true，我们对他取反变为false，这样`std::enable_if<false>`就不存在`type`这个成员，那么这个模板显然就是有问题的，编译器就不会去匹配这个模板，但是他也不会报错，而是去寻找下一个函数看看能不能匹配。显然，这会匹配到`void Append(char, size_t)`。

这就是`SFINAE`，当出现了无意义或者有问题的模板匹配时，编译器不会报错，而是自动忽略，所以这规则叫做“替换失败不是个错误”。

## 类型萃取

类型萃取是一个利用模板特性而实现的功能（一般是利用特化），其典型的一个用法就是从指针类型种将原类型抽出，即我们要实现这样一个功能：

```cpp
strip_point<int*>::type a; // 这里a是int类型，strip_point会将任意指针类型的指针符去掉一个
strip_point<int**>::type b; // 这里b是int*类型。
strip_point<int>::type c;  // 这里c是int类型，当类型不是指针时不改变传入类型
```

如何实现呢，请看代码：

```cpp
template <typename T> // [1]
struct strip_point {
    using type = T;
};

template <typename U> // [2]
struct strip_point<U*> {
    using type = U;
};
```

这里使用了模板的偏特化。[1]是模板的通用形式，对于任意的类型T，让`type`为

T，即不改变传入的类型。

[2]是模板的偏特化，注意`strip_point<U*>`，当我们传入`strip_point<int*>`时，`U*`会被推断为`int*`，这样`U`就是`int`了，所以这样就剥离了一层指针。

这种从某种混合类型种抽取（萃取）出某种特定类型的功能就是类型萃取。

我们可以这样来让此功能变得更方便使用：

```cpp
template <typename T>
using strip_point_t = strip_point<T>::type;
```

类型萃取广泛地运用在标准库中，尤其是`type_triats`头文件里。上面`strip_point`的功能其实就是标准库中`remove_pointer`的功能。

## enable_if的实现

接下来我们简单实现一个`enable_if`：

```cpp
template <bool BOOL, typename T = void>
struct EnableIf;

template <typename T>
struct EnableIf<true, T> {
    using value = T;
};

template <bool B, typename T = void>
using EnableIfV = typename EnableIf<B, T>::value;
```

很简单吧，就是根据`enable_if`的定义，使用偏特化就可以做出来了。

## 通用函数

我们可以通过这种形式给模板一个通用函数：

```cpp
return_type YourFunc(...);
```

你没看错，参数就是三个点。这种函数总会匹配所有调用，但是其匹配情况是重载函数中最差的，不到万不得已找不到其他函数时编译器是不会调用这个函数的。
