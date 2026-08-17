---
title: GinoGJK论文解析
date: 2026-08-17T21:11:40+08:00
tags:
  - 游戏开发
  - 物理引擎
categories:
  - game development
---

本文是《A Fast Robust GJK Implementation for Collision Detection of Convex Object》[^1]论文的解读。

此论文基于GJK原始论文[^2]。阅读本文前也可阅读原始论文，或阅读我[这篇]({{< relref "/posts/GJK原始论文解析.md" >}})的原始论文解析。

由于这篇论文是Gino Van Den Berge写的。我后文中就称其为GinoGJK。

GinoGJK是目前游戏物理引擎中广泛采用的GJK实现。此论文的代码在Github[^3]。几乎是现代GJK的标准实现。十分建议参考。本论文也是偏工程向的，看起来比原始GJK论文舒服很多。

本论文的算法假定在$R^3$下。但可以推广到$R^n$。

Gino Van Den Berge这个人也有著作《Collision Detection in Interactive 3D Environments》[^5]。里面详细描述了此论文的GJK实现（以及后续他发布的带有Margin的GJK和EPA的论文实现）。

<!--more-->

## GinoGJK的目标

在GJK原始论文中[^2]，作者在第6章中也说明了GJK在Johnson距离子算法中会有数值精度问题，其可能导致GJK算法失败。其解决方法是使用兜底程序。但这个兜底程序性能实在太差，一般不会用在游戏物理引擎中。

GinoGJK的目标有：

1. 更快的性能：使用数据缓存和更聪明的Simplex构建方法
2. 更早地退出(Early Exit)：当找到分离轴时直接退出
3. 通过缓存分离轴来利用帧间一致性(frame coherence)
4. 更好的鲁棒性：解决原始GJK中精度带来的问题

这里要简单介绍帧间一致性概念：

指实时模拟中相邻两帧之间物体只移动/旋转了一点点，几何配置变化很小——所以上一帧的结果（分离轴、支撑点、最近特征等）在本帧大概率仍然有效或非常接近，可以作为本帧迭代的热启动起点。

比如下文“支撑点函数”中说到的爬山法，就可以从上一帧找到的支撑点为起点进行爬山搜索。

或者在“分离轴”一节中，利用上一帧的分离轴作为这一帧的支撑点搜索方向。

## 解读

GinoGJK论文基于[^4]论文(称为Extended GJK)。但不太需要真的去阅读。因为GinoGJK论文的第二章有对其方法的回顾。

原始GJK探讨在凸多面体上的GJK，而论文[^4]只是证明了在一般凸体上（包含球，球扫略体等）的GJK适用性。他主要的贡献是，GJK真正依赖的只有两个物体的支撑点查找函数(Support Mapping)，而无需知道凸体本身的形状。

### 回顾Extended GJK

主要是对非标准凸体（含有圆的）的做法回顾：

对于两个凸体$A$,$B$定义
$$
d(A, B) = \min\{||\vec{x} - \vec{y}|| : \vec{x} \in A, \vec{y} \in B \}
$$
为两个物体之间的距离。此距离同时等价于：
$$
\begin{aligned}
d(A, B) = & ||\vec{a} - \vec{b} ||  & 两物体上最近点距离 \\
= & ||v(A - B)|| & Minkowski差中离原点最近的距离
\end{aligned}
$$
用$v(A)$表示$A$物体上离原点最近点。

GJK通过不停构造Simplex来找到Minkowski差中离原点最近的点。

定义$W_k$为Simplex中在第$k$步时的顶点集合($k \ge 1$)。以及$\vec{v}_k = v(\operatorname{co}W_k)$为$W_k$所对应凸包上离原点最近点。

$k = 1$时，$W_k = \emptyset$，$\vec{v}_0 = \vec{x}, \vec{x} \ in \{A - B\}$为Minkowski差中的任意一点。

其后的每一次生成新Simplex的步骤为：$\vec{w}_k = S_{A-B}(-\vec{v}_k)$，其中$S$为查找支撑点的函数(Support Mapping)。$\vec{v}_{k+1} = v(\operatorname{co}(W_k \cup \{\vec{w}_k\}))$，并且$W_{k+1}$为符合$X \subseteq W_k \cup \{\vec{w}_k\}, \vec{v}_{k+1} \in \operatorname{co}X$条件中$X$的最小集合。显然满足此条件的Simplex只有一个。

