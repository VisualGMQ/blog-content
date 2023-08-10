---
title: EnTT源码分析【一】：什么是ECS
date: 2023-08-10T09:42:16+08:00
tags:
- 源码阅读
- EnTT
category:
- game development
---

本文分析了开源项目[EnTT](https://github.com/skypjack/entt) v3.12.2的原理和实现。述说了ECS架构。

## ECS架构

### ECS的用法

ECS是一个典型的组合优于继承的架构。

即`Entity`, `Component`, `System`架构：

* `Entity`：游戏中的某个实体，通常用正整数实现
* `Component`：游戏中的组件，用于附加在Entity上。例如物理系统中的`RigidBody`，渲染部分的`PBRMaterial`等。一般是不含有方法的纯粹数据
* `System`：用于处理附加在Entity的Component。

一个ECS例子如下：

```cpp
// 以下源码仅为示例，并不严谨

void UpdatePhysics(entt::registry& reg) {
    auto entities = reg.view<RigidBody>();
    for (auto& [entity, rigidbody] : entities) {
        // 在这里更新物理
        rigidbody.acc = rigidbody.force * rigidboyd.mass;
        rigidbody.vel = rigidbody.acc * entt::resource_cache<Timer, TimerLoader>{}[0].time();
    }
}

int main() {
    entt::registry reg; // EnTT中用于管理整个ECS的结构

    auto entity = reg.create(); // 创建一个Entity
    reg.emplace(entity, RigidBody::Create(math::Vec2(100.0, 200.0)));   // 创建一个物理组件并附加到Entity上

    // 游戏循环中
    while (!shouldClose) {
        // ...
        UpdatePhysics(reg);
        // ...
    }
}
```

一般来说。一个ECS系统包含如下几个部分：

* `World`：即管理整个ECS数据的地方，在EnTT中是`entt::registry`
* `Querier`：查询器，用来得到含有某个特定组件的实体们，或者从实体得到组件。在EnTT中是`entt::view`
* `Resource`：\[可选\]，资源。本质上是组件，但不附加在任何实体上，且一般全局只有一份。EnTT中是`entt::resource_cache`
* `System`：系统，在游戏循环中被调用用来对组件进行实际操作。EnTT中没有特定类型，自己写函数进行组件操作即可。Bevy中有`StartupSystem`用于程序启动时调用一次，以及`UpdateSystem`用于每帧调用。

还可以分的更细致，比如Bevy中将一些功能从`World`中抽出：

* `Commands`：创建实体/将组件附加在实体/删除实体 的帮助类
* `Resources`：用于方便地从`World`中得到资源

### ECS的优点

相比传统的OO，ECS优点如下：

* OO编程通过类继承来组合数据/功能。这有可能导致产生冗余数据。但ECS可以将数据分为不相干的多个部分，并通过组件插拔的方式灵活地组合。
* OO编程对CPU Cache不友好。摩尔定律指出，CPU每18个月性能翻倍。但内存性能增长速度没有跟上CPU，这导致利用CPU Cache数据是提升性能非常必要的手段。在近几年，由于物理原因，[摩尔定律在慢慢失效](https://zh.wikipedia.org/wiki/%E6%91%A9%E5%B0%94%E5%AE%9A%E5%BE%8B#%E8%BF%98%E8%83%BD%E6%8C%81%E7%BB%AD%E5%A4%9A%E4%B9%85)，导致现在CPU提升性能的常见方法是堆核（多核CPU）。所以利用多核的优势进行并行编程也是必要的手段。而ECS通过将数据分为多个无关部分，各部分的处理更有利于并行。在Bevy游戏引擎中，就已经实现不相关系统并行运行的功能。

由于EnTT的`System`部分由用户自己编写，所以EnTT并没有提供任何`System`并行支持，本系列也不会说。并行支持部分可自行参阅[flecs](https://github.com/SanderMertens/flecs)源码。

### EnTT的工程结构

下面列举了`src/`文件夹下的结构（src下是源码部分）。可选部分指可以使用，不使用的话不会参与编译（独立模块）。

* config：用于通过宏控制EnTT的某些配置
* container：一些通用容器
* core：核心算法，traits，any，内存分配器和一些工具
* entity：**整个EnTT最核心的部分**，是`entt::registry`实现的地方，有着ECS大部分功能
* graph：\[可选\]。 用于辅助开发者做出管线流图的东西。不会在本系列中分析
* locator：\[可选\]。服务定位器
* meta：\[可选\]。动态反射，不会在本系列中分析
* platform：平台相关
* poly：\[可选\]。用于做静态多态的东西。不会在本系列中分析
* process：\[可选\]。文档里没说，应该是用于任务调度的东西。不会在本系列中分析
* resource：\[可选\]。用于提供`Resource`支持
* signal：信号和委托部分，用于提供信号，事件分发&接收。本质上是个委托框架

EnTT的单元测试做的很好，所有模块对应的单测在`test/`目录下。