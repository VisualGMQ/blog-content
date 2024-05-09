---
title: 【模板元编程和反射】：Ponder中的组织结构
date: 2023-11-11T09:42:16+08:00
tags:
- cpp
category:
- game development
---

本文述说了动态反射库[Ponder](https://github.com/billyquith/ponder)中的组织结构。

<!--more-->

## Value

所有的动态反射库中，总是有一种能够存储任意类型的类（用来对标`std::any`）。`meta`中就叫`any`，而`Ponder`中是`Value`。

这种`any`类最简单的实现通常包含两个数据：

```cpp
class any {
public:
    ...
private:
    void* data;			// 用于存储擦除了类型的数据
    TypeInfo typeinfo;  // 用于存储此数据对应的类型信息
};
```

而在`Ponder`中的实现则更加复杂：

```cpp
// include/ponder/value.hpp 72

class PONDER_API Value
{
public:
	... 一些操作函数，不是重点，忽略
        
    static const Value nothing;

private:
    typedef mapbox::util::variant<
                NoType, bool, long, double, ponder::String, EnumObject, UserObject
            > Variant;

    Variant m_value; // Stored value
    ValueKind m_type; // Ponder type of the value
};
```

`Variant`是对标`std::variant`的类型，存储了`Value`所有可能的类型

`ValueKind`则是一个枚举，用来告知`m_value`目前代表什么类型：

```cpp
// include/ponder/type.hpp 65
enum class ValueKind
{
    None,       ///< No type has been defined yet
    Boolean,    ///< Boolean type (`bool`)
    Integer,    ///< Integer types (`unsigned`,`signed` `char` `short` `int` `long`)
    Real,       ///< Real types (`float`, `double`)
    String,     ///< String types (`char*`, `ponder::String`)
    Enum,       ///< Enumerated types
    Array,      ///< Array types (`T[]`, `std::vector`, `std::list`)
    User        ///< User-defined classes
};
```

## 各种类型的定义

注意到`Value`中`Variant<...>`的模板参数，除了布尔，整数（统一用`long`存储），浮点数（统一用`double`存储）之外，还有三种自定义类型：

*   `ponder::String`：用于存储字符串类型，其具体类型由用户通过定义宏自己选择（`std::string`或`string_view`），具体实现见`include/ponder/detail/idtraits.hpp`。这里的`string_view`是作者自己实现的，因为`Ponder`的标准是`C++14`。
*   `EnumObject`：对枚举类型特化的类，用于存储枚举值
*   `UserObject`：对类类型特化的类，用于存储类对象

### EnumObject与Enum

`EnumObject`是很简单的结构，用于存储枚举值和其名称，可以获得其值和名称：

```cpp
// include/ponder/enumobject.hpp

class PONDER_API EnumObject
{
public:
	... 一些操作，不细说了

private:

    long m_value; /// 此枚举量的值
    const Enum* m_enum; ///< 此枚举值对应的枚举类型信息
};
```

`Enum`则是存储一个枚举类型信息的类，主要成员为：

```cpp
// include/ponder/enum.hpp

class PONDER_API Enum : public Type
{
    PONDER__NON_COPYABLE(Enum);		// 这个宏指定此类不可被拷贝，其实是禁用了类的拷贝&复制运算符
    
    typedef long EnumValue;  // 要存储的枚举值的类型
    
    
    ... 一些操作，不细说了
    
private:

    Enum(IdRef name);	// 构造函数，给入这个枚举类型的名称
    
    typedef detail::Dictionary<Id, IdRef, EnumValue> EnumTable;
    
    Id m_name;     ///< 枚举类型的名称
    EnumTable m_enums;      ///< 此枚举类型里面的枚举值们
};
```

所有的枚举值使用`EnumTable`存储，这是作者自己造的一个哈希表，文档中说对Cache更友好。里面存储着枚举值的名称（默认是字符串，也是可以通过宏更改）和枚举值。

### UserObject与Class

 `UserObject`的结构也很简单：

```cpp
// include/ponder/userobject.hpp

class PONDER_API UserObject
{
public:
    ...  一些接口，不细说了
        
private:

    friend class Property;

    // 将一个值设置给类的属性
    void set(const Property& property, const Value& value) const;
    
    UserObject(const Class* cls, detail::AbstractObjectHolder* h)
        :   m_class(cls)
        ,   m_holder(h)
    {}

    /// 类的类型信息
    const Class* m_class;
    
    /// 类对象的存储类
    std::shared_ptr<detail::AbstractObjectHolder> m_holder;
};
```

这里`Class`存储类的类型信息。`detaul::AbstractObjectHolder`则是抽象类，用于存储一个类对象。

`Class`的定义如下：

```cpp
// include/ponder/class.hpp

class PONDER_API Class : public Type
{    
    PONDER__NON_COPYABLE(Class);
    
    // Structure holding informations about a base metaclass
    struct BaseInfo
    {
        const Class* base;
        int offset;
    };
    
    // These are shared_ptr as the objects can be inherited. When this happens the
    // pointers are copied.
    typedef std::shared_ptr<Constructor> ConstructorPtr;
    typedef std::shared_ptr<Property> PropertyPtr;
    typedef std::shared_ptr<Function> FunctionPtr;
    
    typedef std::vector<BaseInfo> BaseList;
    typedef std::vector<ConstructorPtr> ConstructorList;
    typedef detail::Dictionary<Id, IdRef, PropertyPtr> PropertyTable;
    typedef detail::Dictionary<Id, IdRef, FunctionPtr> FunctionTable;
    typedef void (*Destructor)(const UserObject&, bool);
    typedef UserObject (*UserObjectCreator)(void*);
    
    std::size_t m_sizeof;           // Size of the class in bytes.
    Id m_id;                        // Name of the metaclass
    FunctionTable m_functions;      // Table of metafunctions indexed by ID
    PropertyTable m_properties;     // Table of metaproperties indexed by ID
    BaseList m_bases;               // List of base metaclasses
    ConstructorList m_constructors; // List of metaconstructors
    Destructor m_destructor;        // Destructor (function able to delete an abstract object)
    UserObjectCreator m_userObjectCreator; // Convert pointer of class instance to UserObject

    ... 一些操作，不细说了
};
```

`Class`中存储着：

* `m_sizeof`：此类的大小
* `m_id`：此类的ID（一般是字符串，也就是此类的名称）
* `m_functions`：此类中的函数，使用作者自制的哈希表存储
* `m_properties`：此类中的成员变量，使用作者自制的哈希表存储
* `m_bases`：父类信息
* `m_constructors`：构造函数信息
* `m_destructor`：析构函数信息
* `m_userObjectCreator`：<TODO>

#### Property信息

`Property`是存储类中成员变量信息的类：

```cpp
class PONDER_API Property : public Type
{
    PONDER__NON_COPYABLE(Property);
public:

    virtual ~Property();

    IdReturn name() const;

    ValueKind kind() const;

    virtual bool isReadable() const;

    virtual bool isWritable() const;

    Value get(const UserObject& object) const;

    void set(const UserObject& object, const Value& value) const;

    virtual void accept(ClassVisitor& visitor) const;

protected:

    template <typename T> friend class ClassBuilder;
    friend class UserObject;

    Property(IdRef name, ValueKind type);

    virtual Value getValue(const UserObject& object) const = 0;

    virtual void setValue(const UserObject& object, const Value& value) const = 0;
    
private:

    Id m_name; // Name of the property
    ValueKind m_type; // Type of the property
};
```

存储的是成员变量的名称和类型。我特意将`set()`和`get()`函数的声明留下，这说明这个类是可以设置/获得成员变量值的类型的。但是他本身是没有存储变量名称的，所以有一些函数