人话翻译就是$W_k$满足三个条件：

1. 包含新找到的支撑点$\vec{w}_k$
2. 后一个最近点$v_{k+1}$要能在$\operatorname{co}(W_k)$中（但不一定在$W_k$中）
3. $W_k$是满足如上两条的最小集合，并且他是仿射无关的

这意味$W_k$中最多有三个点。当有两个点时$v_{k+1}$在这两个点的连线线段上。当有三个点时在三角平面上。

当$W_k$有四个点时，意味着$v_{k+1}$在这四个点构成的四面体内。此时就达到GJK终止条件了。

对于多面体来说，GJK能够在有限步骤内完成并能精确到达。但对于一般凸体（意指含有圆的）则不一定。这时，我们只能找到一个接近的 $\vec{v}_k$使得
$$
\vec{v}_k\frac{\vec{w}_k}{||\vec{v}_k||}  \le |v(A - B)| \le \vec{v}_k
$$
左侧是支撑平面$H(\vec{w}_k, \vec{v}_k)$到原点的距离，记为$\delta_k$。

下限$\delta_k$不一定是随着$k$单调的。所以我们可以取$\mu_k = \max \{0, \delta_0, ..., \delta_k\}$作为整个GJK算法中的下界。

那么我们希望上下限的差$||\vec{v}_k|| - \mu_k \le \epsilon$小到一定程度$\epsilon$，就认为逼近了$|v(A - B)|$。此$\epsilon$是由用户给的。

这就是处理带有圆的凸体的GJK算法。

### 支撑点函数(Support Mappings)

本节讨论若干几何图形在其仿射变换下的支撑点计算。

注：论文中有`Polytype`和`Polyhedron`。这两者在不同语境下不一样，在此的区别是：

* Polytope：有限点集的凸包
* Polyhedron：有限个半空间交集。本身可以是无限集（比如半空间本身，凸锥等）

根据Minkowski-Weyl定理，有界的Polyhedron就是Polytope。

定义支撑点函数$S_A(\vec{v})$。

