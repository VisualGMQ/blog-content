---
title: Python3-Pickle库
date: 2019-07-28 11:12:53
category:
- 杂项
---
这个库比较牛逼，他可以将python里面的对象或者内置类型保存为文件以便下一次使用。
具体可以保存什么对象呢，官方文档是这么写的：
>
> * None, True, and False
> * integers, floating point numbers, complex numbers
> * strings, bytes, bytearrays
> * tuples, lists, sets, and dictionaries containing only picklable objects
> * functions defined at the top level of a module (using def, not lambda)
> * built-in functions defined at the top level of a module
> * classes that are defined at the top level of a module
> * instances of such classes whose  __dict__ or the result of calling __getstate__() is picklable (see section Pickling Class Instances for details).

也就是None，True,False，所有的内置数据类型和list,tuple,dict，用户自己声明的类对象，内置函数声明都可以被保存。
<!--more-->
***
**pickle库的用法**
这个库的用法非常简单，只有四个函数需要掌握：
* pickle.dump(data,file,protocal=0)
  首先是dump函数，用于将data写入到file当中，且使用protocal协议。其中protocol协议可为0代表人类可以看得懂的编码方式，1位二进制。
* pickle.dumps(data,protocal=0)
  这个函数不会将data写入文件，而是返回其编码
* pickle.load(file)
  load函数可以从file中读入你保存的python对象并返回
* pickle.loads(databyte)
  同样，loads可以将databyte转换为python对象，是和dumps对应使用的。
  

其实以上四个函数可以划分为两个类别：将对象序列化的dump和dumps，以及将对象反序列化的load和loads。
***
接下来看一下实例：
```python
>>> import pickle
>>> dic={"A":100,"B":200,"C":300}
>>> dic
{'A': 100, 'B': 200, 'C': 300}
>>> f = open('test.txt','wb+')
>>> pickle.dump(dic,f)
>>> f.close()
```
这个时候test.txt文件内容如下：
![乱码](/images/luanma.png)
是一串乱码。

然后我们再读区这个文件，获得我们保存的对象：
```python
>>> f = open('test.txt','rb+')
>>> s = pickle.load(f)
>>> s
{'A': 100, 'B': 200, 'C': 300}
```
这样我们的对象就又回来了。

你也可以使用dumps和loads：
```python
>>> dic
{'A': 100, 'B': 200, 'C': 300}
>>> d = pickle.dumps(dic)
>>> d
b'\x80\x03}q\x00(X\x01\x00\x00\x00Aq\x01KdX\x01\x00\x00\x00Bq\x02K\xc8X\x01\x00\x00\x00Cq\x03M,\x01u.'
>>> s = pickle.loads(d)
>>> s
{'A': 100, 'B': 200, 'C': 300}
```
也就是不写入文件对对象进行序列化和反序列化。