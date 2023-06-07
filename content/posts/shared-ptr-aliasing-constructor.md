---
title: shared_ptr aliasing constructor
date: 2021-10-08 16:09:58
tags:
- cpp
category:
- language
---

本文简述了`shared_ptr aliasing constructor`。

<!--more-->

这是`shared_ptr`的一种独特的用法，主要是这个构造函数：

```c++
template< class Y >
shared_ptr( const shared_ptr<Y>& r, element_type* ptr ) noexcept;
```

这里第一个参数是个`shared_ptr`，第二个参数是个`raw pointer`。  

官方最这个用法的解释是：

> Additionally, shared\_ptr objects can share ownership over a pointer while at the same time pointing to another object. This ability is known as aliasing (see constructors), and is commonly used to point to member objects while owning the object they belong to. Because of this, a shared\_ptr may relate to two pointers:  
> * A stored pointer, which is the pointer it is said to point to, and the one it dereferences with operator.  
> * An owned pointer (possibly shared), which is the pointer the ownership group is in charge of deleting at some point, and for which it counts as a use.  
> Generally, the stored pointer and the owned pointer refer to the same object, but alias shared\_ptr objects (those constructed with the alias constructor and their copies) may refer to different objects.  

翻译过来就是：

> 另外，shared\_ptr对象可以共享指针的所有权，同时指向另一个对象。这种能力被称为别名(参见构造函数)，通常用于在拥有成员对象时指向它们所属的对象。因此，shared\_ptr可能与两个指针相关:
> * 一个存储的指针，也就是它要指向的指针，它使用操作符`*`进行解引用。
> * 拥有的指针(可能是共享的)，它是所有权组在某些时候负责删除的指针，并将其视为使用。
> 通常，存储的指针和拥有的指针引用相同的对象，但别名shared\_ptr对象(使用别名构造函数及其副本构造的对象)可能引用不同的对象。

这里的意思是，新的`shared_ptr`指向`r`，负责`r`指向对象的内存管理。但是他不会管理`ptr`，但他使用的时候却被暴露成`ptr`。  

给个例子：

```c++
struct Value {
    int value = 0;
};

int main(int argc, char** argv) {
    auto valuePtr = std::make_shared<Value>();
    std::shared_ptr<int> valueAliasing(valuePtr, &valuePtr->value);

    std::cout << valuePtr.use_count() << std::endl;
    std::cout << valueAliasing.use_count() << std::endl;

    auto anotherPtr = valuePtr;

    std::cout << valuePtr.use_count() << std::endl;
    std::cout << valueAliasing.use_count() << std::endl;

    valuePtr->value = 12;
    std::cout << *valueAliasing << std::endl;

    valueAliasing.reset();

    std::cout << valuePtr.use_count() << std::endl;
    std::cout << valueAliasing.use_count() << std::endl;
    return 0;
}

// 结果
2
2
3
3
12
2
0
```

这说明`valueAliasing`是管理`valuePtr`的，并且同时也会增加减少`valuePtr`的ref-counnt。`valueAliasing`是管不着`value`的，`value`是由`valuePtr`管理的。但是`valueAliasing`本身又是被视为`value`
。  
其实就是变项延长`value`的生命周期。