显然，可在有限次数里找到polyhedron的支撑点。暴力一点就是遍历所有点。或者利用polyhedron的图存储结构，使用爬山法加速查找。论文中说使用Qhull库进行polyhedron的图结构构建（这个方法了解即可。和本论文的核心算法不太有关系。爬山法可以参考我另一篇文章的[爬山法构造]({{< ref "posts/从0开始制作游戏物理引擎（二）" >}}#爬山法构造)一节）。

接下来介绍可以简化支撑点函数的几何体以及他们的支撑点函数：

#### Box

可以利用其三个互相垂直的轴加速计算。

假设此Box由三个轴上的半长$\eta_x, \eta_y, \eta_z$表示。那么支撑点函数就是：
$$
S_{Box}((x, y, z)) = (sgn(x)\eta_x, sgn(y)\eta_y, sgn(z)\eta_z)
$$

#### Sphere

显然为：
$$
S_{sphere}(\vec{v}) = \begin{cases}
\frac{r}{|\vec{v}|}\vec{v} & \text{if } ||\vec{v}|| \ne 0 \\
0 & \text{otherwise}
\end{cases}
$$

#### Capped Cone

意指有界圆锥，即只有一个顶点和一个底面的圆锥。

假设此圆锥轴心位于$y$轴，朝上（顶点在上底面在下），底面半径为$\rho$，顶点在$y = \eta$处，底面中心在$y = -\eta$处。顶点处的半角为$\alpha$满足$\sin(\alpha) = \frac{\rho}{\sqrt{\rho^2 + (2\eta)^2}}$。

令$\sigma = \sqrt{x^2 + z^2}$为任意点到$y$轴的距离，那么支撑点函数为：
$$
S_{cone}((x, y, z)) = 
\begin{cases}
(0, \eta, 0) & \text{if } y \gt ||(x, y, z)||\sin(\alpha) \\
(\frac{\rho}{\sigma}x, -\eta, \frac{\rho}{\sigma}z) & \text{else } \sigma \gt 0 \\
(0, -\eta, 0) & \text{otherwise}
\end{cases}
$$

#### Capped Cylinder

有界圆柱。轴为$y$轴，中心在原点。半高为$\eta$，半径为$\rho$。

其支撑点函数为：
$$
S_{cylinder}((x, y, z)) = 
\begin{cases}
(\frac{\rho}{\sigma}x, \operatorname{sgn}(y)\eta, \frac{\rho}{\sigma}z) & \text{if } \sigma \gt 0 \\
(0, \operatorname{sgn}(y)\eta, 0) & \text{otherwise}
\end{cases}
$$

#### 仿射变换后的几何体

定义仿射变换为$T(\vec{x}) = B\vec{x} + \vec{c}$。那么对于一个物体$A$经过仿射变换之后的物体$T(A)$，其支撑点函数为：
$$
S_{T(A)}(\vec{v}) = T(S_A(B^T\vec{v}))
$$
很易证。原论文有证明这里不写了。

### 更快速的GJK实现

这一节说了一个性能上更快的Johnson距离子算法的实现，以及展示了如何用GJK举例算法做碰撞检测判断。

#### 子算法实现

其实就是利用GJK原始论文[^2]中的点乘缓存技巧。但原始论文没说工程上的具体实现。这里给补上了。

首先，$W_k \cup {\vec{w}_k}$最多只有4个点，并且丢掉的旧点理论上不会再加回来，所以我们只需要缓存四个点的数据就行。

假设支撑点被存在数组`y`中。定义$W_k \subset \{0, 1, 2, 3\}$为使用`y`中下标表示支撑点的集合，这可以用一个位数组`b`实现（比如`uint8_t`）：$W_k = \{y[i] : b[i]  = 1, i = 0, 1, 2, 3\}$。找到`b`中最小的`i`使得`b[i] = 0`，这个`i`作为新增点$\vec{w}_k$在`y`中的位置。

所有$y[i], y[j] \in W_k \cup \{\vec{w}_k\}$的点乘结果都存在一个4x4的数组`d`里面。我们只需要新算含有$\vec{w}_k$（也就是新点）的点乘即可，其他的在之前的迭代中都算完缓存在`d`里面了。

那么对于$Y = W_k \cup \{\vec{w}_k\}$来说，我们要利用其所有非空子集$X \subseteq Y$中缓存的结果。对任意的子集可以使用位数组表示。比如$X = \{y[0], y[3]\}$，可以用`1001`表示。那么最多可以有`1111 = 15`也就是16个子集（虽然`0000`空集无意义，但为了工程上的便利也算上）。那么可以用一个16x4的数组`D`来记录，其中$D[X, i] = \Delta_i(X)$。那么当增加元素的时候，我们只需要用旧的计算就行。

接下来是定理2：

>  所有第$k$步计算出的最近点$\vec{w}_k$都是下一步$k+1$中Simplex点集中的点：$\vec{w}_k \in W_{k + 1}$。

此定理缩小了每次迭代搜索$\vec{v}_k$的子集范围。回想一下原始GJK论文中，GJK算法的第二步，要在$W_k$中找到新的$\vec{v}_k$。而原始论文的方法是遍历所有非空子集，用$\Delta_i(X) \gt 0$和$\Delta(X) \gt 0$测试。

但定理2告诉我们，在第$k +1$步时，只需要测试所有含有第$k$步的$\vec{w}_k$的$W_{k+1}$子集就行。这样减少了测试范围，从原本的$2^{n+1} - 1$缩减到$2^n$（$n = |W_k|$）。

#### 子算法和大部分GJK解释的出入

大部分GJK教程增加删除点的过程都是：

* 增加新点$\vec{w}_k$
* 删除$\vec{w}_k$对面的点

这是等价的。假设$W_k = \{a, b, c \}$。新加点$d$。而含有$d$的面有三个：$\{d, a, b\},\{d, a, c\}, \{d, b, c\}$。那么显然删除$d$对面的那个不构成面的点是正确的。

而一般的GJK教程中说要判断新Simplex的Voronoi域，和GinoGJK测试所有含有$\vec{w}_k$的子集这两个操作也是等价的。只是GinoGJK在写法上更规整，并且他可以一次性得到最近点（使用$\lambda_i = \frac{\Delta_i(X)}{\Delta(X)}$），而一般方法在判断Voronoi域后要再算一下。但其实性能上没有太多差异。

那为什么还要了解GinoGJK的算法？因为大部分物理引擎（Bullet，Dyn4j，JoltPhysics）都是用GinoGJK的编码方式，不了解看不懂。（PhysX是重心坐标）。

#### 分离轴

如果只是判断两个物体是否相交，那我们不需要算得他们之间的最近距离。我们只需要知道$||v(A- B)||$的下限$\vec{v}_k\frac{\vec{w}_k}{||\vec{v}_k||}$即$\vec{v}_k \cdot \vec{w}_k \gt 0$就可以。

此时，面法向量$\vec{v}_k$就是分离轴。

论文中给出了GJK separating-axis算法流程。这里不再赘述。

但这个流程里面有两个优点：

1. 我们算$\vec{v}_k \cdot \vec{w}_k$的话，可以少算一个$||\vec{v}_k||$。这样避免了昂贵的开方运算
2. $\vec{v}_1$不需要使用$A-B$中的点，而可以是任意非0向量。这有利于帧间一致性。

这种帧间一致性体现在，我可以用上一帧的分离轴方向作为这一帧的支撑点搜索方向。这种算法称为ISA-GJK（Incremental Separating Axis GJK）

### 鲁棒性

主要探讨浮点数精度带来的问题以及解决方案。

### 结束条件（Termination Condition）

终止条件为$||\vec{v}|| - \mu \le \epsilon$。在$\vec{v}$非常大的时候，可能会导致问题。这里可以改用相对容差而非绝对容差：
$$
||\vec{v}|| - \mu \le \epsilon ||\vec{v}||
$$
但这又有一个问题：当$\vec{v}$趋近于0时，右侧也趋近于0，同样可能会导致问题。这里的做法是给一个小$\omega \gt 0$，当$||\vec{v}|| \le \omega$的时候算法返回。

经验上来说，对于polytope，GJK的迭代次数不与$\epsilon$相关。而对于含有二次曲面的物体，可能需要随着$\epsilon$的变化而动态改变。平均来说是$O(-\log(\epsilon))$。

### 兜底程序（Backup Procedure）

GJK主要的数值问题在于计算$\Delta_i(X)$。他每次都要计算$y_i \cdot y_k - y_i \cdot y_j$。当某个$y_k$离$y_j$十分接近时，会导致结果为0，从而导致$X$仿射相关，最后Johnson的距离子程序出错（也就是出现新点在原来Simplex的面上的情况）。或者，正由原始论文所说，$\Delta_i(X)$的符号可能由于精度问题不正确。所以原始GJK论文用了一个很慢的兜底程序。

论文中说，在经验上来看，每次触发兜底程序时，兜底程序算出来的点和上一帧的离原点的最近点$\vec{v}_k$几乎一模一样。所以直接返回$\vec{v}_k$就完事了。

#### 病态边界情况（Ill-conditioned Error Bounds）

有如下情况是病态的，会导致GJK死循环：

* 两个三角形的顶点靠的非常近。这可能会对$\Delta_i(X)$计算中产生一个大相对误差，从而导致最后的$\vec{v}_k$计算偏差。此时，终止条件$||\vec{v}|| - \mu$本来应该停了，但是$v$方向的一点点误差会导致$\mu$的大幅偏移，导致总是不满足终止条件，算法死循环。或者，沿错误$\vec{v}$方向找支撑点，可能导致每次支撑点都算成一个，Simplex不再变化，算法死循环。
* 当$v(A - B)$在一条长条形附近，可能会导致在两个支撑点之间来回切从而导致死循环。

解决方法是：

在每次迭代中，在找到新支撑点$\vec{w}_k$时，看他是否在旧集合内（$\text{if } \vec{w}_k \in W_{k - 1} \cup \{\vec{w}_{k-1}\}$）。如果在就说明我们遇到病态情况了。那直接结束算法并返回上一轮的最近点$\vec{v}_k$。



[^1]:[A Fast Robust GJK Implementation for Collision Detection of Convex Object](https://solid.sourceforge.net/jgt98convex.pdf)
[^2]:[GJK原始论文：A fast procedure for computing the distance between complex objects in three-dimensional space - Robotics and Automation](https://graphics.stanford.edu/courses/cs164-09-spring/Handouts/paper_GJKoriginal.pdf)
[^3]:[Github - Solid3](https://github.com/dtecta/solid3.git)
[^4]:Computing the distance between general convex objects in three-dimensional space
[^5]:[Collision Detection in Interactive 3D Environments](https://book.douban.com/subject/2586364/)