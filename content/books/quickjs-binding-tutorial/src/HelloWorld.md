# HelloWorld

本HelloWorld展示了执行一个JS文件。此JS文件会在屏幕上输出一行`Hello World`。

[Github代码链接](https://github.com/VisualGMQ/quickjs-cpp-binding-demo/tree/master/demos/01-HelloWorld)

## 包含头文件

首先要做的是包含QuickJS头文件：

```cpp
#include "quickjs.h"
#include "quickjs-libc.h" // optional
```

`quickjs.h`包含了所有需要的API，是最基础头文件。而`quickjs-libc.h`则是拥有很多实用工具的文件（可选）

## 创建Runtime

首先创建JSRuntime：

```cpp
JSRuntime* runtime = JS_NewRuntime();
if (!runtime) {
    std::cerr << "init runtime failed" << std::endl;
    return 1;
}
```

`JSRuntime`的官方文档解释是：

> `JSRuntime` 表示与对象堆对应的 JavaScript 运行时。多个运行时可以同时存在，但它们不能交换对象。在给定的运行时中，不支持多线程。

`JSRuntime`是整个QuickJS环境的基础。

## 创建Context

然后我们需要创建一个Context:

```cpp
JSContext* ctx = JS_NewContext(runtime);
if (!ctx) {
    std::cerr << "create context failed" << std::endl;
    JS_FreeRuntime(runtime);
    return 2;
}
```

`JSContext`的官方文档解释是：

> `JSContext` 表示 JavaScript 上下文（或 Realm）。每个 JSContext 都有其自己的全局对象和系统对象。每个 JSRuntime 可以有多个 JSContext，并且它们可以共享对象，类似于在 Web 浏览器中共享 JavaScript 对象的同源框架。

## 初始化std帮助库

QuickJS环境初始化之后，环境内除几乎没有任何可用的帮助对象（比如在JS中常见的`console.log`）。这个时候我们需要从`quickjs-libc.h`中的函数

```cpp
js_std_add_helpers(ctx, 0, NULL);
```

来给`JSContext`注册一些辅助对象。这些对象包含：

* `console.log`(...args)：用于控制台输出（注：**没有其他的console函数**，他只注册了`log`函数）
* `print(...args)`：也是用于控制台输出
* `scriptArgs`：提供命令行参数。第一个参数是脚本名称

我们会在JS脚本中使用`console.log`函数输出HelloWorld

## 读取JS文件

我们的JS文件如下：

```javascript
// main.js
console.log("Hello QuickJS!");
```

首先将文件读入内存：

```cpp
std::ifstream file("demos/01-HelloWorld/main.js",
                   std::ios::in | std::ios::binary);
if (!file) {
    std::cerr << "open file main.js failed" << std::endl;
}
std::stringstream ss;
ss << file.rdbuf();
std::string content = ss.str();
```

注意需要**以二进制形式读取**

然后使用`JS_Eval`函数执行：

```cpp
JSValue result = JS_Eval(ctx, content.c_str(), content.size(), nullptr, JS_EVAL_TYPE_GLOBAL);
```

参数分别是：

* `JSContext`：你的JS上下文
* `code`：代码
* `code_len`：代码长度
* `filename`：代码所在文件名。可以给空指针或者随便给一个，只是调试使用
* `flags`：以何种方式执行。这里是全局执行，也是默认方式

这个函数会执行整个脚本，并返回一个值。因为我们的脚本内没有返回任何值，所以这里的`result`是`JS_UNDEFINED`（即JS中的`undefine`）

## 错误处理

有些时候脚本会执行出错（出现了语法错误,运行时错误或用户在JS代码中抛了异常等），这时`JS_Eval`会返回一个异常，可以进行处理：

```cpp
if (JS_IsException(result)) {
    // from quickjs-libc.hpp, to log exception
    js_std_dump_error(ctx);
}
```

这里先判断返回值是否是异常。然后使用了`quickjs-libc`的辅助函数帮我们将异常信息输出到控制台上。

## 释放内存

最后不要忘记释放内存：

```cpp
JS_FreeValue(ctx, result);
JS_FreeContext(ctx);
JS_FreeRuntime(runtime);
```

