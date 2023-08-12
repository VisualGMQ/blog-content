---
title: "Raylib的BatchRendering"
date: 2023-08-12T23:21:25+08:00
tags:
- 图形学
- 源码阅读
category:
- game development
---

本文分析了[开源游戏框架Raylib](https://www.raylib.com/) v4.5.0中的batch rendering实现。

<!--more-->

Raylib是一个非常易用的游戏框架。其中90%的代码都是调库代码，只有渲染部分，作者自己封装了一个`rlgl`作为OpenGL的抽象层，里面比较有技术含量的就是他的Batch Rendering部分。

**注意：Raylib对各个版本的OpenGL（gl2,gl3,gles）都做了统一封装（在`src/rlgl.h`中），我们只分析gl3的代码。gl2的太老了就不看了，gles和gl3差不多，原理一样也就不分析了。**

## 什么是Batch Rendering

直译过来是“批渲染”，就是一次性渲染一堆数据。

假设现在有一个TileMap，他需要从一张图上取多个区域绘制在屏幕上，每一个区域是矩形。如果不使用Batch Rendering，函数的可能形式如下：

```cpp
void RenderOneTile(const Texture& texture, const Rect& region, const Rect& dst) {
    // 将数据传给GPU
    glBindBuffer(GL_ARRAY_BUFFER, RenderContext.buffer);
    glBufferData(GL_ARRAY_BUFFER, CreateRectData(region, dst), GL_STATIC_DRAW);
    // 绑定element buffer
    glBindBuffer(GL_ELEMENT_BUFFER, RenderContext.index_buffer);
    
    // 绑定Texture
    glBindTexture(GL_TEXTURE0, texture.id);
    
    // 准备渲染
    glUseProgram(RenderContext.program);
    
    // 渲染
    glDrawElements(GL_TRIANGLES, 0, 6, 0);
}
```

也就是说，每一次渲染都需要将矩形的数据传递给GPU，然后绑定Texture，进行渲染。

这里的性能缺陷主要是：

* 数据传递给GPU：如果的多个`Rect`使用的是同一个`Texture`，那么我们可以将他们的数据全部存储起来，等到最后一并传给GPU
* 多次的`DrawCall`：这里每一个`Rect`都需要一次`DrawCall`。我们可以将数据全部存储起来，然后调用一次关于`Rect`的`DrawCall`就可以绘制全部。

## Raylib中的Batch Rendering

### 重要数据结构

`raylib`自定义了可以绘制的类型：

```cpp
// Primitive assembly draw modes
#define RL_LINES                                0x0001      // GL_LINES
#define RL_TRIANGLES                            0x0004      // GL_TRIANGLES
#define RL_QUADS                                0x0007      // GL_QUADS
```

有三种。在绘制的时候，`raylib`会自行将相关的数据存储在一起，最后进行统一绘制。

#### rlglData

重要的数据结构如下：

```cpp
typedef struct rlglData {
    rlRenderBatch *currentBatch;            // Current render batch
    rlRenderBatch defaultBatch;             // Default internal render batch
	...
} rlglData;
```

`rlglData`中存储着整个Batch Rendering需要的数据，其最后是一个全局变量：

```cpp
static rlglData RLGL = { 0 };
```

其中对Batch Rendering的数据定义是结构体`rlRenderBatch`：

```cpp
// rlRenderBatch type
typedef struct rlRenderBatch {
    int bufferCount;            // Number of vertex buffers (multi-buffering support)
    int currentBuffer;          // Current buffer tracking in case of multi-buffering
    rlVertexBuffer *vertexBuffer; // Dynamic buffer(s) for vertex data

    rlDrawCall *draws;          // Draw calls array, depends on textureId
    int drawCounter;            // Draw calls counter
    float currentDepth;         // Current depth value for next draw
} rlRenderBatch;
```

成员解释如下：

* `vertexBuffer`,`bufferCount`和`currentBuffer`：分别指定了存储顶点数据的buffer(s)，以及当前的buffer下标，和`vertexBuffer`中buffer的数量
* `draws`,`drawCounter`：`draws`代表一个`DrawCall`，而`drawCounter`则存储`draws`中有多少个`rlDrawCall`
* `currentDepth`：当前的深度值。当你在绘制2D图像的时候，后绘制的图像应该在先绘制的图像后面（z值要更大）。每次绘制的时候，顶点的z值就会应用这里的`currentDepth`，然后`currentDepth`会自动变大一些以实现前面的功能。

#### rlVertexBuffer

然后是存储顶点数据的`rlVertexBuffer`：

```cpp
// Dynamic vertex buffers (position + texcoords + colors + indices arrays)
typedef struct rlVertexBuffer {
    int elementCount;           // Number of elements in the buffer (QUADS)

    float *vertices;            // Vertex position (XYZ - 3 components per vertex) (shader-location = 0)
    float *texcoords;           // Vertex texture coordinates (UV - 2 components per vertex) (shader-location = 1)
    unsigned char *colors;      // Vertex colors (RGBA - 4 components per vertex) (shader-location = 3)
#if defined(GRAPHICS_API_OPENGL_11) || defined(GRAPHICS_API_OPENGL_33)
    unsigned int *indices;      // Vertex indices (in case vertex data comes indexed) (6 indices per quad)
#endif
#if defined(GRAPHICS_API_OPENGL_ES2)
    unsigned short *indices;    // Vertex indices (in case vertex data comes indexed) (6 indices per quad)
#endif
    unsigned int vaoId;         // OpenGL Vertex Array Object id
    unsigned int vboId[4];      // OpenGL Vertex Buffer Objects id (4 types of vertex data)
} rlVertexBuffer;

```

结构解释如下：

* `elementCount`：
* `vertices`：顶点数据，由`x`,`y`,`z`三个分量组成
* `texcoords`：顶点的纹理坐标，由`u`,`v`两个分量组成
* `colors`：顶点颜色，由`r`,`g`,`b`,`a`四个分量组成
* `indices`：顶点的索引
* `vaoId`：OpenGL中Vertex Attributes的ID
* `vboId[4]`：OpenGL中的Buffer的ID，分别对应`vertices`，`texcoords`，`colors`和`indices`（也就是说前三个类型是`GL_ARRAY_BUFFER`，最后一个是`GL_ELEMENT_BUFFER`）

可以看出`Raylib`对Vertex的各信息组织是分开的，并用四个Buffer存储，不像Learning OpenGL教程中放在一起。

#### rlDrawCall

然后看一下`rlDrawCall`：
```cpp
// Draw call type
// NOTE: Only texture changes register a new draw, other state-change-related elements are not
// used at this moment (vaoId, shaderId, matrices), raylib just forces a batch draw call if any
// of those state-change happens (this is done in core module)
typedef struct rlDrawCall {
    int mode;                   // Drawing mode: LINES, TRIANGLES, QUADS
    int vertexCount;            // Number of vertex of the draw
    int vertexAlignment;        // Number of vertex required for index alignment (LINES, TRIANGLES)
    //unsigned int vaoId;       // Vertex array id to be used on the draw -> Using RLGL.currentBatch->vertexBuffer.vaoId
    //unsigned int shaderId;    // Shader id to be used on the draw -> Using RLGL.currentShaderId
    unsigned int textureId;     // Texture id to be used on the draw -> Use to create new draw call if changes

    //Matrix projection;        // Projection matrix for this draw -> Using RLGL.projection by default
    //Matrix modelview;         // Modelview matrix for this draw -> Using RLGL.modelview by default
} rlDrawCall;
```

各结构解释如下：

* `mode`：绘制的类型，就是一开始说的三种类型
* `vertexCount`：绘制所需的顶点数目，之后会直接应用在`glDrawArrays()`或`glDrawElements()`函数中
* `vertexAlignment`：顶点的对齐
* `textureId`：要绘制的图像

最后绘制的时候，对于每一个`rlDrawCall`，都会有一个DrawCall一次性将其中的所有数据全部绘制。

这里要说一下`vertexAlignment`的作用。之前说过`rlVertexBuffer.vboId[4]`中最后一个Buffer是索引Buffer，但是不总是能用到这个Buffer（比如你要绘制不连续的三角形，或者很多条不连续的直线时，这个Buffer就完全无用（`Raylib`中就是当你的`mode`为`RL_LINES`或`RL_TRIANGLES`时），调用`glDrawArrays()`就好了）。那么如果用不到，常见的做法是在将顶点数据放入`rlVertexBuffer`中的时候，同时置索引Buffer处的索引为一个固定值：

```cpp
rlVertexBuffer::vertices : (1.0, 2.0, 3.0) (5.0, 6.0, 8.0) (10.0, 11.0, 12.0, 13.0)
rlVertexBuffer::indices  : -1              -1              6 7 8 7 8 9
是否使用：                   不使用           不使用           使用，绘制一个矩形   
```

但是`Raylib`使用了另一种方法：直接将索引Buffer初始化为绘制多个矩形的Buffer：

```cpp
rlVertexBuffer::indices ： 0 1 2 1 2 3  4 5 6 5 6 7  8 9 10 9 10 11 ...
```

每六个元素代表绘制一个矩形。那么你将数据放入`rlVertexBuffer::vertices/texcoords/colors`中的时候，就需要和`indices`对齐。比如我现在要绘制一个矩形，那我直接将数据放入即可：

```cpp
rlVertexBuffer::vertices : v0 v1 v2 v3
rlVertexBuffer::indices  : 0 1 2 1 2 3    4 5 6 5 6 7
是否使用indces:				会使用
```

如果我接下来要绘制一个单独的三角形呢？依旧将数据放入：

```cpp
rlVertexBuffer::vertices : v0 v1 v2 v3    v4 v5 v6
rlVertexBuffer::indices  : 0 1 2 1 2 3    4 5 6 5 6 7   8 9 10 9 10 11
是否使用indces:				会使用          不会使用
```

那这个时候我又要绘制矩形呢？这个时候矩形应该能够利用到`indices`中的索引才行，所以我不能直接放入`vertices`末尾，如果直接放入，顶点对应的索引下标会变为`7 8 9 8 9 10`而不是我们要的`8 9 10 9 10 11`。所以这个时候就要对齐，`Raylib`会设置`rlDrawCall::vertexAlignment`为1以指定偏移量：

```cpp
rlVertexBuffer::vertices : v0 v1 v2 v3    v4 v5 v6 [v7] v8 v9 v10 v11
rlVertexBuffer::indices  : 0 1 2 1 2 3    4 5 6 5 6 7   8 9 10 9 10 11
是否使用indces:				会使用          不会使用        会使用
```

注意这里的`v7`（即`vertices[7]`）是没有数据的，只是用来占位的。

而是否使用`indices`由`rlDrawCall::mode`来决定。是`RL_QUAD`就调用`glDrawElements`并使用索引Buffer。否则调用`glDrawArray()`。

### Batch Rendering的源码

#### 初始化RLGL部分

初始化`RLGL`部分的代码在：

```cpp
//> src/rlgl.h 2477
rlRenderBatch rlLoadRenderBatch(int numBuffers, int bufferElements) {
    rlRenderBatch batch = { 0 };

#if defined(GRAPHICS_API_OPENGL_33) || defined(GRAPHICS_API_OPENGL_ES2)
    // Initialize CPU (RAM) vertex buffers (position, texcoord, color data and indexes)
    //--------------------------------------------------------------------------------------------
    batch.vertexBuffer = (rlVertexBuffer *)RL_MALLOC(numBuffers*sizeof(rlVertexBuffer));

    for (int i = 0; i < numBuffers; i++)
    {
        ...(1)

        int k = 0;

        // Indices can be initialized right now
        for (int j = 0; j < (6*bufferElements); j += 6)
        {
            batch.vertexBuffer[i].indices[j] = 4*k;
            batch.vertexBuffer[i].indices[j + 1] = 4*k + 1;
            batch.vertexBuffer[i].indices[j + 2] = 4*k + 2;
            batch.vertexBuffer[i].indices[j + 3] = 4*k;
            batch.vertexBuffer[i].indices[j + 4] = 4*k + 2;
            batch.vertexBuffer[i].indices[j + 5] = 4*k + 3;

            k++;
        }

        RLGL.State.vertexCounter = 0;
    }
	...(2)
}
```

`(1)`处省略的是`batch`中各个数组`vertices, indices, texcoords, colors`的内存初始化。紧接着的代码是初始化`indices`的部分。然后`(2)`处省略的是对`vaoId`和`vboId[4]`的初始化和绑定，以及对`draws`成员的初始化。省略的代码都是常规操作。

这个函数在一开始初始化窗口（`void InitWindow(int width, int height, const char *title)`）时会调用（`InitGraphicsDevice()`->`rlglInit()`->`rlLoadRenderBatch()`）。最后返回值会给`RLGL`。

需要注意的是，这个函数传入的参数决定了batch buffer和buffer中能够存储的vertex数目。这个数目之后是不会变的。

#### Batch部分

通过刚才的初始化我们知道，`RLGL.currentBatch->vertexBuffer`和`RLGL.currentBatch->draws`的数目初始化后是固定不变的。那么`Raylib`在何时会真正调用DrawCall绘制呢？答案是：

* 当顶点数据超出`vertexBuffer`时，调用所有存储的drawcall然后清除`draws`和`vertexBuffer`中数据
* 当`draws`已满时，调用所有drawcall然后清除`draws`和`vertexBuffer`中数据
* 调用`void EndDrawing(void)`时，代表游戏循环中的渲染全部结束了，会将剩下的batch全部绘制掉

那么何时会出现新对的drawcall呢？答案如下：

* 需要绘制的元素类型和当前drawcall类型（即`mode`成员）不一致时
* 改变了`texture`时

##### 典型raylib绘制程序结构分析

一个典型的`Raylib`程序如下：

```cpp
// 精简过后的examples/shapes/shapes_basic_shapes.c

#include "raylib.h"

int main(void)
{
    const int screenWidth = 800;
    const int screenHeight = 450;

    InitWindow(screenWidth, screenHeight, "raylib [shapes] example - basic shapes drawing");

    while (!WindowShouldClose())
    {
        BeginDrawing();
            ClearBackground(RAYWHITE);

            // Circle shapes and lines
            DrawCircle(screenWidth/5, 120, 35, DARKBLUE);
            DrawCircleGradient(screenWidth/5, 220, 60, GREEN, SKYBLUE);
            DrawCircleLines(screenWidth/5, 340, 80, DARKBLUE);

            // Rectangle shapes and lines
            DrawRectangle(screenWidth/4*2 - 60, 100, 120, 60, RED);
            DrawRectangleGradientH(screenWidth/4*2 - 90, 170, 180, 130, MAROON, GOLD);
            DrawRectangleLines(screenWidth/4*2 - 40, 320, 80, 60, ORANGE);
        EndDrawing();

    }

    CloseWindow();

    return 0;
}
```

通常渲染以一对`BeginDraw()`，`EndDrawing()`包括，里面有所有的渲染调用函数。

以`DrawCircle`为例，他的实现如下（最里面调用的是`DrawCircleSector`）：

```cpp
void DrawCircleSector(Vector2 center, float radius, float startAngle, float endAngle, int segments, Color color)
{
    ...(1)

#if defined(SUPPORT_QUADS_DRAW_MODE)
    rlSetTexture(texShapes.id);

    rlBegin(RL_QUADS);
        // NOTE: Every QUAD actually represents two segments
        for (int i = 0; i < segments/2; i++)
        {
            rlColor4ub(color.r, color.g, color.b, color.a);

            rlTexCoord2f(texShapesRec.x/texShapes.width, texShapesRec.y/texShapes.height);
            rlVertex2f(center.x, center.y);

            rlTexCoord2f(texShapesRec.x/texShapes.width, (texShapesRec.y + texShapesRec.height)/texShapes.height);
            rlVertex2f(center.x + sinf(DEG2RAD*angle)*radius, center.y + cosf(DEG2RAD*angle)*radius);

            rlTexCoord2f((texShapesRec.x + texShapesRec.width)/texShapes.width, (texShapesRec.y + texShapesRec.height)/texShapes.height);
            rlVertex2f(center.x + sinf(DEG2RAD*(angle + stepLength))*radius, center.y + cosf(DEG2RAD*(angle + stepLength))*radius);

            rlTexCoord2f((texShapesRec.x + texShapesRec.width)/texShapes.width, texShapesRec.y/texShapes.height);
            rlVertex2f(center.x + sinf(DEG2RAD*(angle + stepLength*2))*radius, center.y + cosf(DEG2RAD*(angle + stepLength*2))*radius);

            angle += (stepLength*2);
        }

        // NOTE: In case number of segments is odd, we add one last piece to the cake
        ...(2)

    rlSetTexture(0);
#else
    rlBegin(RL_TRIANGLES);
        for (int i = 0; i < segments; i++)
        {
            rlColor4ub(color.r, color.g, color.b, color.a);

            rlVertex2f(center.x, center.y);
            rlVertex2f(center.x + sinf(DEG2RAD*angle)*radius, center.y + cosf(DEG2RAD*angle)*radius);
            rlVertex2f(center.x + sinf(DEG2RAD*(angle + stepLength))*radius, center.y + cosf(DEG2RAD*(angle + stepLength))*radius);

            angle += stepLength;
        }
    rlEnd();
#endif
}
```

`(1)`处省略了一些针对扇形计算的代码。`(2)`处则省略了对特殊情况的处理。

我们主要看结构，可以看到首先会使用`rlSetTexture()`设置纹理，然后渲染代码总以一对`rlBegin(XXX)`,`rlEnd()`包裹，在里面通过`rlColor4ub()`,`rlVertex2f()`,`rlTexCoord2f()`指定顶点的数据。注意`rlVertex2f()`一定要在最后调用。因为`rlColor4ub()`和`rlTexCoord2f()`是将数据存在`RLGL`中。

##### 改变texture

改变texture会导致产生新drawcall：

```cpp
// Set current texture to use
void rlSetTexture(unsigned int id)
{
    if (id == 0)
    {
#if defined(GRAPHICS_API_OPENGL_11)
        rlDisableTexture();
#else
        // NOTE: If quads batch limit is reached, we force a draw call and next batch starts
        if (RLGL.State.vertexCounter >=
            RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].elementCount*4)
        {
            rlDrawRenderBatch(RLGL.currentBatch);
        }
#endif
    }
    else
    {
#if defined(GRAPHICS_API_OPENGL_11)
        rlEnableTexture(id);
#else
        if (RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].textureId != id)
        {
            if (RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount > 0)
            {
                // Make sure current RLGL.currentBatch->draws[i].vertexCount is aligned a multiple of 4,
                // that way, following QUADS drawing will keep aligned with index processing
                // It implies adding some extra alignment vertex at the end of the draw,
                // those vertex are not processed but they are considered as an additional offset
                // for the next set of vertex to be drawn
                if (RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].mode == RL_LINES) RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexAlignment = ((RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount < 4)? RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount : RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount%4);
                else if (RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].mode == RL_TRIANGLES) RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexAlignment = ((RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount < 4)? 1 : (4 - (RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount%4)));
                else RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexAlignment = 0;

                if (!rlCheckRenderBatchLimit(RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexAlignment))
                {
                    RLGL.State.vertexCounter += RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexAlignment;

                    RLGL.currentBatch->drawCounter++;
                }
            }

            if (RLGL.currentBatch->drawCounter >= RL_DEFAULT_BATCH_DRAWCALLS) rlDrawRenderBatch(RLGL.currentBatch);

            RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].textureId = id;
            RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount = 0;
        }
#endif
    }
}
```

22行在判断当前texture是否改变。如果改变了，24行的`if`内会计算alignment，然后35~41行会新增drawcall数据结构，43行时会将信息存入。

这里面的`rlDrawRenderBatch()`是真正进行batch rendering的地方。后面会说。

##### 开始进行渲染rlBegin

```cpp
// Initialize drawing mode (how to organize vertex)
void rlBegin(int mode)
{
    // Draw mode can be RL_LINES, RL_TRIANGLES and RL_QUADS
    // NOTE: In all three cases, vertex are accumulated over default internal vertex buffer
    if (RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].mode != mode)
    {
        if (RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount > 0)
        {
            // Make sure current RLGL.currentBatch->draws[i].vertexCount is aligned a multiple of 4,
            // that way, following QUADS drawing will keep aligned with index processing
            // It implies adding some extra alignment vertex at the end of the draw,
            // those vertex are not processed but they are considered as an additional offset
            // for the next set of vertex to be drawn
            rlDrawCall* draw = &RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1];
            if (draw->mode == RL_LINES) draw->vertexAlignment = ((draw->vertexCount < 4)? draw->vertexCount : draw->vertexCount%4);
            else if (draw->mode == RL_TRIANGLES) draw->vertexAlignment = ((draw->vertexCount < 4)? 1 : (4 - (draw->vertexCount%4)));
            else draw->vertexAlignment = 0;

            if (!rlCheckRenderBatchLimit(draw->vertexAlignment))
            {
                RLGL.State.vertexCounter += draw->vertexAlignment;
                RLGL.currentBatch->drawCounter++;
            }
        }

        if (RLGL.currentBatch->drawCounter >= RL_DEFAULT_BATCH_DRAWCALLS) rlDrawRenderBatch(RLGL.currentBatch);

        RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].mode = mode;
        RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount = 0;
        RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].textureId = RLGL.State.defaultTextureId;
    }
}
```

这里每一行都很重要:

第6行的`if`判断`mode`是否改变了。如果改变了，说明要新增一个drawcall了。

第8行的`if`及里面的代码是在算当前vertex的alignment，并存储得到`draw->vertexAlignment`中（说是alignment，倒不如说是padding，是当前数据到之前数据之间的空隙个数。所以`RLGL.State.vertexCounter`也要加上这个空隙个数）。

然后27行看一下`draws`是否已满，满了触发batch rendering，之后就将数据放入新的`draws`中。

##### 将数据存放入buffer中

```cpp
// Define one vertex (color)
void rlColor4ub(unsigned char x, unsigned char y, unsigned char z, unsigned char w)
{
    RLGL.State.colorr = x;
    RLGL.State.colorg = y;
    RLGL.State.colorb = z;
    RLGL.State.colora = w;
}

// rlTexCoord2d()同理，不贴了
```

然后`rlVertex2f()`会将所有数据放入buffer中：

```cpp
// Define one vertex (position)
void rlVertex2f(float x, float y)
{
    rlVertex3f(x, y, RLGL.currentBatch->currentDepth);
}

// Define one vertex (position)
// NOTE: Vertex position data is the basic information required for drawing
void rlVertex3f(float x, float y, float z)
{
    float tx = x;
    float ty = y;
    float tz = z;

    // Transform provided vector if required
    if (RLGL.State.transformRequired)
    {
        tx = RLGL.State.transform.m0*x + RLGL.State.transform.m4*y + RLGL.State.transform.m8*z + RLGL.State.transform.m12;
        ty = RLGL.State.transform.m1*x + RLGL.State.transform.m5*y + RLGL.State.transform.m9*z + RLGL.State.transform.m13;
        tz = RLGL.State.transform.m2*x + RLGL.State.transform.m6*y + RLGL.State.transform.m10*z + RLGL.State.transform.m14;
    }

    // WARNING: We can't break primitives when launching a new batch.
    // RL_LINES comes in pairs, RL_TRIANGLES come in groups of 3 vertices and RL_QUADS come in groups of 4 vertices.
    // We must check current draw.mode when a new vertex is required and finish the batch only if the draw.mode draw.vertexCount is %2, %3 or %4
    if (RLGL.State.vertexCounter > (RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].elementCount*4 - 4))
    {
        if ((RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].mode == RL_LINES) &&
            (RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount%2 == 0))
        {
            // Reached the maximum number of vertices for RL_LINES drawing
            // Launch a draw call but keep current state for next vertices comming
            // NOTE: We add +1 vertex to the check for security
            rlCheckRenderBatchLimit(2 + 1);
        }
        else if ((RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].mode == RL_TRIANGLES) &&
            (RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount%3 == 0))
        {
            rlCheckRenderBatchLimit(3 + 1);
        }
        else if ((RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].mode == RL_QUADS) &&
            (RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount%4 == 0))
        {
            rlCheckRenderBatchLimit(4 + 1);
        }
    }

    // Add vertices
    RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].vertices[3*RLGL.State.vertexCounter] = tx;
    RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].vertices[3*RLGL.State.vertexCounter + 1] = ty;
    RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].vertices[3*RLGL.State.vertexCounter + 2] = tz;

    // Add current texcoord
    RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].texcoords[2*RLGL.State.vertexCounter] = RLGL.State.texcoordx;
    RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].texcoords[2*RLGL.State.vertexCounter + 1] = RLGL.State.texcoordy;

    // TODO: Add current normal
    // By default rlVertexBuffer type does not store normals

    // Add current color
    RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].colors[4*RLGL.State.vertexCounter] = RLGL.State.colorr;
    RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].colors[4*RLGL.State.vertexCounter + 1] = RLGL.State.colorg;
    RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].colors[4*RLGL.State.vertexCounter + 2] = RLGL.State.colorb;
    RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].colors[4*RLGL.State.vertexCounter + 3] = RLGL.State.colora;

    RLGL.State.vertexCounter++;
    RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].vertexCount++;
}
```

上面代码中，16行那个`if`表示如果需要进行变换，会乘上变换矩阵。

26行那个`if`是在看`RLGL.currentBatch->vertexBuffer`能否容纳新加入的顶点。如果不能，就触发BatchRendering先将所有点绘制掉，然后清空以存储新点（这一过程在`rlCheckRenderBatchLimit(count)`中）：

```cpp
bool rlCheckRenderBatchLimit(int vCount)
{
    bool overflow = false;

#if defined(GRAPHICS_API_OPENGL_33) || defined(GRAPHICS_API_OPENGL_ES2)
    if ((RLGL.State.vertexCounter + vCount) >=
        (RLGL.currentBatch->vertexBuffer[RLGL.currentBatch->currentBuffer].elementCount*4))
    {
        overflow = true;

        // Store current primitive drawing mode and texture id
        int currentMode = RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].mode;
        int currentTexture = RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].textureId;

        rlDrawRenderBatch(RLGL.currentBatch);    // NOTE: Stereo rendering is checked inside

        // Restore state of last batch so we can continue adding vertices
        RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].mode = currentMode;
        RLGL.currentBatch->draws[RLGL.currentBatch->drawCounter - 1].textureId = currentTexture;
    }
#endif

    return overflow;
}
```

第6行在判断能否容纳。如果不行，15行会触发Batch Rendering（里面会置`RLGL.currentBatch->drawCounter`为1，就是清空`draws`），然后18-19行将数据存到`draws`中。

##### 真正的Batch Rendering：rlDrawRenderBatch()

真正的Batch Rendering代码巨多，这里简化一下贴上来：

```cpp
void rlDrawRenderBatch(rlRenderBatch *batch)
{
#if defined(GRAPHICS_API_OPENGL_33) || defined(GRAPHICS_API_OPENGL_ES2)
    // Update batch vertex buffers
    //------------------------------------------------------------------------------------------------------------
    // NOTE: If there is not vertex data, buffers doesn't need to be updated (vertexCount > 0)
    // TODO: If no data changed on the CPU arrays --> No need to re-update GPU arrays (change flag required)
    if (RLGL.State.vertexCounter > 0)
    {
        // Activate elements VAO
        if (RLGL.ExtSupported.vao) glBindVertexArray(batch->vertexBuffer[batch->currentBuffer].vaoId);

        ...(1)

        // Unbind the current VAO
        if (RLGL.ExtSupported.vao) glBindVertexArray(0);
    }
    //------------------------------------------------------------------------------------------------------------

    // Draw batch vertex buffers (considering VR stereo if required)
    //------------------------------------------------------------------------------------------------------------
    Matrix matProjection = RLGL.State.projection;
    Matrix matModelView = RLGL.State.modelview;

    int eyeCount = 1;
    if (RLGL.State.stereoRender) eyeCount = 2;

    for (int eye = 0; eye < eyeCount; eye++)
    {
        if (eyeCount == 2)
        {
            ...(2)
        }

        // Draw buffers
        if (RLGL.State.vertexCounter > 0)
        {
            ...(3)

            if (RLGL.ExtSupported.vao) glBindVertexArray(batch->vertexBuffer[batch->currentBuffer].vaoId);
            else
            {
                ...(4)
            }

            ...(5)

            for (int i = 0, vertexOffset = 0; i < batch->drawCounter; i++)
            {
                // Bind current draw call texture, activated as GL_TEXTURE0 and Bound to sampler2D texture0 by default
                glBindTexture(GL_TEXTURE_2D, batch->draws[i].textureId);

                if ((batch->draws[i].mode == RL_LINES) || (batch->draws[i].mode == RL_TRIANGLES)) glDrawArrays(batch->draws[i].mode, vertexOffset, batch->draws[i].vertexCount);
                else
                {
#if defined(GRAPHICS_API_OPENGL_33)
                    // We need to define the number of indices to be processed: elementCount*6
                    // NOTE: The final parameter tells the GPU the offset in bytes from the
                    // start of the index buffer to the location of the first index to process
                    glDrawElements(GL_TRIANGLES, batch->draws[i].vertexCount/4*6, GL_UNSIGNED_INT, (GLvoid *)(vertexOffset/4*6*sizeof(GLuint)));
#endif
#if defined(GRAPHICS_API_OPENGL_ES2)
                    glDrawElements(GL_TRIANGLES, batch->draws[i].vertexCount/4*6, GL_UNSIGNED_SHORT, (GLvoid *)(vertexOffset/4*6*sizeof(GLushort)));
#endif
                }

                vertexOffset += (batch->draws[i].vertexCount + batch->draws[i].vertexAlignment);
            }

            if (!RLGL.ExtSupported.vao)
            {
                glBindBuffer(GL_ARRAY_BUFFER, 0);
                glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);
            }

            glBindTexture(GL_TEXTURE_2D, 0);    // Unbind textures
        }

        if (RLGL.ExtSupported.vao) glBindVertexArray(0); // Unbind VAO

        glUseProgram(0);    // Unbind shader program
    }

    ...(6)

    // Reset RLGL.currentBatch->draws array
    for (int i = 0; i < RL_DEFAULT_BATCH_DRAWCALLS; i++)
    {
        batch->draws[i].mode = RL_QUADS;
        batch->draws[i].vertexCount = 0;
        batch->draws[i].textureId = RLGL.State.defaultTextureId;
    }

    // Reset active texture units for next batch
    for (int i = 0; i < RL_DEFAULT_BATCH_MAX_TEXTURE_UNITS; i++) RLGL.State.activeTextureId[i] = 0;

    // Reset draws counter to one draw for the batch
    batch->drawCounter = 1;
    //------------------------------------------------------------------------------------------------------------

    // Change to next buffer in the list (in case of multi-buffering)
    batch->currentBuffer++;
    if (batch->currentBuffer >= batch->bufferCount) batch->currentBuffer = 0;
#endif
}
```

这里`(1)`处是将顶点信息`vertices`,`texcoords`等的数据传入对应buffer。

`(2)`处的`eyeCount`如果是2，代表要用VR（从两个眼睛处看物体，并绘制两幅图），做一些用于VR绘制的准备操作（主要是设置矩阵）。

`(3)`处使用着色器，并初始化一些矩阵。

`(4)`处，如果不能够绑定`VAO`（因为OpenGLES2不支持），那么会使用GLES2的方式处理各个Buffer以正确绑定（不过如果有`GL_ARB_vertex_array_object`拓展支持也可以绑定（也就是`RLGL.ExtSupported.vao`指定的事情））。

`(5)`处设置一些着色器的`Uniform`变量。

`(6)`处渲染已经完毕了，重置一些变量的值。

真正的渲染在53行处开始：如果是`RL_LINES`或`RL_TRIANGLES`，则调用`glDrawArray()`直接绘制。否则调用`glDrawElements`进行绘制。然后`vertexOffset`通过`vertexCount`和`vertexAlignment`指向下一批数据。

## 总结

* batch rendering的优点：减少数据送往GPU的次数，减少drawcall

* `raylib`的batch rendering做法：将数据尽可能地先存在本地，相同类型的绘制使用一个drawcall一次性绘制完毕。

* 导致新增drawcall的情况：

    * 改变了texture
    * 改变了绘制类型

    这就说明，如果要利用到batch rendering，就需要相同类型，相同texture的元素放在一起绘制。这也就是为什么游戏引擎中会使用图集的原因：同一类UI全部使用一个texture，texture不变。UI中能使用矩形就使用矩形，减少绘制类型的改变次数，以充分利用batch rendering。

