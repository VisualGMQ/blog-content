---
title: C++ Templates 1-基础知识
date: 2022-01-18 16:34:42
tags:
- cpp
category:
- language
---

这里是《C++ Templates》第二版的读书笔记

<!--more-->

## 函数模板

函数模板的定义举例：

```cpp
template <typename T>
T Sum(T a, T b) {
    return a + b;
}
```

使用模板：

```cpp
Sum(1, 2);       // OK，模板自动推导T为int
Sum(1l, 2l);     // OK，模板自动推导T为long
Sum(3.12, 5.18); // OK，模板自动推导为double
```

注意：模板的参数可以退化(decay)，但是不能进行隐式转换：

```cpp
Sum(3.12f, 5.18); // Error，第一个参数是float，第二个参数是double，无法推断
Sum(1, 2.3);      // Error 第一个参数是int，第二个是double，无法推断
```

这个时候可以强制指定模板参数：

```cpp
Sum<int>(1, 2.3); // OK 2.3转换为int
```

## 二阶段翻译（Two-Phase Translation）

模板的编译是“两阶段的”

1. 首先模板会检查所有不含模板参数T的语法是否正确，这意味着：
   * 语法错误会被检测到，比如缺了分号
   * 不依赖模板参数的语句的语法错误也会被检测到
   * 不依赖于模板参数的`static_assert`会被执行
2. 然后如果存在模板实例化，将会将实际的类型代替模板参数T再次检查模板的语法是否正确

比如下面这段代码：

```cpp
template <typename T>
void foo(T t) {
    static_assert(false); // Error, 此静态断言不依赖于T，会执行，表现为编译时报错
    static_assert(T == 3); // OK， 此静态断言依赖于T，将会推迟到第二阶段（模板实例化的阶段）执行
    std::cout << T->GetName(); // OK，此语句依赖于T，推迟到第二阶段检查语法
    std::cout << 3        // Error， 此语句不依赖于T，会在第一阶段进行语法检查
}
```

这意味着，实例化模板时，你的类必须能够满足两个条件才不会报编译错误：

* 可以和整数用`operator==`比较
* 有`GetName()`成员函数

这其实是限制了使用此模板类的类型，强制要求这些类增加这些操作（而不是使用继承）。

这就给我们一个新思路，试想我们现在要编写一个内存复用池：

```cpp
template <typename T>
class Pool final {
public: 
    T* Create() {
        T* element;
        if (cache_.empty()) {
            element = cache_.top();
            cache_.pop();
            element->Reset();
        } else {
            element = new T;
            element->Reset();
            elements_.push_back(element);
        }
        return element;
    }

    void Destroy(T* element) { /* ... */ }

private:
    std::vector<T*> elements_;
    std::stack<T*> cache_;
};
```

这个池子将所有不使用的对象放入`cache_`中，当调用`Create()`函数时会首先检查`cache_`中是否存在元素，如果有就拿出来调用其`Reset()`函数重置对象并返回，否则new一个新的对象。

可以看出，要想让此模板类实例化成功，`T`类型必须满足两个条件：

* 拥有一个默认构造函数
* 拥有一个`Reset()`成员函数，并且`Pool`可以访问这个函数（这意味着如果是私有函数，你需要将`Pool`变为友元）

这样，只要任何类满足上面的条件，就可以使用此内存池。不满足条件的将在编译时就报错。

如果用面向对象，你可能需要一个基类：

```cpp
class PoolElement {
public:
    virtual ~PoolElement();
    virtual void Reset() = 0;  
};
```

然后每个要放入内存的类都继承他，这有一些缺点：

* 新类必须记得继承此类
* 虚函数会带来性能开销，尤其是继承链越来越长时

但是使用模板就不会存在这种问题。无疑模板是一种更加通用的方法。

## 模板参数推导及

### 作为函数参数的模板参数推导(Decay规则)

当模板参数作为函数参数时，会有一些奇怪的推导规则：

* 不能够进行窄缩的隐式转换
  ```cpp
  template <typename T> void foo(T a, T b);
  
  foo(1, 2);    // OK, T推导为int
  foo(1, 2.12); // Error, 1是int，2.12是double，无法推导
  foo(1.23, 2.18f); // Error, 1.23是double，2.18是float，无法推导
  ```
