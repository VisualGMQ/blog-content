---
title: CMake给工程编写配置文件
date: 2020-11-19 19:02:09
category:
- 构建工具
tags:
- cmake&make
---

本文介绍如何通过`config_file`和`option`给工程进行额外配置。

<!--more-->

首先把例子给出来：

目录结构

```bash
-include
-config
	- config.hpp.in
CMakeLists.txt
```

然后我们在`config.hpp.in`中编写：

```cmake
#cmakedefine PROJECT_VERSION_MAJOR 1
#cmakedefine PROJECT_VERSION_MINOR 2
#cmakedefine PROJECT_ROOT_PATH @PROJECT_SOURCE_DIR@
```

然后我们在`CMakeLists.txt`中增加如下代码:

```cmake
config_file(config/config.hpp.in
						include/config.hpp)
option(PROJECT_VERSION_MAJOR "major version" ON)
option(PROJECT_VERSION_MINOR "minor version" ON)
option(PROJECT_ROOT_PATH "project root path" ON)
```

然后我们`cmake .`，可以在`include`文件夹下看到出现了`config.hpp`:

```c++
#define PROJECT_VERSION_MAJOR 1
#define PROJECT_VERSION_MINOR 2
#define PROJECT_ROOT_PATH ~/Documents
```

产生了三个宏，分别表示工程的主版本，副版本和工程目录。这样我们就可以在源代码中`#include "config.hpp"`来得到这些量了。



实际上cmake给出了两个命令`config_file`和`option`来像这样产生一些宏用于配置工程。首先`config_file()`命令常用格式如下：

```cmake
config_file(srcfile dstfile)
```

srcfile用于指定你编写的配置文件的路径（这里是config/config.hpp.in），dstfile则是在`cmake`命令后，这个文件会被解析到哪个地方。



然后是配置文件的编写，使用`#cmakedefine`即可：

```cmake
#cmakedefine VAR1 //不给初始值，这样产生之后是#define VAR1
#cmakedefine VAR2 2 //给初始值2，产生#define VAR2 2
#cmakedefine VAR3 @VAR2@	//给初始值VAR2也就是2，产生#define VAR3 2
```

这里要注意，如果你想要把变量赋值，使用`@@`而不是`${}`，而且在CMakeLists.txt文件中存在的变量也可以赋值哦（就像例子里面的PROJECT_SOURCE_DIR一样）。



仅仅写完配置文件还不够，如果你不告诉cmake使用这些变量的话，cmake只会为你产出

```c++
/*#undef VAR1*/
```

这种代码。你需要使用`option()`命令告诉cmake启用哪一个：

```cmake
option(VAR1 "这里是对变量的描述，必须有，不影响产生的文件" ON)	#使用ON表示启用，默认为OFF
if(VAR1)		#启用了之后cmake里面也可以使用哦
	option(VAR2 "this is var2" ON)
	set(VAR2 4)	#重新设置VAR2的值
endif(VAR1)
option(VAR3 "this is var3" ON)
```

这样就会产生

```c++
#define PROJECT_VERSION_MAJOR 1
#define PROJECT_VERSION_MINOR 4
#define PROJECT_ROOT_PATH ~/Documents
```



这种控制工程的方法很舒服，比如在我们制作游戏的时候，图像一般放在工程的`resources`目录下，但是在build的时候一般我们直接会`cd build;cmake ..;./game`这样执行，这样如果你在游戏中使用的路径是`resources/xxx.png`的话就会找不到文件，必须先退回工程根目录才能找到，很麻烦。我们这个时候就可以将图像路径写一个配置文件，然后改变源代码为相对路径，就可以不用返回上级目录直接run了。

