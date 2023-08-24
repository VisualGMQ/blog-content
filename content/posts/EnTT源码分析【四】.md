---
title: EnTT源码分析【四】：storage
date: 2023-08-24T10:35:16+08:00
tags:
- 源码阅读
- EnTT
category:
- game development
---

本文分析了开源项目[EnTT](https://github.com/skypjack/entt) v3.12.2的原理和实现。述说了ECS中的核心数据结构storage。

## storage

`storage`是在`sparse_set`上进行封装的类，主要用于将组件(component)和实体(entity)关联起来。

有两种`storage`，第一种是最通用的一种，用于关联实体和组件：

```cpp
//> src/entt/storage.hpp 235
template<typename Type, typename Entity, typename Allocator, typename>
class basic_storage: public basic_sparse_set<Entity, typename std::allocator_traits<Allocator>::template rebind_alloc<Entity>> { ... }
```

回忆一下`sparse set`的结构，存在一个`packed`数组和一个`sparse`数组。而`storage`则是在其上加了一个`payload`数组用于存储组件：

```cpp
storage:
payloads: _ _ _
packed  : _ _ _
sparse  : _ _ _
    
插入实体1和组件V:
payloads: V _ _
packed  : 1 _ _
sparse  : _ 0 _
```

插入的组件会放在和实体一样下标的`payloads`数组中。删除实体的时候也会一并删除。也就是说，相同下标的`payloads`和`packed`数组元素是一一对应的（组件和实体一一对应）。

理论上是这样，但为了更高效地分配/释放内存，`EnTT`还是使用了分页的机制去分配`payload`，也就是说会一次性分配一页（默认是1024个（在`src/entt/config/config.hpp 34`处的`ENTT_PACKED_PAGE`））。



第二种是用于纯粹存储实体的`storage`，使用偏特化实现：

```cpp
//> src/entt/storage.hpp 955
class basic_storage<Entity, Entity, Allocator>
    : public basic_sparse_set<Entity, Allocator> { ... }
```

里面的函数基本上都是`basic_sparse_set`的函数包装了一下，但是做了实体的复用操作。



其实还有一个偏特化，是用于“当组件为空类”的特殊情况的。这个时候并没有`payloads`数组（因为组件是空类，没必要实例化），主要是为了节省内存。这种实现对于tag类来说很有帮助：

```cpp
// 一个tag类，只是为了标记某个entity是玩家操控的而已
struct Player {};

registry.emplace<Player>(entity);

// 之后可在system中对含有Player类的entity进行特殊操作（比如按键响应等）
```

偏特化声明如下：

```cpp
//> src/entt/storage.hpp 780
template<typename Type, typename Entity, typename Allocator>
class basic_storage<Type, Entity, Allocator, std::enable_if_t<component_traits<Type>::page_size == 0u>>
```

注意到最后那个`component_traits<Type>::page_size == 0u`就是用来判断组件类型`Type`是否是空类。

## 细节实现

### component_traits

先看一下`component_traits`，这个东西会决定组件分配的页大小，所有的代码都在`src/entt/entity/component.hpp`下：

```cpp
template<typename Type, typename = void>
struct component_traits {
    static_assert(std::is_same_v<std::decay_t<Type>, Type>, "Unsupported type");

    /*! @brief Component type. */
    using type = Type;

    /*! @brief Pointer stability, default is `false`. */
    static constexpr bool in_place_delete = internal::in_place_delete<Type>::value;
    /*! @brief Page size, default is `ENTT_PACKED_PAGE` for non-empty types. */
    static constexpr std::size_t page_size = internal::page_size<Type>::value;
};
```

*   `type`：就是组件本身的类型

*   `in_place_delete`：是否可以就地删除，实现是:

    ```cpp
    template<typename Type, typename = void>
    struct in_place_delete: std::bool_constant<!(std::is_move_constructible_v<Type> && std::is_move_assignable_v<Type>)> {};
    ```

    主要是要求组件类型必须可以移动构造和移动赋值。

*   `page_size`：组件分配一页的大小。实现是：

    ```cpp
    template<typename Type, typename = void>
    struct page_size: std::integral_constant<std::size_t, !std::is_empty_v<ENTT_ETO_TYPE(Type)> * ENTT_PACKED_PAGE> {};
    
    template<>
    struct page_size<void>: std::integral_constant<std::size_t, 0u> {};
    
    template<typename Type>
    struct page_size<Type, std::enable_if_t<std::is_convertible_v<decltype(Type::page_size), std::size_t>>>
        : std::integral_constant<std::size_t, Type::page_size> {};
    ```

    对于任意非`void`类型，使用`!std::is_empty_v<ENTT_ETO_TYPE(Type)> * ENTT_PACKED_PAGE`得到一页的大小（其实就是如果`Type`是空类，那么大小为0，否则为`ENTT_PACKED_PAGE`）

    对于`void`类型直接为0（在第一个全特化版本中实现）

    最后一个使用SFINEA，当组件类型`Type`自己指定了页大小`Type::page_size`的时候，使用他的大小而不是默认的`ENTT_PACKED_PAGE`（当然`Type::page_size`要能转换为`size_t`）。

### 非空组件类型的stroage的内存分配实现

由于`storage`的算法原理和`sparse set`一样，只是加了个`payloads`数组，所以算法部分就不再重复。我们着重关注一下`EnTT`是如何高效利用内存的。

首先还是简单看一下类型声明：

```cpp
template<typename Type, typename Entity, typename Allocator, typename>
class basic_storage: public basic_sparse_set<Entity, typename std::allocator_traits<Allocator>::template rebind_alloc<Entity>> {
    using alloc_traits = std::allocator_traits<Allocator>;
    static_assert(std::is_same_v<typename alloc_traits::value_type, Type>, "Invalid value type");
    using container_type = std::vector<typename alloc_traits::pointer, typename alloc_traits::template rebind_alloc<typename alloc_traits::pointer>>;
    using underlying_type = basic_sparse_set<Entity, typename alloc_traits::template rebind_alloc<Entity>>;
    using underlying_iterator = typename underlying_type::basic_iterator;

    static constexpr bool is_pinned_type_v = !(std::is_move_constructible_v<Type> && std::is_move_assignable_v<Type>);
```

模板参数解释如下：

*   `Type`：组件类型
*   `Entity`：实体类型
*   `Allocator`：内存分配器
*   最后的`typename`指定的类型用于SFINEA，类里面并不会用到

`using`部分解释如下

*   `alloc_traits`：使用标准库的`allocator_traits`得到的内存分配器类型信息
*   `container_type`：`payloads`的类型，是一个`std::vector`，元素是一页组件类型（默认是1024个`Type*`）
*   `underlying_type`：其父类类型
*   `underlying_iterator`：其父类的迭代器类型
*   `is_pinned_type_v`：描述组件类是否是固定在内存中的类（即不可移动）

接下来看一下内存分配

首先要知道`traits_type`：

```cpp
//> src/entt/entity/storage.hpp 404    
using traits_type = component_traits<value_type>;
```

然后着重看一下`assure_at_least`，这个函数确保在创建组件的时候`payloads`数组能有足够空间容纳：

```cpp
//> src/entt/entity/storage.hpp 249
auto assure_at_least(const std::size_t pos) {
    const auto idx = pos / traits_type::page_size;

    if(!(idx < payload.size())) {
        auto curr = payload.size();
        allocator_type allocator{get_allocator()};
        payload.resize(idx + 1u, nullptr);

        ENTT_TRY {
            for(const auto last = payload.size(); curr < last; ++curr) {
                payload[curr] = alloc_traits::allocate(allocator, traits_type::page_size);
            }
        }
        ENTT_CATCH {
            payload.resize(curr);
            ENTT_THROW;
        }
    }

    return payload[idx] + fast_mod(pos, traits_type::page_size);
}
```

由于`payloads`内存的是一页，所以第三行先算一下页的下标。

然后第五行判断一下`payloads`内的页数是否够用，够的话21行直接算出页内元素然后返回（顺便说一句，页内元素类型是`Type*`也就是组件的指针类型）。

不够的话，6~8行对`payload`大小进行扩容，然后11~13行的`for`循环对扩容后的页进行内存分配。这里顺便说一下这里的`allocate`函数，第一个参数是内存分配器，第二个参数是要分配的个数。这里是分配一页的组件。

16~17行则是对异常的处理，如果内存分配抛出异常，则将`payload`回滚到之前的大小，并传递异常（很细节，在可能抛出异常的地方处理掉）。

这里我就顺便说一下`EnTT`对于异常的态度。几乎90%的函数都不能抛出异常（使用`noexcept`制约），如果能否抛出异常和用户实现有关（`EnTT`内有很多地方允许用户给入自定义的类型），会使用`type traits`进行约束（比如`noexcept(std::is_nothrow_constructable_v<T>)`这种）。剩下的就是自己内部设计中会抛出异常的地方，这种函数不会有`noexcept`修饰。这里强调的是使用`type traits`配合`noexcept`达到跟随用户类型异常状态而改变自身函数抛出异常状态的灵活设计。

然后看一下真正添加组件的地方：

```cpp
//> src/entt/entity/storage.hpp 271
template<typename... Args>
auto emplace_element(const Entity entt, const bool force_back, Args &&...args) {
    const auto it = base_type::try_emplace(entt, force_back);

    ENTT_TRY {
        auto elem = assure_at_least(static_cast<size_type>(it.index()));
        entt::uninitialized_construct_using_allocator(to_address(elem), get_allocator(), std::forward<Args>(args)...);
    }
    ENTT_CATCH {
        base_type::pop(it, it + 1u);
        ENTT_THROW;
    }

    return it;
}
```

这里第7行得到`elem`，然后第8行对这一块内存进行初始化（`Allocator`创建的内存是不会初始化的，这里会调用`Type`的构造函数进行初始化），简单看一下：

```cpp
template<typename Type, typename Allocator, typename... Args>
constexpr Type *uninitialized_construct_using_allocator(Type *value, const Allocator &allocator, Args &&...args) {
    return std::apply([value](auto &&...curr) { return new(value) Type(std::forward<decltype(curr)>(curr)...); }, internal::uses_allocator_construction<Type>::args(allocator, std::forward<Args>(args)...));
}
```

这里本质上是使用了emplacement new方法，在原有的内存上初始化类对象。EnTT在删除的时候也不是真的删除，而是调用类的析构函数，内存还是保留的。这样就增加了内存的复用率，减少了`new/delete`的开销。

### 存储Entity的Storage对Entity的复用

对于纯粹存储`Entity`的`storage`，他使用了对Entity的复用。因为`sparse set`中删除整数并不会使整数的值减少，`sparse`数组中的内存会越来越多：

```cpp
增加元素1
packed: 1
sparse: _ 0
    
增加元素2
packed: 1 2
sparse: _ 0 1

删除元素1
packed: 2
sparse: _ _ 0
 
增加元素3
packed: 2 3
sparse: _ _ 0 1
```

可以发现增加元素3之后，`sparse`的容量还是会增大，这和是否删除元素无关，只要元素以递增的方式插入进来，`sparse`就会无限增大。

之前我们说过`EnTT`中对实体的定义，实体是一个整数，被分为ID部分和版本号部分。复用的秘密就在这个版本号中。

`storage`有一个单独的`length`变量用于存储当前所有实体的个数（正在使用的+可复用的），整个复用流程如下：

```cpp
length = 0
packed:
sparse:

创建三次实体：
创建实体时，如果没有可复用实体，会将packed.size()的值作为实体插入。所以创建三次会插入0, 1, 2

length = 3
packed: 0 1 2
sparse: 0 1 2
    
删除 1
length = 2
packed: 0 2 1/1		这里的1/1代表ID为1，版本为1的实体。删除并不会真的删掉，而是将元素移动到 length-1 处并自增版本号，同时sparse也会更改
sparse: 0 2 1
    
创建新实体：
这时存在可复用实体，那么直接返回length处值即可
length = 3
packed: 0 2 1/1
sparse: 0 2 1
```

这里对的核心点在于，删除操作时会将删除的实体版本号+1然后移动到`length-1`处。在创建新实体时，会判断`length < packed.size()`，如果小于，说明存在复用实体，就直接`lenghth + 1`并返回`packed[length - 1]`就行。