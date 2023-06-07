---
title: C/C++小知识点，注意点汇总（持续更新）
date: 2019-07-28 16:01:01
category:
- language
tags:
- cpp
- c
---
这里汇总了一些C/C++的知识点和注意点

<!--more-->

# C++初始化规则

C++中除了全局变量和static变量可以被自动初始化，其他的所有变量都不能够被初始化（包括成员变量和局部变量），但是如果成员是类对象的话会调用其默认构造函数：

```c
#include <iostream>
using namespace std;

int global_i;

class number{
public:
    number(int m_i){
        m_i = m_i;
    }

    void info(){
        int m_local_i;
        cout<<"m_local_i:"<<m_local_i<<endl;
    }
    int m_i;
};

int main(){
    static int static_i;
    int local_i;
    cout<<"global_i:"<<global_i<<endl
        <<"static_i:"<<static_i<<endl
        <<"local_i:"<<local_i<<endl;
    number n(10);
    n.info();
    cout<<"m_i:"<<n.m_i<<endl;
    return 0;
}
```

但是如果类中存在其他类的实例，那么会初始化那个类的实例。

# C++数组越界问题
C/C++数组越界时编译器不会报错，你可以获得越界的数据。STL容器中的`vector`和`array`等在使用`at()`函数时才抛出异常。

# 同名变量赋值问题
C++和Java一样，在类的成员函数赋值的时候不能够自己赋值自己，也就是说下面的代码中，两个x,y都是成员变量x,y，产生了自我赋值:

```c
class Point{
public:
    Point(int x, int y){
        x = x;
        y = y;
    }
private:
    int x;
    int y;
};
```

所以最后成员中的x和y的值其实都是未赋值的随机值。

# switch的判断有类型限制

switch只能对**宽泛整型**来判断，也就是说只能判断字符型，整型和枚举。其他的判断不会报错，但是会有问题。

# enum和int的相互转换

enum可以**隐式转换**为int（甚至可以直接给enum中的item赋予整型值），但是int想要转换为enum需要**强制转换**。

# enum class

原本兼容C的enum有如下特点：

* 枚举项是公开的，在全局下是全局的，在类中是属于类的
* 可以隐式转换为整型

第一点导致在同一作用域下不同的枚举类型不能够声明相同的枚举项：

```c++
enum A{
    E_A,
    E_B
};

enum B{
    E_B,    //E_B重复了
    E_C
};
```

第二种情况可能会引起隐患。所以C++11推出了`enum class`，有如下特点：

* 具有封装性，即枚举量不再是全局的，访问也必须加上枚举类型的名字
* 不能和整型互相隐式转换
* 可以指定枚举类型中枚举值的变量类型

比如:
```c++
enum class A{
    E_A,
    E_B
};

enum class B:unsigned int{  //这里使用:来指定枚举值的数据类型
    E_B = 0,
    E_C   
};

//访问
A::E_A; //不能直接E_A
int x = static_cast<int>(A::E_A);    //需要强制转换
```

# C++ cout的输出控制符

std::boolalpha内的才是控制符，ios::boolalpha内的是常量：

```c
cout<<boolalpha<<false<<endl;
等价于
cout.setf(ios::boolalpha);
cout<<false<<endl;
```

不要用混了，其他的控制符同理。
而且`setf`是会一直改变ostream的格式的，所以你用完记得改回来（包括控制符也是）

# C++的引用和指针
引用就是给变量取别名，甚至连引用的变量的地址和原变量都一样。所以以下三种情况都是可以改变b的值的：

```c
#include <iostream>
using namespace std;

void changed(int& a){
    a = 10;
}

int main(){
    int b = 20;
    int& rb = b;
    int* pb = &b;
    changed(*pb);
    cout<<b<<endl;
    return 0;
}
```

# 内存分配的注意事项

需要注意的是，我们可能会产生这样的错误:

```c++
ClassA* obj = nullptr;
obj = (ClassA*)malloc(sizeof(obj));
```

虽然在C++中使用的是`new`运算符，但是我们不敢保证在C中使用`memcpy, memset`等函数不出错。

出错的原因是`sizeof(obj)`的大小并不等于`sizeof(ClassA)`而是`sizeof(ClassA*)`这两种是完全不同的。指针的大小和其类型的大小在很多情况下并不相等。所以你必须得这样写:
```c++
obj = (ClassA*)malloc(sizeof(ClassA));
```
才能分配一个`ClassA`的内存

# C++ new赋予初值的问题
C++中如果你是对基本数据类型进行new的话是不会初始化的。但是如果你在最后加上`()`会初始化为0:

