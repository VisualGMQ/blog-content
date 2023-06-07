---
title: 【C#入门笔记】从C++到C#
date: 2022-05-08 12:14:55
tags:
- C#
categories:
- language
---

这里是跟着[微软官方的C#文档](https://docs.microsoft.com/zh-cn/dotnet/csharp/)学习C#笔记。着重说明了C#和C++之间的区别。

## C#是如何工作的

C#和Java十分类似，是一种静态的，带有GC的编译型语言。C#和Java一样有个“虚拟机”，即.Net平台。C#将代码编译成IL（平台无关代码），然后让.Net去执行。

## 类

C#中所有的类型都是从`object`中派生而来。

### class和struct

class就是普通的class，struct则是不能被继承，同时也不能继承别人（其从`System.ValueType`隐式派生）。struct的出现主要是为了存储数据。

struct和class的主要区别如下：

* 不能继承（但是可以继承接口）
* 不能被继承
* 不能含有abstract，protected或virtual成员
* 可以不使用new操作符进行实例化，这时，你必须手动赋值所有成员之后才能使用该结构体
* 可以有有参构造函数（无参的是默认定义且不可以被改变的），但不能有析构函数
* 不能在成员变量定义时初始化
* 类在堆上分配，结构在栈上分配

简单的class声明：

```c#
public class Point {
    public int x { get; }
    public int y { get; }
    
    // 构造函数中使用 => 来进行简单的初始化
    public Point(int x_, int y_) => (x, y) = (x_, y_);

    // 使用readonly表示只能在变量声明时或构造函数中赋值的变量。
    public static readonly String ClassName = "Point";

    public void Introduce() {
        // 输出函数中，使用{0}代表第一个参数，{1}代表第二个参数
        Console.WriteLine("Point2D({0}, {1})", x, y);
    }
}

// 继承Point
public class Point3D: Point {
    // 对成员使用get,set以方便地控制成员的读写权限
    public int z { get; set; }

    // 构造函数中使用base调用父类构造函数
    public Point3D(int x, int y, int z): base(x, y) {
        // 和Java类似的this
        this.z = z;
    }

    // 使用new关键字来说明重写了父类方法（类似C++中override）
    public new void Introduce() {
        Console.WriteLine("Point2D({0}, {1})", x, y);
    }
}
```

注意这里子类中虽然使用了`new`代表是重写方法，但是并不能在继承链中起作用。要起作用还是得变成虚函数：

```c#
// in class Point
virtual public void Introduce() {
    Console.WriteLine("Point2D({0}, {1})", x, y);
}

// in class Point3D
// 注意override关键字
public override void Introduce() {
    Console.WriteLine("Point3D({0}, {1}, {2})", x, y, z);
}
```

需要注意：
1. **想要进行多态的重写必须加上override，不然默认会加上new关键字（即重写，但不是多态）**。
2. **不使用virtual的函数不能被override**

new关键字也可以放在子类成员变量中以表示隐藏父类同名变量（默认是new）

纯虚函数使用`abstract`（即抽象函数）：

```c#
// in class Point
abstract public void Introduce();
```

`sealed`关键字如同C++中的`final`，用在方法和类前面用于停止继承。

从派生类访问基类成员要使用`base`关键字。

## 接口interface

和Java一样，你可以将Interface视为C++中的纯虚类：

```c#
interface Introductable {
    public void Introduce();
}
```

如果继承了多个接口，可以使用接口类型进行限定实现：

```c#
interface Interface1 {
    public void Fn1();
}

interface Interface2 {
    public void Fn2();
}

class C : Interface1, Interface2 {
    public Interface1.Fn1() { ... }
    public Interface2.Fn2() { ... }
}
```

## 枚举

和C++一样，使用`enum`关键字：

```c#
public enum EnemyType {
    Flying,
    Standing,
}
```

C#中的enum都是C++中的`enum class`，需要通过枚举名访问，不能隐式转换为整型。

## 函数（方法）

C#和Java一样，所有的东西都是对象，所以理论上只有类方法。

在C#8之后可以使用面向过程式的写法，类似于Python一样不需要类直接编写代码：

```c#
// helloworld.cs

Console.WriteLine("hello world without class");
```

### 引用传递参数

使用ref声明的参数是引用参数，使用引用方式传递。

C#和Java一样，基本数据类型默认按值传递，其他类型按引用传递。而且C#还可以通过装箱对基本数据类型进行引用传递：

```c#
int a = 12;
object o = (object)a;

// 使用装箱强制传递a的引用
func(o);
```

所以ref的作用可能只是让基本数据类型进行引用传递吧。

### in和out参数

所有参数默认是in参数。

out参数指明此参数可以**在不进行初始化的情况下**按引用方式传递。并且当调用函数时，**需要显式指出是out参数**：

```c#
private static void inc(in int value, out int outvalue) {
    outvalue = value + 1;
}

// Main中
int result;
// 使用out关键字显式指定out参数
inc(1, out result);
```

### 数组参数/不定参数

说是数组参数，其实表现得更像是不定参数。

即将数组当做参数(**但数组的长度不是固定的**)，有如下规定：

1. 必须使用`params`指定数组参数
2. 必须放参数列表最后

```c#
private static void printList(params int[] list) {
    foreach (var item in list) {
        Console.WriteLine(item);
    }
}
```

### 紧凑表示法和Lambda

```c#
void Sum(int a, int b) => a + b;
```

这有点像Lambda：

```c#
Func lambda =
(int a, int b) => { return a + b; };
```

## 一些琐碎知识点

### 类型隐式转换

1. 不同类型之间不能转换（如枚举到整型/整型到枚举）
2. 相似类型之间不能进行窄缩转换（如long不能到int，double不能到float，float不能到int）

注意：**由于以上的规则，int/float是不能转换到bool的，这意味着**

```c#
int a = 3;
if (a) {
    Console.WriteLine("a");
}
```

**是无法通过编译的**

### var

作用同C++11的auto

### 可为null的类型

和Swift一样，使用`type?`来表示此变量可以接受null：

```c#
int a;  // 不能接受null
int? a; // 可以接受null
```

### 强制初始化

变量在使用前必须初始化/赋值，不然会报错。

## 语句

拥有和C++一样的if，for，switch，while语句。只有foreach不一样：

```c#
int[] arr0 = new int[]{1, 2, 3, 4};
foreach(int elem in arr0) {
    // ...
}
```

## 相等性比较

对于值类型，使用`==`即可。

对于引用类型，要判断引用的是否为同一变量，使用`Syste.Object.ReferenceEquals(a, b)`。

对于浮点数，可以使用`Float.Epsilon`和`Double.Epsilon`辅助判断。

## 条件编译和#define系列语句

没错C#是有这些东西的，而且和C++的用法一模一样。

## 访问修饰符

* `public`,`private`,`protected`: 同C++
* `internal`：仅可访问当前程序集
* `protected internal`：仅可访问此类，此类的派生类和同一程序集中的类
* `private internal`：此类或同一程序集中的类

### 程序集

在一个大项目中可能包含多个小项目，这些小项目就是程序集。

所以程序集可以是可执行文件或者链接库。

## 常用数据结构

使用数据结构前（除了数组）必须包含`System.Collections`

### 数组

数组和声明和Java如出一辙：

```c#
// 一维数组
int[] arr0 = new int[5];
int[] arr1 = new int[]{1, 2, 3, 4};
int[] arr2 = {1, 2, 3, 4};

// 二维数组
int[,] arr3 = new int[1, 2];
int[,] arr4 = {{1, 2}, {3, 4}};
```

元素一定会被初始化。基本数据类型初始化为0，bool值为false，可为null的值初始化为null。

类对象会调用默认构造函数。

注意二维数组和交错数组的区别（交错数组是*数组的数组*，每个数组的长度可以不一样）：

```c#
// 这是交错数组
int[][] arr5 = new int[3][];
arr5[0] = new int[2];
arr5[1] = new int[3];
arr5[2] = new int[4];
```

### 元组

和C++的Tuple类似：

```c#
(double a, int b) t2 = (2.3, 4);
t2.a;
t2.b
```

### ArrayList和List<T>

是简单形式的`std::vector`，底层是数组，可以自动扩容。缺点是他不是个泛型类，其内部存储的是`Object`类型，每次放入/取出元素还要装/拆箱。

而List则是纯纯的`std::vector`，其是泛型类。注意List的底层是数组而不是链表，不要和C++弄混了。

### HashTable和Dictionary<K,V>

同C++中的`std::unordered_map`，底层是哈希表。`HashTable`存储的也是`Object`类型，需要拆/装箱。而Dictionary是泛型。

### HashSet<T>

同C++的`std::unordered_set`，底层是哈希表，表示数学意义上的集合。

### Queue<T>, Stack<T>

队列和栈

### SortedList<K,V>和SortedDictionary<K,V>

自动排序的数组和红黑树（注意SortedDictionary底层是红黑树）

### ListDictionary和LinkedList<T>

分别是单链表和双向链表

### BitArray

存储位的Array，对二进制位优化了。

### HybridDictionary

混合了`HashTable`和`ListDictionary`的结构，数据量小于8时使用ListDictionary，大于8时将数据移动到HashTable中并使用HashTable管理。

## 字符串

字符串的**关键字**是`string`，你也可以使用`System.String`类型（这两个是一个东西）。

C#的string结尾没有'\0'终止符。

和Java一样，字符串初始化之后是不可变的。所以如下代码只是将新生成的字符串赋值给`str1`：

```c#
string str1 = "hello";
string str2 = "world";

str1 += str2;   // 先生成字符串"helloworld",然后赋值给str1。
```

这也意味着使用`str1[0]`方式获得的字符不可被更改。

### 一些初始化方式

```c#
string s1 = "hello world"; // 最普通的初始化
string s2 = @"C:\Program Fileype\asset"; // 忽略所有转译字符的初始化（包括换行符等）

char[] chars = {'h', 'e', 'l', 'l', 'o'};
string s3 = new string(chars);  // 使用字符数组构造初始化
```

### 字符串格式化

使用`String.Format`可以格式化：

```c#
string s = String.Format("{0}'s age = {1}", "XiaoMing", 19);
```

### 空字符串

将`String.Empty`赋值以得到空字符串。这比让字符串接收null更好（避免NullException）。

### StringBuilder

同Java，StringBuilder创建缓冲区保存所有字符，这意味着可以就地更改字符串内容而不是创建新字符串。

```c#
System.Text.StringBuilder builder = new System.Text.StringBuilder("hello world");

builder.Append('d');    // 在末尾增加字符
builder[0] = '3';       // 更改字符
```

严格意义上来说StringBuilder更像C++中的`std::string`。

使用`ToString()`成员方法返回`string`。

## 委托

委托说白了就是观察者模式的一种简化，只不过C#做到语言里面去了。

使用`delegate`创建委托，相当于函数指针。

```c#
public delegate int PerformCalculation(int x, int y);
```

此委托可以指向任意参数为两个整数，返回值为整数的函数。

声明委托变量：

```c#
PerformCalculation pf;
```

可以给委托变量使用`+`,`+=`增加委托函数，使用`-`,`-=`去除委托函数。当一个委托中含有多个函数，他就是个多播委托。

Lambda表达式是一种特殊形式的委托。

## 优雅输出

使用`Console.WriteLine()`进行输出。

使用`{0}`指定第0个参数，`{1}`指定第1个参数：

```c#
Console.WriteLine("{0}'s age is {1}", "XiaoMing", 19);
```

使用`$""`来允许字符串内插：

```c#
int a = 123;
Console.WriteLine($"a = {a}");
```

## 泛型

类似于Java的泛型：

```c#
void Sum<T>(T a, T b) => a + b;
```

只需要简单的在函数/类/接口/结构后面增加泛型参数就行了。

也可以对泛型参数进行约束（类似C++20的Concept）：

```c#
interface Restrict {

}

class Generic<T> where T: Restrict {}
```

这里要求T必须是实现了Restrict的类型。

约束存在两种：

1. 对继承的约束，比如要求T继承于XX，实现于XX接口等
2. 对类型约束，比如T必须为值类型，必须为引用类型，比如不可为null等

对继承的约束好理解，对类型的约束语法如下：

```c#
class MyClass<T> wherer T: restrict {}
```

其中restrict可以为如下值：

* `struct`：必须为不可为null的值类型
* `class`：必须为不可为null的引用类型
* `class?`：可为null或不可为null的引用类型
* `notnull`：不可为null的类型
* `new()`：必须有公共无参构造函数，且这个约束必须最后指定（而且你没有看错，他**确实有个括号**）

还有各种其他约束，详见C#微软文档。
