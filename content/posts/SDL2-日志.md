---
title: SDL2-日志
date: 2019-07-28 00:38:24
category:
- game development
tags:
- SDL2
---
SDL的日志功能很简单.
首先要明确，SDL的每个日志都由两个条件决定：
* category：类型，可以是如下几个：
    * `SDL_LOG_CATEGORY_APPLICATION`
    * `SDL_LOG_CATEGORY_ERROR`
    * `SDL_LOG_CATEGORY_ASSERT`
    * `SDL_LOG_CATEGORY_SYSTEM`
    * `SDL_LOG_CATEGORY_AUDIO`
    * `SDL_LOG_CATEGORY_VIDEO`
    * `SDL_LOG_CATEGORY_RENDER`
    * `SDL_LOG_CATEGORY_INPUT`
    * `SDL_LOG_CATEGORY_TEST` 测试用
    * `SDL_LOG_CATEGORY_CUSTOM` 用户自己定义的
    * `SDL_LOG_CATEGORY_RESERVED` 为了未来SDL版本的拓展使用，用户不应该占用。
    
    可以看到这些都对应着SDL的模块，也就是按照模块信息分类的
    
* priority：日志级别，这个用过日志库的都很熟悉了，有如下几个：
    * `SDL_LOG_PRIORITY_VERBOSE`
    * `SDL_LOG_PRIORITY_DEBUG`
    * `SDL_LOG_PRIORITY_INFO`
    * `SDL_LOG_PRIORITY_WARN`
    * `SDL_LOG_PRIORITY_ERROR`
    * `SDL_LOG_PRIORITY_CRITICAL`
    
    那么优先级就是CRITICAL>ERROR>WARN>INFO>DEBUG>VERBOSE
    

接下来就是我们常见的日志库中的日志函数了。SDL的日志函数都是类printf格式的。有如下日志函数：
    `SDL_Log SDL_Log Critical/Debug/Error/Info/Verbose/Warn/Message`
    其中`SDL_Log`会默认将日志记到`SDL_LOG_CATEGORY_APPLICATION`,`SDL_LOG_PRIORITY_INFO`类别中。其他的都需要指定。
    `SDL_LogMessage`的第一个参数是category，第二个参数是priority，可以将日志记到任意类别和优先级中。其他的就是按照优先级命名的日志函数了，第一个参数都是category。
    
接下来就是关于日志优先级的函数了：
* `SDL_LogGetPriority(int category)`获得优先级
* `SDL_LogResetPriorities()`将所有category的优先级设为默认（INFO级）
* `SDL_LogSetPriority(int category,SDL_LogPriority priority)`改变优先级。
* `SDL_LogSetAllPriority(SDL_LogPriority priority)`设置所有category的日志一个优先级。

最后SDL还允许你自定义日志的输出方式。你可以给一个函数给SDL，他会按照调用你的函数来输出：
* `SDL_LogGetOutputFunction(SDL_LogOutputFunction* callback,void** userdata)`：获得当前的日志格式函数和额外数据
* `SDL_LogSetOutputFunction(SDL_LogOutputFunction callback,void* userdata)`：设置日志输出格式函数，函数需要有下面的格式
    * `void SDL_LogOutputFunction(void*           userdata,int category,SDL_LogPriority priority,const char* message)`