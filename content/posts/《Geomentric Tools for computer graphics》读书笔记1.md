---
title: 《Geometric Tools For Computer Graphics》读书笔记1
category:
- 图形学和计算几何
tags:
- 图形学
---

这里是本书第一章的笔记，第一章主要强调了一些数值计算方面的问题。

<!--more-->

# 数值计算问题

## 底层问题

因为计算机存储浮点数的原因，导致存储的数字和实际数字之间可能存在偏差，将 $r$ 记作纯数学意义上的数字， $f(r)$ 记为r在计算机中存储的实际数字。



### 误差

绝对误差(absolute error)记作：
$$
\abs{f(r) - r}
$$
相对误差(relative error)记作：
$$
\frac{\abs{f(r) - r}}{\abs{r}}
$$

### 不精准的浮点数带来的精度问题

在数学上，$s + r \ne r(s \ne 0)$，但在计算机中可能存在$f(s)+f(r) = f(r)(f(s) \ne 0)$，这往往是因为$f(r) $要远大于$f(s)$。

计算顺序的不一致也会导致结果不一样，也就是说存在
$$
(f(r)+f(s))+ f(t) \ne f(r)+(f(s)+f(t))
$$
比如说，$f(r)$远大于$f(s)$和$f(t)$时，会导致
$$
f(r)+f(t) = f(r) \\
f(r) + f(s) = f(r)
$$
这样，$(f(r) + f(t))+f(s) = f(r)$。

但是，如果先求$f(s)+f(t)$，则可能导致其结果足够大，以至于$f(r)+(f(s)+f(t)) \ne f(r)$。

所以，求和的一般顺序是**按照数字从小到大依次求和**。

## 更高层次的问题

浮点数所带来的的误差会直接影响到算法。比如判断某个点$p$是否在四边形$<V1,V2,V3,V4>$中，满足如下任意条件即为在四边形中：

* $p$在三角形$<V1,V2,V4>$中
* $p$在三角形$<V2,V3,V4>$中
* $p$在线段$<V1, V3>$上

但是由于误差，可能存在$p$点离四边形某条边特别近，以至于算法误判$p$位于边上，从而导致结果为`false`。这在[德劳内三角化算法](https://zhuanlan.zhihu.com/p/83817061)有体现。



因为这些误差的存在，导致我们在写算法时**不能完全相信数学推导的结果，而要考虑误差所带来的影响。**