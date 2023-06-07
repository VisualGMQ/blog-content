---
title: 'OpenGL-关于VAO,VBO的解释'
date: 2019-07-28 10:57:08
category:
- game development
tags:
- OpenGL
---
我在看教程的时候很迷，不知道VBO和VAO有什么用，为什么搞得那么复杂，我这里就来详细的说一下他们两个的工作。
<!--more-->
**VBO**
也就是`vertices buffer object`，顶点缓冲对象。这个东西的作用，就是**将一系列的点放到显存GPU中去**。但是注意，他只是把点放到显存里面去，放进去的点OpenGL并不知道以何种方式绘制出来。
通过`glGenBuffer()`函数来生成一个VBO。然后需要制定VBO的种类，所以你得将其和一个种类进行绑定，使用`glBindBuffer()`函数可以做到。然后OpenGL知道了这个VBO的类型之后，你就可以通过`glBufferData()`函数将点（或者后面学到的其他数据）放到GPU里面去了。

那么到这里，我们都只是将数据（这里是顶点数据）放到GPU中，我们并没有说明这些点怎么绘制对吧。这就是VBO的用途：**只是将点放到GPU中，他就是将数据放到GPU中的一个桥梁**。

***
**VAO**
VAO是`vertice attribute object`，也就是顶点属性对象。这个东西的作用，就是**告诉OpenGL我应该以什么样的方式绘制出VBO放到GPU里面的点**。所以说绘制这一部分是在VAO指定的。
通过`glGenVertexArrays()`函数产生一个VAO，然后你也得绑定（为什么需要绑定后面会说到），使用`glBindVertexArray()`来绑定。然后你就得告诉OpenGL我得怎么绘制那些在显存里面的数据，通过`glVertexAttribPointer()`函数来实现。最后由于着色器的问题你得使用`glEnableVertexAttribArray()`函数来指定点的传输变量（在着色器里面的out变量）。

***
**为什么要绑定**
这里我要先说一下，在源代码的注释中，也就是循环里面的`glBindVertexArray(VAO);`这句话后面说
> seeing as we only have a single VAO there's no need to bind it every time, but we'll do so to keep things a bit more organized

也就是说这里的VAO只有一个，我们其实不需要再循环里面重复绑定。那么我们就先忽略掉循环里面的`glBindVertexArray(VAO);`语句来分析。

作者在开头就告诉我们，OpenGL是一个大的状态机，我们只要按照这个思路去想就可以了。

为什么要绑定VBO？因为OpenGL里面就需要一个VBO来将数据放入GPU中，你绑定了VBO只是在内部产生了类似这样的语句：
```c++
innerVBO = VBO;
```
也就是OpenGL状态机里面将你的VBO视为他要运作的VBO。

那么绑定VAO一个道理，OpenGL里面每次` glDrawElements();`的时候都会以这个VAO指定的绘制方式来绘制点。所以如果后面我们有其他的绘制方式的话你就必须在循环里动态绑定了。

***
**EBO**
EBO的道理和VBO一样，只不过我们传入很多的点，其中有一些点是重复的，让OpenGL注意到不去重复绘制，其实他就是另一个类型的VBO:`GL_ELEMENT_ARRAY_BUFFER`。
但是这里有一点需要注意：**EBO的绑定要在VAO绑定之后**。不知道为什么如果反过来的话图像会不显示。