```c
int* p = new int;   //no initialize
int* p = new int(); //initialize
```

如果是类的话，如果类有默认构造函数，那么会调用默认构造函数（无论有没有加括号），如果没有你需要显式传入参数来调用构造函数：

```c
#include <iostream>
using namespace std;

class Person{
public:
    int age;
    int height;
    Person(int age, int height){
        this->age = age;
        this->height = height;
    }
private:
};

int main(int agrc, char** arhv){
    Person* p = new Person(10, 170);
    cout<<p->age<<endl<<p->height<<endl;
    return 0;
}
```

如果是数组的话，基本数据类型仍然要加上()才能初始化。但是类的话必须要有默认构造函数，因为这个时候C++不允许你传入参数：

```c
#include <iostream>
using namespace std;

class Person{
public:
    int age;
    int height;
    Person(){
        age = 17;
        height = 170;
    }
    Person(int age, int height){
        this->age = age;
        this->height = height;
    }
private:
};

int main(int agrc, char** arhv){
    Person* p = new Person[10]; //new Person[10](17,170)或者new Person(17,170)[10]都不可以
    cout<<p[2].age<<endl<<p[2].height<<endl;
    delete[] p;
    return 0;
}
```

# 关于内存释放的问题
假如有以下代码：

```c
#include <stdio.h>
#include <stdlib.h>
#include <assert.h>

typedef struct
{
    int* array;
}struct_a;

typedef struct{
    struct_a* a;
}struct_b;

typedef struct{
    struct_b* b;
}struct_c;


int main(int argc, char** argv){
    struct_c* c = NULL;
    while(1){
        //malloc memory
        c = (struct_c*)malloc(sizeof(struct_c));
        c->b = (struct_b*)malloc(sizeof(struct_b));
        c->b->a = (struct_a*)malloc(sizeof(struct_a));
        c->b->a->array = (int*)malloc(sizeof(int)*10);
        //free memory
        free(c);
        c = NULL;
    }
    return 0;
}
```

这里的`free(c)`可以将c变量中的b变量，b变量中的a变量，a变量中的array一同释放掉吗？答案是不行的。对于使用多次`malloc`的内存，要相应地使用`free()`依次释放才可以：

```c++
free(c->b->a->array);
c->b->a->array = NULL;
free(c->b->a);
c->b->a = NULL;
free(c->b);
c->b = NULL;
free(c);
c = NULL;
```

对于C++的new和delete是一个道理。

顺便说一下在Unix系统上判断内存泄漏的方法：将你认为会内存泄漏的代码放在死循环里面循环，然后用`top -pid`命令打印出这个程序的信息，查看`MEM`字段，如果其字段恒定不变的话，就没有泄漏，如果一直在增长就是泄漏了。

# switch中的变量声明
在C/C++语言中，switch中是不能有变量声明的：

```c
switch(var){
    case 1:
        int i=2;
        break;
    case 2:
        double j=3;
        break;
}
```

这里编译器会给i和j报错:

```text
test.cpp:10:9: error: cannot jump from switch statement to this case label
        case 2:
        ^
test.cpp:8:17: note: jump bypasses variable initialization
            int i=2;
                ^
1 error generated.
```

错误提示说跳过了变量声明。其实switch内部的每一个case跳转都是使用标号跳转（也就是goto语句），语法规定标号跳转是不能越过变量声明的，所以这里出错了。
当然下面的代码也是不行的：

```c
switch (a){
    case 20:
        int b = 30;
        cout<<b<<endl;
        break;
    case 30:
        cout<<"30"<<endl;
        break;
}
```

解决办法就是把声明放在花括号里变成局部的：

```c
switch (a){
    case 20:{
        int b = 30;
        cout<<b<<endl;
        break;
    }
    case 30:
        cout<<"30"<<endl;
        break;
}
```

这样跳过局部变量声明是可以的，所以不会发生

# C++的文件IO
C++的文件IO，关于`ofstream`的话，需要注意使用`ios::app`标志之后是不能改变文件指针的位置的，指针一直指向文件末尾。其余的都会将文件内容清除。
如果不想要清除文件内容的话，只能使用`fstream`并给入`ios::in|ios::out`标志才行。而且就算给出了in和out标志，其他标志在in和out状态下的作用是一样的。唯独**清除整个文件的作用会失效（也就是说传入ate标志不会清除文件）**。你不能传入`app`，因为同样会导致文件指针不能移动。
在`ifstream`中使用`ios::trunc`的话会导致打不开文件。

# 函数返回引用的问题

函数返回引用的时候，如果你承接的变量不是引用的话，返回值仍然会拷贝一份给你。如果使用引用就没有问题。

