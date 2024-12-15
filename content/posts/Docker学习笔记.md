---
title: Docker学习笔记
date: 2019-09-19 19:02:09
category:
- 杂项
tags:
- Docker
photos:
- https://s1.ax1x.com/2020/04/07/GcdYa8.png
- Docker
---

# 什么是Docker 

> Docker是一个开源的应用容器引擎，让开发者可以打包他们的应用以及依赖包到一个可移植的镜像中，然后发布到任何流行的 Linux或Windows 机器上，也可以实现虚拟化。容器是完全使用沙箱机制，相互之间不会有任何接口。

其实说白了就是Docker是一个存储开发环境的容器，每个开发环境之间没有任何接口。我们可以通过docker来共享开发环境。

<!--more-->

## 什么是镜像

镜像(image)，通俗的来说，就是一份描述软件的清单。docker通过镜像来构建容器，说白了就是通过软件描述清单来构建容器。

## 什么是容器

容器(container)其实就是根据镜像构建出来的软件实体。镜像和容器就像类和对象的关系一样。

# Mac下Docker服务的开启

在Docker官网下载Docker文件，安装之后点击Docker的图标就会自动开启服务。
和Linux不同，Mac下只能通过Docker程序启动服务，不能使用命令启动。

# Docker镜像相关命令

## 查看本地镜像

使用`docker images`来查看本地的所有镜像:
```
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
redis               latest              4cdbec704e47        6 days ago          98.2MB
ubuntu              latest              4e5021d210f6        2 weeks ago         64.2MB
```

* Repository: 镜像的名称，这里是Ubuntu系统
* TAG: 镜像的版本号，latest表示最新版本
* IMAGE ID: docker给与的每个镜像的唯一ID
* CREATED: 创建的时间
* SIZE: 镜像大小

## 搜索镜像文件

使用`docker search xxx`在镜像仓库中来搜索你想要的镜像。
比如搜索python：`docker search python`

```
NAME                             DESCRIPTION                                     STARS               OFFICIAL            AUTOMATED
python                           Python is an interpreted, interactive, objec…   5076                [OK]
django                           Django is a free web application framework, …   946                 [OK]
pypy                             PyPy is a fast, compliant alternative implem…   237                 [OK]
kaggle/python                    Docker image for Python scripts run on Kaggle   139                                     [OK]
arm32v7/python                   Python is an interpreted, interactive, objec…   48
nikolaik/python-nodejs           Python with Node.js                             44                                      [OK]
...
```

* NAME: 镜像名称
* DESCRIPTION: 镜像的描述
* STARS: star的人数，和github的star差不多
* OFFICIAL: 是否是官方的镜像

如果不想下载列表中有的版本，可以上[docker hub](hub.docker.com)中来搜索你想要的镜像版本。如果有的话就可以下载。

## 拉取（下载）镜像文件

使用`docker pull xxx:version`下载
其中xxx是你的镜像名称，version是镜像的版本，如果省略默认为latest。

## 删除镜像文件

使用`docker rmi id`即可。
其中id是镜像ID。
如果存在相同ID的镜像会报错（存在相同ID的原因是你的镜像名称和版本都一样，也就是说你下载了多个一模一样的镜像）,这时可以使用`docker rmi name:version`的方式删除。

## 查看所有镜像的ID

使用`docker images -q`可以查看到所有镜像的ID。那么就可以使用:`docker rmi \`docker images -q\``来删除所有的镜像。

# Docker容器相关命令

## 查看容器

`docker ps`来查看现在**正在运行**的容器
`docker ps -a`来查看**现存的所有**容器:

```
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS                  PORTS               NAMES
ca319f908c4e        ubuntu              "/bin/bash"         4 days ago          Exited (0) 4 days ago                       helloworld
```

* CONTAINER ID:容器的ID
* IMAGE: 容器所承载的镜像
* COMMAND: 进入容器时默认执行的命令（对于Ubuntu镜像默认进入Bash）
* CREATED: 创建时间
* STATUS: 容器状态，这里是退出状态（运行状态会显示Up）
* PORT:容器端口号
* NAMES: 容器名称

也可以使用`docker inspect container_name`来获取容器的详细信息

## 创建容器

使用`docker run ...`来创建容器。这个命令需要加上一些参数：
* --name=:容器的名称
* -i:容器保持一致运行（在客户端连接断开还能连接）
* -t:给容器分配一个伪终端，方便我们输入一些命令
* -d:后台运行容器，需要通过额外命令进入容器
* image_name:version :镜像名称:镜像版本（默认latest版本或已存在的唯一镜像版本）
* command:初始化指令，在进入容器时默认执行的指令，可选

如:
`docker run -it --name=c1 ubuntu /bin/bash`
会创建一个基于ubuntu镜像的容器，并且进入时默认执行`/bin/bash`指令

在回车之后docker会自动进入容器内部，想要退出的话使用`exit`命令即可。退出之后容器默认自动关闭

## 进入容器

`docker exec container_name/container_id` 命令进入容器

## 启动容器

`docker start container_name/container_id`启动容器

## 停止容器

使用`docker stop container_name`来停止容器

## 删除容器

使用`docker rm container_id/container_name`删除。
使用方法和删除镜像一样，后面跟容器ID或者容器名称

得到所有容器的ID是`docker ps -aq`

# 数据卷操作

## 配置数据卷

通过`docker run ... -v 宿主机目录/文件:容器内目录/文件`来将容器内的目录或文件挂载到容器内。
注意事项:

* 目录必须是绝对路径
* 如果目录不存在会自动创建
* 一个容器可以挂在多个数据卷（通过多个-v来指定）

比如:
`docker run -it --name=c1 -v /root/data:/root/data_container ubuntu`来将本机的data挂载到/root/data_container目录中。

有了挂载，我们就可以解决如下问题：
* 不同的容器内文件相互共享：只需要将同一目录或文件挂载到不同容器即可
* 容器文件和宿主机文件共享

# 数据卷容器

如果想要多个容器进行数据交换，那么需要很繁杂的挂载操作。数据卷容器就是为了处理这个情况而诞生的。

## 配置数据卷容器

首先使用`-v`参数来设置容器目录（不设置数据卷目录）：
`docker run -it --name=c2 -v /volume ubuntu`

然后通过`--volumes-from`参数将多个容器挂载到这个数据卷上:
`docker run -it --name=c3 --volumes-from c2`将c2和c3绑定。
这样我们在c3中就可以看到c2中的`/volume`目录了。

如果想看当前挂载到那个目录了，可以通过`docker inspect`命令找到`Mount`字段，里面的`destination`就是挂载的目录了。

# 将容器转移到镜像

通过`docker commit container_id image_name:image_version`来将容器转化为镜像。
通过`docker save -o 咋锁文件名称 镜像名称:版本号`将镜像压缩成压缩包。
通过`docker load -i 压缩文件包`来将压缩好的镜像文件加载进来。

有了镜像压缩包之后，就可以将镜像发给其他的人，这样就可以共享开发环境了。
