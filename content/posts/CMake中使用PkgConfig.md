---
title: CMake中使用PkgConfig
date: 2020-10-02 10:58:54
category:
- 构建工具
tags:
- cmake&make
---

# 为什么要使用PkgConfig

有时候某些第三方库没有提供Cmake的支持，没有办法使用`find_package`命令找到。这个时候就可以尝试使用`pkg-config`。大部分的第三方库都会支持`pkg-config`。

# 使用方法

首先让CMake找到`PkgConfig`模块：

```cmake
find_package(REQUIRED PkgConfig)
```

然后通过`PkgConfig`模块找到你想要找到的第三方库，这里我找一下SDL2：

```cmake
pkg_check_modules(REQUIRED SDL2 SDL2_image SDL2_ttf SDL2_mixer)
pkg_search_module(SDL2 REQUIRED sdl2)
pkg_search_module(SDL2_image REQUIRED sdl2_image)
pkg_search_module(SDL2_mixer REQUIRED sdl2_mixer)
pkg_search_module(SDL2_ttf REQUIRED sdl2_ttf)
```

`pkg_check_modules`可以一次性检查所给的所有模块是否存在。

接下来再使用`pkg_search_module`找到对应的模块。第一个参数是`prefix`，第二个参数我填了`REQUIRED`表示找不到就报错，第三个参数就是模块名字。

找到之后，我们可以使用如下变量来得到模块信息：

* `<prefix>_FOUND`：如果找到模块，此变量为1
* `<prefix>_LIBRARIES`：模块的链接库名称（不包含`-l`）
* `<prefix>_LINK_LIBRARIES`：模块的链接库名称（包含绝对路径）
* `<prefix>_LIBRARY_DIRS`：模块的链接库路径（不包含`-L`）
* `<prefix>_INCLUDE_DIRS`：模块的头文件路径（不包含`-I`）
* `<prefix>_LDFLAGS`：链接flags
* `<prefix>_LDFLAGS_OTHER`：额外的链接flags
* `<prefix>_CFLAGS`：所有的编译器cflags
* `<prefix>_CFLAGS_OTHER`：其他的编译器cflags

这里我这样写，以让我的工程得以编译：

```cmkae
aux_source_directory(src SRC)
set(SRC ${SRC} main.cpp)

include_directories(include ${SDL2_INCLUDE_DIRS} ${SDL2_image_INCLUDE_DIRS} ${SDL2_mixer_INCLUDE_DIRS} ${SDL2_ttf_INCLUDE_DIRS})
link_directories(${SDL2_LIBRARY_DIRS} ${SDL2_mixer_LIBRARY_DIRS} ${SDL2_ttf_LIBRARY_DIRS} ${SDL2_image_LIBRARY_DIRS})
link_libraries(${SDL2_LIBRARIES} ${SDL2_image_LIBRARIES} ${SDL2_mixer_LIBRARIES} ${SDL2_ttf_LIBRARIES})
```

