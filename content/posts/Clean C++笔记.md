---
title: Clean C++笔记
date: 2020-10-16 19:02:09
category:
- 编程素养
tags:
- cpp
---

这里是《Clean C++》（C++代码整洁之道）的笔记。比起《Clean Code》来说，本书更多地讲述了如何使用C++技术来达到“Clean Code”的方法，我觉得很值得参考。本书和这里的所有代码，例子均在C++11及其以后的标准下编写。

<!--more-->

# 单元测试

单元测试是已经不需要再重复强调的技术了。无论是不是用TDD开发方法，做单元测试都是保证代码质量的一种良好手段。尤其是对于我这种喜欢先随便写然后再重构的人，单元测试更是保证重构正确性的一道坚固屏障。

简单来说，单元测试可以带来这些好处：

* **测试即文档**。在编写单元测试的时候，你其实也在编写文档。只不过这份文档是以代码的方式表示出来的。当别人不知道某个接口或者类的使用方法时，通过观看和运行单元测试可以很好地学习到这个接口或类的使用方法。由于单元测试取代了文档，所以就不需要再花时间在文档的编辑上，这也就意味着不需要维护文档。这可以节省很多的时间，让程序员更加关注内容。而且要比起文档来说，**代码就是最精确的文档**，因为文档可能会出错，但代码绝对不会。
* **有利于重构后的功能检查，可以更快检查出代码更改后的错误**。重构是在开发过程屡次出现的事情。重构的核心是**只改变代码结构，而不改变代码功能**。想要知道你重构是否改变了功能是很难的。但是如果有单元测试，在重构后只需要转一遍单元测试看看有没有什么错误就可以了。免去了因为重构而不小心改变程序功能的不良后果。
* **提升程序员的自信心**。你的程序通过单元测试了，说明你的程序在你的预期下运行，这样说明你的程序有保障，你基本可以毫无后顾之忧地去继续写代码，而不是在之后出bug时屡次怀疑以前的代码是否有bug。
* **能够促进产品开发**。在TDD中，编写单元测试意味着你同时也在明确你的软件设计。

那么关于单元测试，有哪些要注意的地方呢？

* **单元测试的覆盖面应该尽可能地大**。显然，如果你的单元测试只测试了一小部分代码，那么上面的那些优点显然无法体现。

* **单元测试的命名**：单元测试的命名应当以`单元测试的前提条件_单元测试的API名称_单元测试的预期后果`这种格式来命名。虽然看上去很长，但是这样更加有利于你和你的朋友在第一眼看到单元测试时就明白他是什么意思，而不是通过一句一句地琢磨你单元测试里的语句来揣摩你的意思。比如`giveTwoComplexNumber_add_theSumOfNumbers`一看就知道是需要传入两个复数变量给add函数，add函数会将其相加后返回相加的值。

* **不要对简单函数进行单元测试**。比如大部分类的`Getter`和`Setter`方法。这些方法通常只由一两条语句构成，内容极其简单，简单到不需要做单元测试。为这些函数做单元测试没什么卵用，反而会耗费精力。但是，**如果你的Getter和Setter方法真的很复杂，那还是有必要整一下单元测试的**。

* **不要对第三方库做单元测试**。第一，给第三方库做单元测试应该是第三方库开发者的事情，不是你的事情。第二，第三方库的API太多了，为其做单元测试会很累（不过你要是通过做单元测试的方式来学习的话可以忽略这一条）。如果你不信任你的库，请找带有单元测试的第三方库，那种库可能更有质量保障。

* **单元测试必须独立**：*千万千万不要出现一个单元测试依赖另一个单元测试的情况*，每个单元测试都应当可以单独拿出来编译并运行。

* **一个测试一个断言**：一个单元测试中只有一个断言。这不仅有利于单元测试的独立性，而且能够更好地为测试找个好名字。

  不要在意这会带来很多单元测试文件的后果。比起代码整洁来说，多一些不耦合的文件不算什么。

* **测试必须快速执行**：由于*一个测试一个断言*，会导致你拥有很多单元测试。这些单元测试必须快速执行。你我都不会想在等待单元测试的编译过程上花费很多时间（毕竟对于我这种喜欢重构的人来说，每几十分钟转一次单元测试是常有的事情）。

