---
title: OpenGL-法向量变换
date: 2019-10-12 10:59:39
category:
- game development
tags:
- OpenGL

mathjax: true
---
这两天在看OpenGL光照的时候，教程上提到了法向量变换。这里就来推导一下。
<!--more-->

# 法向量变换

## 为什么要法向量变换
很简单，因为如果你直接对法向量采用模型矩阵model或者其他比那还的话，会改变法向量的方向。你可以将法向量$(x,y)$看作一个位置向量，然后对其做$M$变换。可以知道，这个点的坐标必定变化。那么其方向向量就会变化，这样法向量也就变化了（除非它是沿着其方向向量移动）。

## 法向量变换矩阵的推导
推导很简单。首先给出空间中齐次坐标的平面方程：

$$
n_xX+n_yY+n_zZ+n_wW = 0
$$
写成矩阵就是：

$$
\begin{bmatrix}
n_x & n_y & n_z & n_w 
\end{bmatrix}
\begin{bmatrix}
X \\
Y \\
Z \\ 
W
\end{bmatrix}
=0
$$

然后我们在中间乘上变换矩阵$M$和其逆$M^{-1}$来方便我们寻找法向量变换方程:

$$
\begin{bmatrix}
n_x & n_y & n_z & n_w 
\end{bmatrix}
M^{-1}
M
\begin{bmatrix}
X \\
Y \\
Z \\ 
W
\end{bmatrix}
=0
$$

这个时候，$M\begin{bmatrix} X \\ Y \\ Z \\ W \end{bmatrix}$就是经过变化之后的顶点了，那么显然$\begin{bmatrix} n_x & n_y & n_z & n_w \end{bmatrix}M^{-1}$就是变换后的法向量了，也就是说存在：

$$
\begin{bmatrix}
n_x & n_y & n_z & n_w 
\end{bmatrix}
M^{-1}
=
\begin{bmatrix}
n_{x_{eye}} \\
n_{y_{eye}} \\
n_{z_{eye}} \\
n_{w_{eye}} 
\end{bmatrix}
$$

那么对左边式子转置一下，得到:

$$
(M^{-1})^T
\begin{bmatrix}
n_x \\
n_y \\
n_z \\
n_w
\end{bmatrix}
=
\begin{bmatrix}
n_{x_{eye}} \\
n_{y_{eye}} \\
n_{z_{eye}} \\
n_{w_{eye}} 
\end{bmatrix}
$$

所以我们就可以知道，通过$(M^{-1})^T$变换之后，可以将原本的法向量变换到观察空间中了。所以**法向量变换矩阵**就是$(M^{-1})^T$其中$M$是将点变换的新空间的矩阵（如果你只将点变换到全局空间中就是`model`，变换到观察空间中就是`model*view`）