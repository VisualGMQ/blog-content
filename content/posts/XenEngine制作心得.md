---
title: XenEngine制作心得
date: 2021-05-22 15:31:49
category:
- game development
tags:
- game engine
---

![XenEngine](https://i.loli.net/2021/05/22/EHWuAsVUcMnYtxX.png)

XenEngine是我的本科毕业设计，是一个基于OpenGL的游戏引擎，仓库在[这里](https://gitee.com/VisualGMQ/xen-engin.git)  

我还为这个破引擎做了个视频：
{% bilicard BV1U5411u7Tv %}
这次就来说一说我制作这个引擎的心得

<!-- more -->

# 心得体会

这个引擎是我花费了将近20天制作的，其实也算是一个速成引擎，里面还有不少的bug。  
以前写过渲染器，但是写的比较垃圾。这次本来想把PBR和曲线绘制加进来的，但是时间实在是不够了，就写了个小的。总的来说不是很满意。  
因为之前没有写过游戏引擎，这次一开始是跟着[Cherno的视频](https://www.bilibili.com/video/BV1KE41117BD?from=search&seid=6686429739796972054)一步一步做的，前期基本就是跟着视频一步一步抄代码，毕竟我也不知道他后面会讲什么，所以不敢擅自改动，怕后面代码结构不一样自己变来变去还麻烦。但是他只讲到了2D部分，后面的3D部分是我自己独立完成的。  
不得不说大佬就是不一样，代码的结构非常的清晰，从中学到了不少。  

## 技术细节

### 如何跨平台和允许用户指定渲染API

首先是关于跨平台的事情，Cherno一开始就打算让引擎跨平台，需要支持多种渲染API，并且还提供给用户自己选择API的权利。也就是说，你可以通过如下代码来指定引擎使用的API：  

```c++
Renderer::Init(RendererAPI::API::OpenGL); // 选择OpenGL
Renderer::Init(RendererAPI::API::Vulkan); // 选择Vulkan
Renderer::Init(RendererAPI::API::DX11);   // 选择DirectX11
```

具体的做法是这样，首先对API进行抽象，比如顶点缓冲，索引缓冲和纹理等都做一个高层次的抽象:  

```c++
class VertexBuffer;
class IndexBuffer;
class Texture;
```

然后让具体的API去实现这些抽象类：  

```c++
class OpenGLVertexBuffer: public VertexBuffer {}
class OpenGLIndexBuffer: public IndexBuffer {}
class OpenGLTexture: public Texture {}
```

然后在`Renderer::Init()`方法中让用户指定API：  

```c++
enum class RendererAPI {
    None, OpenGL, Vulkan, DX11
};

class Renderer {
public:
    static void Init(RendererAPI api) { api_type_ = api; }
    inline static RendererAPI GetAPI() { return api_type_; }
...

private:
    static RendererAPI api_type_;
};
```

最后在抽象类中使用工厂方法，根据API的不同来创建不同的子类：  

```c++
std::static_cast<VertexBuffer> VertexBuffer::Create() {
    switch (Renderer::GetAPI()) {
        case OpenGL:
            return std::make_shared<OpenGLVerteBuffer>();
        case Vulkan:
            return std::make_shared<VulkanVerteBuffer>();
        case DX11:
            return std::make_shared<DirectX11VerteBuffer>();
    }
    return nullptr;
}
```

这样就达到动态指定API的方法了。

我在其上做了点改进，因为不是所有的平台都有OpenGL或者Vulkan的，我们需要检测平台有没有，如果没有的话就不应该让用户指定对应的API。这一点可以让CMake帮我们搞定：  

```cmake
find_package(OpenGL QUIET) # 先让CMake寻找库

add_library(XenEngine) # 添加target

if (OpenGL_FOUND) # 如果找到了，我们就给一个宏定义HAS_OPENGL
    target_compile_options(
    XenEngine
    PUBLIC HAS_OPENGL
    )
endif()
```

有了这个宏定义我们就可以在工程中指定了：  

```c++
enum class RendererAPI {
    None,
#ifdef HAS_OPENGL
    OpenGL,
#endif
#ifdef HAS_VULKAN
    Vulkan,
#endif
    ...
};
```

这样就可以做到避免不存在的API指定。

### 智能指针的广泛使用

其次让我感到新奇的是它对智能指针的广泛使用。在他的工程里面几乎没有使用过new和delete操作符，都是使用智能指针代替。  
其实我也很熟悉智能指针，只是没有这么广泛地用过，因为很难确定`unique_ptr`和`shared_ptr`的使用场景，经常要在两者之间来回切换。这一次我是见识到了智能指针的威力，以及何为“RAII”。这种不用操心内存释放的事情简直太美妙了。  
其实总的来说，`shared_ptr`的使用比`unique_ptr`广得多，毕竟有很多变量都是共享的，需要当做参数传来传去。我好像就没有用`unique_ptr`。  

但是智能指针也有不是很管用的情况，就是在使用ODE的时候，ODE需要在程序结束的时候调用`dCloseODE()`，而在调用这个函数前必须将所有的ODE引擎对象全部使用Destroy函数删掉。这就造成了一个问题：因为ODE是纯C的库，我在上面又封装了一层C++，并且仿照了Cherno的做法使用工厂函数返回`shared_ptr`。一旦我返回了`shared_ptr`，这意味着我将变量的析构交给了系统，按道理来说我是完全不需要操心的。但是由于ODE的这个特性，我不得不将每一个产生的`shared_ptr`记录下来，最后再ODE关闭前全部手动清除。讲真这样我还不如不用智能指针，我自己写一个管理类都好一些。  

这里顺便吐槽一下ODE：你居然自己不在关闭的时候自动释放。我怀疑他就没有追踪他分配的这些内存。。。

### 着色器方面的细节

我之前一直为着色器的uniform变量困扰过，以冯氏光照为例，有些模型是有镜面贴图的，有些没有。我以前的做法是直接写两个着色器，一个有`uniform Sampler2D specular_map`，一个没有。因为不适用的uniform着色器会自动移除，所以如果你写了不用的话会在光照计算方面带来错误。  
但是显然这样非常麻烦。后面还有视差贴图和法线贴图等，不能总是每多一类贴图就多写一个着色器。  
Cherno给了个很好的解决方案：如果你不适用镜面贴图，直接给一个黑色的1x1的贴图就行了。简直天才。同理，不适用的法线贴图可以给一个纯蓝色的1x1纹理。  
而且这些纹理不需要从文件读取，直接`glTexImage()`传给GPU就行了，美滋滋。  
用这个方法只需要写一个着色器就行了。

## 对未来的展望

通过这次毕设，我学到了很多，也充分认识到了自己的不足。虽然是因为时间关系没有加一些新东西，但是说真话，就算加了PBR和曲线我也依然没有办法想出这么好的代码设计和处理一些疑难杂症的方法。而且我也看了别人写的引擎，比我的牛逼多了。我感觉我在计算机图形学方面还是刚刚入门。现在我越来越坚信我二战是正确的选择，我希望我能成功上岸图形学的研究生，花个两三年时间好好研究研究这方面。
