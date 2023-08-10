---
title: EnTT源码分析【二】：Entity
date: 2023-08-10T10:35:16+08:00
tags:
- 源码阅读
- EnTT
category:
- game development
---

本文分析了开源项目[EnTT](https://github.com/skypjack/entt) v3.12.2的原理和实现。述说了ECS中的Entity部分。

## Entity

### Entity的本质

EnTT中的Entity是正整数，或者更严谨一点，是`enum class`：

```cpp
enum class entity : id_type {}; //> src/entt/entity/fwd.hpp
using id_type = ENTT_ID_TYPE;   //> src/entt/core/fwd.hpp

//> src/entt/config/config.h
#ifndef ENTT_ID_TYPE
#    include <cstdint>
#    define ENTT_ID_TYPE std::uint32_t
#endif
```

所以总的来说就是正整数类型的强枚举。

之所以使用强枚举是因为这样可以避免用户拿到Entity之后胡乱当做整数进行运算。每次操作Entity的时候其实都会将其强转到`id_type`的，本质上还是当整数去操作。

### entity traits

traits用于限制Entity的类型，并且定义一些字段：

```cpp
//> src/entt/entity/entity.hpp

namespace internal {

...

/*(1)*/
template<typename, typename = void>
struct entt_traits;

/*(2)*/
template<typename Type>
struct entt_traits<Type, std::enable_if_t<std::is_enum_v<Type>>>
    : entt_traits<std::underlying_type_t<Type>> {
    using value_type = Type;
};

/*(3)*/
template<typename Type>
struct entt_traits<Type, std::enable_if_t<std::is_class_v<Type>>>
    : entt_traits<typename Type::entity_type> {
    using value_type = Type;
};

/*(4)*/
template<>
struct entt_traits<std::uint32_t> {
    using value_type = std::uint32_t;

    using entity_type = std::uint32_t;
    using version_type = std::uint16_t;

    static constexpr entity_type entity_mask = 0xFFFFF;
    static constexpr entity_type version_mask = 0xFFF;
};

template<>
struct entt_traits<std::uint64_t> {
    using value_type = std::uint64_t;

    using entity_type = std::uint64_t;
    using version_type = std::uint32_t;

    static constexpr entity_type entity_mask = 0xFFFFFFFF;
    static constexpr entity_type version_mask = 0xFFFFFFFF;
};

...

}
```

EnTT中有很多类似这样的操作：首先`(1)`处声明一个模板，但是不实现它。等到后面对其进行特化。这样只有满足特化的模板参数才可以通过编译，其余的一律是不支持的模板参数，变相地限制了模板参数（C++20 concept我想你了555）。

`(2)`和`(3)`是在做如下事情：

* 如果`Type`是类，那它要求`Type`中有一个`entity_type`，并且这个`entity_type`也必须是类或枚举，然后将这个类型递归地进行萃取
* 如果`Type`是枚举，得到他对应的数字类型（EnTT中就是`id_type`是`uint32_t`）并且通过继承聚合此类型相关的信息

`(4)`处开始真正的Entity信息定义。这里通过全特化指定只有`uint32_t`和`uint64_t`能够有类型，其余的数字类型一律编译失败。

Entity由两部分组成：id部分和version部分。version部分主要是为了复用entity。

那么我们可以看到，Entity应该有如下信息：

* `value_type`：Entity真正的数字类型
* `entity_type`：id部分的类型
* `version_type`：version部分的类型
* `entity_mask`：id部分的掩码
* `version_mask`：version部分的掩码

比如对于`uint32_t`类型来说，其Entity组成如下：

|version|id|
|-|-|
|0000 0000 0001|000 0000 0000 0000 0001|

version在高位id在低位。

接下来的`basic_entt_traits`则通过组合的方式增加了一些对Entity的操作：

```cpp
template<typename Traits>
class basic_entt_traits {
static constexpr auto length = internal::popcount(Traits::entity_mask);
    /*(1)*/
    static_assert(Traits::entity_mask && ((typename Traits::entity_type{1} << length) == (Traits::entity_mask + 1)), "Invalid entity mask");
    static_assert((typename Traits::entity_type{1} << internal::popcount(Traits::version_mask)) == (Traits::version_mask + 1), "Invalid version mask");

public:
    using value_type = typename Traits::value_type;
    using entity_type = typename Traits::entity_type;
    using version_type = typename Traits::version_type;

    static constexpr entity_type entity_mask = Traits::entity_mask;
    static constexpr entity_type version_mask = Traits::version_mask;

    [[nodiscard]] static constexpr entity_type to_integral(const value_type value) noexcept { ... }

    [[nodiscard]] static constexpr entity_type to_entity(const value_type value) noexcept { ... }

    [[nodiscard]] static constexpr version_type to_version(const value_type value) noexcept { ... }

    ...
}
```

这里的模板参数`Traits`就是上面的`entt_traits`。然后类里面重新`using`了traits里的类型。

增加的一些操作也很好懂，在这里就不分析了，注释写的很详细。主要是得到Entity的版本号/ID号，通过版本号&ID好拼一个Entity，通过两个Entity拼一个Entity等等。

这里稍微看一下`(1)`处的两个`static_assert`，要求`entity_mask`和`version_mask`必须满足所有位全为1的条件。我也是第一次知道`static_assert`可以直接放在类里面。

最后，通过`entt`命名空间中的`entt_traits`继承`basic_entt_traits`得到最后的traits：

```cpp
template<typename Type>
struct entt_traits: basic_entt_traits<internal::entt_traits<Type>> {
    using base_type = basic_entt_traits<internal::entt_traits<Type>>;
    static constexpr std::size_t page_size = ENTT_SPARSE_PAGE;
};
```

并且在下面将`basic_entt_traits`的`static`函数封装成全局函数以便于调用。

小结一下：

1. 首先通过`entt_traits`进行类型萃取，要求Entity的类型必须是枚举，并且枚举的底层数字类型必须是`uint32_t`/`uint64_t`（但可通过增加全特化版本来扩展支持类型）
2. 然后通过`basic_entt_traits`在原本的信息上增加控制这些数据的函数
3. 最后使用全局函数封装`basic_entt_traits`以方便函数调用（`basic_entt_traits`需要一个`entt_traits`作为模板参数。`entt_traits`需要一个`Entity`作为模板参数。封装成全局函数可直接通过`Entity`模板参数调用函数）

### null和tombstone

`null`代表空，而`tombstone`代表“死了”，两者虽然实现非常相似，但不是一个东西（之后的文章会说用法）。

这里对`null`和`tombstone`的实现也很有意思，可以学习学习。这两者实现几乎一样，而且也非常地好懂：

```cpp
//> src/entt/entity/entity.hpp

struct null_t {
    template<typename Entity>
    [[nodiscard]] constexpr operator Entity() const noexcept {
        using traits_type = entt_traits<Entity>;
        constexpr auto value = traits_type::construct(traits_type::entity_mask, traits_type::version_mask);
        return value;
    }

    [[nodiscard]] constexpr bool operator==([[maybe_unused]] const null_t other) const noexcept {
        return true;
    }

    [[nodiscard]] constexpr bool operator!=([[maybe_unused]] const null_t other) const noexcept {
        return false;
    }

    template<typename Entity>
    [[nodiscard]] constexpr bool operator==(const Entity entity) const noexcept {
        using traits_type = entt_traits<Entity>;
        return traits_type::to_entity(entity) == traits_type::to_entity(*this);
    }

    template<typename Entity>
    [[nodiscard]] constexpr bool operator!=(const Entity entity) const noexcept {
        return !(entity == *this);
    }
};

template<typename Entity>
[[nodiscard]] constexpr bool operator==(const Entity entity, const null_t other) noexcept {
    return other.operator==(entity);
}

template<typename Entity>
[[nodiscard]] constexpr bool operator!=(const Entity entity, const null_t other) noexcept {
    return !(other == entity);
}
```

实现很简单。首先，这个类是一个空类。其次有如下三种函数：

* 隐式转换到`Entity`
* 和任意的`null_t`类型比较，总是为`true`
* 和`Entity`比较，只有特定情况（`Entity`所有位全是1）的时候为`true`，其他的全为false

真正的做到了0开销抽象原则。