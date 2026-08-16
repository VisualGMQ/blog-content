---
title: "GJK原始论文解析"
date: 2026-08-14T16:57:51+08:00
tags:
  - 游戏开发
  - 物理引擎
categories:
  - game development
---

本文是对GJK原始论文[^1]的解析。着眼于GJK算法本身的正确性证明，以及阐述数值上的缺陷。补充了一些原论文中证明的省略步骤。

建议看过更白话的文章中的GJK，了解GJK整体算法流程之后再看。

<!--more-->

## 文章结构

GJK论文分为8章：

1. 概述
2. 物体表示和距离：说明了物体（和复合物体）之间的距离的数学上的表示，确定使用欧几里得距离作为度量，顺便说明了已知两复合物体的距离时可直接算出复合物体对应球扫略体之间的距离
3. 预备知识：说明了仿射，凸体的定义，定义了最近点，支撑点等核心函数。以及说明了如何将寻找物体之间最短距离的问题转换为求Minkowski差中到原点最近点距离的问题（原论文中几乎没有提到Minkowski差。但他的表示就是Minkowski差）
4. 算法理论：说明了如何解决3中的问题
5. 距离算法的子算法：由Johnson提出的基于Simplex的GJK方法
6. 数值算法：探讨GJK算法中数值问题
7. 性能测试：列出作者用Fortran程序跑的GJK的性能分析
8. GJK用于碰撞检测的例子：举了一些例子，列了一些GJK在实际应用中的性能

本文只说3~6章。这些章节是GJK算法的核心部分。第二章只是做一些先置条件的定义，包括：

* 只研究多面体
* 使用欧几里得距离
* 复合物体的最近距离可以通过求两两单个物体最近距离的最小值得到
* 球扫略体的距离计算（这个严格上来说和本论文核心内容无关）

## 解析

### 预备知识

首先是一些预备知识和符号的定义要明确：

任意多面体使用$K_i$表示。而任意多面体的Minkowski差用$K = \{(x - y) | x \in K_1, y \in K_2 \}$表示。

然后是一些凸优化里面的知识：

* 仿射集(Affine)：

  $\operatorname{aff} X = \{ \sum\lambda_ix_i : x_i \in X, \sum \lambda_i = 1 \}$

* 凸集(Convex)

  $\operatorname{co}X = \{  \sum\lambda_ix_i : x_i \in X, \sum\lambda_i = 1, \lambda_i \ge 0 \}$

简单来说，仿射集和凸集中元素都是$X$中所有点的线性组合，只是加了一些限制条件。

仿射集中，所有$\lambda$的总和要等于1。而凸集更严格，在等于1的基础上还要大于等于0。

其实凸集中关于$\lambda$的条件也可以写成$\lambda_i \in [0, 1], \sum \lambda_i = 1$，这其实就是凸体的定义：任意两个点的连线在多面体内。凸集就是凸多面体中所有点的集合。后面都用凸集表示凸多面体，他们在数学上是等价的。

这个论文中只会用到凸集（毕竟GJK就是在凸多面体上探讨的），后面的集合没说默认就是凸集。

后文中我们说的凸集中的点都是仿射无关的。仿射无关是指，$\{x_2 - x_1, x_3 - x_1, x_4 - x_1, ... , x_n - x_1\}$这个集合内的元素线性无关。

仿射无关的本质是：**没有任何一个点落在其余点张成的"平面"（仿射包）里**，每个点都是一个真正的新"角"。

这里定义仿射无关的本意就是说明凸体是支棱起来的，没有任何多余的点落在面/体上。其实就是将凸体最精简化。



然后是点集$X$中**到原点的最近点**的定义：
$$
v(X) \in X, |v(X)| = \min{\{|x| :x \in X\}}
$$
主要是符号$v(X)$要记一下。

那么凸集$\operatorname{co}X$中到原点最近点$v(\operatorname{co}X)$就可以表示为：
$$
v(\operatorname{co}X) = \sum{\lambda_ix_i}
$$
对于某一组$\lambda_i$成立。



接下来是支撑点的定义。用$h_X(\eta)$表示支撑距离，$s_X(\eta)$表示支撑点：
$$
h_X(\eta) = \max\{x \cdot \eta : x \in X\} = s_X(\eta) \cdot \eta, s_X(\eta) \in X
$$
用$h_X(\eta)$表示。其中$\eta$是一个方向。

