---
title: Roguelike里的几种时间系统
date: 2021-08-14 17:19:59
tags:
- 算法
category:
- game development
---

这里介绍了传统Roguelike游戏开发中的几种处理时间消耗的算法。  
参考网站是[RogueBasin](http://roguebasin.com/index.php/Articles#Useful_algorithms_and_code)

<!-- more -->

# 时间消耗系统和算法

像Roguelike这种回合制游戏，生物每次行动都需要消耗一定量的时间，这样就必须有一个通过消耗时间确定生物行动顺序的系统。

## 简单的时间管理系统(elegant time management system)

这个系统很简单，需要一个循环链表：  

```c++
struct Entity {
    int Update() { /*.. your update ..*/ }  // 返回物体行动消耗的时间
    int speed;
    int action_points;
};

struct ETMSystem {
    std::list<Entity*> entities;    // 含有物体链表
};
```

因为是循环链表，我们得定义一个头节点，这里默认就在下标0处吧。  
然后这个算法的核心就是：每次看头结点的物体`action_points`是否大于0，如果大于0，就执行其`Update()`函数进行更新，并且将`action_points`减去消耗的时间。如果没有，就加上物体的`speed`，然后继续看下一个物体。
整个流程的代码大致如下：

```c++
struct ETMSystem {
    std::list<Entity*> entities;    // 含有物体链表

    void RegistEntity(Entity* entity) {
        entities.push_front(entity);  // 新增加的放在头部
    }

    void Tick() {  // 这个函数在游戏主循环中被调用，每帧调用过一次
        if (!entities.empty()) {
            auto& entity = entities.front();
            std::rotate(entities.begin(), ++entities.begin(), entities.end()); // 这里为了方便用rotate将所有元素循环左移了一位
            entity->action_points += entity->speed;
            if (entity->action_points > 0) {
                entity->action_points -= entity->Update();
            }
        }
    }
};
```

如果你想要给你的游戏加上动画，这里有一个锁机制可以帮助你：

```c++
struct ETMSystem {
    void RegistEntity();
    void Tick();

    void Lock() { lockNum++; }
    void Unlock() { lockNum--; }

    int lockNum = 0;
};

// 然后在调用Tick的时候判断，如果锁上了就不掉用Tick
if (etm.lockNum == 0) {
   etm.Tick(); 
}

/* 每一次动画开始时都需要Lock，然后动画播放完成就Unlock */
```

这种算法适合将Update函数写死在物体内的游戏。

## 基于优先队列的回合管理系统(a priority queue based turn scheduling system)

这个很简单，就是将事件推入到优先队列中，然后每次从队列中取出需要耗费时间的最短的事件去处理，并且将余下的所有事件的剩余时间全部减掉。  

```c++
struct Event {
    int costTime;
    int id;     // 为了辨别Event

    // 定义operator<，优先队列需要
    bool operator<(const Event& e) { return costTime < e.costTime; }
};

struct PriorityQueue {
    std::vector<Event> events;

    void Push(const Event& event) {
        int i = 0;
        while (i < events.size() && events[i + 1] > event) {
            i++;
        }

        events.insert(event, events.begin() + i);
    }

    Event Pop() {
        Event e = events[0];
        events.erase(events.begin());
        return e;
    }

    void DecCostTime(int time) {
        for (auto& e : events)
            e.coseTime -= time;
    }
};

struct TurnSchedule {
    PriorityQueue q;

    Event NextEvent() {
        Event e = q.Pop(); 
        q.DecCostTime(e.time);
        return event;
    }
};
```

这里STL的优先队列不能满足我们的需求，我就写了个简单的。在每次的游戏循环中，都需要调用`NextEvent()`函数获得Event并处理。  
这种算法适合基于事件或者命令机制的游戏。
