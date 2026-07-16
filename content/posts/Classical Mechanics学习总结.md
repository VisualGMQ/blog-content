---
title: Classical Mechanics学习总结
date: 2026-07-16 18:44:56
tags:
- 游戏开发
- 物理引擎
categories:
- game development
draft: true
---

学习Classical Mechanics的总结笔记。

<!--more-->

经典力学（Classical Mechanics）中一般包含两部分：

* 牛顿力学：在牛顿时代，使用矢量法的力学，又叫矢量力学（基本就是高中力学）
* 分析力学：由拉格朗日和哈密顿开创的，使用数学分析方法重构的力学框架

## 牛顿力学

### 时空观和参考系

牛顿的时空观是：

> 时间和空间是均匀，各向同性的。时空就像一个静止的容器，里面装着不同的物质。时空独立于物质之外

但现代力学（或相对论力学）的观念是：

> 时空是非均匀，稠密，且各向异性的。时空像一锅粥，是由物质组成的

各项同性的意思是说，无论在哪个方向上，物理定律都一样。

### 参考系和坐标系

研究物理对象时必须定下参考系。从概念上分为两种：

1. 惯性系：牛顿第一定律（由此可以推导出也适用于其他两定律）成立的参考系，即物体在不受力的情况下拥有常量速度C（注：C可以为0）

   惯性系只能静止或者做匀速运动，本身不能旋转。

2. 非惯性系：除了惯性系以外的参考系。比如加速行驶的火车。由于物体在非惯性系中不受力也会移动，为了能够使用牛顿定律，将参考系本身的加速度对物体带来的移动效应视为一个虚构的惯性力。

经典力学的绝大部分研究都在惯性系下。



为了便于数学计算，必须建立坐标系。有三种：

1. 自然坐标系：沿着物体运动方向建立的坐标系（其实就是物体的局部坐标系）。原点和坐标轴随着物体变化
2. 笛卡尔坐标系
3. 极坐标系（三维中对应柱坐标系/球坐标系）

### 牛顿定律

牛顿定律只在惯性系中成立。

#### 惯性和质量

首先要定义质量：

> 物体惯性的度量

然后定义惯性：

> 维持物体现有运动状态的性质

注意：惯性是“性质”，要度量他得用质量。

#### 牛顿定律

牛顿第一定律（惯性定律）：

> 不受力的物体拥有常量速度

牛顿第二定律：

> F = ma

或者用等价的动量表示：

> p = $\int F dt$ = mv

牛顿第三定律：

> 所有的力都有反作用力，方向和力相反，大小相等

#### 牛顿定律局限性

三个定律的局限性越来越多：

* 所有定律只能在惯性系下成立
* 牛顿第一定律和第二定律在量子力学和相对论里面不成立
* 牛顿第三定律即使在宏观下也可能不成立。在书中提出了一个电场例子（Taylor Section1.5），其中由电荷产生的场作用力根本不是方向相反的

#### 不同坐标系下的牛顿定律表述

##### 笛卡尔直角坐标系

$$
\begin{cases}
F_x = m\ddot{x} \\
F_y = m\ddot{y} \\
F_z = m\ddot{z}
\end{cases}
$$

##### 极坐标系$(r, \theta)$

