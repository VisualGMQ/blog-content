---
title: USRefl源码分析
date: 2022-04-13 14:27:28
tags:
- cpp
categories:
- 源码分析
---

最近在看UE4中的反射机制，学了一些反射的使用方式，但并不知道其实现方式。这两天上知乎看到了Ubp.a大神写的99行静态反射，所以拿来分析一下源码。

其知乎文章在[这里](https://zhuanlan.zhihu.com/p/158147380)。

<!--more-->

## 一些小工具

这里先来看一些小工具，以方便后面接触反射核心代码。

### TStr

首先是`TStr`，这是个编译期字符串，其实现如下：

```cpp
template<typename C, C... chars>
struct TStr {
    using Char = C;

    template<typename T>
    static constexpr bool Is(T = {}) { return std::is_same_v<T, TStr>; }

    static constexpr const Char* Data() { return data; }
    static constexpr std::size_t Size() { return sizeof...(chars); }
    static constexpr std::basic_string_view<Char> View() { return data; }

private:
    static constexpr Char data[]{ chars...,Char(0) };
};
```

创建一个字符串的方法是这样：

```cpp
TStr<char, 'h', 'e', 'l', 'l', 'o', 'w'> str;
```

这里的模板参数C是指字符的类型，`chars...`则是字符串中所有的字符。

首先看`data[]`的定义，他就是一个字符数组，并且在末尾增加了0，这里是将模板中的字符串存储了下来。

接下来看`Is(T)`函数，这个函数判断两个TStr是否相等。注意这里虽然字符串存到了`data[]`中但不能使用`strcmp`比较，因为`strcmp`只能运行在运行期。这里使用`std::is_same_v`进行判断。
这是因为对于两个不同的字符串，他们的类型是不一样的：

```cpp
TStr<char, 'h', 'e', 'l', 'l'> str1; -> 类型为 TStr<char, 'h', 'e', 'l', 'l'>
TStr<char, 'o', 'w', 't', 'r'> str2; -> 类型为 TStr<char, 'o', 'w', 't', 'r'>
```

接下来要看一下两个创建TStr的函数，但是在此之前要介绍一下`std::index_sequence`：

`std::index_sequence`是`integer_sequence<size_t>`的模板别名，他存储着编译期的一个序列。`std::make_index_sequence`则可以生成他。

```cpp
template<std::size_t... Ints>
using index_sequence = std::integer_sequence<std::size_t, Ints...>;
```

注意，这个类型主要是为了用在模板参数中，它并不像数组一样，他只有一个成员函数`size()`，这意味着你不能通过`seq[0]`这种方式得到他的值。

要想得的值只能使用一些模板技术（例子来自cppreference）：

```cpp
template<typename T, T... ints>
void print_sequence(std::integer_sequence<T, ints...> int_seq)
{
    std::cout << "The sequence of size " << int_seq.size() << ": ";
    ((std::cout << ints << ' '),...);   // 这里是Fold Expression
    std::cout << '\n';
}

int main() {
    print_sequence(std::integer_sequence<unsigned, 9, 2, 5, 1, 9, 1, 6>{});
}
```


现在回头来这两个函数：

```cpp
template<typename Char, typename T, std::size_t... Ns>
constexpr auto TSTRHI(std::index_sequence<Ns...>) {
    return TStr<Char, T::get()[Ns]...>{};
}

template<typename T>
constexpr auto TSTRH(T){
    return TSTRHI<typename decltype(T::get())::value_type,T>(std::make_index_sequence<T::get().size()>{});
}
```

`T::get()[NS]...`是指从T类型中调用静态函数`get()`，这个get会返回一个可索引的对象，然后将此对象的内容在这里展开：

```cpp
TSTRHI(std::index_sequence<1, 2, 3>());

// 展开成
return TStr<Char, T::get()[1], T::get()[2], T::get()[3]>
```

### 其他的编译期函数

```cpp
template<class L, class F>
constexpr std::size_t FindIf(const L&, F&&, std::index_sequence<>) { return -1; }

template<class L, class F, std::size_t N0, std::size_t... Ns>
constexpr std::size_t FindIf(const L& l, F&& f, std::index_sequence<N0, Ns...>) {
    return f(l.template Get<N0>()) ? N0 : FindIf(l, std::forward<F>(f), std::index_sequence<Ns...>{});
}
```

这两个函数是经典的递归式模板函数，用于在一个`index_sequence`中找到特定的数。其中`f`是谓词函数，用于对数字进行条件判断。

其他的函数也大同小异（只是功能不同），就不细说了。

## 核心的反射实现

### Field的实现

Field是保存类中成员的结构，是反射的核心，它是存储着类中成员变量和函数的容器：

```cpp
template<class Name, class T, class AList>
struct Field : FTraits<T>, NamedValue<Name, T> {
    AList attrs;
    constexpr Field(Name, T v, AList as = {}) : NamedValue<Name, T>{ v }, attrs{ as } {}
};
```

可以看出他存储了`NamedValue`和`attrs`。其中`attrs`是`AList`类型，这是用于给类型附加用户自定义信息的，属于这个反射系统中可有可无的东西，我们不管他。

先看继承的第一个类`FTraits`：

```cpp
template<bool s, bool f>
struct FTraitsB { static constexpr bool is_static = s, is_func = f; };

// [1]
template<class T>
struct FTraits : FTraitsB<true, false> {}; // default is enum

// [2]
template<class U, class T>
struct FTraits<T U::*> : FTraitsB<false, std::is_function_v<T>> {};

// [3]
template<class T>
struct FTraits<T*> : FTraitsB<true, std::is_function_v<T>>{}; // static member
```

`FTraits`类型系列是用于自动判断类型T（和U）是类中的哪种成员。`s`代表是否是类中静态成员，`f`代表是否是函数。

[1]处的是默认值，即默认是类的静态变量。

[2]处的`T U::*`是指向类成员指针的表示形式(不清楚的看我的[这篇文章](https://visualgmq.gitee.io/2021/09/12/C++%E6%8C%87%E5%90%91%E6%88%90%E5%91%98%E5%8F%98%E9%87%8F%E7%9A%84%E6%8C%87%E9%92%88/)），所以置`s`为false，但到底是不是函数还得用`std::is_function_v`判断一下。

[3]处的`T*`一定是静态成员，所以置`s`为true，但可能是指向变量的指针或者函数指针，所以要额外对`f`进行判断。


然后再看`NamedValue`：

```cpp
template<class Name, class T>
struct NamedValue : NamedValueBase<Name> {
    T value;
    static constexpr bool has_value = true;
    constexpr NamedValue(T v) : value{ v } {}

    template<class U>
    constexpr bool operator==(U v) const {
        if constexpr (std::is_same_v<T, U>)
            return value == v;
        else
            return false;
    }
};

template<class Name>
struct NamedValue<Name, void> : NamedValueBase<Name> {
    static constexpr bool has_value = false;

    template<class U>
    constexpr bool operator==(U) const {
        return false;
    }
};
```

`NamedValue`从广义上来说就是存储了个有名字的变量`value`（名字在其父类`NamedValueBase`的`name`成员中）。在这里它是存储着成员字段。

然后看一下他的父类`NamedValueBase`，其实他的父类很简单，就是存了一个`std::string_view`，即成员的名称：

```cpp
template<class Name>
struct NamedValueBase {
    using TName = Name;
    static constexpr std::string_view name = TName::View(); 
};
```

最后再通过`Field`的用法来彻底弄清楚这个玩意的用法：

```cpp
struct Vec {
  float x;
  float y;
  float norm() const { return std::sqrt(x*x + y*y); }
};

template<>
struct Ubpa::USRefl::TypeInfo<Vec> :
  TypeInfoBase<Vec>
{
  static constexpr FieldList fields = {
    Field {TSTR("x")   , &Type::x   },
    Field {TSTR("y")   , &Type::y   },
    Field {TSTR("norm"), &Type::norm},
  };
};
```

这里的Field的`Name`模板参数是`TSTR("x")`是个TStr，`T`则是`float Vec::*`也就是我们说的指向类成员的指针。那么这个时候NamedValue类就存储了成员的名字（`TSRT("x")`中的`data`成员，只不过是通过`std::string_view`的方式得到的，存在其父类NamedValueBase的name中）和指向成员的指针（NamedValue中的`value`）。

然后`FTraits`父类此时也存储了能够判断此成员是否静态，是否是函数的信息。所以总结下来，Field就是存储了指向类成员指针和名字的类，并且还能判断指向的是静态的还是非静态的，是函数还是变量。

上面代码中有一个`FieldList`，它是`ElemList`的子类，存储着所有的`Field`并且提供了查找，增加功能。

### ElemList

`ElemList`是作者自己造的一个能够存储任意类型的列表，其内部使用了`tuple`实现。简单来说就是个tuple的封装，但比起tuple提供了更多的操作（如查找，询问是否包含，对每个元素进行操作和增加元素等）。操作主要是利用经典的递归模板技术，我们这里主要着眼于使用`tuple`存储各个类型的技巧：

```cpp
template<typename...Es>
struct ElemList {
    std::tuple<Es...> elems;

    static constexpr std::size_t size = sizeof...(Es);

    constexpr ElemList(Es... elems) : elems{ elems... } {}

    //...
};
```

tuple可谓是实现反射中的核心和大哥大，因为它能够存储不同类型的变量。这里`ElemList`就是将`Es`类型存放到了tuple中。


### TypeInfoBase

TypeInfoBase主要是存储着父类的信息。其存储的类型都是`Base`类的子类：

```cpp
template<class T, bool IsVirtual = false> struct Base {
    static constexpr auto info = TypeInfo<T>{};
    static constexpr bool is_virtual = IsVirtual;
};
```

可以通过这个类得到类的信息，以及是否是虚类。


我们简单地看看`TypeInfoBase`：

```cpp
template<class T, typename... Bases>
struct TypeInfoBase {
    using Type = T;

    static constexpr BaseList bases{ Bases{}... };

    // ...
};
```

他将所有的基类全部存储到`BaseList`，这是`ElemList`的子类：

```cpp
template<typename...Bs>
struct BaseList : ElemList<Bs...> {
    constexpr BaseList(Bs... bs) : ElemList<Bs...>{ bs... } {}
};
```

这里的`Base`是你使用此库时手动加上去的：

```cpp
template<>
struct Ubpa::USRefl::TypeInfo<C> :
	TypeInfoBase<C, Base<A>>    // <--- 这里
{
	static constexpr AttrList attrs = {};
	static constexpr FieldList fields = {
		Field {TSTR("c"), &Type::c},
	};
};
```

而且你得先对A类进行反射（也Base类要知道A类的反射信息）。

其他的`TypeInfoBase`成员函数就是普通的查找，增加等操作了（都是`ElemList`中的操作），没什么可说的。

## 总结

UML如下

![UML](/assets/USRefl_UML.png)

其中`TypeInfo`是一个空类，用户需要全特化他并且将自己类型的信息放入（使用`Field`）。

其实说难也不难，都是模板的常见操作，但是合起来就觉得挺麻烦的了。
