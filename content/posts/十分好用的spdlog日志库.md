---
title: 十分好用的spdlog日志库
date: 2019-08-09 00:08:58
category:
- 杂项
---

最近发现了一个十分好用的日志库spdlog。这个库就连安装都很简单，你只需要`brew install spdlog`或者`sudo apt-get install spdlog`即可。

***
spdlog是一个十分十分轻量级的，但是速度很快很快的库。缺点是有一些函数不支持线程安全。但是我们目前并不关心这些。
***
<!--more-->
## spdlog的简单使用
spdlog是一个“要什么包含什么”的库，你想要什么功能就包含什么头文件。我们先包含`spdlog.h`文件来使用最最基础的方法：

```c
#include <spdlog/spdlog.h>

int main(int argc, char** argv){
    spdlog::set_level(spdlog::level::err);
    spdlog::error("this is an error");
    spdlog::info("this is an info");
    spdlog::debug("this is debug");
    spdlog::warn("this is a warn");
    spdlog::critical("this is a critical");
    spdlog::info("{} a info {}", 3.14159, false);
    return 0;
}
```

这里我们没有使用命名控件`spdlog`，这样看上去更清楚。
首先你可以使用`set_level`函数来设置当前的日志等级，所有的等级如下（从大到小）：
`critical(致命错误) err(错误) warn(警告) info(信息) debug(调试) trace(跟踪)`
最后显示出来的信息只会是你指定等级及其左边的等级日志，比如将等级设置为`warn`:

![屏幕快照 2019-07-11 下午4.42.03.png](/images/B993DAE1DD3C6A63B4D50503AFC8E061.png)

这样info, debug, trace信息都不会被显示出来。
你也可以传入`off`来让所有信息都显示出来。

### 格式化输出
spdlog设计的可以像python一样，使用`{}`作为占位符来输出：

```c
spdlog::warn("this is {} file warn {}", "VisualGMQ", false);

//output
[2019-07-11 17:03:29.927] [warning] this is VisualGMQ file warn false
```

只要类重载了operator<<，那么就可以被日志输出。

## 通过日志器（日志池？）来记日志
spdlog的最大优点在于他有很多很多的日志器来记录日志。你想要使用这些日志器的话需要包含相应的头文件。

### 使用控制台日志器`stdout_color_mt`
首先你要包含头文件`spdlog/sinks/stdout_color_sinks.h`。所有的日志器的头文件都在`sink`目录下。
然后你需要声明日志器对象并且使用：

```c
#include <spdlog/spdlog.h>
#include <spdlog/sinks/stdout_color_sinks.h>
using namespace std;

int main(int argc, char** argv){
    auto console_log = spdlog::stdout_color_mt("console1");
    console_log->set_level(spdlog::level::info);
    console_log->info("this is console info");
    console_log->warn("this is console warn");
    console_log->critical("this is console critical");
    spdlog::drop_all();
    return 0;
}
```

使用的方法和最基本的spdlog一样。你可以设置日志等级啊，或者输出不同等级的日志。
每次获得一个日志器，spdlog内部都会进行管理（其实`stdout_color_mt`是一个工厂方法，其参数是你的日志器的名称），可以通过`spdlog::get()`函数传入日志器的名称来获得日志器。
11行的`drop_all()`会释放所有的日志器。

使用日志器的好处有：
* 本日志器的日志等级设置不会影响到其他日志器
* 最后的输出信息会显示是哪个日志器输出的：

![屏幕快照 2019-07-11 下午4.44.59.png](/images/D277DBBF8DE18EAAAD4BEE12E76A3E3F.png)

红色圈圈出来的那些就是日志器名称。

### 使用文件日志器`basic_file_sink`
同样的，需要包含`spdlog/sinks/basic_file_sink.h`
然后像一般日志器使用即可，但是由于是文件日志器，其工厂函数还需要文件的名称才行：

```c
#include <spdlog/spdlog.h>
#include <spdlog/sinks/basic_file_sink.h>

int main(int argc, char** argv){
    auto file_log = spdlog::basic_logger_mt("filelog1", "./file1.txt");
    file_log->info("this is file info");
    file_log->warn("this is file warn");
    spdlog::drop_all();
    return 0;
}

//output
file1.txt中：
[2019-07-11 16:52:47.932] [filelog1] [info] this is file info
[2019-07-11 16:52:47.932] [filelog1] [warning] this is file warn
```

不过文件日志器每次记录不会将元数据覆盖掉。

**还有很多其他的logger，但是我现在还不怎么用，先把他们官网的教程放在这里吧，要用到的时候可以去查一查"Sinks"一章，[wiki](https://github.com/gabime/spdlog/wiki)**