---
title: CMake基础语法汇总
date: 2019-07-28 15:45:15
category:
- 构建工具
tags:
- cmake&make
---
cmake基础语法汇总

<!--more-->

## 指定最低cmake版本号：

`cmake_minimum_required`指令，一般这样使用：

```makefile
cmake_minimum_required(VERSION 3.13)
```

## 编译cpp文件
### 编译cpp文件为可执行文件
通过使用`add_executable()`指令，第一个参数是要生成的文件名称，其后的第二个参数是带有main函数的cpp文件，其后是附加的其他需要的cpp文件（会自动连带编译hpp文件）：

```makefile
add_executable(exe main.cpp [header1.cpp, header2.cpp ...])

#和下面的指令是一样的：
g++ main.cpp [header1.cpp header2.cpp ...] -o exe
```

也就是说，Cmake会自动通过cpp文件找到对应的hpp文件（不论hpp文件放在哪里）。

你也可以通过`EXECUTABLE_OUTPUT_PATH`命令指定产生的文件的路径。

### 编译cpp文件为动态库和静态库
通过使用`add_library(<name> [STATIC | SHARED | MODULE] [EXCLUDE_FROM_ALL] [source1] [source2] [...])`来产生一个动态或者静态链接库，或者一个插件。
第一个参数是生成的链接库名称，会是`lib{name}.xxx`，其中xxx是由第二个参数（STATIC,SHARED,MODULE）决定的，STATIC代表生成静态链接库（Mac上是.a），SHARED代表生成动态链接库（Mac上是.dylib），MODULE是生成一种不会被链接到其它目标中的插件（Mac上是.so）
然后后面的参数就是所有需要链接成库的cpp文件。
`EXCLUDE_FROM_ALL`后面的参数是不会被链接到链接库里面的文件。

你也可以通过`LIBRARY_OUTPUT_PATH`指定产生的链接库的路径。

## 链接到链接库
### 链接到第三方库
首先需要通过`find_package`指令找到这个库:

```makefile
find_package(SDL2 REQUIRED)
```

第一个参数是库的名称。
第二个参数表示如果没有找到库会发生什么，`QUIET`表示不产生错误继续执行，`REQUIRED`会停止执行。
如果找到了这个库，那么`SDL2_FOUND`这个变量会有值，那么你可以使用:`if(SDL2_FOUND)...endif(SDL2_FOUND)`选择语句来判断有没有找到库。而且会将库的头文件路径放在`<package>_INCLUDE_DIRS`变量中，将库的路径放在`<package>_LIBRARIES`变量中。
得到了库的include文件路径和lib文件路径，你需要接下来的两个指令：
* `include_directories`这个指令用于添加头文件搜索路径（也就是g++中添加-I命令），你需要通过添加这个指令来让你的cpp文件找到库的头文件
* `target_link_libraries`这个指令用于指定链接库，cmake会自动链接你指定的链接库，你需要通过这个指令链接链接库，不过你可以不写库的全称，cmake会帮你补齐(main->libmain.a等)

```makefile
add_executable(exe main.cpp)
if(SDL2_FOUND)
    include_directories(${SDL2_INCLUDE_DIRS})
    target_link_libraries(exe ${SDL2_LIBRARIES})
endif(SDL2_FOUND)
```

像上面这样，`include_directories`只有一个参数，但是`target_link_libraries`需要两个参数，第一个是要链接到的可执行文件。所以我们需要在使用这个指令之前使用`add_executable`指令指定生成的可执行文件。

### 链接到自己的库
自己的库是没有办法被cmake识别的，所以我们必须手动添加头文件搜索路径（-I）和库搜索路径（-L），靠这两个指令：
`INCLUDE_DIRECTORIES`和`LINK_DIRECTORIES`（你也可以使用`target_link_libraries`指令代替这个指令）。
* `LINK_DIRECTORIES`指定链接库的搜索路径

然后通过`LINK_LIBRARIES`来指定链接什么库，同样可以不指定全名。
`LINK_LIBRARIES`和`target_link_libraries`的区别在于，前者只是指定库，而没有指定什么文件要链接库，所以所有出现在工程中的可执行文件都会无条件链接库。但是`target_link_libraries`就会指定哪个可执行文件链接到库。

### 先生成链接库后链接