* 当为引用时`T&`，不会发生什么奇怪的事情
* 当为值时`T`，实参的`const`和`volatile`和引用会被忽略；数组，函数会转变为对应的指针（这个规则被称为**退化(Decay)**）

```cpp
// 当模板参数为引用时，一切都很正常
template <typename T> void fooRef(T& a) {}

int a;
fooRef(a); // T -> int, fooRef(T&) -> fooRef(int&)
const int b;
fooRef(b); // T -> const int, fooRef(T&) -> fooRef(const int&)
int arr[32];
fooRef(arr); // T -> int[32], fooRef(T&) -> fooRef((int[32])&)

// 当模板参数为值时，存在特殊规则
template <typename T> void fooVal(T a) {}

int& c = a;
fooVal(c); // T -> int, fooVal(T) -> fooVal(int)
const int& b = a;
fooVal(b); // T -> int, fooVal(T) -> fooVal(int)

int arr[32];
fooVal(arr); // T -> int*, fooVal(T) -> fooVal(int*)
```

现在来猜一猜，`const char* const`传入后会被退化成什么？

答案是`const char*`，指针部分可以被修改，但是指针指向的值不能被修改。总之，传入的参数总会**退化成自己可被修改的类型**

### 作为返回值的模板参数推导

可以额外增加一个模板参数用过返回值：

```cpp
template <typename T1, typename T2, typename Ret>
Ret Sum(T1& a, T2& b) {
    return a + b;
}
```

或者使用高级一点的返回值推导

在C++11中，你可以使用`auto`和`decltype`：

```cpp
template <typename T1, typename T2>
auto Sum(T1& a, T2& b) -> decltype(T1 + T2) {
    return a + b;
}
```

在C++14时，可以不使用`decltype`直接使用`auto`。

## 默认模板参数

可以给模板参数以默认值，和函数参数一样，默认值要放到最后：

```cpp
template <typename T1, typename T2 = int>
void foo();
```

注意`typename`在这里的新用法：

```cpp
struct NewStruct {
  using MyString = std::string;  
};


template <typename T1>
void foo() {
    typename T1::MyString* mystring; // here!
    /* ... */
}
```

为什么变量声明前要加上`typename`？这是因为这句话对应着两个可能的实例化，一个就是讲`mystring`实例化为指针，而另一个：

```cpp
struct NewStruct {
  static int MyString;  
};
```

这个时候`T1::MyString* mystring`会变成一个乘法操作，编译器就会误判。

所以为了防止这种情况发生，需要使用`typename`强制告诉编译器我要一个类型而不是其他什么的。

## 模板函数重载

模板函数可以重载一模一样的非模板函数：

```cpp
void foo(int a, int b);

template <typename T>
void foo(T a, T b);
```

在使用的时候会优先使用非模板参数，除非你加了模板限定符：

```cpp
foo(1, 2);     // normal function call
foo<>(1, 2);   // template function call
```

但是当参数有所不同时，会优先使用更精确的那一个（无论是模板还是非模板参数）：

```cpp
void foo(int, int);

template <typename T1, typename T2>
void foo(T1, T2); 


foo(1, 2);      // call the normal function
foo(1, 2.2);    // call the template function
```

## 传值还是传引用

一般来说，按值传递更好：

* 语法简单
* 编译器能够更好地优化
* 移动语义可以减少拷贝
* 某些情况下甚至没有移动和拷贝

对于模板函数来说有一些特殊情况：

* 模板又可以用于简单类型，又可以用于复杂类型，所以选择值传递这种普通的方式更好
* 就算以普通方式传值，你也可以使用`ref()`和`cref()`传递引用
* 引用传递字符串字面量和普通数组会有问题（虽然按值传递也有，但是引用传递问题更大）

## 干嘛不用inline

其实在现在来看，由于编译器优化，inline这个关键字只剩下“让函数定义在头文件中”这一种用途。而模板函数自身就满足这个性质，所以没必要用inline（除了**全特化的模板函数**，因为那个时候他已经是普通函数了）

## 类模板

