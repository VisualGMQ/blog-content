---
title: C/C++不定参数注意事项
date: 2020-6-3 19:02:09
category:
- language
tags:
- cpp
- c
---

这里主要说明的是使用`va_arg`,`va_start`,`va_end`宏得到的不定参数。

主要坑爹的地方在于，`va_arg`这个宏的第二个参数——取出的数值类型，必须是int或者double，而不能是float，char等。如果你在调用函数的时候，char，unsigned char等实数会转化为int，而float会转化为double：

```c++
template <int num>
real min(double a, ...){
	va_list args;
	real min = a;
	va_start(args, a);
	for(int i=0;i<num-1;i++){
		double value = va_arg(args, double);
		min = value<min?value:min;
	}
	va_end(args);
	return min;
}
```

这里如果第7行改成`va_args(args, float)`会得到乱七八糟的数据。



还有一个坑爹的地方在于，如果你的参数像上面一样使用的是double，那么：

```c++
min<3>(2, 3, 5);
```

这种调用是错的，你必须明确指出你给的参数是浮点数（只需要至少给出一个即可）:

```c++
min<3>(2.0f, 3, 5);
```