在一些情况下，我们希望先生成链接库，然后再使用我们生成的链接库链接到我们的程序，也就是如下:

```cmake
add_library(liba STATIC ${SRC})
#some operators
add_execute(exe)
```

这个时候只能使用`target_link_library`指令。因为如果你使用`link_library`，在`exe`生成之前不能确保链接库也生成，因为这个时候并没有建立起exe和链接库的联系。只有使用`target_link_library`的时候才能建立起联系，让exe生成之前生成链接库。

## FILE指令
`FILE`指令用于对文件和文件夹进行操作：

```makefile
FILE([WRITE|READ|APPEND|GLOB|RENAME|REMOVE|MAKE_DIRECTORY|DOWNLOAD|UPLOAD|GENERATE|...] param1 ...)
```

正如你看到的，FILE命令有很多的参数，让我们来看一看：
* WRITE 用于向文件写入文本，会覆盖原来的文本
* READ 用于从文件读出文本放在变量中
* APPEND 用于向文件中以附加的形式写入文本
* MAKE_DIRECTORY 用于生成一些列的文件夹，包括不存在的父文件夹
* RENAME 用于重命名文件或者文件夹
* REMOVE 用于删除文件和文件夹
* DOWNLOAD 用于从网上下载资源到本地，第二个参数是url，第三个参数是文件的名称
* COPY 用于拷贝文件
* UPLOAD 用于上传文件

## find_xxx系列指令
`find_xxx`指令有五个：
* `find_file` 用于寻找文件
* `find_path` 用于寻找包含一个文件的文件夹
* `find_library` 用于寻找库
* `find_program` 用于寻找程序
* `find_package` 用于寻找包

前几个指令的用法很相似。比如说find_file用来找到指定的文件：

```makefile
find_file(FOUND_FILE
		test.txt
		PATHS /usr/local/lib /usr/local/include	
)
```

找到的文件的路径会存放在FOUND_FILE变量中，第二个参数是找到的文件（只能有一个文件），第三个PATHS参数表示在哪个目录（和其子目录）中寻找。
如果没有找到会定义`FOUND_FILE-NOTFOUND`变量。

`find_package`的方法有点特殊，在*链接到第三方库*一章说过了。

## 增加C++11链接选项
`SET(CMAKE_C_COMPILER g++)`
`add_compile_options(-std=c++11)`
首先设置编译器为g++，然后通过`add_compile_options`来设定增加C++11的编译选项。

## 向g++添加-D指令

`ADD_DEFINITIONS`指令即可，如`ADD_DEFINITIONS(-DENABLE_DEBUG-DABC)`

## 获得文件夹下的所有cpp文件
通过`aux_source_directory(filepath filevar)`，其中filepath是要找的路径，所有找到的文件偷会存储在filevar变量中。

## 设置变量
通过`set`和`list`命令来设置变量：

```makefile
set(SRC_LIST main.cpp)

#在原有的变量上添加新值
set(SRC_LIST ${SRC_LIST} test.cpp)
#或者
list(APPEND SRC_LIST test.cpp)

#在原有变量上去掉已有值
list(REMOVE_ITEM SRC_LIST main.cpp)
```

## 安装文件
安装文件通过`INSTALL`指令，它可以安装
* 可执行文件
* 库文件
* 普通文件
* 文件夹

### 安装可执行和库文件
安装可执行和库文件都是使用参数`TARGETS`:

```makefile
INSTALL(TARGETS runexe dylib slib
		RUNTIME DESTINATION bin
		LIBRARY DESTINATION dynamiclib
		ARCHIVE DESTINATION staticlib)
```

这里指定将可执行文件runexe安装到\<prefix\>/bin文件夹中，将动态链接库dylib安装到\<prefix\>/dynamiclib中，将静态链接库slib安装到\<prefix\>/staticlib中。其中\<prefix\>/是前缀，由`CMAKE_INSTALL_PREFIX`变量指定，默认为`/usr/local`。

### 安装其他文件
使用`FILES`或者`PROGRAMS`参数：

```makefile
INSTALL(FILES file1.txt 
		DESTINATION file)
```

这里的路径如果是相对路径是相对于当前路径的。

### 安装文件夹
使用`DIRECTORY`参数:

```makefile
INSTALL(DIRECTORY dir 
		DESTINATION build)
```