接下来定义两个物体$K_i, K_j$的Minkowski差（论文中没明说但其实就是）：
$$
K = \{ x_i - y_j : x_i \in K_i, y_j \in K_j \}
$$
用$K$表示Minkowski差。

那么显然，$v(\operatorname{co}K) = \min\{ |z| : z \in K, z = x_i - y_j, x_i \in K_i, y_j \in K_j \}$。即Minkowski差中到原点的最短距离就是两个物体的最小距离（即$\min\{x_i - y_i\}$）。这就将问题转换为求Minkowski差中离原点最近点的问题。

然后论文说了Minkowski差$K$也是凸体。这里论文没证，我给补上。虽然凸优化理论里面也有证明，但我可以用一个不使用凸优化理论的，纯基于凸体定义的方式证明：
$$
\begin{aligned}
& \forall a_1, a_2 \in Polygon_1, \forall b_1, b_2 \in Polygon_2 \\
& a_1 - b_1 = p_1 \in Polygon_1 \oplus Polygon_2 \\
& a_2 - b_2 = p_2 \in Polygon_1 \oplus Polygon_2 \\
& 且 \\
& \lambda p_1 + (1-\lambda) p_2 = \lambda(a_1 + b_1) + (1 - \lambda)(a_2 + b_2) = [\lambda a_1 + (1-\lambda)a_2] + [\lambda b_1 + (1-\lambda)b_2] = a^* + b^* \in Polygon_1 \oplus Polygon_2
\end{aligned}
$$
这样就证明Minkowski差后的两个物体仍满足“凸体内任意两点的线段仍在凸体中”，那么他就是凸体。



然后可以将求Minkowski差中距离原点最短距离使用支撑点函数的方式来替换。先弄出$K$中的支撑函数：
$$
\begin{aligned}
& h_K(\eta) = h_{K_1}(\eta) + h_{K_2}(-\eta) \\
& s_K(\eta) = s_{K_1}(\eta) - s_{K_2}(-\eta)
\end{aligned}
$$
那么距离原点最近距离显然就是满足某个支撑方向$\eta_i$的点到原点的距离：
$$
d_{ij} = |v(K)| = h_K(\eta_i)
$$
而且我们还知道：
$$
\begin{aligned}
& v(K) = \sum \lambda_i(x_i - y_i) =  v_1(K_1, K_2) - v_2(K_1, K_2) \\
& v_1(K_1, K_2) = \sum\lambda_ix_i \\
& v_2(K_1, K_2) = \sum\lambda_iy_i \\
\end{aligned}
$$
这里$v_1(K_1, K_2)$表示$K_1, K_2$之间最近点对中，在$K_1$上的点。而$v_2(K_1, K_2)$指在$K_2$上的点。

通过这个公式，我们就可以通过$\lambda_i$得到在$K_1, K_2$上的最近点。这样我们能同时得到最短距离和最近点，一举两得。

算法核心还是求最短距离，最近点其实是附属品。

后面所有的算法都基于Minkowski差$K$进行。

### 算法理论

有了上面的预备知识就可以开始讲述GJK算法本身的算法步骤了。

#### 定理1

$K \subset R^m$是紧致的和凸的。我们定义$g_K:R^m \rightarrow R$为：
$$
g_K(x) = |x|^2 + h_K(-x)
$$
而$g_K$有如下性质：

