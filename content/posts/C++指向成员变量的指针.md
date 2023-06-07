---
title: C++指向成员的指针
date: 2021-09-12 22:07:42
tags:
- cpp
category:
- language
---

今天看《C++ Templates》中遇到的，一开始没看懂，就探究一下。  
参考[cppreference pointer](https://en.cppreference.com/w/cpp/language/pointer)

<!--more-->

## 指向非静态的成员变量的指针

C++中有专门对指向非静态成员变量指针的类型定义：`S C::*`，其中S是成员变量的类型，C是类名称。  
比如如下代码：  

```c++
struct Node {
    int value;
    Node* left;
    Node* right;

    Node(int value): value(value), left(nullptr), right(nullptr) {}
};
```

那么`int Node::*`就是可以指向`value`的指针，而`Node* Node::*`就是可以指向`left`和`right`的指针。  
有了指针，我们可以通过`成员指针访问运算符` `.*`和`->*`来访问：  

```c++
int Node::* value = &Node::value;
Node* Node::* left = &Node::left;
Node* Node::* right = &Node::right;

Node* root = new Node(1);
root->left = new Node(2);
root->right = new Node(3);

cout << root->*left->*value << endl; // 输出root的左节点的值，是2
```

这也能在继承中生效，指向父类的成员指针，如果用子类去调用，会隐式转换到子类指针：  

```c++
class Parent { int value; };
class Child: public Parent {};

int Parent::* valuePtr = &Parent::value;

Child child;
child.value = 1;
cout << child.*valuePtr << endl; // 输出1
```

从子类到父类的转换可以通过`static_cast`或者显示转换，转换总能成功。如果父类不存在对应的成员，调用时会产生未定义行为。  

最玄幻的是，你还能自己包含指向自己类成员的指针：  

```c++
struct A {
    int m;
    int A::* p;
};

// 这样声明p的指针:
int A::* A::* ptr = &A::p; // 即(int A::*) A::* ptr
```

需要注意的是，`&(S::C*)`这种格式不是上述这种指针

## 指向静态成员的指针

就和普通的指针一样，无论是指向成员变量还是函数：  

```c++
struct A {
    static int value;
    static void Func();
};

int* p = &A::value;
using F = void(*)(void)
F p = &A::Func;
```

## 指向成员函数的指针

格式上和指向成员的变量一样：  

```
struct A {
    void Func();
};

using F = void(A::*)(void);
F f = &A::Func;
```

用法也是用`.*`或`->*`:

```c++
A a;
(a.*f)(); // 调用
```