* **如何处理来自网络，数据库等IO的访问**：网络和数据库的依赖一般来说都会让代码变得很麻烦。单元测试讲究小巧简单。这个时候我们可以使用伪对象(`fake object`)来帮助测试。

  譬如我的模块依赖关系是这样：

  ![UML1](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLWWEz759B4bCIYnEXOeu9YVdb-QL15SMbwJcSY79AzZewgBAMYca974vfEQb0Cq30000)

  但是这个时候我想要对`AccountSystem`做单元测试的话，不可避免的会引入`SQLDatabase`类。而操作数据库是一件即麻烦，又很花时间的事情（磁盘操作）。这个时候，我们需要先抽象出接口，然后通过继承接口来得到我们自己的fake对象：

  ![拥有fake对象的UML](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLWWEz759B4bCIYnEXOeu9YVdb-QL15SMbwJcScNcbQGMfIKcfoh0b7d2HBWmH1HiQdHrKOnqIynEXN4KT7LhxB0OWs8XK96T0eekAuKq83S-9OdB8JKl1UXo0000)

  这样就可以放心地利用fake_db对象做单元测试了。

# 原则

这里提出了一些编码方面的一般原则。

## KISS保持简单和直接原则

任何事情都应该尽可能简单。能够使用C++标准库做到的事情就尽量使用标准库去做，而不是自己从头造轮子。不要因为会用，就在代码中加入一些花里胡哨的技巧。这里很典型的例子就是过度设计和乱用设计模式。

## YAGNI不需要原则

现在不需要的东西就一定不要提前写。等到真正有需要的时候再编写。

这是因为有的东西你觉得以后可能会用到，但是真实情况却是根本没有用到。这样就多出了无用代码，使得代码更加复杂，同时也破坏了KISS原则。

## DRY不重复原则

这个原则已经是耳熟能详的了。不要滥用复制黏贴（最好不用），尽量减少程序中的重复代码。确切地说是**确保一个系统内部，任何一个知识点都只有一个权威的，单一的，明确的称述**。

最常见的是函数的问题。如果有两个或者多个函数中出现了类似的代码，这就需要将公共部分提取出来放到新函数里面：

```c++
class Creature{
  void SetPosition(int x, int y);
  //...
};

class Wall{
  void SetPosition(int x, int y);
};
```

像上面这种代码，可以通过继承避免重复的SetPosition函数：

![通过继承来避免重复](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLl1FoafDBe5od8jI4qjAYrAXtF34d1mkc9Y2hcwD7KmvI0P5048fM2a4fvO4v1TdbcJcvsbKM6NcbUWeL88eJIw7rBmKeBq0)

## 信息隐藏原则

如果一段代码调用了另一段代码，那么调用者不需要知道被调用者的内部实现。也就是说，所有的代码都需要隐藏自己的信息，将自己变为黑盒子。

这个原则是模块化设计的基础。看一下书上关于门的例子：