```c++
#include <iostream>
using namespace std;

class A{
public:
	A(){
		a = 10;
	}
	int& GetA(){
		cout<<"origin a's address:"<<&a<<endl;
		return a;
	}
private:
	int a;
};

int main(int argc, char** argv){
	A a;
	int na = a.GetA();
	cout<<"without &:"<<&na<<endl;
	int& ra = a.GetA();
	cout<<"with &:"<<&ra<<endl;
	na = 20;
	cout<<"changed na:"<<a.GetA()<<endl;
	ra = 30;
	cout<<"changed ra:"<<a.GetA()<<endl;
	return 0;
}

/**
输出：

origin a's address:0x7ffee4adccd8
without &:0x7ffee4adccd4
origin a's address:0x7ffee4adccd8
with &:0x7ffee4adccd8
changed na:origin a's address:0x7ffee4adccd8
10
changed ra:origin a's address:0x7ffee4adccd8
30
*/
```

# 函数返回时拷贝构造函数，移动构造函数和operator=调用的次数

> 注：这个例子可能有瑕疵，因为可能没有关闭相应的编译器优化。

通过下面代码来得到验证：

```c++
#include <iostream>
using namespace std;

class A{
public:
	A(){
		cout<<"normal constructor called in "<<this<<endl;
		a = 10;
	}
	A(const A& oth){
		cout<<"copy constructor called in "<<this<<endl;
		a = oth.a;
	}
	A(A&& oth){
		cout<<"move constructor called in "<<this<<endl;
		a = oth.a;
	}
	A& operator=(const A& oth){
		cout<<"operator= called in "<<this<<endl;
		a = oth.a;
		return *this;
	}
	int& GetA(){
		return a;
	}
	static A GetInstance(){
		A tmpa;
		cout<<"tmpa in GetInstance:"<<&tmpa<<endl;
		return tmpa;
	}
	static A&& GetMoveInstance(){
		A tmpa;
		cout<<"tmpa in GetMoveInstance:"<<&tmpa<<endl;
		return std::move(tmpa);
	}
	static A& GetRefInstance(){
		cout<<"tmpa in GetRefInstance:"<<&static_a<<endl;
		return static_a;
	}
private:
	int a;
	static A static_a;
};

A A::static_a;

int main(int argc, char** argv){
	A a;
	cout<<"a's addr:"<<&a<<endl<<endl;
	A b = a;
	cout<<"b's addr:"<<&b<<endl<<endl;
	A& ra = a;
	cout<<"ra's addr:"<<&ra<<endl<<endl;
	A ma = std::move(a);
	cout<<"ma's addr:"<<&ma<<endl<<endl;
	A fa = A::GetInstance();
	cout<<"fa's addr:"<<&fa<<endl<<endl;
	A fb = A::GetRefInstance();
	cout<<"fb's addr:"<<&fb<<endl<<endl;
	A& fra = A::GetRefInstance();
	cout<<"fra's addr:"<<&fra<<endl<<endl;
	A&& fma = A::GetMoveInstance();
	cout<<"fma's addr:"<<&fma<<endl<<endl;
	return 0;
}

//编译： g++ main.cpp -o main -std=c++11 -fno-elide-constructors	//最后的编译选项表示不使用构造函数优化
/**结果
normal constructor called in 0x100f4a100	//这个是static_a的构造函数导致
normal constructor called in 0x7ffeeecb6c98
a's addr:0x7ffeeecb6c98

copy constructor called in 0x7ffeeecb6c90
b's addr:0x7ffeeecb6c90

ra's addr:0x7ffeeecb6c98

move constructor called in 0x7ffeeecb6c80
ma's addr:0x7ffeeecb6c80

normal constructor called in 0x7ffeeecb6bf8
tmpa in GetInstance:0x7ffeeecb6bf8
move constructor called in 0x7ffeeecb6c70
move constructor called in 0x7ffeeecb6c78
fa's addr:0x7ffeeecb6c78

tmpa in GetRefInstance:0x100f4a100
copy constructor called in 0x7ffeeecb6c68
fb's addr:0x7ffeeecb6c68

tmpa in GetRefInstance:0x100f4a100
fra's addr:0x100f4a100

normal constructor called in 0x7ffeeecb6bf8
tmpa in GetMoveInstance:0x7ffeeecb6bf8
fma's addr:0x7ffeeecb6bf8

normal constructor called in 0x7ffee3e1cbe8
tmpa in GetMoveInstance:0x7ffee3e1cbe8
move constructor called in 0x7ffee3e1cc50
fma2's addr:0x7ffee3e1cc50
*/
```

