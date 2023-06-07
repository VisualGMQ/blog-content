---
title: Perl的面向对象
date: 2020-05-22 10:39:53
category:
- language
tags:
- perl
photos:
- https://s1.ax1x.com/2020/05/07/Ymhw4O.jpg
---

这里记录了Perl面向对象的相关知识

<!--more-->

# 类

类的本质是包，其实一个类就是一个包。

## 创建类

这里来一步一步创建一个类，由于类就是包，类名就是包名，所以应当首先创立一个包。我这里就直接创建一个模块了：

```perl
#file Person.pm
package Person;

use 5.010;
use utf8;
use Exporter;
@ISA = qw(Exporter);

1;
```

类中的函数其实就是包中的函数。为了初始化对象，我们需要给出一个构造函数：

```perl
sub new{
	my $this = {};
	bless $this;
	return $this;
}
```

一般习惯是将构造函数命名为`new`，当然你也可以取其他的名字。

Perl的类和Lua的类十分像。Perl本身是没有表示类的数据结构的，所以这里表示类只能用哈希表示。

第二行声明了一个this变量，引用了匿名的哈希。

第三行使用`bless`函数让这个引用和本包名关联起来。`bless`是在创建类的时候必须需要的一个特殊函数，其作用是将变量和包关联起来，让用户能够通过变量来调用包内的函数。

`bless`的第一个参数一定要是一个引用，第二个参数是要关联的包名，这里忽略默认为本包。

第四行返回我们构造完成的this变量。这里由于this变量是指向的匿名哈希的引用，所以虽然函数结束之后this变量销毁了，但是匿名的哈希并没有被销毁，所以可以被外部变量使用。

不要忘记最后在`EXPORT`变量中导出函数（下面不再说明）：

```perl
EXPORT = qw(new);
```





使用类的话可以使用多种方法：

```perl
use Person;	#首先导入模块

#可以用::或->获取包中的变量和函数
$p = Person::new();
$p = Person->new();
$p = new Person();	#这种类似C++/Java的方法也可以
```



## 添加成员变量和函数

首先来添加一些成员变量：

```perl
sub new{
	my $this = {};
	$this->{name} = @_[1];
	$this->{age} = @_[2];
	$this->{height} = @_[3];
	bless $this;
	return $this;
}
```

由于整个类对象其实就是this变量所指向的引用，所以显然给引用键值对就相当于给对象成员变量了。这里增加了name，age，height三个属性。

需要注意的是，new函数的参数默认第一个是类名称，所以我们要得到自己的参数需要从第二个参数开始。



然后添加一些成员函数。由于bless的影响，我们可以直接通过this变量访问包内的函数，所以这个时候函数直接放在包内就可以了，而不需要像成员变量一样加到this中：

```perl
sub GetInfo{
	my $this = shift;
	return ($this->name, $this->age, $this->height);
}

sub ModuleInfo{
	say "this is Person Module";
}

sub DESTORY{
	say "I'm died";
}
```

这里`GetInfo()`函数属于虚函数（C++概念），也就是说对于不同的子类，调用同一个方法时，调用的是子类的方法而不是父类的。虚函数的第一个参数一定是类对象，所以在第二行的时候直接将类对象shift出来。

而`ModuleInfo()`则是静态函数（C++概念），由于是静态函数，所以不需要类对象作为参数。静态函数其实就是整个包的函数，也可以通过包直接使用：`Person::ModuleInfo()`。

`DESTORY()`函数是析构函数（一定是这个名字），一个类中只能由一个。其有唯一的参数——类对象本身的引用。但是注意这个引用是只读的（也就是说不能用`$_[0]`这种方法获得），但是对象自身是可写的（如`%$_[0]`这种）。

## 继承

继承的话只能继承函数而不能继承成员变量，所以对成员变量的继承得你自己想办法。

继承是通过`@ISA`变量做到的：

```perl
package Programmer;
use Person;

@ISA = qw(Programmer);	#将父类写入其中即可，你可以写多个父类来表示多继承
```

这样Programmer类就有了Person类中的所有函数。

## 重写

在子类中重写父类方法是可行的，如果你要调用父类方法，可使用

```perl
$this->SUPER::func();
```

的方法来调用。