![门的例子](http://www.plantuml.com/plantuml/png/LOmz3i8m34Ptd-8R0QaNO2eID-04KMfLbH8RrLycnDrfaudDF--zEPXsjbf4hLMycAWVGIuUkWZyhRRPEePnFjUlI2uf0ez6hubRVhhlXuTLsHkNAx9R4FVHF9K_6BTf6gy3YOxCQakhvGS0)

`State`是`AutomaticDoor`的内部enum。这样，每次调用`AutomaticDoor`的`getState()`方法时，都会有类似如下代码：

```c++
AutomaticDoor door;
AutomaticDoor::State doorState = door.getState();
if(doorState == AutomaticDoor::State::closed){
  //...
}
```

如果这时我们想要删除`AutomaticDoor`的`State`枚举，那么所有调用`getState`的代码都需要更改，这样调用者就产生了对被调用者(`door.getState()`)的依赖。所以这里并没有进行信息隐藏。

更好的做法是为每个动作都设计一个函数：

![更好的信息隐藏](http://www.plantuml.com/plantuml/png/POyz3i8m38Ltdy9Z2ye5c8hApi09GcgXI4cCQcT2t1qNB_nipv_ythCdqRXghmMezOeNZKeFm5HOQ07aExNSRYuSR-CJ89KeWiUkNAFcT69UpRV7BFFREunum2jpSNWs_n-SFMuOVpS_eNLzjU0k1B_JiWBAfc2YjjWJBm00)

## 高内聚和松耦合原则

各个模块的内聚性应当尽量高（即模块之间的耦合应该尽量低），模块不应当或者应当很少知道其他模块的具体信息。

这个原则可以更好地帮助我们建立抽象结构。比如书上关于开关和灯的例子：

![开关和灯的例子](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLl19p2sevbBGLiZFqz1Ki58eoyzC0NFJqX3yMYwewk3op9Ba3A1wNGMWEIMfLadv-JaWvINv-UavgHgQLZ3r49KAkhfsO2iKh81QSe0CBYw7rBmKeFq0)

这里`toogle()`函数通过调用`lamp`的`on`和`off`函数来在开关灯之间切换。

这里的耦合在于，`Switch`类和`Lamp`类是紧耦合的。从单元测试的角度来看，`Switch`类显然不能够单独拿出来测试。因为Switch类知道Lamp的事情。

这里的改进方法是使用抽象的类接口，屏蔽`Lamp`类的具体细节：

![改进的高内聚例子](http://www.plantuml.com/plantuml/png/NOz13i8W44Ntd6AMRKmlmCBq0EuymPGEIZ9bJ1breTvTa6Y9E_xFUtmOa-AgruMDOqm93hXS7WPs8B7hmS9Dmlo9tc_vPKo8Igj7Ht2y1tLdd9WQxq_xMdMZ6faU8AyhsKc42wqY9wQk__7bDJ0CptspOkenrsqBjjosGIF5EV_g3G00)

这样，开关不仅能够打开台灯。如果以后还想打开电风扇的话，我们依然可以建立电风扇类继承`Switchable`接口。

## 小心优化原则

不成熟和优化和过早优化会产生问题。

首先，过早优化会违反YAGNI原则。

其次，你认为需要优化的地方可能并不是性能瓶颈，你的优化带来不了多少性能的提升。这里建议使用Profiler等工具帮助你找到真正的性能瓶颈。

最后，优化意味着可能引入bug。而且现代编译器已经非常擅长优化了，大部分优化的事情都可以交给编译器去做。

## PLA最少惊讶原则

在用户界面和API设计中，不要出现让用户和调用者感到惊讶的事情。函数应该完全按照函数名暗示的意义执行，比如一个`Getter`函数不应当拥有副作用。

## 童子军原则

即反破窗原则。即不容忍破窗行为。只要看到不好的东西就立刻修复。一般这个原则会伴随着大量重构过程。

# 代码整洁的基本规范

## 良好的命名

首先，虽然书上没有说，但是我认为每个人都需要对自己的代码进行编码规则的约束。如果还没有良好的编码风格的话，我推荐看看[Google C++开源项目编码风格指南](https://zh-google-styleguide.readthedocs.io/en/latest/contents/)。

下面是一些基本命名规范

* 任何具有名称的东西，其名称都应该**有意义**和**有表现力**。

  所谓**有意义**是指不要起一些和其内容不相干的名称，比如给`class Customer`的全局实例对象起名为`c`这种。

  **有表现力**是指要尽量将名称对应的实体的作用表示出来。所以对于Customer全局实例的起名，可以是`aCustom`或者`customer`这种。

*   名称应当可以自解释**。意思是说，当一个不知道这段代码的人第一次看见这段代码时，他可以从名称一下就知道这段代码的大致作用是什么，而不是去查看文档或者逐语句查看。

* 使用领域中的名称。如果你在编写某一领域内的代码，你应当使用这一领域内的特定术语。这样可以让领域内的工作人员很快地了解代码功能。

* 避免冗余的名称。举个栗子，你在`Movie`类中定义了一个Getter`GetMovieName()`。显然这里的*Movie*是冗余的（在Movie类里面的Get方法不是返回Movie的名称那是返回什么呢？如果你说我这里还有不同专辑(category)的名称，我需要`GetMovieName()`和`GetCategoryName()`两种方法，那只能说你的Movie类和Category概念耦合了，需要解耦）

* 不要用晦涩难懂的缩写。显然，如果缩写不是人尽皆知的话，看代码的人还得去猜你的缩写是什么意思，这就违反了*需要具有表现力*这一规范。

* 不要用匈牙利命名法或者前缀。第一，现代IDE很智能，你将光标往变量上一放就能知道变量类型，这意味着前缀是多余的。第二，拥有前缀意味着你必须维护前缀，即当你改变变量类型的时候，必须将变量的名称一起改变。

* 避免相同名称用于不同目的。显然，同一名称所表示的内容不一样让人困惑。

## 注释

这里有一些对注释的讨论

* 尽量少地使用注释。好的代码可以自解释。多处注释意味着你需要花功夫维护注释。不正确的注释还会误导他人
* 不要为易懂的代码写注释。既然代码的功能不言自明，你还写啥注释呢。
* 不要通过注释禁用代码。第一，这会造成代码的整洁度下降。第二，一般来说，注释掉为了以后再用的代码，其实以后都没有用到过。所以这里的建议是直接删除，如果不想删除，请使用版本控制系统。当然，短暂的测试可以通过注释代码完成。所以这句话的含义应该是**不要在提交的代码中存在通过注释禁用的代码**。
* 不要写块注释。在一些源代码中，我常常看到将自己许可证写在代码头部的情况（比如SDL）。现在来说，这些注释并不具有法律效益，所以完全没必要写。如果想要版权，可以将许可证写在License.txt文件中。也不要使用块注释代替版本控制。
* 特殊情况下的注释是有用的，比如Doxygen的从源代码生成文档的注释。不过请只对公共API进行注释，而不是连私有函数和保护函数都注释。

## 函数

函数如何做到整洁？

* 只做一件事。一个函数应当只做一件事。如果一个函数做的事情太多，应当将其分解为多个函数。一个函数做了太多事情的“坏味道”有如下：

  * 函数代码量贼多。
  * 为函数命名时，不可避免地需要用到“和”，“或”这种词时。
  * 函数体用空行将代码分割为几个片段，这意味着这些片段需要单独拿出来组成新函数。
  * 包含了太多的if-else,switch语句
  * 函数的入参比较多（一般建议少于3个）

  这里我先拿一个我自己的例子出来说一下，请看下面代码片段：

  ```c++
  void buildRoom(int x, int y, int width, int length){
      SDL_Color color = {255, 255, 255, 255};
      // draw horizontal walls;
      for(int i=0;i<width;i++){
          Solid* solid = new Solid(Names::WALL_HORI);
          solid->SetPosition(x+i, y);
          solid->SetColor(color);
          worldmodel.RegistObject(solid);
          worldmodel.GetLayer()->AddObject(solid);
  
          solid = new Solid(Names::WALL_HORI);
          solid->SetPosition(x+i, y+length-1);
          solid->SetColor(color);
          worldmodel.RegistObject(solid);
          worldmodel.GetLayer()->AddObject(solid);
      }
    
      // draw vertical walls;
      for(int j=1;j<length-1;j++){
           Solid* solid = new Solid(Names::WALL_VERT);
           solid->SetPosition(x, y+j);
           solid->SetPosition(x, i);
           solid->SetColor(color);
           worldmodel.RegistObject(solid);
           worldmodel.GetLayer()->AddObject(solid);
        
           Solid* solid = new Solid(Names::WALL_VERT);
           solid->SetPosition(x, y+j-1);
           solid->SetPosition(x, i);
           solid->SetColor(color);
           worldmodel.RegistObject(solid);
           worldmodel.GetLayer()->AddObject(solid);
      }
    
      // draw ground
      for(int i=1;i<width-1;i++)
          for(int j=1;j<length-1;j++){
               Ground* ground = new Ground;
               ground->SetPosition(x+i, y+j);
               ground->SetPosition(area.x+i, area.y+j);
               ground->SetColor(color);
               worldmodel.RegistObject(ground);
               worldmodel.GetLayer()->AddObject(ground);
          }
  }
  ```

  `BuildRoom`函数会生成一个房间，这个房间有竖直的墙，水平的墙和地面三种物体。具体的方式是将这些物体new出来，设置好属性，放入worldmodel中，最后由worldmodel进行绘制和运行逻辑。

  首先，这个函数太长了，有40多行。其次，这里的函数违反了“只做一件事”的规则。咋一看，函数的确是用来创造一个房间，但是创造房间分为三个步骤“创建竖直墙，创建水平墙和创建地面”。所以这个函数其实一次性做了三个事情。这样我们就需要将这函数分解。下面是分解后的函数声明：

  ```c++
  void BuildVertWall(int x, int y1, int y2, SDL_Color color);
  void BuildHoriWall(int y, int x1, int x2, SDL_Color color);
  void BuildGround(SDL_Rect area, SDL_Color color);
  
  void BuildRoom(SDL_Rect area, SDL_Color color);
  ```

  这样`BuildRoom`的实现就变为这样：

  ```c++
  void BuildRoom(SDL_Rect area,  SDL_Color color){
      BuildHoriWall(area.y, area.x, area.x+area.w, color);
      BuildHoriWall(area.y+area.h-1, area.x, area.x+area.w, color);
      BuildVertWall(area.x, area.y+1, area.y+1+area.h, color);
      BuildVertWall(area.x+area.w-1, area.y+1, area.y+1+area.h, color);
      BuildGround(area, color);
  }
  ```

  显然整洁多了。

  接下来我要举一个“函数参数不多于3个”的例子，那就是Vulkan的API。Vulkan的创建型API本身需要很多的参数，但是为了整洁，开发者将这些参数打包为结构体。也就是说，在调用函数之前需要配置函数所需的结构体，而结构体的成员其实就是函数所需要的参数。这种方法叫做**参数打包**。一般来说当参数很多的时候就可以使用参数打包。

  这是Vulkan创建Instance的一段代码：

  ```c++
  //配置需要创建的Application的信息
  VkApplicationInfo app_info = {};
  app_info.sType = VK_STRUCTURE_TYPE_APPLICATION_INFO;
  app_info.pNext = nullptr;
  app_info.pApplicationName = "Hello World";
  app_info.applicationVersion = VK_MAKE_VERSION(1, 0, 0);
  app_info.pEngineName = "No Engin";
  app_info.engineVersion = VK_MAKE_VERSION(0, 0, 0);
  app_info.apiVersion = VK_API_VERSION_1_0;
  
  //得到SDL给与Vulkan的拓展
  unsigned int count;
  const char** names = nullptr;
  SDL_Vulkan_GetInstanceExtensions(window, &count, names);
  
  //配置Instance创建信息
  VkInstanceCreateInfo create_info = {};
  create_info.sType = VK_STRUCTURE_TYPE_INSTANCE_CREATE_INFO;
  create_info.pApplicationInfo = &app_info;
  create_info.enabledExtensionCount = count;
  create_info.ppEnabledExtensionNames = names;
  create_info.enabledLayerCount = 0;
  
  //创建实例
  VkResult result = vkCreateInstance(&create_info, nullptr, &instance);
  ```

  其实最后一行的`vkCreateInstance`理应需要一大堆参数。但是通过参数打包，现在只需要三个参数。

* 让函数尽可能小。一般来说一个函数理想情况下是4~5行，最多12~15行。超过20行就需要考虑考虑是不是要分解了。不用担心函数调用的开销。CPU调用函数很快很快的（至少比起IO操作要快得多，大部分性能瓶颈其实都在IO上）

* 函数命名应当以动词开头，并且使用容易理解的名称。

* 避免使用标志参数。因为如果你存在函数`CreateCreature(Property prop, bool flag)`，那么在你调用的时候`CreateCreature(prop, true), CreateCreature(prop, false)`，其他人不能够一下看出这里的`true`,`false`有什么用。这样函数的清晰度就不够了（显然当你看到这个函数时，你也不知道这里的flag是个啥），而且也违反了单一职责原则。这时应该分解函数为两个：

  ```c++
  CreateCreatureWithClothes(Property prop) 
  CreateCreatureWithoutClothes(Property prop) 
  ```

  这样就能一眼看出了。

* 避免使用输出参数。首先，调用者不能很好地区分输出参数和输入参数。其次，使用输出参数不能够形成链式调用。如果一定要返回多个参数，建议将返回值打包，或者使用`tuple`（不推荐）。

* 不要给予或者返回`nullptr`。

  1. 返回nullptr意味着调用者需要对返回值进行判断，这意味着代码整洁度下降。
  2. 返回nullptr会给调用者造成迷惑，你说我得到一个nullptr后是应该终止程序呢，还是打一个log呢，还是该怎么滴。也就是说，你将函数造成的后果推给了调用者。
  3. 如果调用者忘记给nullptr判空，那程序就直接崩溃。
  4. 返回或者传递指针，还意味着需要考虑指针所有权：我传进去的指针，是函数给我释放内存还是我得自己释放内存呢？对于函数返回的指针也有同样的道理。这显然违背了信息隐藏原则。

  简单的办法是返回/传递一个空对象。

## C++中的C代码

在用C++时，应该尽量减少C风格的代码。尽量去使用C++标准库的内容。包括但不限于：

* 使用标准库容器而不是自己写C容器。这遵循了KISS原则。
* 使用`static_cast`代替强制转换，因为`static_cast`可以在编译器做类型检查，更加安全。
* 使用`string`替代`char*`字符串
* 避免使用`printf`,`sprintf`这种函数。C++中有相关的替代函数和类。

# 现代C++中的高级概念

## 使用智能指针进行资源管理

资源管理总是C/C++中的一个大问题。所幸在C++11中我们存在智能指针。通过智能指针，我们可以使用RAII（资源申请即初始化），他们会帮助我们管理资源。

### unique_ptr

`unique_ptr`指针会将资源独占，任何的`operator=`，Move语义，拷贝构造都会让原有的资源占有者将资源转移给新的占有者。

### shared_ptr

`shared_ptr`通过引用计数的方式共享资源。当使用`operator=`，拷贝构造时会将引用计数加一，从而得到共享的方式。当计数为0的时候会自动释放资源。`shared_ptr`的缺点就是不能够解决环指向的问题。

### weak_ptr

`weak_ptr`需要和`shared_ptr`配合使用。当某个对象只是想临时地占有资源，而不想成为资源的所有者时可以使用。其需要一个`shared_ptr`对象进行构造，并且在使用资源之前必须使用`expired()`函数检测资源是否还有效。如果有效，需要使用`lock()`成员函数获得资源本身。



由于拥有了智能指针，所以我们需要尽可能地避免使用显式的new和delete。因为内存泄漏很可能存在含有new和delete的代码中。我们应当尽量使用栈内存，或者使用智能指针，或者使用标准容器。

## Move语义

Move语义的出现改变了很多C++中的编程习惯，并且极大地增强了C++的效率。

### 三大原则和五大原则，零原则

三大原则指的是：

> 类需要显式定义其析构函数，且应该总是定义拷贝构造函数和赋值构造函数。

醉着Move语义的引入，“总是定义移动构造函数和移动赋值构造函数”的条件加入了三大原则，变为了现在的五大原则。

之所以存在五大原则，是因为编译器给出的关于拷贝和赋值的函数总是浅拷贝的，这会为某些需要深拷贝的类带来隐患。而析构函数的定义则提醒你释放类中的资源。

然而，总是定义拷贝构造函数和赋值构造函数是很麻烦的事情，所以现在出现了**零原则**

> 实现类的时候，应该不需要声明/定义析构函数，也不需要声明/定义 Copy/Move 构造其和 Copy/Move 运算符。使用智能指针和标准库来管理资源

这意味着编译器提供的函数可以很好地执行。这一原则的背后是KISS原则。

## 恰当的错误处理机制

涉及关于涉及错误处理的API时，我们需要考虑三个方面：

* 前置条件：在函数或者类方法被**调用前必须总为真**，如果违反前置条件，函数调用的结果就难以保证。
* 不变式：函数**调用过程中必须为真的条件**。如果违反了，函数调用后会导致不正确或者不一致。
* 后置条件：**函数执行结束后立即返回真**。如果后置条件不成立，说明函数执行出错了。

接下来是四个异常保障级别，这部分也在《More Effective C++》中提到：

* 无异常安全：就是不提供任何异常安全保障。**代码永远不应该提供这个级别的保障！**

* 基本异常安全：指可以保证在*函数调用过程中*，以下几方面的安全：

  * 如果函数调用过程中发生异常，确保无资源泄漏
  * 调用过程中发生异常，所有不变式不变
  * 调用过程中发送异常，不会有数据和内存的损坏，并且所有的对象都是良好和一致的状态。但不能保证调用后数据不变

  一般来说这个级别是**默认的安全级别**，每一份代码都应当实现。

* 强异常安全：发送安全的情况下，数据内容需要恢复到函数调用前的状态，即需要回滚。

  这个类别的异常安全需要耗费开发者很多时间，除了在一些对异常严格要求的程序外，其他的不要求这一级别异常

* 保证不抛出异常：显然，最完美的异常就是没有异常。一般来说，以下函数和操作都必须达到这一级别：

  * 类的析构函数
  * Move操作
  * 默认构造函数
  * swap函数

如果没办法保证异常恢复，则发生异常后应该尽快退出以避免更大的损失。

# 面向对象

## 类设计原则

### 让类尽可能小

**类必须像函数一样尽可能小**。如果你的类很大，那么大概率需要解耦或搭建更多的抽象层次。

### 单一职责原则SRP

> 一个类应当有且只有一个职责

类和函数，应当只做一件事情。如果类做了多个事情，我们应当将其分解

### 开闭原则OCP

> 对拓展开放，对修改关闭

一般来说，支持这一原则的方式是使用继承。通过继承，我们可以在不改变父类的前提下拓展父类的功能。

### 里氏替换原则LSP

> 使用基类指针或基类引用的函数，必须在不知道派生类的情况下使用

这意味着**派生类必须能够完全替换基类**。LSP原则提出了以下规则：

* 基类的前置条件不能在派生类中增强
* 基类的后置条件不能在派生类中被削弱
* 基类的所有不变量，在派生类中都不能违反
* 历史约束：即派生类不能提供改变父类不可变量的API

这里书上给出了“矩形和方形”问题：

假设现在我们需要一些形状来帮助我们在屏幕上绘制图像：

![初代矩形UML](http://www.plantuml.com/plantuml/png/LO-n3e8m48RtFaN74kK5Y0EBYQDH4-T2BrmJe8Gxx82ykpqqAalRV6s__x-Is8uyTQsgMqkahsW7c9NUTU41js26u7ikph9cYHA6QBBPLiJZLFEI47e76xIeZ-i2DTk-QSMNw-WTenmGV8CiCk2ZQu2CBP9-holPilV5NLwR-4TEwpU3nQRAju34hkNruPddlsnLGk_IV2y0)

现在我们需要一个正方形。显然，数学告诉我们，正方形是特殊的矩形，所以我们的第一直觉是将正方形继承于矩形：

![加了正方形的UML](http://www.plantuml.com/plantuml/png/LO_1ZeCW48RlF0L7pAulO7OJBvliiQbDUaQP20c2bQ4UgEzU0QFr0fD_c6y-QeTyGZzeqcdk76qa7o4G-ZNO9zmi6wqoM5tYMQofatPcHU2jmybtkAoHL09EqK8srXKwvARNaLVIMGcKiP2WUeaH1lWdUd2CLol-cxRnAdBZ7b-p-IFvJsDCLYULNU1Ospmydo0S2vW6iqs5PF6R5P8gIJ-cFw-oF8J9NkL6Hf8QZF23VWC0)

这里正方形给出了不变式:`width=height`，并且提供了新的方法`setEdge()`来同时设置width和height。

但是这个显然不是一个好的方法。

首先我们仍然可以在Square中使用Rectangle的`setEdges`方法，这个时候，`setEdges`方法的两个参数就会导致迷惑性：对于一个正方形，为什么要设置两个边长度呢？对于`setWidth`，`setHeigh`方法同样如此。

那这个时候有人就说了：那我将`setEdges`,`setWidth`,`setHeight`方法变为virtual的，然后在Square中重写为不就行了：

```c++
void Square::setEdges(int a, int b){
  throw runtime_error("square can't set edges");
}
```

这显然是不好的设计，因为这种方法是“子类试图删除父类功能”的一种方法。违反历史约束。

最好的方法其实是不使用继承，而使用组合。（不要忘记：组合优先于继承）：

![最好的设计](http://www.plantuml.com/plantuml/png/TP2zJaGX48Lxdc9ADafXIzHiOs9fN1DBmruc5n8MLfZhBN3VNNvKTejj-3cPEUURsIPIaPQ3OvDJAS7Eg2Dc1ZU7y8LlWH-3zIHVwhafQZ9XvPkizedYCj6fICPgl91ExDVh5ITIVdRLJy1gDPdwC6XdGzKCwKdFcBYInVuMzl8l1UczLlFrJ7bkRTp82vH_W16x-rnKn3m2k4D_hGjoutheK0sUjHt0_RSGOuHpiGUmVe4GZwCC9Dp1H-nVP5lqkkps1m00)

Square类的所有方法都由Rectangle类代理（其实这里也使用了代理思想）。这就是利用里氏替换原则的例子。

### 接口隔离原则ISP

> 接口和接口之间应该互相隔离，类中不应该存在不应该包含的接口

书上的例子是鸟类的例子：

现在我们有这样一个设计：

![鸟的设计](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLd3AB4gfvbBGJikfrD2iJamgBYagJIwf1OgK9-Paemcb9fQWYPIKfwQYYjLoGKqEBaWiAielvmBPe61JewiB5t58pKi1kW00)

然后我们要加个企鹅类。但是要注意到企鹅虽然也属于鸟类，但是且不会飞。这个时候，`Bird`接口就存在多余的接口函数，我们需要将设计变为如下：

![新的鸟设计](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLl39J4kjvbBGBa_CoTRGh4vCAYufAaqkgGKAfIQMe8cKbAUceehLSa7DSSkfJ4pA0HkLbbE9NKrmGM9HKNuv5yXE1PiQNLsu24GtL11JMK1gNdffPXwNGsfU2j3f0000)

这就是接口隔离

### 依赖倒置原则DIP

> A.高级模块不应该依赖低级模块，两者都应该依赖于抽象
>
> B.抽象不应该依赖于细节，细节需要依赖于抽象

这里的“高级模块”指*需要其他模块提供功能的模块*，“低级模块”是*提供功能的模块*

一般来说，存在环依赖总是不好的。因为这会造成编译的不通过。但是我们可以通过依赖倒置来解决这个问题。

我们首先有这样的环依赖：

![环依赖](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLd2ivghbWhATm6n71LrTEmKdBYS56rrT1KSkXzIy5A1w0000)

我们可以通过给B增加一个接口来解决这个依赖：

![依赖导致](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLd2ivghbWhATmEpCl9BKehJ4v5G5vseWrr51LzTEmPdBIS56LrV1aSjPmQO6o73YSaZDIm6Q0m00)

这个时候，原来A对B的依赖变为了A对B父类的依赖。这就是依赖倒置。

我们还能做到更好的依赖倒置：

![更好的依赖倒置](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuKhEIImkLd2ivghbWhATmEpCl9BKehJ4v5G5v-fQ99uBaCVbgA2RavfMeckduCpbec2ZMvIPdb6Yg-34vQnWKwERab-U1-AuW3Yb1ReAZbmEgNafGDi0)

这完美地诠释了“细节依赖抽象”。

### 迪米特法则（不和陌生人说话）

> 一个类只能调用其邻居类对象的API，而不应该尝试调用离他较远的对象的API

比如，下面的例子就破坏了迪米特法则：

```c++
class A;

class B{
public:
  A& GetA(){ return a; }
  void OpOnA(){ a.op(); }
private:
  A a;
};

class C{
public:
  void OpOnA(){ b.GetA().op(); } //这一行违反了原则
private:
  B b;
};
```

B类的邻居是A，C的邻居是B。那么C就不应该直接使用A的对象，而应当通过B提供的方法去简介使用A对象。