将力分解为沿着质点矢径的$F_r$和垂直于$F_r$的$F_\theta$。这样合力为：
$$
F = F_r \hat{r} + F_\theta \hat{\theta}
$$
而加速度是位置的二阶导数，就有：
$$
\begin{gathered}
\mathbf{r} = r\hat{r} \\
d\mathbf{r} = dr \hat{r} + rd\hat{r}
\end{gathered}
$$
而$d\hat{r} = \Delta{\hat{r}} = \mathbf{\hat{r_2}} - \mathbf{\hat{r_1}}$，由变化前后的位置之差，在极小情况下，可以视为方向为$\hat{\theta}$，大小使用弧长运算：
$$
|{d\hat{r}}| = rd\theta
$$
得到的微分：
$$
\Delta{\hat{r}} = \Delta \theta \hat{\theta}
$$
那么：
$$
\frac{d\hat{r}}{dt} = \frac{d\theta}{dt}\hat{\theta} = \dot{\theta}\hat{\theta}
$$
带入$dr$的表达式就能得到沿着矢径位置的一阶微分（即速度）：
$$
\frac{d\mathbf{r}}{dt} = \dot{r}\hat{r} + r\dot{\theta}\hat{\theta}
$$
那么沿着$\hat{\theta}$方向的速度就是：
$$
v_\theta = r\dot{\theta} = r \omega
$$
那么二阶导数就是在一阶导上再求导：
$$
\begin{cases}
a_r = \ddot{r} - r\dot{\theta^2} \\
a_\theta = r\ddot{\theta} + 2\dot{r}\dot{\theta}
\end{cases}
$$

### 动量守恒定量

可直接由牛顿第三定律得出：

> 当系统不受力的时候，所有内力相互抵消，系统的总动量为常数

动量守恒比第三定律更本质。在电场例子中，整个场和电荷是动量守恒的。

### 质心公式

$$
\begin{cases}
M = \sum{m_i} \\
\mathbf{R} = \frac{\sum{m_i \mathbf{r_i}}}{M}
\end{cases}
$$

R就是最后的质心（Center of Mass，CM）

### 刚体动力学



### 能量

能量有多种形式（动能，势能，热能等）。

#### 做功

功的定义是力沿着路径的第二类曲线积分：
$$
W = \int \mathbf{F} d\mathbf{r}
$$
功是能量的搬运工。功可以将一种能量变换为另一种能量。功是导致能量改变的原因。

能量就是由功来定义的。

#### 动能(Kinematic Energy)

