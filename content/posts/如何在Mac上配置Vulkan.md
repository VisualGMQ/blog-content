---
title: 如何在Mac上配置Vulkan
date: 2020-5-15 17:06:44
category:
- game development
---

本文说明了如何在XCode配置Vulkan，以及如何使用g++进行vulkan编程。

<!--more-->

# 下载，测试和安装

首先去[vulkan官网](https://vulkan.lunarg.com/home/welcome)下载Mac下的SDK包。我这里下载的是*vulkansdk-macos-1.2.135.0.tar.gz*。

下载好之后解压。先进入`Applications`文件夹，里面有`vkcube`程序，双击看看能不能转。如果能转的话说明你的显卡可以使用vulkan，就可以进行安装了。

在解压文件根目录下可以看到`install_vulkan.py`文件。这个就是安装文件，打开终端，输入`./install_vulkan.py`即可安装。

如果安装过程中出现失败，一般他都会提示你如何修复。

它会将vulkan头文件安装到`/usr/local/include`下，并且将vulkan库安装到`/usr/local/lib`下。

如果想要卸载vulkan，请运行`uninstall.sh`。

# 在XCode上配置Vulkan

官方文档说了如何在XCode上配置，见[这里](https://vulkan.lunarg.com/doc/sdk/1.2.135.0/mac/getting_started.html)。

这里我也简单说一下：

1. 创建一个基于C++的XCode工程

2. 将这段代码粘到main.cpp中：

   ```c++
   #include <iostream>
   #include <vulkan/vulkan.h>
   
   int main(int argc, const char * argv[]) {
       VkInstance instance;
       VkResult result;
       VkInstanceCreateInfo info = {};
   
       result = vkCreateInstance(&info, NULL, &instance);
       std::cout << "vkCreateInstance result: " << result  << "\n";
   
       vkDestroyInstance(instance, nullptr);
       return 0;
   }
   ```

3. 这个时候由于找不到vulkan头文件，会报错。解决办法是加上vulkan的framework：

   1. 将vulkan文件夹下的`macOS/Frameworks/vulkan.framework`拷贝到你的工程根目录
   2. 打开工程的`Build Phases`选项卡，打开`Link Binary With Libraries`节点，将你刚刚拷贝的`vulkan.framework`拖进去。
   3. 然后打开`Copy Files`节点，去掉`Copy only when installing`，再将`vulkan.framework`拖进去。

然后再编译应该就可以成功了。

如果还是提示找不到头文件的话，你就需要在XCode的`Build Settings`选项卡里面找到`Header Search Paths`节点，手动添加vulkan的头文件目录（这里是`/usr/local/include`）。

经过以上步骤应该就可以编译了。

# g++的配置

前面我们说过，头文件安装在了`/usr/local/include`下，库安装在了`/usr/local/lib`下，所以我们就可以这样编译：

```bash
g++ main.cpp -o exe -I/usr/local/include -L/usr/local/lib -lvulkan
```

即可成功。

# vulkan工具

vulkan还会将`macOS/bin`下的文件安装到`/usr/local/bin`下。可以使用`vulkaninfo`工具来看看你系统上vulkan的信息。