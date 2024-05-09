# NickelEngine——图形学试验场地

**NickelEngine**是一个我用来学习图形学方方面面的引擎。大部分的底层都是纯手工造轮子。

工程开源地址：[VisualGMQ/NickelEngine: a game engine based on ECS (github.com)](https://github.com/VisualGMQ/NickelEngine)

## 在线Demo

引擎在线Demo（某些Demo因技术原因暂时无法放入网页（菜，就多练））：

* [Triangle-显示一个三角形](/NickelEngine/demos/Triangle/index.html)
* [Cube-显示一个彩色立方体](/NickelEngine/demos/cube/index.html)
* [TextureCube-显示一个带有纹理的立方体](/NickelEngine/demos/texture_cube/index.html)
* [NormalMap-法线贴图](/NickelEngine/demos/normal_map/index.html)

## 引擎内容

引擎底层采用ECS架构。ECS库为自研的[Gecs](https://github.com/VisualGMQ/gecs)，主要借鉴开源项目EnTT的代码设计和内部算法，并且在API上加以改良，向Bevy-ECS的API设计靠齐。

引擎内部拥有序列化和反序列化/预制体创建操作，核心是自研C++17反射库[mirrow](https://github.com/VisualGMQ/mirrow)，主要借鉴meta，refl-cpp，ponder，RTTR反射库的实现和API设计。在原有的记录类信息反射的功能上添加了自动序列化/反序列化功能（目前仅可序列化为TOML文件，但预留了接口，可非侵入地增加其他文件的序列化功能）

引擎渲染部分后端如下：

| 平台/图形学API            | Vulkan             | OpenGL 4.3         | OpenGLES 3.0       |
| ------------------------- | ------------------ | ------------------ | ------------------ |
| PC（Windows,MacOS,Linux） | :heavy_check_mark: | :heavy_check_mark: |                    |
| Android                   | :hammer:           | :x:                | :hammer:           |
| Web                       | :x:                | :x:                | :heavy_check_mark: |

暂不考虑苹果系列产品。

渲染部分拥有一个抽象层，封装了Vulkan和OpenGL。API风格借鉴WebGPU。

### 引擎编辑器

为了能够实时查看引擎的功能，制作了一个编辑器。

演示视频可见 [Bilibili【NickelEngine简要介绍】](https://www.bilibili.com/video/BV1of42127UM/?share_source=copy_web&vd_source=e1b8baee842192a0e6b2b7d9ef8e10ef&t=0)

目前只有2D功能，可以创建/删除Entity和Component。可以显示2D图像。并且有一个动画编辑器可以制作简单动画。
