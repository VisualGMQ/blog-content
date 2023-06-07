---
title: Perl的包和模块
date: 2020-05-21 18:02:53
category:
- language
tags:
- perl
photos:
- https://s1.ax1x.com/2020/05/07/Ymhw4O.jpg
---

这里介绍了Perl的包，模块和面向对象相关知识。

<!--more-->

# 包和模块

## 包

和Python一样，Perl有包机制。声明包的话需要使用`package`函数，而引入则需要`require`函数：

```perl
package Example;
```

这里声明了一个Example包。

如果你的代码不声明包的话，默认是`main`包：

```perl
package main;
```

也可以通过`no`函数来取消包的引用：

```perl
no main;
```

如果你写了上面的语句，那么你的文件现在就是没有包的状态，那么你声使用的变量和函数就必须显式指定是哪个包里面的，直到你用`require`导入了包。

一个文件中是可以通过`package`来转换包名的：

```perl
package Example;
$a = 12;
package main;
$a = 23;
```

上面两个a变量不一样，第一个是Example包中的a变量，第二个则是main包中的a变量。

### 创建一个包

创建包的一般格式如下：

```perl
package package_name;

# some statements

1;
```

开头一句不用说，是说明现在的包名。最后一个1是因为，在使用`require`函数的时候，require会先执行包含的文件（使用`eval`来执行）。如果这个文件最后返回真，则导入，返回假则停止导入。所以为了我们的包可以导入，一般都在最后加上`1;`来表示返回真。

然后就可以在里面放入一些函数和变量了，这里随便放几个：

```perl
package Example;

$name = 32;
local $age = 19;

sub Info{
	say "this package name is ", __PACKAGE__;
}

1;
```

`__PACKAGE__`是一个特殊的变量，指代当前包名。加了`local`的变量代表只能在自己的包内使用。

### 使用包

我们现在使用上面的Example包，首先先导入：

```perl
require "Example.pl";
```

require函数是可以指定路径导入的。这里将Example.pl放在和源码同一目录下。

然后使用变量和函数：

```perl
$Example::name;
Example::Info();
```

注意变量之前要加上固有前缀。

## 模块

Perl用包表示模块。

一般我们将程序分成一块一块的，这种就叫做模块。

其实你可以认为模块就是包。

### 导入模块

你可以通过`require`导入，因为包就是模块，或者用更正规的`use`导入。

use会查看`@INC`变量，这个变量里面存储了很多路径，Perl会在这些路径下面找你use的包。

use了包之后就不需要再加包前缀了。

### 例子

模块的后缀是`pm`，我们这里就来创建一个简单的，放在`Example.pm`文件中（模块名和文件名同名）：

```perl
package Example;

$name = 32;
local $age = 19;

sub Info{
	say "this package name is ", __PACKAGE__;
}

1;
```

这个就是上面的Perl包，这里当做模块使用。

然后在`main.pl`中使用这个包：

```perl
use Example;

Info();
```

你也可以通过`Exporter`模块来指定你的模块要导出什么函数的变量（默认是导出全部的非local函数和变量）：

```perl
package Example;

use Exporter;
@ISA = qw(Exporter);
@EXPORT = qw(Info);
@EXPORT_OK = qw(age name);

$name = 32;
local $age = 19;

sub Info{
	say "this package name is ", __PACKAGE__;
}

1;
```

第三行导入Exporter模块，第四行是固定写法，第五行的`@EXPORT`变量表示要导出的函数，第六行的`EXPORT_OK`变量表示要导出的变量。这里将所有的函数和变量都导出了。

### 模块生成工具h2xs

Perl本身带有`h2xs`工具来生成模块。其说明文档写的很详细。

# 安装第三方模块

首先你得有一个可以找到模块的网站，这里推荐[metacpan](https://metacpan.org/)。

上去之后你就可以在里面找模块了，找到模块之后点进去，在左边的`TOOLS`栏中可以看到`Install Instructions`，点开之后就可以看到这个模块的安装方法了。

一般有两种安装方法，第一种是它提供的，通过`cpan`工具安装，一般指令如下：

```perl
perl -MCPAN -e shell
install XXXX
```

网上也提供了使用`cpanm`工具的方法，不过cpanm工具要另装。

还有一种是手动安装，将模块下载下来之后，进入模块然后通过

```perl
perl Makefile.PL
```

指令来生成Makefile，然后再

```bash
make
```

即可编译完成，之后还可以使用

```perl
make test
```

来运行模块的测试，看看这个模块是不是能转。

然后用

```bash
make install
```

即可安装模块到Perl目录中。