1. 如果$g_K \gt 0$，那么在线段$\operatorname{co} \{x, s_K(-x)\}$上（这里的线段用只含有两个点的凸集表示）一定有一个比$x$离原点更近的点$z$（$|z| < |x|$）

   证明如下：

   首先证$z$的存在性：

   如果$|s_K(-x)| \lt |x|$，那么显然$z = s_K(-x)$

   否则，我们可以表达出$z = \lambda x + (1 - \lambda)(s_K(-x)) = x + \lambda(s_K(-x) - x)$

   并且，将$g_K(x)$用$s_K(x)$表示得到$g_K(x) = |x|^2 + h_K(-x) = |x|^2 +(-x)s_K(-x) = x(x - s_K(-x))$，这样可以解出$\lambda = \frac{g_K(x)}{|x - S_K(-x)|^2}$。

   然后，由于假设$|s_K(-x)| \ge |x|$可以得到：
   $$
   \begin{aligned}
   & 注:以下用s代替s_K(-x) \\
   & |x - s|^2 = |x|^2 + |s|^ 2 -2x\cdot s \\
   & 2g_K(x) = 2(|x|^2 - x\cdot s) = 2|x|^2 - 2x\cdot s \\
   & 上面两式相减有: \\
   & |x - s|^2 - 2g_K(x) = |s|^2 - |x|^2 \ge 0 \\
   & 那么有 \\
   & |x - s|^2 \ge 2g_K(x) \Rightarrow \frac{g_K(x)}{|x - s|^2} \le \frac{1}{2}
   \end{aligned}
   $$
   这就证明了$\lambda \le \frac{1}{2}$。而由于我们的题设$g_K > 0$，所以显然$\lambda \in [0, \frac{1}{2}]$。

   那么就证明出总能找到一个合法的$\lambda$。那么$z$也就存在了。

   然后证$|z| \lt |x|$：
   $$
   \begin{aligned}
   & z = x + \lambda(s - x) \\
   & \Rightarrow \\
   |z|^2 & = (x + \lambda(s-x))^2 \\
   & = |x|^2 +2\lambda x(s-x) + \lambda^2|s -x|^2 \\ 
   & = |x|^2 + 2\lambda(-g_K(x)) + \lambda^2|s - x|^2 \\
   & 而 \lambda = \frac{g_K(x)}{|x - s|^2} \Rightarrow g_K(x) = \lambda |x-s|^2 \\
   & 带入上式最右边得到 \\
   & = |x|^2 -2\lambda g_K(x) + \lambda g_K(x) \\
   & = |x| ^ 2 - \lambda g_K(x) \\
   \end{aligned}
   $$
   由于凸体定义有$\lambda \in [0, 1]$，且由于题设$g_K(x) \gt 0$。那么就有：
   $$
   |z|^2 \lt |x|^2
   $$
   证明完毕。

2. 当且仅当$g_K(x) = 0$时，$x = v(K)$即此时$x$是距离原点最近的点

   我们取凸集$K$上任意一点$z$，有：
   $$
   \begin{aligned}
   & g_K(x) = 0 \Rightarrow |x|^2 + h_K(-x) = 0 \Rightarrow |x|^2 = -h_K(-x) = \min \{z\cdot x : z \in K \} \\
   & 那么显然,因为|x|^2等于z\cdot x的最小值，有: |x|^2 \le z\cdot x \\
   & 而|x|^2 \le |x|^2 + |z - x|^2 = |z|^2 + 2(|x|^2 - z\cdot x) \\
   & 因为2(|x|^2 - z\cdot x) \le 0，所以 \\
   & |x|^2 \le |z|^2
   \end{aligned}
   $$
   即$x$到原点记录比凸集中任意点$z$都小。

3. $|x - v(K)|^2 \le g_K(x)$

   这个将左式展开用$s(K)$替换，再利用1,2证明里面的一些结论就可以得到。不再细说

4. 虽然原论文没说，但我要补充一下，当$x \in \operatorname{co} K$时 $g_K(x) \ge 0$恒成立。因为：

    $$
    h_K(-x) = \max \{z\cdot (-x): z \in K \} \ge x \cdot(-x) = -|x|^2
    $$
	
	绝大多数时候，$g_K(x) \gt 0$ 都是成立的


#### 距离算法

接下来介绍真正计算凸体到原点最短距离的算法。

假设对$m$维凸体$K$($K \in R^m$)计算：

在$K$里面选取一系列的起始点$y_1, y_2, ..., y_v$，注意$v \in [1, m+1]$（这一步说明操作可以在单形及以下开始）。

1. 设$V_0 = \{y_1, ..., y_v\}$且$k = 0$。我下面就叫$V_0$为Simplex（即使点数可能达不到Simplex要求）
2. 找到Simplex中离原点最近的点$v_k = v(\operatorname{co}V_k)$
3. 如果$g_K(v_k) = 0$，那么根据定理1我们知道已经找到最近点$v_k$。算法停止
4. 令$V_{k+1} = \hat{V_k} \bigcup \{s_K(-v_k)\}$。这里$\hat{V_k} \subset V_k$，并且$\hat{V_k}$中**最多**有$m$个点并且$v_k \in \operatorname{co}\hat{V_k}$。然后$k += 1$，回到第二步。

**注意：我给的文档里面，第四步的印刷有问题，他把$V_{k+1} =$写成$V_{k+1} +$了**。但我目前没找到过没有印刷错误的原论文。倒是在很多物理库源码或者书籍里面看到了正确印刷。

