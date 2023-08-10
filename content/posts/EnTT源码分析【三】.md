---
title: EnTT源码分析【三】：sparse set
date: 2023-08-10T10:35:16+08:00
tags:
- 源码阅读
- EnTT
category:
- game development
---

本文分析了开源项目[EnTT](https://github.com/skypjack/entt) v3.12.2的原理和实现。述说了ECS中的核心数据结构sparse set，以及在其上进行Entity支持的storage。

## sparse set

### 结构介绍

sparse set是一个数据结构，用于极快速地对**正整数**进行增删改查并能够较好地利用CPU Cache。而EnTT中的`Entity`部分正式用正整数实现的。

sparse set由两部分组成：

* `packed`：一个线性表，用于**紧密存储**所有正整数。也是真正保存所有数据的地方。
* `sparse`：一个线性表，比较稀疏，用于存储`packed`中整数在`packed`数组中的下标，主要是为了建立值和下标的映射以加快查找。

需要注意的是，`packed`和`sparse`必须是**内存连续**的线性表，这样才能发挥它易命中Cache的优势。

### 基本操作

#### 增加

增加元素的操作如下，对于任意正整数A

1. 将A**无条件**放在`packed`数组末尾
2. 得到A在`packed`数组中的下标I（其实就是`packed`数组的长度-1）
3. 将I放在`sparse`数组的，以A为下标的位置处

下面用一个例子说明：

```cpp
0. 一开始的sparse set:

packed: 空 
sparse: 空

现在要插入一个正整数3：
1. 将3放入packed最后

packed: 3
sparse: 空

2. 得到3在packed数组的下标，为0

3. 将0存入sparse[3]处：

packed: 3
sparse: _ _ _ 0
```

#### 查询

很简单：对于任意元素A，看`sparse[A]`处是否有值即可。

如果有值，还可以通过`sparse[A]`得到A元素在`packed`数组中的下标。

#### 删除

删除的话也很简单，对于任意元素A：

1. 通过`sparse[A]`得到A在`packed`中的下标I
2. 将`packed[A]` 和 `packed`最后一位互换，记`packed`最后一位元素为L
3. 更新L在`sparse`中的索引：`sparse[L] = I`
4. 置`sparse[A]`为空删除其索引
5. 弹出`packed`末尾元素（就是之前换到末尾去的A）

#### 迭代元素

`packed`数组中紧密存储着所有元素，所以直接迭代`packed`数组就行了（EnTT的迭代器`sparse_set_iterator`就是直接拿到`packed`数组的迭代器进行迭代）。

顺便说一句，sparse set是无序容器。

### 和HashMap的对比

sparse set的增删查复杂度都是O(1)，而HashMap也是。但HashMap的效率总体来说不如sparse set高。因为sparse set总能在确定步数内完成操作，而HashMap因为冲突的问题，可能需要多次使用散列函数，真正的步骤是不确定的。而如果使用拉链法解决冲突，则更会导致难以命中Cache的问题。

sparse set的缺点就是只能对正整数进行操作。

### 源码分析

源码位于`src/entity/sparse_set.hpp`中。

#### 分页的sparse数组

这个类是个模板类：

```cpp
template<typename Entity, typename Allocator>
class basic_sparse_set { ... };
```

`Entity`模板参数是EnTT中实体的类型。`Allocator`是内存分配器。

需要注意的是，`basic_sparse_set`的`sparse`数组不是一维数组，是二维的（用的时候其实还是视为一位数组，会将二维摊开成一维），差不多是`std::vector<Entity[PageSize]>`这个类型。本质上是将一位数组分为多个“页”(Page)，每个页大小就是`PageSize`最终的页大小在`src/entt/config/config.h`中有定义：

```cpp
#ifndef ENTT_SPARSE_PAGE
#    define ENTT_SPARSE_PAGE 4096
#endif
```

分页的原因应该是考虑到CPU的分页机制，当内存过大时方便CPU按照这个大小换页。也有可能是为了方便内存分配器`Allocator`一次分配这么多内存。

所以当你插入一个元素A的时候，他会把下标放在`sparse[A / PageSize][A % PageSize]`处。

#### 成员变量和一些using

成员变量和其using如下：

```cpp
template<typename Entity, typename Allocator>
class basic_sparse_set {
    using alloc_traits = std::allocator_traits<Allocator>;
    static_assert(std::is_same_v<typename alloc_traits::value_type, Entity>, "Invalid value type");
    using sparse_container_type = std::vector<typename alloc_traits::pointer, typename alloc_traits::template rebind_alloc<typename alloc_traits::pointer>>;
    using packed_container_type = std::vector<Entity, Allocator>;

    ...

private:
    sparse_container_type sparse;
    packed_container_type packed;
    const type_info *info;
    entity_type free_list;
    deletion_policy mode;
};
```

`sparse_container_type`和`packed_container_type`是`std::vector`这在意料之中，但是`sparse_container_type`的成员有些不明朗，是`Allocator`分配出的指针类型。这个类型在`src/entt/entity/fwd.hpp`中有说明：

```cpp
template<typename Entity = entity, typename = std::allocator<Entity>>
class basic_sparse_set;
```

就是使用的标准库的`allocator`，旨在分配一个`Entity`。但实际的`sparse_container_type`中则是分配的`alloc_traits::pointer`，即`Entity*`，并且使用`rebind_alloc`将此`allocator`重绑定以让其分配`Entity*`（对`std::allocator`不熟悉可以[看这个文章](https://zhuanlan.zhihu.com/p/185611161)）。

#### 某些函数简述

内部函数的话我觉得没什么好说的，毕竟算法已经说明白了，代码也就是实现的事。简单说一下我比较感兴趣的函数吧：

* `[[nodiscard]] auto sparse_ref(const Entity entt) const`：得到`sparse[entt / PageSize][entt % PageSize]`元素的引用
* `[[nodiscard]] auto sparse_ptr(const Entity entt) const`：得到`sparse[entt / PageSize][entt % PageSize]`元素的指针。没有这个元素返回`nullptr`
* `[[nodiscard]] auto &assure_at_least(const Entity entt)`：保证当前`sparse`数组可以容纳`entt`（会自动扩容），并返回容纳`entt`的那个元素。这个函数是个很好的辅助函数，因为你可以在任何插入`entt`的地方使用`assure_at_least(entt) = entt`插入entt倒`sparse`中，不需要进行很多if判断
* `template<typename Compare, typename Sort = std_sort, typename... Args>     void sort_n(const size_type length, Compare compare, Sort algo = Sort{}, Args &&...args)`：对开头的length个元素排序。EnTT是允许对sparse set排序的，这样遍历的时候会有一个顺序，在某些场景比较有用。