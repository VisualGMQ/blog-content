---
title: 【模板元编程和反射】（一）：type_list
date: 2023-10-07T09:42:16+08:00
tags:
- cpp
category:
- game development
---

本文述说了基于匹配的模板以及常见模板小工具`type_list`。

本章的`type_list`实现代码在[mirrow](https://github.com/VisualGMQ/mirrow)的[type_list.hpp](https://github.com/VisualGMQ/mirrow/blob/main/include/mirrow/util/type_list.hpp)中。可自行参考。

<!--more-->

## 基于匹配的模板

C++的模板是基于匹配的，也就是说在实例化的时候会尝试匹配所有存在的模板。直到所有模板都不匹配才会报错。

### 类型萃取

类型萃取就是使用这种规则的模板：

```cpp
// (1)
template <typename T>
struct remove_one_pointer {
    using type = T;
};

// (2)
template <typename T>
struct remove_one_pointer<T*> {
    using type = T;
};

template <typename T>
using remove_pointer_t = typename remove_one_pointer<T>::type;

int main() {
    using type1 = remove_pointer_t<int>;		// type -> int
    using type2 = remove_pointer_t<int*>;	// type -> int
    using type3 = remove_pointer_t<int**>;	// type -> int*
    return 0;
}
```

“萃取”是化学中的术语，意思是将某种混合物中的东西分离出来。这里的`remove_one_pointer`会移除一层指针，如果类型不是指针则会保留原本类型。

这里的`type1`给入的类型是`int`，编译器会先去匹配特化模板*(2)*，发现不能将`int`作为其模板参数（其模板参数需要一个指针`T*`），于是去匹配*(1)*这个非特化模板，得到类型`type = int`。

而`type2`给入的类型是`int*`，匹配*(2)*的时候传入一个`int*`，这个`int*`会匹配到9行的`struct remove_on_pointer<T*>`中的`T*`，而*(2)*中的模板参数（我指`typename T`这个`T`）是`T`，所以`T*`会是`int*`而`T`变为`int`。这样就成功萃取出来了。

`type3`也是同理，9行的`struct remove_on_pointer<T*>`中的`T*`会匹配到`int**`，然后注意到`T`是去掉一层指针（如果写`struct remove_on_pointer<T**>`就是去掉两个），所以`T`会是`int*`而不是`int`。



萃取有个固定写法：

1.   确定你需要对哪个类进行萃取，比如我们需要对一个特定的类`std::list`

2.   确定你要对他的哪个模板参数进行萃取。`std::list`的声明是：

     ```cpp
     template<
         class T,
         class Allocator = std::allocator<T>
     > class list;
     ```

     有两个模板参数`T`和`Allocator`，比如我们要得到`T`

3.   将需要萃取的类型的所有模板参数写在`template <>`声明中，并在特化部分将此类型用上，然后在结构体内用`using type = XXX`得到你想要的类型：

     ```cpp
     template <typename T> // 要萃取T，我们这里写一个T
     struct get_list_element_type;	// 先写一个声明，声明不做任何事情
     
     template <typename T, typename Allocator>
     struct get_list_element_type<std::list<T, Allocator>> {
       	using type = T;
         // using allocator = Allocator;		// 想要保存Allocator的类型？也可以
     };
     ```

4.   使用时，直接将类型放入你写的萃取中就行了：

     ```cpp
     using type = typename get_list_element_type<std::list<int>>::type;	// int
     
     // 一般会给一个更加方便的using来节省打字时间：
     template <typename T>
     using get_list_element_type_t = typename get_list_element_type<T>::type;
     
     using type = get_list_element_type_t<std::list<int>>;
     ```

当然这里只是个例子，对于`std::list`来说，标准库很贴心地在其内部早就存下了元素类型`std::list<T>::value_type`和内存分配器类型`std::list<T>::allocator_type`。

### 将模板看做编译期的函数

上面的`get_list_element_type`我们可以看做是对类型操作的函数：

```cpp
using type = get_list_element_type_t<your-list>;
// 你不觉得很像：
auto  type = get_list_element_type_t(your-list);
```

模板参数作为入参，模板内的`type`或者`value`作为返回值。

不只是萃取，你可以写其他的模板来对类型/编译期值进行操作：

```cpp
template <size_t Idx>
struct inc_idx {
    static constexpr size_t value = Idx + 1;
};

template <size_t idx>
constexpr size_t inc_idx_v = inc_idx<Idx>::value;
```

这里`inc_idx`会将value+1。

标准库也有一些类似的做法，比如`std::conditional_t`可以做编译时`if`。

## type_list小工具

在很多反射和模板元编程框架中([Refl-Cpp](https://github.com/veselink1/refl-cpp)，[Ubp.a USRefl](https://github.com/Ubpa/USRefl))都会有`type_list`小工具。这个工具顾名思义，是编译时存储和操作一组类型的列表。

模板元编程在很大程度上和**函数式编程**有着极为密切的关系。而我们这里的`type_list`实现也是仿造函数式编程，尤其是[Haskell中list](https://flaneur2020.github.io/lyah/ready-begin.htm#List入门)的实现。

### type_list的用法

首先来看一下这个工具的用途（一部分）：

```cpp
using list = type_list<int, char, float, double>;	// 声明一个类型列表

// list_element_t 用于从 type_list中获得第n个元素
static_assert(std::is_same_v<list_element_t<list, 0>, int>);
static_assert(std::is_same_v<list_element_t<list, 1>, char>);
static_assert(std::is_same_v<list_element_t<list, 2>, float>);
static_assert(std::is_same_v<list_element_t<list, 3>, double>);

// list_head_t 是仿照函数式编程中 head 函数，用于获得list开头的元素
static_assert(std::is_same_v<list_head_t<list>, int>);

// list_size_v 用于获得list的大小
static_assert(list_size_v<list> == 4);

// 一个谓词（谓词：函数式编程术语，即返回布尔值的函数），用于判断某个类型T是否是`int`，使用基于匹配的方法编写
template <typename T>
struct IsInt {
    static constexpr bool value = false;
};

template <>
struct IsInt<int> {
    static constexpr bool value = true;
};

// disjunction_v，仿照std::disjunction，用于判断列表中是否至少有一个元素使得谓词返回true
static_assert(disjunction_v<list, IsInt>);
// conjunction_v，仿照std::conjunction，用于判断列表中是否所有元素使得谓词返回true
static_assert(!conjunction_v<list, IsInt>);

// list_filter_t，使用谓词过滤列表，所有满足谓词的元素会被保留下来
static_assert(std::is_same_v<list_filter_t<list, std::is_integral>, type_list<int, char>>);
static_assert(std::is_same_v<list_filter_t<type_list<>, std::is_integral>, type_list<>>);
```

### type_list的实现

#### type_list声明

首先是`type_list`的声明：

```cpp
template <typename... Ts>
struct type_list {};
```

是一个空类，所有的类型信息全部记录在不定模板参数`Ts`中。

#### list_size_v的实现

接下来实现第一个函数，也是最简单的，`list_size_v`，用于获得`type_list`中元素个数：

```cpp
namespace detail {

// (1)
template <typename>
struct list_size;

// (2)
template <template <typename...> typename ListType, typename... Ts>
struct list_size<ListType<Ts...>> {
    static constexpr size_t value = sizeof...(Ts);
};

}	// namespace detail

template <typename T>
static constexpr size_t list_size_v = detail::list_size<T>::value;
```

模板元编程中，习惯性的做法是将实现放在命名空间`detail`或者`impl`中，用户一般是不允许接触这种命名空间的（当然编译器并没有强制禁止，只是口头约定），然后在外部暴露一个便捷方法（这里是`list_size_v`）。

这里的实现也很简单，依旧是基于匹配的模板方法：将要匹配到的模板类型中所有需要的类型参数（这里是`type_list`需要的参数，是*(2)*中的`Ts`）写在`template <>`中，然后在特化处`struct list_size<>`写上你需要的真正类型。

这里其实可以写成：

```cpp
// (2)
template <typename... Ts>
struct list_size<type_list<Ts...>> {
    static constexpr size_t value = sizeof...(Ts);
};
```

告诉`list_size`我们需要的参数是固定类型`type_list`。这里之所以写了模板模板参数`template <typename...> typename ListType`是因为这样写可以匹配到`std::tuple`（因为`tuple`的模板声明也是`template <typename... Ts> class tuple{ ... };`，通用性更好一些。如果你不需要就不用这样写。

内部实现的话使用`sizeof...`对不定模板参数计数就行了。

如果传入的类型`T`不可以接受不定模板参数`Ts`，那会匹配到*(1)*处的声明，编译器会发现类没有实现，所以会报一个类缺少实现的编译时错误。

#### list_head_t的实现

接下来实现一个复杂一点的。`list_head_t`通过给入一个`type_list`可以得到此list的第一个元素。如果`type_list`是空则编译无法通过。

```cpp
// (1)
template <typename>
struct list_head;

// (2)
template <template <typename...> typename ListType, typename T, typename... Remains>
struct list_head<ListType<T, Remains...>> {
    using type = T;
};

template <typename T>
using list_head_t = typename list_head<T>::type;
```

*(1)*处仍然是声明。*(2)*处将`type_list`内元素拆分成两部分：第一个元素`T`以及剩下的所有元素`Remains`，然后通过匹配拿到第一个元素。

#### list_add_to_first的实现

`list_add_to_first<List, T>`会将元素`T`插入`List`的第一个位置上：

```cpp
template <typename List, typename T>
struct list_add_to_first;

template <template <typename...> typename ListType, typename... Ts, typename T>
struct list_add_to_first<ListType<Ts...>, T> {
    using type = ListType<T, Ts...>;
};

template <typename List, typename T>
using list_add_to_first_t = typename list_add_to_first<List, T>::type;
```

具体实现中通过将新元素`T`和老元素们`Ts`放在一个`ListType`中并返回。

#### list_element_t的实现

看了上面三个例子后，对如何使用模板参数以及如何匹配想必已经有一定的了解了。接下来看一点不一样的。

`list_element_t<ListType, Idx>`可以取得`ListType`中第`Idx`个元素：

```cpp
template <typename T, size_t Idx>	// 这里的模板参数没用到可以省略，但我还是写出来以便于下面解说
struct list_element;

// (1)
template <template <typename...> typename ListType, typename T, typename... Ts,
          size_t N>
struct list_element<ListType<T, Ts...>, N>
    : list_element<ListType<Ts...>, N - 1> {};

// (2)
template <template <typename...> typename ListType, typename T, typename... Ts>
struct list_element<ListType<T, Ts...>, 0> {
    using type = T;
};
```

这里用了递归式模板：*(2)*中定义递归结束条件：当`Idx==0`的时候，直接返回`ListType`的第一个元素。

而*(1)*中则进行递归：我们构造传入`ListType`的子列表作为下一次递归的开始（这个列表只是将第一个元素移除了），并将`Idx - 1`：

```cpp
假设有type_list: tl = int char float double
我们要拿到下标为2的元素，也就是float： Idx = 2
    
调用list_element_t:
	list_element<type_list<int, char, float, double>, 2>
第一次递归的调用：
    list_element<type_list<char, float, double>, 1>
第二次递归的调用：
    list_element<type_list<float, double> 0>
这时Idx == 0，匹配到(2)处的特化模板，现在list_element结构体里有T = float了。
```

这里*(1)*处的继承并没有任何面向对象里*as-is*的意思，单纯地就是将数据聚拢在一起。一般在模板元编程中，类如果都是空的话，比较趋向于使用集成将信息组合到一起。

#### list_foreach_t的实现

接下来我们要更加贯彻**将模板视为编译期函数**的原则。

`list_foreach_t<List, Pred>`通过给入一个`Pred`模板类，将这个类当做函数用在`List`的所有元素上从而创造一个新的`List`：

```cpp
template <typename List, template <typename> typename F>
struct list_foreach { };

// (2)
template <template <typename...> typename ListType, template <typename> typename F, typename... Ts>
struct list_foreach<ListType<Ts...>, F> {
    using type = ListType<typename F<Ts>::type ...>;
};

template <typename List, template <typename> typename F>
using list_foreach_t = typename detail::list_foreach<List, F>::type;
```

*(2)*中的函数类型是`template <typename> typename F`，表示接受一个模板参数，并且在7行的`typename F<Ts>::type`也要求其内部有一个`type`类型作为返回值。比如：

```cpp
template <typename T>
struct AddPointer {
    using type = T*;
};
```

就是合法的，可以这样用：

```cpp
list_foreach_t<type_list<int, char>, AddPointer>
```

### 其他

对于`type_list`还有很多函数可以编写，比如筛出其中某个元素，将`type_list`倒置等。但最基本的写法和例子都写在上面了。完整代码可去github上看一下。