这里第四步可能有点难理解。简单翻译一下就是$\hat{V_k}$所在凸体中必须有上一步找到的离原点的最近点$v_k$，然后往$-v_k$的方向找到支撑点，将支撑点塞到$\hat{V_k}$中。但还要确保$\hat{V_k}$中点数目$\le m$，所以还得踢掉多出来的点。

或者按照GJK算法的大众理解，这一步就是找到支撑点构建新的Simplex。注意这里找支撑点的方向也和一般文章中说的一致：注意他说的是$v_k \in \operatorname{co} \hat{V_k}$没说$v_k \in \hat{V_k}$。那么如果刚好$v_k \in \hat{V_k}$是Simplex的顶点，那么直接用顶点反方向找支撑点。但这个时候，和此顶点相连的某条边（我们假设取离原点更近的那一条）一定和$v_k$垂直（也就是说$v_k$是此边的法线），不然这个边上肯定有更近的点。

否则，$v_k$得是边上的点。这时$-v_k$就是边到原点法线的反方向了。

所以无论怎么说。只需要找到离原点最近的边的法线反方向作为支撑点搜索方向即可。实际操作中根本不需要求出$v_k$。这一点和一般的GJK算法介绍一致。



接下来证明此算法是能够在有限步骤内找到结果的：

这要分两步：证明能找到结果，已经步骤有限。这里先证明能找到结果。有限步骤在下一章的定理2中证明。

首先证明算法的每一步都是可达的。显然只有第4步可能卡住。而第4步的新$V_{k+1}$总是可构造的。因为只有一种情况无法构造就是$|v_k| = 0$此时没有找支撑点的方向了。但这在第3步中已经否决了。

