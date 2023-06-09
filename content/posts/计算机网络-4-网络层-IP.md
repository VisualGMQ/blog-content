---
title: 计算机网络-4-网络层-IP协议
date: 2020-05-29 15:50:34
category:
- 计算机网络
---

《计算机网络：自顶向下方法》的学习笔记。

IP协议存在于网络层，网络层是将运输层送到网络边缘的分组发送到路由器的层。而IP协议就是运行在网络层的协议。

<!--more-->

# IPv4

IP协议分为两种，一种是IPv4一种是IPv6。IPv4是目前广泛运用的，而IPv6则是为了弥补IPv4中IP地址不足而提出的

## 数据报格式

首先来看一下IPv4的数据报格式：

![IPv4数据报格式](https://s1.ax1x.com/2020/05/30/tQCamq.png)

* 版本：表示IP版本，IPv4是4。
* 首部长度：整个首部的长度（不包括数据）。
* 服务类型：标识当前数据报代表什么类型的服务。因为有很多基于IP的服务，如FTP和ICMP等，这里就是给出服务的标志（详见《TCP/IP详解：卷一》。
* 13比特片偏移：和运输层报文段一样，如果IPv4报文段过大会分片，而IPv4不想TCP使用序号标志，而是使用比特偏移来标志当前片的位置。
* 寿命：即TTL（Time-To-Live），这个是防止数据报在网络中无尽循环传输的。比如现在有两个路由器A和B，A可以通过路径P1通往B，B可以通过路径P2通往A。这个时候数据报到A路由器，路由器和他说，你下一站是B，然后他跑到B问B下一站在哪里，B说你下一站是A。那这样数据报就在A和B两个地方不停地跑，形成了死循环。TTL是数据报的寿命，没到一个路由器就会减一，如果路由器发现TTL是0就会丢弃这个数据报。
* 上层协议：表明这个数据报应当交给运输层的哪个协议，6位TCP，17位UDP。
* 首部检验和：和运输层一样，用于校验内容。有两个地方要注意：
  * 计算方式：计算方式是**将首部轴每两个字节分为一组，用反码算数对这些数求和，该和的反码就是校验和**。
  * 每次重新计算：由于TTL没过一个路由器会减一，所以每次到达新路由器，路由器都必须重新计算校验和
* 源IP地址和目标IP地址：这个就是发送方的IP地址和接收方的IP地址
* 选项：允许首部被扩展以增加一些其他功能，不过很少用到，IPv6已经废弃了这个字段
* 数据：上层给出的数据

数据报一行32比特，所以首部最小一共是$5*4=20Bytes$。

## IPv4编址

### IPv4地址的表示

这里不得不说人尽皆知的IP地址了。IPv4中IP地址4字节，每一个字节为一组，共分为四组，每组以一个点分割，形成如`198.2.10.1`这种表示，称为`点分十进制`表示。

IP其实并不是代表*主机*的地址，而是代表*接口*的地址。**接口**是主机和物理链路之间的边界，或者路由器和其任意一条链路的边界：

![接口示意图](https://s1.ax1x.com/2020/05/30/tQCt6s.png)

这里直接是链路，圆是路由器，矩形是端系统。一般主机只有一个接口，所以主机自己带有一个IP地址（这里用黑色表示）。路由器可以有多个接口，比如左上方的路由器就一共有三个接口（分别是和两个端系统相连的`233.1.1.0`和连接向右边路由器的`1.18.1.33`和连接向厦门路由器的`1.19.2.4`）。同样地其他两个路由器也有三个接口。

### 子网

假设现在你开了个公司，你得向ISP要IP地址对吧。那么这个时候假设你的公司里面有三台联网的电脑，难道你就要三个IP地址吗？显然我们得多要一点以备以后增加电脑所需。而ISP分配给你IP地址也不是一个一个分配的，而是一次性分配给你一堆，比如它会将`233.1.1.x`下的所有IP分配给你，那么你就有`233.1.1.1 ~ 233.1.1.254`这么多地址了。

子网其实就是分配给你的IP地址范围，比如`233.1.1.3`就在`233.1.1.x`子网下，而由于最左侧24个位定义了子网，所以在`233.1.1.0`后面加个`/24`来表示子网。以前叫`/24`子网掩码，现在不这么叫了。这种表示子网的方法叫做`无类别域间路由选择（CIDR）`

举个栗子，比如`129.3.0.0/16`的意思就是左边16位是子网，那么你的主机IP就可以是`129.3.0.1~129.3.255.254`了。

为什么`129.3.0.0`和`129.3.255.255`不能作为主机IP呢？因为除了子网之外的数值不能全是0或1.如果全是0代表**当前子网**，你看上图中路由器是不是最后8位都是0，那如果你主机最后还是个0，不是和路由器IP重了吗，那数据报到达之后路由器怎么知道送往哪一个主机呢。而全为1的话表示**广播地址**，发往广播地址的数据报会分发给当前子网下的所有主机（有时候路由器也会选择性地发到外部网络，不过一般不这么做）。

#### 子网的计算方法

现在问一下，上图中一共有多少个子网？

答案是6个，首先可以明显判断路由器和主机相连为一个子网，所以有3个子网，还有三个如下图：

![剩下的三个子网](https://s1.ax1x.com/2020/05/30/tQCYlj.png)

图中绿色圈出来的就是子网，诶没想到吧。

子网可以通过如下方法确定：

> 为了确定子网，分开主机和路由器的每个接口，产生几个隔离的网络岛，使用接口端接这些隔离的网络的端点。这些隔离的网络中的每一个都叫做一个子网

#### 网络的分类和子网掩码

**这一部分现在已经废弃了，记录下来主要是为了应付考试。**

##### 网络分类

在CIDR出现之前，确定子网是通过将网络分类的方式。主要是将IP地址分为ABCDE五类，每一类都有确定的子网号和主机号：

图片来自于[CSDN](https://blog.csdn.net/zhoutianzi12/article/details/103199111)

![IP地址分类](https://s1.ax1x.com/2020/05/30/tQCQTf.png)

同理可计算出ABCDE网络的范围：

```
A:  0.0.0.0 - 126.255.255.255
B:128.0.0.0 - 191.255.255.255
C:192.0.0.0 - 223.255.255.254
D:224.0.0.0 - 239.255.255.254
E:240.0.0.0 - 255.255.255.255
```

##### 子网掩码

在给网络分类之后，ABC类网络都有默认的子网掩码：

```
A: 255.0.0.0
B: 255.255.0.0
C: 255.255.255.0
```

所谓子网掩码就是用来区分网络号和主机号的掩码，子网掩码是1的地方对应IP地址就是网络号，为0的地方对应IP地址就是主机号。比如`126.123.3.3`这个IP是A类网络，其默认子网掩码是`255.0.0.0`，那么其网络号就是`126.0.0.0`，其主机号就是`123.3.3`。

所谓网络号就是子网号，和用CIDR表示的`126.123.3.3/8`表示的`126.0.0.0`一样，而主机号就是在这个子网中主机可以使用的IP号，就是子网掩码0对应的位置。

## 内网和外网

内网就是局域网（LAN），而外网就是互联网。我们可以通过调制解调器将多个主机连在一起形成局域网，或者将主机连接到通往外网的路由器来连接到外网。具体解释如下：

摘自[CSDN czl_Serena](https://blog.csdn.net/czl_Lynn/java/article/details/75455437)

>外网：即互联网，局域网通过一台服务器或是一个路由器对外连接的网络，这个IP地址是惟一的。也就是说内网里所有的计算机都是连接到这一个外网IP上，通过这一个外网IP对外进行交换数据的。也就是说，一个局域网里所有电脑的内网IP是互不相同的,但共用一个外网IP。在局域网中，每台电脑都可以自己分配自己的IP，这个IP只在局域网中有效。而如果你将电脑连接到互联网，你的网络提供商（ISP）的服务器会为你分配一个IP地址，这个IP地址才是你在外网的IP。两个IP同时存在，一个对内，一个对外。当你家里买了两台电脑，你想组建一个局域网，你除了要用网线和路由器等设备将两台电脑相连，你还要将两台电脑设置固定IP，比如电脑A设为192.168.1.2，电脑B设为192.168.1.3，这样你就可以用这两个IP地址互相访问两台电脑，但这两个IP地址只在这两台电脑间有效，对外网无效。所以局域网中分配的IP与广域网中的IP完全没有对应关系。你在内网的机子在上网时，都是在向网关发出请求，再由网关（一般为路由器）用外网IP转到INT网上，接受数据后，再分发到你的内网IP上。

也就是说，在局域网中我们可以自己手动设置自己的IP地址，这个IP就是内网IP。如果你想要连接到互联网的话，路由器会通过DHCP协议给你分一个IP，这个IP就是外网IP。

通过如下指令可以得到同意网关下的所有内网IP:

```bash
arp -a
```

通过如下命令可以得到外网IP：

```bash
curl ifconfig.me
```

## 动态主机配置协议DHCP

一旦你获得了一个子网，就可以为子网中的主机分配IP地址了，你当然可以手动分配，但是也存在着名为DHCP的自动IP地址分配协议。这个协议广泛用于无线网中（移动端接入网之后，DHCP分配一个IP给他，等用户走了只会自动归还IP）。

DHCP本质是一个C/S架构的协议，你可以配置DHCP给每次连接的主机相同的IP，或者随机给它个临时IP。由于DHCP可以自动分配给连入网络主机IP的能力，所以又叫做`即插即用协议`和`零配置协议`。

要使用DHCP，你的子网内必须有一个运行着DHCP服务的服务器，或者有一个DHCP中继代理（每次请求DHCP服务时，中继代理会帮助你和真正的DHCP服务器通信）。

从DHCP得到IP分为四个步骤：

* DHCP服务器发现：一台新到达的主机要向广播地址`255.255.255.255`发送源地址为`0.0.0.0`的报文。由于DHCP服务器在子网中，所以会受到来自广播的这个报文。
* DHCP提供：受到报文之后，DHCP会找一个IP地址填入报文，然后再通过广播地址发送给主机。报文内有分配的IP地址，事务ID，网络掩码和**IP地址租用期**（即这个IP地址的最长使用时间）。
* DHCP请求：由于一个子网中可能存在多个DHCP，可能会发送多个DHCP提供报文，所以主机必须选择一个报文并给予响应，表示我要用你给我的IP地址了
* DHCP ACK：在客户响应报文之后，DHCP也会回应一个ACK报文表示“好的，你就用这个IP地址吧，我记录下来了”。

一旦DHCP ACK报文接收到之后，主机就可以在租用期内使用这个IP了。

## 网络地址转换NAT

NAT用于网络地址转换，具体的背景请见百度百科：

> 随着接入Internet的计算机数量的不断猛增，IP地址资源也就愈加显得捉襟见肘。事实上，除了中国教育和科研计算机网（CERNET）外，一般用户几乎申请不到整段的C类IP地址。在其他ISP那里，即使是拥有几百台计算机的大型局域网用户，当他们申请IP地址时，所分配的地址也不过只有几个或十几个IP地址。显然，这样少的IP地址根本无法满足网络用户的需求，于是也就产生了NAT技术。

简单地来说，就是IP地址不够了，导致我们得想个办法减少IP地址的使用率。

NAT服务一图就可以表示完全：

![NAT示意图](https://s1.ax1x.com/2020/05/30/tQCKmt.png)

NAT会隐藏内部的主机，只暴露自己的IP地址。比如主机10.0.0.1的8080端口发送了一个报文，NAT会将其源IP地址变为自己的IP地址（这里是138.76.29.1），并且将端口号也给换了（假定换成5339），然后在内部的**转换表**中记录一下端口和IP的映射。在将数据报发出去。这个时候外部网络就会以为是IP为138.76.29.1的主机上的5339端口发送的报文。然后目的地会返回请求的数据，数据也是首先到达NAT路由器，路由器通过转换表发现5339端口应当转换为8080端口，IP为10.0.0.1的主机，于是给10.0.0.1主机的8080端口转发这个报文。

## 网关和路由器的区别

网关是网络边缘的器件，连接两个不同类型的网络，让两个端系统相互通信。而路由器则是转发分组，通过路由选择协议发送报文。不过现在的路由器都带有网关的功能，所以基本上路由器就是网关。

# IPv6

在2019年11月25日时，IPv4地址以及全部用完。互联网进入了IPv6时代。

有关IPv6的细节见《TCP/IP协议》，这里只略微提到一点。

## 数据报格式

![IPv6数据报格式](https://s1.ax1x.com/2020/05/30/tQCeld.png)

* 版本：IPv6是6。需要注意的是，简单地将版本换为4是没办法变成IPv4报文的
* 流量类型：和IPv4的服务类型差不多
* 有效载荷查干度：在定长的40字节首部之后的数据长度
* 下一个首部：和IPv4的“上层协议”一样
* 跳限制：就是TTL
* 源地址和目的地址：地址增长到了128位（16字节），这样就不用担心地球人用完IP地址了。
* 数据：上层要传输的数据

## 从IPv4到IPv6的迁移

首先带来的问题是如何将IPv4机器升级到IPv6机器。这个吧目前没什么好解决办法。其次是使用IPv6的路由器如何将数据转发到使用IPv4的路由器上（总不能把所有IPv4路由器都换了吧），这里提出的解决办法是`建隧道`：

![建隧道](https://s1.ax1x.com/2020/05/30/tQCPw6.png)

这里相连的IPv4路由器被视为一个隧道。IPv6路由器会将数据报放到IPv4数据报的**数据**字段中，这样IPv4路由器并不知道自己已经携带了IPv6信息了，它会直接传给和它相连的IPv4路由器，直到IPv4路由器将数据传给IPv6路由器，IPv6路由器会从其数据字段部分解析出IPv6数据报，然后继续传送。