很简单，类比函数模板，就是把模板参数用在类里面：

```cpp
template <typename T>
class Person {
  T info;
  std::string name;
  int height;
public:
  T& GetInfo() { return info; }
};
```

主要的注意点在于，实例化模板类的时候并不是所有的成员函数都实例化，只是用到的成员函数会被实例化。所以即使你的类型不具备某种操作，只要不掉用包含那种操作的成员函数的话也可以实例化。

### 友元函数

可以使用不同的模板参数进行友元的声明：

```cpp
template <typename T>
class Person {
    T info;

public:
    Person(T value): info(value) {}

    template <typename U>
    friend std::ostream& operator<<(std::ostream&, const Person<U>& p);
};

template <typename T>
std::ostream& operator<<(std::ostream& o, const Person<T>& p) {
    o  << p.info;
    return o;
}
```

或者先声明模板函数再友元：

```cpp
template <typename T> class Person;
template <typename T> std::ostream& operator<<(std::ostream&, const Person<T>&);

// in class Person
template <typename T>
class Person {
    friend std::ostream& operator<< <T>(std::ostream&, const Person<T>&);  
};
```

这里注意Person类里面的`opertor<< <T>()`中的`<T>`，这其实是对这个函数模板的特化。

### 类型推导

C++17前必须将所有的模板参数显式地写出来（除非有默认模板参数），从C++17开始编译器可以自动推导了。

### 推断指引(Deduction Guides)

通过推断指引我们可以修正现有的模板推断规则：

```cpp
Person(const char*) -> Person<std::string>
```

这告诉编译器，当模板参数为`const char*`时自动推导为`std::string`。这语句必须出现在和模板类的定义相同的作用域或命名空间中。

甚至对聚合类也可以做到这一点（聚合类是指**无显式定义的，继承的构造函数**，**无private和protected的非静态成员**，**无虚函数**，**无virtual和protected,private父类**的类）：

```cpp
template <typename T>
struct Value {
    T value1;
    std::string value2;
};

Value(const char*, const char*) -> Value<std::string>;

// use
Value value = {"hello", "template"};
```

缺少了上面的推断指引将不能够这样使用，因为没有这样的构造函数供模板完成类型推断。

## 非类型参数

即模板参数不是一个类型，而是一个值：

```cpp
template <int ID>
void GetID() { return ID; }
```

注意：`GetID<1>`和`GetID<2>`不是一个函数，和将ID作为参数不同，他们是两个函数！

## 偏特化和全特化

偏特化指将模板参数中的一些（非全部）类型固定：

```cpp
template <typename T, typename U>
class Test {
    T a;
    U b;
};

template <typename T>
class Teset<T, int>{
    T a;
    int b;
};
```file:///Users/visualgmq/Documents/blog/source/_posts/C++ Templates 5-完美转发.md

而全特化则是将所有模板参数的类型固定，这个时候函数会**被视为普通的全局函数**：

```cpp
template <>
void foo<int, float>(int , float b);
```

注意：**模板函数不能偏特化，只有类可以偏特化。两者都可以全特化**

## 处理字符串常量和裸数组

处理这两个东西头疼的点在于模板参数到底是使用`T`还是`T&`，因为这涉及到decay的问题。

当你使用`T`时，参数会退化，这就会造成你分不清传入的到底是数组还是指针。而如果是`T&`的话，则会有更加麻烦的事情：

```cpp
template <typename T>
void concat(T& arr1, T& arr2);

// call:
concat("hello", "world!"); // ERRO!
```

这里会出现错误，因为`hello`是`const (char&)[5]`而`world!`是`const (char&)[6]`。这会导致参数不匹配，所以模板无法实例化。

解决的办法是在内部使用指针：

```cpp
T* a1 = arr1;
T* a2 = arr2;
```

这样不管传入的是数组还是指针都会变为指针。

或者对指针和数组类型编写两个不同的模板函数（这里可以使用`enable_if`配合`is_array`）：

```cpp
template <typename T,
          typename = std::enable_if_t<std::is_array_v<T>>>
void foo(T& a); // 为数组编写的函数

template <typename T>
void foo(T& a);  // 为非数组的函数
```