然后证明算法每次迭代后都是“下降”的（缩小了解空间）。由于算法没有终止时$g_K(x) \ne 0$，而由定理1的性质4可知此时$g_K(x) \gt 0$。然后由性质1可知，在$\operatorname{co} \{ v_k, s_K(-v_k) \}$上，总有一个离原点更近的点$z$。
$$
\begin{aligned}
|v_{k+1}| = & \\
& |v(\operatorname{co}V_{k+1})| & (由算法步骤4得到) \\
\le & |v(\operatorname{co}\{v_k, s_K(-v_k\})| & (1) \\
\lt & |v_k| & (2)
\end{aligned}
$$
这里$(1)$的不等式，是因为$\operatorname{co}\{v_k, s_K(-v_k\} \subset \operatorname{co} V_{k+1}$（由步骤4），也就是说你在子集里面找距离原点最近的点，那这个点肯定比在全集里面找的距离不会更小只会更大。

而$(2)$不等式是显然的，因为定理1的性质1可知在$\operatorname{co}(x, S_K(-x))$上总能找到一个比$x$更接近原点的。

这样我们就证明了，新找的离原点的最近点一定比旧的更近。这样算法是可收敛的（同时也说明了新$v_k$一定不会和旧的重复）。

这样此算法的正确性就证明完毕。



然后可以证明解空间是有限的。由步骤4可知，算法总是在$K$的子集中寻找。而$K$的子集个数是有限的，所以解空间是有限的。

又因为我们每一步找到的最近点$v_k$都不一样，这说明任意两步的$V_i, V_j$不一样。那这样总是能遍历完毕整个解空间。所以算法总能在有限步骤内完成。

注：有限步骤内完成的证明原论文在定理2中用更数学的方法证了。我这里是将内容挪到一起并做简化了。

### 距离算法的子算法

第四章的内容介绍了距离算法，以及如何找到支撑点以扩充Simplex。但还有几个问题：

1. 第2步：找到$\operatorname{co}V_k$中距离原点最近的点。这一步并没有明说要怎么做
2. 第4步：将旧点删除。那我怎么知道要删哪个点

这一章就是来解决这些问题的。

**本章算法英文为Distance Subalgorithm，直译是距离子算法，很多教程中都是这样称呼的。**

这一章的算法由GJK中J作者Johnson发明，所以也叫做Johnson算法。

首先对当前$V_k$，得到其一个子集$Y_s$。$s$表示其子集里面的元素。

比如$s = \{ 1, 2, 3 \}$就是指$Y_s$里面包含$V_k$里面的前三个元素。

原论文中用更数学的方式进行了表述：
$$
\begin{aligned}
& V_k = \{y1, ... y_v \} \\
& v(\operatorname{co} Y) = \sum_{i \in I_s} \lambda_i y_i \\
& i \in I_s \subset \{1, 2, ..., v\} \\
& Y_s = \{ y_i : i \in I_s \}
\end{aligned}
$$
$V_k$中一共有$v$个元素。

首先定义$I_s \subset \{1, ..., v \}$，也就是说$I_s$是$V_k$中元素对应序号的子集。也就是从$V_k$中挑选任意个元素，将他们的序号记录下来。然后$(1)$式中利用这些序号$i$想元素$y_i$从$V_k$中取出放进$Y_s$中。

所以$Y_s$简单来说就是$V_k$的子集。原论文中提到$Y_s \ne \emptyset$。

论文中还提到，$Y_s$是仿射无关的。也就是最“精简”的$V_k$的子集。

那么这个时候其实可以用$Y_s$去表示距离算法第四步的$\hat{V_k}$：他们同为$V_k$的子集，并且$Y_s$还更严格（仿射无关）。

其实这里隐含了条件：$Y_s$需要有上一步的距离原点的最近点。

这一步其实是构造了一个最小的$\hat{V_k}$，用于剥去算法中可能的冗余操作。



由于距离算法的要求，$V_k$中元素个数$v$肯定是很小的。由子集个数公式：
$$
|Y_s| = \sigma = \sum_{k = 1}^v \frac{v!}{k!(v-k)!}
$$
可知，最多最多就检查这么多个子集。

论文给出了数据：$v=4$时$\sigma = 15$，也就是说3D情况下最多检查15个子集。

那么具体要怎么做呢？答案是利用重心坐标公式。但论文没有明确说明要用到重心坐标。所以我接下来进行拆解。

论文的原本意思是：

定义$I = \{1, 2, ..., v\}$，而根据前面的定义知道$I_s \subset I$。定义$I_s$的补集$I_s^{'}$。然后定义实数$\Delta_i(Y_s), i \in I_s$：
$$
\begin{aligned}
& \Delta_i(\{y_i\}) = 1, & i \in I \\
& \Delta_j(Y_s \cup \{y_j\}) = \sum_{i \in I_s}\Delta_i(Y_s)(y_i \cdot y_k - y_i \cdot y_j), & k \in I_s, j \in I_s^{'} \\
& \Delta(Y_s) = \sum_{i \in I}\Delta_i(Y_s)
\end{aligned}
$$
这里的$\Delta(Y_s)$其实是行列式的值，而$\Delta_j(Y_s \cup \{y_j\})$则是行列式的Laplace展开（后文有分析）。注意这里只说了$k \in I_s$，但是求和符号内并没有对$k$的循环。所以实际上$k$是在$I_s$中任取的。$j$也是同理（不过一般$I_s^{'}$里面只有一个值）。

**注意：$\Delta(Y_s) \sum_{i \in I}\Delta_i(Y_s)$中，原文写的是$i \in I_s$应该也是印刷错误！**

注意这三个式子在实际操作中是有先后顺序的（后文会看到），必须按照原文写的顺序执行。

然后引出定理3

#### 定理3

$Y_s$成立的条件是，当且仅当：

1. $\Delta(Y_s) \gt 0$
2. $\forall i \in I_s, \Delta_i(Y_s) \gt 0$
3. $\forall j \in I_s^{'}, \Delta_j(Y_s \cup \{y_j\}) \le 0$

而且，如果将$Y_s$中的点以凸集形式写出$v(\operatorname{co}Y) = \sum_{i \in I_s} \lambda_i y_i$，那么可以计算出$\lambda_i$：
$$
\lambda_i = \frac{\Delta_i(Y_s)}{\Delta(Y_s)}
$$
看到最后$\lambda_i$的计算是不是很眼熟？没错这就是重心坐标公式。

但这是怎么来的呢？在原论文的附录2中有对这个东西的证明：

我们要算$Y_s = \{x_1, x_2, \cdots, x_r\}$中最近点$v(Y_s)$，先用仿射变换的形式写出来：
$$
v(\operatorname{aff}Y_s) = \sum_i^r \lambda_ix_i
$$
我们知道（可类比重心坐标）：
$$
\lambda_1 = 1 - \sum_{i = 2}^r \lambda_i
$$
那么$v(\operatorname{aff}Y_s)$到原点的距离的平方就是：
$$
f(\lambda_2, \cdots, \lambda_r) = |x_1 + \sum_{i = 2}^r \lambda_i(x_i - x_1)|^2
$$
那我要找函数$f$的最小值满足的$\lambda_i$就是我要找的最近点。那么利用分析学中的理论：

* 函数梯度为0的点为临界点。此时函数在此处可能取极值或不能取。

但由于$f$是凸函数（因为他是仿射函数的范数的平方），所以梯度为0的点一定是$f$的**最小值**点。所以这个问题转换为求$f$梯度为0的点，即$\frac{\partial{f(\lambda_2, \cdots, \lambda_r)}}{\partial \lambda_i} = 0$。而这个函数可以写作：
$$
A_s\lambda = b \\
A_s = 
\begin{bmatrix}
1 & \cdots & 1 \\
(x_2 - x_1)\cdot x_1 & \cdots & (x_2 - x_1) \cdot x_r \\
\vdots & & \vdots \\
(x_r - x_1)\cdot x_1 & \cdots & (x_r - x_1) \cdot x_r \\
\end{bmatrix} \\
b = \begin{bmatrix}
1 \\
0 \\
\vdots \\
0
\end{bmatrix}
$$
那么此方程有解的条件显然是$|A_s| \ne 0$。那么使用Cramer[^5]法则$\lambda_i = \frac{|A_i|}{|A_s|}$，先定义$\Delta(Y_s) = |A_s|$，然后定义$\Delta_i(Y_s) = |A_i|$，其中$A_i$是$A_s$的第$i$列替换成$b$之后的矩阵。

然后可以回过头看前面$\Delta_j(Y_s \cup \{y_j\}) = \sum_{i \in I_s}\Delta_i(Y_s)(y_i \cdot y_k - y_i \cdot y_j)$这个式子是啥意思了。这个是使用旧的$\Delta_i(Y_s)$去增量计算新$\Delta_i(Y_s)$的递推公式。

我们看一个实际的例子。假设我们在$R^3$下运行此算法。并且此时$Y$里面没有点。所以我们先往里面填充点：

第一步：

加入$y_1$。此时$Y = Y_s = \{y_1\}$，由定义$\Delta_1(Y_s) = \Delta_i(\{y_1\}) = 1$，$\Delta(Y_s) = 1$。

第二步：

加入$y_2$，此时$Y = \{y_1, y_2\}$。注意$Y_s \subset Y$按照$I_s$中的下标选取元素。所以这里有三种$Y_s$：
$$
\begin{aligned}
& Y_1 = \{y_1\}, & I_1 = \{1\} \\
& Y_2 = \{y_2\}, & I_2 = \{2\} \\
& Y_3 = \{y_1, y_2\}, & I_3 = \{1, 2\} \\
\end{aligned}
$$
这里，由于$y_2$是新增点，所以$I_s^{'} = \{2\}$。那么就是：
$$
\begin{aligned}
& \Delta_j(Y_1 \cup \{y_2\}) = \sum_{i \in I_1}\Delta_i(Y_1)(y_k - y_j) \cdot y_i \\
& I = \{1, 2\} \\
& I_s = I_1 \\
& i = k \in I_1 \\
& j \in I_2^{'}
\end{aligned}
$$
那么有
$$
\Delta_2(Y_3) = \Delta_2(Y_1 \cup \{y_2\}) = \Delta_1(Y_1)(y_1 - y_2) \cdot y_1
$$
可这为何能成立？因为这就是$|A_i|$的Laplace展开。当有两个点时：
$$
\begin{aligned}
& |A_s| =
\begin{vmatrix}
1 & 1 \\
(y_2 - y_1) \cdot y_1 & (y_2 - y_1) \cdot y_2
\end{vmatrix}
\\
&|A_2| = 
\begin{vmatrix}
1 & 1 \\
(y_2 - y_1) \cdot y_1 & 0
\end{vmatrix}
\end{aligned}
$$
将$|A_2|$按第二列展开就得到了。

那么新问题来了。公式里有$\Delta(Y_s) = \sum_{i \in I} \Delta_i(Y_s)$。我们这里是$\Delta(Y_3) = \Delta_1(Y_3) + \Delta_2(Y_3)$。我们有$\Delta_2(Y_3)$，但是$\Delta_1(Y_3)$从何而来？其实一样的，只是组成的集合不一样。

对于$\Delta_1(Y_3)$，$j = 1$，也就是说此时$I_s^{'} = \{1\}$。那么为了凑齐$I = \{1, 2\}$显然$I_s = \{2\}$。

也就是说，$\Delta_1(Y_3)$是视为从$\{y_2\}$中增加$\{y_1\}$点得到的结果。那么也是一样计算，会得到：
$$
\Delta_1(Y_3) = |A_1| = (y_2 - y_1) \cdot y_2
$$
那么为什么$\Delta(Y_s) = |A_s| = \sum_{i \in I} \Delta_i(Y_s)$成立呢？这其实是$|A_s|$按第一行展开的结果。

所以这里你就可以看到，使用旧的$\Delta_i(Y_s)$去加速计算新$\Delta_j(Y_s)$的过程了。

第三步：

为了更好地看到这种加速，我们再加一个点。将$y_3$加入$Y$中得$Y = \{y_1, y_2, y_3\}$。那么此时有6个$Y_s$：
$$
\begin{aligned}
& 之前保留的Y_1 \sim Y_3: \\
& Y_1 = \{y_1\}, & I_1 = \{1\} \\
& Y_2 = \{y_2\}, & I_2 = \{2\} \\
& Y_3 = \{y_1, y_2\}, & I_3 = \{1, 2\} \\
& 新增的: \\
& Y_4 = {y_3}, & I_4 = \{3\} \\
& Y_5 = {y_2, y_3}, & I_5 = \{2, 3\} \\
& Y_6 = {y_1, y_2, y_3}, & I_6 = \{1, 2, 3\} \\
\end{aligned}
$$
那么新增的$Y_4 \sim Y_6$是否能用$Y_1 \sim Y_3$加速计算呢？显然是可以的。首先根据定义$\Delta(Y_4) = 1$。然后
$$
\begin{aligned}
& |A_5| = \begin{vmatrix}
1 & 1 \\
(y_3 - y_2) \cdot y_2 & (y_3 - y_2) \cdot y_3
\end{vmatrix} \\
& I = \{2, 3\} \\
& I_s = \{2\}, I_s^{'} = \{3\} 时 \\
& \Delta_3(Y_5) = \Delta_3(Y_2 \cup \{y_3\}) = \Delta_2(Y_2)(y_2 - y_3) \cdot y_2 = (y_2 - y_3) \cdot y_2 \\
& I_s = \{3\}, I_s^{'} = \{2\} 时 \\
& \Delta_2(Y_5) = \Delta_2(Y_4 \cup \{y_2\}) = \Delta_2(Y_4)(y_3 - y_2) \cdot y_3 = (y_3 - y_2) \cdot y_3 \\
& \Delta(Y_5) = \Delta_2(Y_5) + \Delta_3(Y_5)
\end{aligned}
$$
而$Y_6$则是：
$$
\begin{aligned}
& |A_6| = \begin{vmatrix}
1 & 1 & 1 \\
(y_2 - y_1) \cdot y_1 & (y_2 - y_1) \cdot y_2 & (y_2 - y_1) \cdot y_3 \\
(y_3 - y_1) \cdot y_1 & (y_3 - y_1) \cdot y_2 & (y_3 - y_1) \cdot y_3 \\
\end{vmatrix} \\
& I = \{1, 2, 3\} \\ \\
& I_s = \{1, 2\}, I_s^{'} = \{3\} 时 \\
& \Delta_3(Y_6) = \Delta_3(Y_3 \cup \{y_3\}) = \Delta_1(Y_3)(y_1 - y_3) \cdot y_1 + \Delta_2(Y_3)(y_1 - y_3) \cdot y_2 \\ \\
& I_s = \{2, 3\}, I_s^{'} = \{1\} 时 \\
& \Delta_1(Y_6) = \Delta_1(Y_5 \cup \{y_1\}) = \Delta_2(Y_5)(y_2 - y_1) \cdot y_2 + \Delta_3(Y_5)(y_2 - y_1) \cdot y_3 \\ \\
& I_s = \{1, 3\}, I_s^{'} = \{2\} 时 \\
& \Delta_2(Y_6) = \Delta_2(\{y_1, y_3\} \cup \{y_2\}) = \Delta_1(\{y_1, y_3\})(y_1 - y_2) \cdot y_1 + \Delta_3(\{y_1, y_3\})(y_1 - y_2) \cdot y_3
\end{aligned}
$$
可以看到确实可以通过旧值加速计算新值。这里只有$\Delta_2(Y_6)$中的$\Delta_i(\{y_1, y_3\})$没有旧值，但仍旧可以使用递推公式算得旧值。

当$Y$内点到达上限$m$时，此时新增点前需要删除点。新增的点仍旧可以用旧值加速计算（不再举例赘述）。

这个递推公式的好处就是可以快速计算$\lambda$，只需要使用旧值计算$\Delta_i(Y_s)$，然后将各个$\Delta_i(Y_s)$相加即可得到$\Delta(Y_s)$，然后就可以用Cramer法则得到最后的$\lambda$。免去了每次都要从头展开行列式带来的性能问题。



然后再回头看$\lambda_i$。其实他就是在Simplex中某个点的重心坐标。（因为重心坐标的定义就是凸集中$\lambda$的定义）。所以在实践中算法就变成求重心坐标而不是解这个行列式了。但我说这个行列式带来的性能优化方法是值得学习的。



最后，可以真正定义距离子算法的步骤：

给出$Y = \{y_1, \cdots, y_v \} \in R^m$的有限集，并且按顺序取其中的子集$Y_s, s = 1, \cdots , \sigma$。对所有的$Y_s \subset Y$执行如下步骤：

1. 初始化：令$s = 1$从第一个子集开始
2. 如果$\Delta(Y_s) \gt 0$ 并且$\Delta_j(Y_s) \gt 0, j \in I_s$,并且$\Delta_j(Y_s \cup \{y_j\}) \le 0$，那么此时我们就找到最近点了。通过解出$\lambda_i$来停止算法
3. 如果$s \lt \sigma$，$s = s+1$然后回到步骤2（即检查下一个子集）
4. 如果上面都失败了，那算法失败返回`false`

这里其实就是在检查原点是否在对应的Voronoi域内。其实和重心坐标的方法是一样的。

### 数值算法

在实际编码时，由于计算机的浮点数存储，会带来一些精度问题导致算法失效（经过我的实践，这种失效很常见，尤其在对两个一模一样的凸体，他们之间只有相对平移没有相对旋转的时候最明显，因为这个时候很容易出现新增点几乎在旧点构成的平面内，导致导致$|A_s| = 0$）。

论文中提到，距离算法和距离子算法本身是不会有误差累计的。误差的来源有如下几个：

* 点乘的时候带来的。一个方法是将两个凸体平移到离原点近的地方再做算法。做法是将两个凸体的质心的连线中点平移到原点：
  $$
  \begin{aligned}
  & K = \operatorname{co}Z_1 - \operatorname{co}Z_2 \\
  & \bar{z_i} = \frac{\sum{z_{ij}}}{|Z_i|} \\
  & \rho_c = \frac{1}{2}(\bar{z_1} + \bar{z_2})
  \end{aligned}
  $$
  这里$\rho_c$就是平移向量。

* $g_K(v_k)$的计算。本来第三步是看$g_K(v_k) = 0$。这里需要使用浮点数容差判断：
  $$
  \begin{aligned}
  & \epsilon \gt 0 \\
  & D(K) = \max \{|z| : z \in K\} \\
  & g_K(v_k) \le \epsilon(D(K))^2
  \end{aligned}
  $$
  论文中说$\epsilon$取机器精度的100倍左右即可。
  
  这里的容差公式为什么是$\epsilon(D(K))^2$论文没有证明，他说的是“一种合理的容差”。但我们可以看出来这个容差是随着凸体大小而改变的相对容差，看上去是合理的。

某些时候，数值精度问题会导致距离子算法失败。比如新增的点距离原有点构成的平面非常近。这可能导致第2步判断错误。这个时候可能需要一个兜底的子程序(Backup Procedure)。

这个程序很简单也很暴力：遍历$Y$的所有子集$Y_s$，找到仿射包上距离原点最近的点$v(\operatorname{co}Y)$作为新增点返回。最近点仍旧用Cramer法则那一套找。

然后论文中将此兜底程序融入原本的距离算法，构成数值算法(Numerical Algorithm)。这里就不再赘述了。






[^1]:[GJK原始论文：A fast procedure for computing the distance between complex objects in three-dimensional space - Robotics and Automation](https://graphics.stanford.edu/courses/cs164-09-spring/Handouts/paper_GJKoriginal.pdf)

[^4]:[实时碰撞检测算法技术 (豆瓣)](https://book.douban.com/subject/4861957/)
[^5]:[Cramer's rule - Wikipedia](https://en.wikipedia.org/wiki/Cramer's_rule)
