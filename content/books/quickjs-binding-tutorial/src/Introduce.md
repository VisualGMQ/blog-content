# 介绍

## 什么是QuickJS

> QuickJS is a small and embeddable Javascript engine. It supports the [ES2023](https://tc39.github.io/ecma262/2023) specification including modules, asynchronous generators, proxies and BigInt.
>
> Main Features:
>
> - Small and easily embeddable: just a few C files, no external dependency, 367 KiB of x86 code for a simple `hello world` program.
> - Fast interpreter with very low startup time: runs the 78000 tests of the [ECMAScript Test Suite](https://github.com/tc39/test262) in about 2 minutes on a single core of a desktop PC. The complete life cycle of a runtime instance completes in less than 300 microseconds.
> - Almost complete [ES2023](https://tc39.github.io/ecma262/2023) support including modules, asynchronous generators and full Annex B support (legacy web compatibility).
> - Passes nearly 100% of the ECMAScript Test Suite tests when selecting the ES2023 features (warning: the report available at [test262.fyi](https://test262.fyi/) underestimates the QuickJS results because it does not use the right executable).
> - Can compile Javascript sources to executables with no external dependency.
> - Garbage collection using reference counting (to reduce memory usage and have deterministic behavior) with cycle removal.
> - Command line interpreter with contextual colorization implemented in Javascript.
> - Small built-in standard library with C library wrappers.

[QuickJS](https://github.com/bellard/quickjs)是由大神Bellard制作的一款小巧，快速的JavaScript运行时。目标是用于嵌入各种程序中。

## 为何写这份教程

QuickJS本身几乎没有任何的API文档。所有API基本上只能通过看例子进行学习。而且很多API还有很多坑。我在将QuickJS嵌入自己的游戏引擎的过程中遇到了很多坑，所以想做一份较为完善的教程。

## 本教程有/没有的内容

本教程会介绍如何在C++代码中嵌入QuickJS，将C/C++的代码绑定给QuickJS并且在C++中调用js代码。

本教程**不会**说如何从Js编译成独立可执行文件，并且调用C++链接库。本教程着眼于JS作为脚本语言嵌入，而非JS作为主语言的情况。

## 代码实例

本教程附带一份[代码实例](https://github.com/VisualGMQ/quickjs-cpp-binding-demo)，使用[QuickJS-NG](https://github.com/quickjs-ng/quickjs)在C++20下编译。

之所以在C++20下是因为在初始化时指定结构体成员的C相关语法只能在C++20下编译通过：

```cpp
struct Person {
    float age;
    float height;
};

int main() {
    // can compile under C, but can't compile before C++20
    Person p = {.age = 21.0f, .height = 190.0f};
    return 0;
}
```

## 注意事项

本教程的所有知识来源于[QuickJS-NG](https://github.com/quickjs-ng/quickjs)而非Bellard的QuickJS。因为最初的QuickJS只能在Linux下编译，而QuickJS-NG做了跨平台处理。QuickJS-NG和最初的QuickJS API相差无几，本书的知识点应该可以同时用在两者之上。

## 作者不是个熟练的JS使用者

我的工作是游戏引擎开发，并不是前后端开发，我也不太使用JavaScript，所以我并不十分了解JavaScript。如果本教程有疏漏还请指正（email: 2142587070@qq.com）