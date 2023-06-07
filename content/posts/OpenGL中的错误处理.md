---
title: OpenGL中的错误处理
date: 2021-03-17 11:01:09
category:
- game development
tags:
- OpenGL
---

OpenGL中的错误处理方法有两种，一种是所有版本都能用的`glGetError()`，这个函数每次调用只会返回一个错误值，如果没有错误会返回`GL_NO_ERROR`。而4.3及之后的版本中有`glDebugMessageCallback()`函数，通过这个函数给OpenGL注册一个回调函数，可以在每次发生错误的时候OpenGL以人类可读的方式在屏幕上打印出错误。

这里使用`glGetError()`函数来进行错误处理，首先可以编写函数来清空所有的错误：

```c++
void GLClearError() {
  while (glGetError() != GL_NO_ERROR);
}
```

然后可以编写一个函数来对每个错误值输出：

```c++
void GLPrintError() {
  GLenum err;
  while ((err = glGetError()) != GL_NO_ERROR) {
    cout << "[OpenGL Error]:" << err << endl;
  }
}
```

最后可以编写一个宏来帮助我们在每次调用OpenGL函数时都捕捉错误并输出：

```c++
#define GLCall(x) \
do {
	GLClearError();
	x;
	GLPrintError();
} while(0)
```

这样我们每次通过`GLCall()`调用OpenGL函数就可以检测到错误了：

```c++
GLCall(glBindTexture(GL_TEXTURE0, 0));	// will print error code
```

