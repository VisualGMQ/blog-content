# 使用QuickJS标准库

[Github代码链接](https://github.com/VisualGMQ/quickjs-cpp-binding-demo/tree/master/demos/02-UsingInternalModules)

## 使用QuickJS标准库

QuickJS有自己的标准库（输入输出，文件操作，json操作等），详见[QuickJS-NG文档](https://quickjs-ng.github.io/quickjs/stdlib#scriptargs)。但是要使用的话需要调用额外函数进行初始化。

在[HelloWorld](./HelloWorld.md)章节已经看到了如何注册`console.log`和其他全局变量/函数了。其他的函数则需要通过`js_init_module_xxx`进行初始化：

```cpp
js_init_module_os(ctx, "os");
js_init_module_std(ctx, "std");
js_init_module_bjson(ctx, "json");
```

第二个参数是库注册的名称。

## JS代码加载库

有至少三种方式：

### 使用模块模式执行代码

如果想要在JS代码中使用

```js
import * as std from 'std'
```

这类代码，在执行代码时必须将其视为模块执行：

```cpp
JSValue result = JS_Eval(ctx, content.c_str(), content.size(), nullptr, 
                         // use this flag!
                         JS_EVAL_TYPE_MODULE);
```

否则会说没有`import`语法。

作为模块执行的话有一个很严重的缺点：**如果出现某些语法错误/运行时错误，QuickJS会直接静默而非抛出异常**。这意味着调试困难。一般如果模块找不到的话他会正常报错。但是在你使用模块内部的对象（比如对一个不存在的类进行`new`），QuickJS则会abort，并且不会抛出异常（检查`JS_Eval`的返回值不会是异常）

### 使用异步加载方式加载

这种方式可以不以模块方式加载：

```js
import('std').then(module => {
    module.puts("I am std module in non-module mode\n");
}).catch(err => {
    print("Error loading module:", err);
});
```

但这是一段异步代码。我们需要在执行完之后使用`js_std_loop`或`js_std_await`等待异步执行完毕：

```cpp
JSValue result = JS_Eval(ctx, content.c_str(), content.size(), nullptr, JS_EVAL_FLAG_GLOBAL);
js_std_loop(ctx);
```

`js_std_loop`会对整个`JSContext`中需要等待的脚本做等待。只指定某个脚本等待的话需调用`js_std_await`

### 预加载模块，然后执行

我们也可以走两步：

1. 先通过模块模式`import`需要的模块入`JSContext`
2. 执行我们自己的代码。这样可以直接使用已经导入的模块

这里首先以模块模式执行：

```cpp
std::cout << "execute in pre-module mode" << std::endl;
const char* module_preload_code = R"(
    import * as std from 'std';
    globalThis.std = std;
)";
auto value =
    JS_Eval(ctx, module_preload_code, strlen(module_preload_code), nullptr, JS_EVAL_TYPE_MODULE);
```

注意这里需要将模块放入`globalThis`中。

然后执行我们自己的代码：

```js
std.puts("I am std module when preload module\n") // call function in std module
```

```cpp
JSValue result = JS_Eval(ctx, content.c_str(), content.size(), nullptr, JS_EVAL_FLAG_GLOBAL);
```

