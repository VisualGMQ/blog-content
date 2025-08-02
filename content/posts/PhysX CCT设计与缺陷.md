---
title: "PhysX CCT设计与缺陷"
date: 2025-08-02T17:26:12+08:00
tags:
- Game Physics
- 源码阅读
category:
- Game Development
---

本文基于[PhysX5.5.0](https://github.com/NVIDIA-Omniverse/PhysX)源码分析（不过PhysX在这方面从4.0开始几乎没有什么改动）。讲述了[PhysX CharacterController](https://nvidia-omniverse.github.io/PhysX/physx/5.5.0/docs/CharacterControllers.html)的设计实现，以及其中存在的问题。

注：PhysX的CCT实现非常简陋（如果不是工作原因不建议看源码，有这时间不如去看看UE或者Jolt这种物理引擎的实现），而且存在很多问题。我是因为工作原因才要学习，没办法。

<!--more-->

## CCT是什么

CCT（CharacterConTroller）是角色控制器。一般用于控制玩家角色。使用纯粹的物理模拟会有很多的问题，比如如何让人物站在斜坡上，根据物理定律，需要摩擦力在静摩擦范围内物体才能停留在斜坡上。但不同的斜坡摩擦系数可能不相同，而在游戏开发时不太可能针对每个不同的斜坡调整玩家物理刚体的摩擦系数。同样，刚体模拟的底层算法可能会造成物体的抖动（比如Box2D使用的Sequential Impulse，是在刚体碰撞时使用冲量将物体推开，当物体从高处落到地面时，解算器其实是需要几帧的时间才能将物体推开，这时可能会带来几帧的物体抖动。虽然表面上看上去能够接受，但当制作第一人称游戏时，这种抖动会通过摄像机直接反馈给玩家，体验极差）。而且人物可能会做很多反物理的行为（比如蹬墙跳），这时使用纯粹的物理模拟会增大开发难度。

而CCT就是完全为角色量身定制的功能。CCT和游戏玩法强相关，虽然现代物理引擎基本上都会提供一个CCT功能，但大部分时候还是要根据游戏进行魔改或者完全重写。绝大部分的CCT不使用物理模拟，CCT本质上是一个几何形体（一般是胶囊体，立方体或者圆柱体），使用场景查询(SceneQuery)功能配合一些碰撞检测算法（用于在物体相交时进行挤出）实现。

通用CCT一般处理如下问题

1. MoveAndSlide：最核心的功能，分为两步：
   1. Move：对CCT进行移动
   2. Slide：移动过程中使用几何扫略（Sweep），如果碰到了物体到物体之后贴着物体移动（Slide）
2. 处理爬坡问题：可以爬坡，但太陡峭的坡爬不上去，或者站在上面会滑下来
3. 处理上楼梯问题：可以爬低矮的楼梯，但太高的楼梯无法爬上去
4. 处理移动平台问题：当人物站在移动平台上，应该要随着平台一起移动
5. 处理和其他CCT碰撞的问题：角色之间如果碰撞应该如何解决（直接穿过去还是阻挡等）
6. 处理和非CCT的动态物碰撞问题：比如角色被巨石挤开

## PhysX CCT原理与实现

PhysX CCT本身是一个不进行模拟的Kinematic刚体，实现总共分为三步：

1. 检测当前是否站在平台上，处理移动平台问题

2. 做爬坡和爬楼梯（以后统称为爬坡）

![PhysXCCT爬楼梯](/assets/PhysXCCT第一次MoveCharacter.png)

3. 如果爬坡梯失败，使用正常的MoveAndSlide：

![PhysXCCT爬楼梯](/assets/PhysXCCT第二次MoveCharacter.png)

我们这里只分析对胶囊体的移动（PhysX还支持立方体，但是情况比胶囊体简单所以不再分析）。

胶囊体移动的源码在

```cpp
// CctCharacterController.cpp
PxControllerCollisionFlags Controller::move(SweptVolume& volume, const PxVec3& originalDisp, PxF32 minDist, PxF32 elapsedTime, const PxControllerFilters& filters, const PxObstacleContext* obstacleContext, bool constrainedClimbingMode)
```

PhysX不是直接移动CCT所用的刚体，而是先构造一个`SweepTest`（里面存储着CCT形状和其他信息），对整个`SweepTest`做移动，最后再将位置同步回CCT刚体。

其主要流程为：

1. 使用`findTouchedObject`（以及后面`moveCharacter`中`DOWN_PASS`）找到现在站的移动平台，并且使用`rideOnTouchedObject`处理移动
2. 第一次`moveCharacter`处理爬坡
3. 如果第一次`moveCharacter`失败，将胶囊体回滚到最开始的位置，进行第二次`moveCharacter`走正常move and slide

### 处理移动平台问题

接触到的物体保存在`SweepTest::mTouchedActor`和`SweepTet::mTouchedShape`中。接触物体的位置保存在`SweepTest::mTouchedPosShape_World`和`SweepTet::mTouchedPosShape_Local`中。因为这是`move`的开头，所以此时保存的是上一次`move`的接触物体。

#### 检查接触物是否有效，以及找到新接触物

首先判断当前接触物体是否还生效：

1. 查看`mTouchedActor`和`mTouchedShape`是否还存在，以及`mTouchedShape`是否还在`mTouchedActor`上
2. 使用用户自定义的Filter过滤
3. 检查`mTouchedShape`是否还能进行场景查询（`PxShapeFlag::eSCENE_QUERY_SHAPE`）

如果经过检查发现失效，使用`findTouchedObject`获得当前的接触物体以及物体位置。

`findTouchedObject`只会检测动态物。方法是从胶囊体的中心向下打射线，长度为胶囊体半高。然后取得第一个打到的物体。

如果有`UserObstacle`，再对`UserObstacle`进行同样操作。

#### 进行移动平台操作

此时如果仍旧存在接触物，使用`rideOnTouchedObject`进行跟随接触物移动操作。很简单，就是把物体当前的位置和之前记录的位置差值加到`originalDisp`上。也就是说这一步并不真正的移动胶囊体，而是改变它的移动向量。

### moveCharacter

接下来要做`moveCharacter`。`moveCharacter`内部其实是个状态机，根据设置的状态，里面依次有至多五次的`doSweepTest`：

1. `UP_PASS`：当CCT需要向上移动时，做垂直向上的`doSweepTest`（其实是沿着CCT的`up_direction`）
2. `SIDE_PASS`：当CCT需要向前移动时，做向前的`doSweepTest`
3. `SENSOR_PASS`：当CCT的攀爬模式是`ConstarintClimbing`时，额外做一次向前的探测（但是不影响CCT位置）
4. `DOWN_PASS`：当CCT需要下落时，做向下的`doSweepTest`
5. `WALK_EXPERIMENT`：如果当前是`WALK_EXPRERIMENT`状态，做一次向上的恢复移动

其中1, 2, 3, 4会出现在爬坡的`moveCharacter`中。而4, 5会出现在第二次`moveCharacter`中

### doSweepTest

`doSweepTest`其实是做Move，然后看情况要不要Slide。它的步骤如下：

1. 使用`computeTemporalBox`得到胶囊体前向方向的扫略框，然后使用` updateTouchedGeoms`找到可能碰撞的物体

   ![沿着前进方向的包围盒](/assets/PhysXCCT前进方向包围盒.png)

2. 对扫略到的所有碰撞体进行Sweep查询。找到最近碰撞到的物体

3. 如果没有碰撞到物体，移动胶囊体到指定位置

4. 如果开启了`OverlapRecovery`，则将物体从重叠的物体中挤出（使用`computeMTD`得到最小分离向量，然后使用这个向量移动CCT。

5. 如果是`DOWN_PASS`，记录移动平台相关信息

6. 执行move and slide

#### doSweepTest缺陷

这里有一些问题需要注意：

`doSweepTest`的上述逻辑是套在一个while循环中：

```cpp
PxVec3 current_position = swept_volume.center
PxVec3 target_position = swept_volume.center
while (max_iter--) {
    找到附近的碰撞体
    if (!碰撞到物体) {
        current_position = target_position;
        break;
    }
    
    if (CCT和其他物体重合) {
        计算MTD并移动CCT
        retur true;
    }
    
    if (DOWN_PASS) {
	    记录移动平台相关信息   
    }
    
    if(sweepPass==SWEEP_PASS_DOWN && !stopSliding)
	{
        if(!NbCollisions)
            max_iter += 9;
	}
    
    if(C.mDistance>DynSkin) // (*1)
        add(current_position, currentDirection*(C.mDistance-DynSkin));

    执行move and slide，结果位置存在target_position中
}

swept_volume.center = current_position
```

如果`max_iter == 1`，那么CCT就只是移动，而不进行slide（如果没碰到物体走步骤3，如果碰到了走`(*1)`逻辑移动`currentPosition`）。

这里只有步骤4会直接设置CCT位置并返回。但是重叠恢复操作也不是很正确。执行此操作的前提是：

```cpp
if(mUserParams.mOverlapRecovery && C.mDistance==0.0f)
```

用户需要开启重叠恢复功能并且有物体重叠。而`C.mDistance == 0.0f`取决于步骤2中的碰撞体查询：

```cpp
if(!CollideGeoms(this, swept_volume, mGeomStream, currentPosition, currentDirection, C, !mUserParams.mOverlapRecovery))
{
    // no collision found => move to desired position
    currentPosition = targetOrientation;
    break;
}
```

在`CollideGeoms`中会找到碰撞到的物体，当某个物体和CCT重合时，会使用`shouldApplyRecoveryModule`函数检测此物体是否能被视为挤出物体。

然而`shouldApplyRecoveryModule`的逻辑却是这样的：

```cpp
static bool shouldApplyRecoveryModule(const PxRigidActor& rigidActor)
{
	const PxType type = rigidActor.getConcreteType();
	if(type==PxConcreteType::eRIGID_STATIC)
		return true;

	if(type!=PxConcreteType::eRIGID_DYNAMIC)
		return false;
	return static_cast<const PxRigidBody&>(rigidActor).getRigidBodyFlags() & PxRigidBodyFlag::eKINEMATIC;
}
```

只有在物体是Static或者Kinematic的时候才被视为可以挤出，对于任何动态物都不会做这个操作！这意味着CCT会和场景中的动态物穿过去！

<video src="/assets/PhysXCCT MTD失效.mp4" controls="controls"></video>

将这里的最后一行改为返回`true`就可以了：

<video src="/assets/PhysXCCT MTD生效.mp4" controls="controls"></video>



### 爬坡

了解了`doSweepTest`之后我们可以来看爬坡操作了![PhysXCCT爬楼梯](/assets/PhysXCCT第一次MoveCharacter.png)

爬坡操作是做三次`doSweepTest`。首先将CCT移动的向量`disp`按`up_direction`正交拆分成`normal_disp`和`side_disp`。`UP_PASS`和`DOWN_PASS`都只向`normal_disp`方向（或反方向）移动。`SIDE_PASS`和`SENSOR_PASS`会按照`side_disp`移动。

由于`doSweepTest`到底做不做Slide是受到`max_iter`影响的，所以这里我们要着重看这个量的值

1. 对于`UP_PASS`是这样的：

   ```cpp
   if(mUserParams.mPreventVerticalSlidingAgainstCeiling)
       maxIterUp = 1;
   else
       maxIterUp = isAlmostZero(SideVector) ? maxIter : 1;
   ```

   `PreventVerticalSlidingAgainstCeiling`的用法是如果头顶的天花板是斜的，那么不会被沿着天花板的斜面move and slide从而导致人物跳跃之后向前移动。

2. 对于`SIDE_PASS`是这样的：

   ```cpp
   const PxU32 maxIter = MAX_ITER;
   const PxU32 maxIterSides = maxIter;
   ```

   `MAX_ITER`是常量为10，也就是说`SIDE_PASS`一定会做move and slide

   `SENSOR_PASS`不改变CCT位置，暂时不讨论。

3. 对于`DOWN_PASS`是这样的：

   ```cpp
   const PxU32 maxIterDown = ((mFlags & STF_WALK_EXPERIMENT) && mUserParams.mNonWalkableMode==PxControllerNonWalkableMode::ePREVENT_CLIMBING_AND_FORCE_SLIDING) ? maxIter : 1;
   ```

   `STF_WALK_EXPERIMENT`只有在进入第二次`moveCharacter`时才会设置。`PREVENT_CLIMBING_AND_FORCE_SLIDING`是一个用于设置，用途是当CCT站在斜坡上时，强制让CCT下滑（这个后面会说）。

   这段逻辑是说在爬坡逻辑中永远为1，在第二次`moveCharacter`中如果你接受强制下滑操作，设为10做move and slide。

   但要注意到，在`doSweepTest`中也有影响`max_iter`的因素：

   ```cpp
   while (max_iter--) {
       // 其他操作
       
       if(sweepPass==SWEEP_PASS_DOWN && !stopSliding)
       {
           if(!NbCollisions)
               max_iter += 9;
       }
       
       // 其他操作
   }
   ```

   这里如果`stopSliding == false`也会强制下滑。这个`stopSliding`是当碰到物体（非UserBox和UserCapusle）时：

   ```cpp
   if(sweepPass!=SWEEP_PASS_SENSOR)
   {
       const PxU32 behaviorFlags = shapeHitCallback(userHitData, C, currentDirection, Length);
       stopSliding = (behaviorFlags & PxControllerBehaviorFlag::eCCT_SLIDE)==0;		// (*)
   }
   ```

   而`shapeHitCallback`则为：

   ```cpp
   PxU32 Cct::shapeHitCallback(const InternalCBData_OnHit* userData, const SweptContact& contact, const PxVec3& dir, float length)
   {
   	Controller* controller = static_cast<const PxInternalCBData_OnHit*>(userData)->controller;
   
       // 这些是当碰撞到物体时调用用户的回调函数进行report
   	PxControllerShapeHit hit;
   	fillCCTHit(hit, contact, dir, length, controller);
   
   	hit.shape			= const_cast<PxShape*>(reinterpret_cast<const PxShape*>(contact.mGeom->mTGUserData));
   	hit.actor			= const_cast<PxRigidActor*>(contact.mGeom->mActor);
   	hit.triangleIndex	= contact.mTriangleIndex;
   
   	if(controller->mReportCallback)
   		controller->mReportCallback->onShapeHit(hit);
   
       // 这里才是决定是否下滑的逻辑
   	PxControllerBehaviorCallback* behaviorCB = controller->mBehaviorCallback;
   	return behaviorCB ? behaviorCB->getBehaviorFlags(*hit.shape, *hit.actor) : defaultBehaviorFlags;
   }
   ```

   最后一行的`behaviorCB->getBehaviorFlags`是用户定义的CCT Behavior操作。默认是`stopSliding`的。

   也就是说，用户的行为会覆盖掉`ePREVENT_CLIMBING_AND_FORCE_SLIDING`设置（因为他会强制`max_iter += 9`从而move and slide）。

   #### 爬坡的结果存储

   如果爬坡失败。整个CCT会回到爬坡之前（也就是最开始的位置），然后做第二次`moveCharacter`。但是爬坡依旧记录了一些有用的信息。主要是`STF_XXX`标志位：

   * `STF_VALIDATE_TRIANGLE_SIDE`：做`SIDE_PASS`时碰到了物体

     ```cpp
     // doSweepTest的while循环中：
     if(sweepPass==SWEEP_PASS_SIDE || sweepPass==SWEEP_PASS_SENSOR)
     {
         if((touchedActor->getConcreteType() == PxConcreteType::eRIGID_STATIC) && (C.mInternalIndex!=PX_INVALID_U32))
         {
             // 如果碰到了物体，记录下信息
             mFlags |= STF_VALIDATE_TRIANGLE_SIDE;
             const PxTriangle& touchedTri = mWorldTriangles.getTriangle(C.mInternalIndex);
             touchedTri.normal(mContactNormalSidePass);
             if(mUserParams.mPreventVerticalSlidingAgainstCeiling && mContactNormalSidePass.dot(mUserParams.mUpDirection)<0.0f)
                 preventVerticalMotion = true;
         }
     }
     ```

   * `STF_VALIDATE_TRIANGLE_DOWN`：做`DOWN_SIDE`时碰到了物体

     ```cpp
     // doSweepTest的while循环中：
     if(sweepPass==SWEEP_PASS_DOWN)
     {
         mFlags &= ~(STF_TOUCH_OTHER_CCT|STF_TOUCH_OBSTACLE);
     
     #ifdef USE_CONTACT_NORMAL_FOR_SLOPE_TEST
         mFlags |= STF_VALIDATE_TRIANGLE_DOWN;
         mContactNormalDownPass = C.mWorldNormal;
     #else
     
         if((touchedActor->getConcreteType() == PxConcreteType::eRIGID_STATIC) && (C.mInternalIndex!=PX_INVALID_U32))
         {
             // 这里记录下DOWN_PASS时碰到的物体
             mFlags |= STF_VALIDATE_TRIANGLE_DOWN;
             const PxTriangle& touchedTri = mWorldTriangles.getTriangle(C.mInternalIndex);
             const PxVec3& upDirection = mUserParams.mUpDirection;
             const float dp0 = touchedTri.verts[0].dot(upDirection);
             const float dp1 = touchedTri.verts[1].dot(upDirection);
             const float dp2 = touchedTri.verts[2].dot(upDirection);
             float dpmin = dp0;
             dpmin = physx::intrinsics::selectMin(dpmin, dp1);
             dpmin = physx::intrinsics::selectMin(dpmin, dp2);
             float dpmax = dp0;
             dpmax = physx::intrinsics::selectMax(dpmax, dp1);
             dpmax = physx::intrinsics::selectMax(dpmax, dp2);
     
             PxExtendedVec3 cacheCenter;
             getCenter(mCacheBounds, cacheCenter);
             const float offset = upDirection.dot(toVec3(cacheCenter));
             mTouchedTriMin = dpmin + offset;
             mTouchedTriMax = dpmax + offset;
     
             touchedTri.normal(mContactNormalDownPass);
         }
     #endif
         touchedShapeOut = const_cast<PxShape*>(touchedShape);
         touchedActorOut = touchedActor;
         const PxTransform shapeTransform = getShapeGlobalPose(*touchedShape, *touchedActor);
         const PxVec3 worldPos = toVec3(C.mWorldPos);
         mTouchedPosShape_World = worldPos;
         mTouchedPosShape_Local = shapeTransform.transformInv(worldPos);
     }
     ```

   * `STF_TOUCH_OTHER_CCT`和`STF_TOUCH_OBSTACLE`：是否碰到了其他的CCT或用户自定义障碍物。也是在`DOWN_PASS`的时候：

     ```cpp
     // doSweepTest的while循环中：
     if(sweepPass==SWEEP_PASS_DOWN)
     {
         if(touchedObstacle)
         {
             mFlags |= STF_TOUCH_OBSTACLE;
     
             mTouchedObstacleHandle = touchedObstacleHandle;
             if(!gUseLocalSpace)
             {
                 mTouchedPos = toVec3(touchedObstacle->mPos);
             }
             else
             {
                 mTouchedPosObstacle_World = toVec3(C.mWorldPos);
                 mTouchedPosObstacle_Local = worldToLocal(*touchedObstacle, C.mWorldPos);
             }
         }
         else
         {
             mFlags |= STF_TOUCH_OTHER_CCT;
         }
     }
     ```

   
   ### 滑坡/无法上台阶
   
   在爬坡的`moveCharacter`中，做完`DOWN_PASS`之后会进行一次能否爬坡的检测：
   
   ```cpp
   if(doSweepTest(userData, userHitData, userObstacles, volume, DownVector, SideVector, maxIterDown, &NbCollisions, min_dist, filters, SWEEP_PASS_DOWN, touchedActor, touchedShape, contextID))
   {
       if(NbCollisions)
       {
           if(dir_dot_up<=0.0f)
               CollisionFlags |= PxControllerCollisionFlag::eCOLLISION_DOWN;
   
           // 站在CCT或者自定义障碍物上不算滑坡
           if(mUserParams.mHandleSlope && !(mFlags & (STF_TOUCH_OTHER_CCT|STF_TOUCH_OBSTACLE)))
           {
               // 如果SIDE_PASS碰到了物体，并且testSlope成功,说明无法爬坡
               // 注意testSlope的功能是检测是否不能爬坡。这里使用SIDE_PASS时碰到的面法向量做检测
               if((mFlags & STF_VALIDATE_TRIANGLE_SIDE) && testSlope(mContactNormalSidePass, upDirection, mUserParams.mSlopeLimit))
               {
                   // 然后检测是否能爬楼梯
                   if(constrainedClimbingMode && PxExtended(mContactPointHeight) > originalBottomPoint + PxExtended(stepOffset))
                   {
                       mFlags |= STF_HIT_NON_WALKABLE;
                       if(!(mFlags & STF_WALK_EXPERIMENT))
                           return CollisionFlags;
                   }
               }
           }
       }
   }
   ```
   
   注意点：
   
   1. `testSlope`的算法是使用碰撞的面法线和用户设置的能够爬坡斜率做判断。并且这里使用的是`mContactNormalSidePass`而不是`mContactNormalDownPass`（下文会解释）
   2. 如果坡和楼梯都上不去，设置`STF_HIT_NON_WALKABLE`标识碰到了无法行走的地方
   
   ### 第二次moveCharacter
   
   经过爬坡逻辑之后，如果发现碰到了无法走到的区域，回滚CCT位置，使用最开始的移动方向做move and slide：
   
   ```cpp
   if(mCctModule.mFlags & STF_HIT_NON_WALKABLE)
   {
       // STF_WALK_EXPERIMENT只有在第二次moveCharacter才会设置
       mCctModule.mFlags |= STF_WALK_EXPERIMENT;
       // 回滚CCT位置
       volume.mCenter = Backup;
   
       // 这个操作后面会说，是个有问题的操作
       PxVec3 xpDisp;
       if(mUserParams.mNonWalkableMode==PxControllerNonWalkableMode::ePREVENT_CLIMBING_AND_FORCE_SLIDING)
       {
           PxVec3 tangent_compo;
           decomposeVector(xpDisp, tangent_compo, disp, upDirection);
       }
       else xpDisp = disp;
   
       // 执行第二次moveCharacter
       collisionFlags = mCctModule.moveCharacter(&findGeomData, &userHitData, volume, xpDisp, userObstacles, minDist, filters, constrainedClimbingMode, standingOnMoving, touchedActor, touchedShape, getContextId());
   
       mCctModule.mFlags &= ~STF_WALK_EXPERIMENT;
   }
   ```
   
   先来看第二次`moveCharacter`做了什么。由于设置了`STF_WALK_EXPERIMENT`，导致内部逻辑变化了：
   
   1. 做`SIDE_PASS`
   2. 做`DOWN_PASS`
   3. 如果仍旧无法爬坡，做`WALK_EXPERIMENT`的`doSweepTest`（这个后面再解释）去解决一些问题
   
   #### WALK EXPERIMENT在做什么
   
   前面说过，`DOWN_PASS`后检测爬坡的方式是使用`mContactNormalSlidePass`，可能有人会问那如果`SIDE_PASS`时没碰到物体，`DOWN_PASS`时碰到了斜坡不是不会下滑了吗（因为爬坡检测通过了）。这就是`WALK_EXPERIMENT`做的事情。
   
   这个时候`WALK_EXPERIMENT`的`doSweepTest`强制把CCT往下移动，移动距离正是他移动前后的高度差：
   
   ```cpp
   // ==========[ WALK EXPERIMENT ]===========================
   mFlags |= STF_NORMALIZE_RESPONSE;
   
   const PxExtended tmp = dot(volume.mCenter, upDirection);
   // 这里算出Delta是 此时高度 - 初始高度（未做moveCharacter之前的高度）
   float Delta = tmp > originalHeight ? float(tmp - originalHeight) : 0.0f;
   Delta += fabsf(direction.dot(upDirection));
   float Recover = Delta;
   
   NbCollisions=0;
   const float MD = Recover < min_dist ? Recover/float(maxIter) : min_dist;
   
   PxVec3 RecoverPoint(0,0,0);
   
   // 向下移动
   RecoverPoint = -upDirection*Recover;
   
   if(doSweepTest(userData, userHitData, userObstacles, volume, RecoverPoint, SideVector, maxIter, &NbCollisions, MD, filters, SWEEP_PASS_UP, touchedActor, touchedShape, contextID))
   {
   }
   mFlags &= ~STF_NORMALIZE_RESPONSE;
   ```
   
   这样就解决了这个问题
   
   
   
   ## PhysX CCT缺陷
   
   ### 钻墙的缺陷
   
   首先，最显而易见的是钻矮墙会钻不过去。由于他是先做爬坡逻辑，而爬坡会将CCT向上移动再向前，这使得CCT在钻矮墙的时候可能被`SIDE_PASS`挡住从而钻不过去。即使CCT本身的高度并没有那么高。
   
   <video src="/assets/PhysXCCT钻矮墙问题.mp4" controls="controls"></video>
   
   
   ### PreventClimbing带来的问题
   
   首先是`PreventClimbing`和`PreventClimbingAndForceSliding`的缺陷。
   
   `PreventClimbing`会阻止CCT爬坡。但同时他也不会让CCT落下。于是CCT会一直停在坡上。这显然是不合逻辑的：
   
   <video src="/assets/PhysXCCT卡在墙上.mp4" controls="controls"></video>
   
   这里是因为用户自己没有设置下滑的逻辑：
   
   ```cpp
   if(sweepPass!=SWEEP_PASS_SENSOR)
   {
       // 这里shapeHitCallback内会调用用户的CCTBehavior回调。你没设置默认返回0，stopSliding就是true，会阻止下滑
       const PxU32 behaviorFlags = shapeHitCallback(userHitData, C, currentDirection, Length);
       stopSliding = (behaviorFlags & PxControllerBehaviorFlag::eCCT_SLIDE)==0;
   }
   ```
   
   只要设置上就可以了。

那么设置了`PreventClimbingAndForceSliding`呢？确实会滑下来。但是在滑下来的过程中你贴着墙按水平方向的移动是无效的。他会一直下滑直到落到可以站立的地方，这时你才能左右移动。因为在代码里把水平位移去掉了：

```cpp
// 在第一次moveCharacter之后，第二次moveCharacter之前
if(mCctModule.mFlags & STF_HIT_NON_WALKABLE)
{
    // A bit slow, but everything else I tried was less convincing...
    mCctModule.mFlags |= STF_WALK_EXPERIMENT;
    volume.mCenter = Backup;

    // 这里去掉了水平位移
    PxVec3 xpDisp;
    if(mUserParams.mNonWalkableMode==PxControllerNonWalkableMode::ePREVENT_CLIMBING_AND_FORCE_SLIDING)
    {
        PxVec3 tangent_compo;
        decomposeVector(xpDisp, tangent_compo, disp, upDirection);
    }
    else xpDisp = disp;

    collisionFlags = mCctModule.moveCharacter(&findGeomData, &userHitData, volume, xpDisp, userObstacles, minDist, filters, constrainedClimbingMode, standingOnMoving, touchedActor, touchedShape, getContextId());

    mCctModule.mFlags &= ~STF_WALK_EXPERIMENT;
}
```

就很离谱。只能说是PhysX的一种设计吧。

### 爬楼梯的缺陷

爬楼梯的计算可能有误，在`DOWN_PASS`之后判断爬楼梯的逻辑是：

```cpp
if(constrainedClimbingMode && PxExtended(mContactPointHeight) > originalBottomPoint + PxExtended(stepOffset))
```

注意这里是**用接触点的位置和stepOffset进行对比**。但我们用的是胶囊体不是圆柱体，这样可能导致误差：

![PhysXCCT爬楼梯缺陷](/assets/PhysXCCT爬楼梯缺陷.png)

这在圆柱体非常宽大的时候误差会很大。

## SENSOR_PASS在做什么

如果你指定了攀爬模式为`ConstraintClimbingMode`，PhysX会在`SIDE_PASS`未碰到物体时再做一次`SENSOR_PASS`。这是为了避免在移动距离很短的情况下，非常小物体一直阻挡着CCT移动：

![SENSOR_PASS用途](/assets/PhysXCCTSENSOR_PASS用途.png)

这里可能会判定到无法越过（如果StepOffset很小甚至为0的话）。

而这时通过`SENSOR_PASS`延长了横向的探测距离，在`DOWN_PASS`之后的爬坡检测就会通过，CCT就可以越过障碍物。