缩写为`KE`，用`T`表示。为：
$$
T = \frac{1}{2}mv^2
$$
可由牛顿第二定律推导得到：
$$
\begin{gathered}
\mathbf{F} = m\ddot{\mathbf{r}} \\
\mathbf{F}d\mathbf{r} = m\ddot{\mathbf{r}}d\mathbf{r} \\
W = \int \mathbf{F} d\mathbf{r} = \int m\ddot{\mathbf{r}}d\mathbf{r} = m\dot{\mathbf{r}} = m\mathbf{v} = \dot{(\frac{1}{2}mv^2)} = \dot{T}
\end{gathered}
$$
这个式子同时也彰显了**动能定理**：力做的功($\int \mathbf{F}d\mathbf{r}$)是动能的改变量($(\frac{1}{2}mv^2)^{'}$)。

#### 势能(Potential Energy)

能量只和力做的功有关。所以需要先定义势能对应的特殊力，即保守力：

##### 保守力(Conservation Force)

满足如果任一性质的力为保守力：

* **最经典定义**:力只和位置有关，和其他任何物理量无关（即力只是位置的函数$F(\mathbf{r})$）
* 沿闭合曲线做功为0的力为保守力：$\oint \mathbf{F} d\mathbf{r} = 0$
* 做功与路径无关，只和起始点和终止点的位置有关（功是路径无关第二类曲线积分）
* 可以表示为某个势能函数的梯度：$\mathbf{F} = -\nabla{U}$

其中第二，三条在数学上可直接由第一条推得（详见微积分中第二类曲线积分部分）

在数学上，力$F$的旋度$\nabla \times F$为0时其也满足路径无关第二类曲线积分。但是在保守力这里是充分不必要条件（见下“随时间变化的势能”）

##### 势能

和动能类似，保守力做功是势能的改变量：

> 势能是保守力从当前位置运动到势能零点所做的功

即：
$$
\int \mathbf{F_cons} d\mathbf{r} = 0 - U = -U
$$
注意**保守力做正功会导致势能减少而不是增大。**

保守力是势能函数的梯度，这个事情可以从势能的定义得到：
$$
\begin{gathered}
W = \int \mathbf{F_cons} d\mathbf{r} = -\dot{U} \\
而F是值和\mathbf{r}有关的函数，即F(\mathbf{r})，那么有：\\
F(\mathbf{r})d\mathbf{r} = F_x dx + F_y dy + F_z dz \\
\dot{U} = \lim_{\Delta\mathbf{r}\rightarrow 0} \Delta U(\mathbf{r} \rightarrow \mathbf{r} + \Delta \mathbf{r}) = \lim_{\Delta\mathbf{r}\rightarrow 0} (U(\mathbf{r} + \Delta \mathbf{r}) - U(\mathbf{r})) = \lim_{\Delta\mathbf{r}\rightarrow 0}(- (F(\mathbf{r} + \Delta \mathbf{r}) - F(\mathbf{r}))) = - (\Delta F_x dx + \Delta F_y dy + \Delta F_z dz) \\
(\Delta F_x dx + \Delta F_y dy + \Delta F_z dz) = -\dot{U} = - \nabla U
\end{gathered}
$$
右式就是$-\nabla U$。

##### 随时间变化的势能

某些时候势能不是一直不变的。比如一个带电小球对距离其$r$的电荷的电势能。如果此小球的电荷随着时间推移而减少，那么电势能也会一直减少。

这个时候，电磁力$\mathbf{F} = k\frac{qQ(t)}{r^2}\hat{r}$不是保守力。虽然其$\nabla \times \mathbf{F} = 0$。但是不满足$\oint\mathbf{F}d\mathbf{r} = 0$（因为走一圈回来，时间上有差异，导致做功不为0）。

那显然，此时机械能也不再守恒。

##### 几种经典势能

注意：因为势能定义的原因，在定义势能前，必须先定义势能零点（势能为0的位置），势能零点可以**随意**选定，下表中只是提供了一些常见选择。

| 势能名称     | 公式                                       | 势能零点                          | 对应保守力                                                   |
| ------------ | ------------------------------------------ | --------------------------------- | ------------------------------------------------------------ |
| 重力势能     | $mgh$：只和物体高度有关                    | 星球的地表（$h=0$处）             | $F = -\nabla mgh = -mg\hat{j}$，即重力的相反数               |
| 弹性势能     | $\frac{1}{2}kx^2$：只和弹簧拉伸长度有关    | 弹簧自然状态下的长度（$x = 0$处） | $F = -\nabla \frac{1}{2}kx^2 = -kx\hat{x}$，即弹簧拉力       |
| 万有引力势能 | $-G\frac{m_1m_2}{r}$：只和物质之间距离有关 | 无穷远点（$r = \infty$处）        | $F=-\nabla -G\frac{m_1m_2}{r} = -G\frac{m_1m_2}{r^2} \hat{r}$ |

显然，对势能求梯度可以得到对应保守力。对保守力积分则可以得到对应势能。

注意：**非保守力不会对势能做功。因为势能的定义只和保守力有关**

#### 机械能

动能和势能的综合称为机械能:
$$
E = T + U
$$
机械能守恒：

> 系统只有保守力做功时，机械能为固定常数

因为，当只有保守力做功时，保守力沿任一路径所做功为：
$$
\begin{gathered}
W = \Delta{T} \\
W = -\Delta{U}
\end{gathered}
$$
那显然，$\Delta{T} = -\Delta{U}$，根据机械能定义：
$$
\begin{gathered}
\Delta E = \Delta(T + U) = \Delta T + \Delta U = 0 \\
\int dE = E = C
\end{gathered}
$$
当存在非保守力做功时，将不满足机械能守恒。此时系统会收到/散出能量。

比如你在水平地面上用力推重物。此时重力不作功，势能不变。但是你的力做功，导致能量从你的身体流向物体，从而增大了其动能，导致机械能增大。

再比如给水加热。此时势能仍旧不变。热源的热能变换为水的动能，机械能增大。

#### 一维势能曲线

由于势能只和物体位置有关。那么在一维的情况下，可以将$U(x)$绘制成曲线（二维就是曲面）：

![势能曲线](/assets/势能曲线.jpg)

我们假设系统机械能守恒，图中横向的虚线是机械能的值。

那么有几个点要注意：

1. 当曲线和机械能所在横线相交时，此时势能等于机械能，那么动能就是0。也就是说此时物体速度是0。

2. 曲线的极值点要特别关注。因为曲线的极值点是$\dot{U(x)} = F = 0$的位置，也就是说此时物体不受力，处于平衡状态(equilibrium state)。

   1. 处于极小值点是物体处于稳定平衡(stable equilibrium)状态。在极小值点附近的物体在不受力的作用时会自动回到极小值点（自动回到平衡态）。
   2. 处于极大值点则相反，物体处于非稳定平衡(unstable equilibrium)状态。此时任何的扰动都会让物体从极大值点落回稳定平衡（极小值点）。

   对于稳定平衡和非稳定平衡的理解，可以考虑一个小球在山谷和山峰处。在山谷（稳定平衡态）中，小球即使移动也会有回到平衡态的趋势。而在山峰（非稳定平衡态），任何微小扰动都会让小球落回山谷：
   ![稳定平衡和非稳定平衡](/assets/稳定平衡和非稳定平衡.png)

#### 通过机械能得到物体的运动方程

如果机械能守恒，并且我们知道势能函数$U(\mathbf{r})$，那么可以通过机械能分析任意位置处物体的运动方程：
$$
\begin{gathered}
E = T + U = \frac{1}{2}m\dot{\mathbf{r}}^2 + U(\mathbf{r}) \\
\frac{1}{2}m\dot{\mathbf{r}}^2 = E - U(\mathbf{r}) \\
\dot{r} = \pm \sqrt{\frac{2}{m}(E-U(\mathbf{r}))}
\end{gathered}
$$
然后有：
$$
\begin{gathered}
\dot{\mathbf{r}} = \frac{d\mathbf{r}}{dt} \Rightarrow dt = \frac{d\mathbf{r}}{\dot{\mathbf{r}}} \\
t = \int \frac{d\mathbf{r}}{\dot{\mathbf{r}}} = \int \frac{d\mathbf{r}}{\pm \sqrt{\frac{2}{m}(E-U(\mathbf{r}))}}=\pm \sqrt{\frac{m}{2}} \int \frac{d\mathbf{r}}{\sqrt{E - U(\mathbf{r})}}
\end{gathered}
$$
这样就可以得到$t$对$\mathbf{r}$的函数。

比如任意小球从空中以静止情况向下坠落。不考虑空气阻力，假设势能0点为刚开始静止的点。那么根据刚才推导的公式，有：
$$
\begin{gathered}
\dot{\mathbf{r}} = \sqrt{\frac{2}{m}} \sqrt{0 - (-mgh)} = \sqrt{2gh} \\
t = \int \frac{dh}{\sqrt{2gh}} = \sqrt{\frac{2h}{g}} \Rightarrow h = \frac{gt^2}{2}
\end{gathered}
$$
和我们用牛顿力学推出的公式一样。

### 震动和弹簧



## 分析力学

## 参考资料

* Taylor的《Classical Mechanics》：宝宝巴士，讲的十分详细，就是有点太啰嗦，信息密度低。适合睡前阅读辅助睡眠
* Goldstein的《Classical Mechanics》：信息密度较高。但是章节安排混乱，分析力学和牛顿力学混在一起讲
* B站的理论力学网课[【理论力学（物理类） 主讲：哈尔滨工业大学物理学院 任延宇】](https://www.bilibili.com/video/BV1xJ411s78q/?share_source=copy_web&vd_source=e1b8baee842192a0e6b2b7d9ef8e10ef)：不错的网课，推荐学习