显然在`A a = A::GetInstance()`的时候，调用了两次移动构造函数。

在`A b = A::GetRefInstance()`的情况下仍然会拷贝一次，说明使用非引用得到引用返回值并不能直接饮用（当然改变fb也没办法影响tmpa）。

在`A& ra = A::GetRefInstance()`时可以视为直接引用。

在`A fma2 = A::GetMoveInstance()`时会移动构造一次，拷贝构造一次，显然移动构造将原值移动给中间变量，然后再使用中间变量的拷贝构造。

在`A&& fma = A::GetMoveInstance()`时直接移动，没有多余的动作。

## 在优化情况下的变化 

这里比较有意思的是，如果你允许编译器优化（将编译的最后一个选项去掉），`fa`的构造过程会发生改变：

```c++
/**
normal constructor called in 0x7ffeee135c78
tmpa in GetInstance:0x7ffeee135c78
fa's addr:0x7ffeee135c78
 */
```

这是因为编译器优化的原因，导致中间两次移动构造失败。

## 在没有移动构造函数下的变化

如果不定义移动构造函数，`fa`的构造过程将会变成这样：

```c++
/**
normal constructor called in 0x7ffee1398c08
tmpa in GetInstance:0x7ffee1398c08
copy constructor called in 0x7ffee1398c70
copy constructor called in 0x7ffee1398c78
fa's addr:0x7ffee1398c78
*/
```

也就是说调用了拷贝构造函数。所以**存在移动构造函数时会有点调用移动构造函数，其次调用拷贝构造函数。**

## 各种情况的对比

这里是最后各种情况的对比(使用vimdiff比对)，分别是`Cpp98下无优化无移动构造函数`，`Cpp11下优化有移动构造函数`，`Cpp11下无优化有移动构造函数`，`Cpp11下无优化无移动构造函数`。

![比较](https://s2.ax1x.com/2020/02/27/3dVgqx.png)

# 返回右值临时变量是否有用

答案是没用。具体的你可以将上面的例子中加入析构函数来看`fma`的析构过程：

```c++
/**
normal constructor called in 0x7ffeeca22af8
tmpa in GetMoveInstance:0x7ffeeca22af8
deconstructor called in 0x7ffeeca22af8
fma's addr:0x7ffeeca22af8
*/
```

会发现`fma`得到之后直接析构了。所以**返回临时变量的左值和右值都没有用，因为原变量会提前析构。**

# 如何编写log(const char* string, ...)类函数

这种函数的一个麻烦问题就是怎么在内部调用`printf`函数。

其实很简单，使用`vprintf,vfprintf, vsprintf,vsnprintf `即可。

这四个函数都会接受一个字符串和`va_list`作为参数。其各自的用途分别是：

* 将字符串当作format,并且输出va_list，其实就相当于printf
* 和vprintf一样，只不过是输出到文件中的
* 和vprintf一样，只不过是输出到另一个`char[]`中的
* 和vsprintf一样，但是可以制定前多少个字符串输出到`char[]`中

所以答案就很明显了：

```c++
void Log(const char* string, ...){
  va_list args;
  va_start(string, args);
  vprintf(string, args);
  va_end(args);
}
```

# 重载取负函数

对于数学类，总是可以用到前置负号表示取相反数。这种重载函数的原型应当是：

```c++
T operator -();
```

注意符号前的空格。

其实不需要每次都用全局的`T operator-(const T& t)`。

# struct{char elem[0]}写法的意义

可能你会看到一些结构体中写:

```c
struct s{
  //other elements
  char elem[0];
};
```

为什么这里不直接使用指针呢?因为这样写的话整个结构体只需要malloc一次就可以了。

比如按照指针的写法，你需要:

```c
s* ps = malloc(sizeof(s));
ps->elem = malloc(SIZE);
```

但是如果按照这种写法，你只需要:

```c
s* ps = malloc(sizeof(s)+SIZE);
```

即可。

原因是你malloc一堆内存之后，内存是连续的，而C/C++是不对数组下标越界报错的。数组下标越界报错的真正原因是达到了不可访问的内存。而你现在多分配了SIZE个内存，这样elem元素就可以超出数组边界访问了。

# 一句话将文件全部内容读入string

```c++
ifstream file("test.txt");

string contex((istreambuf_iterator<char>(file)), istreambuf_iterator<char>());
```

注意这里第一个参数外面的括号不能少。

这里的原理是利用string的一个构造函数：以迭代器作为参数的那个构造函数。这里构造了istreambuf的迭代器，所以可以直接使用构造函数传入。