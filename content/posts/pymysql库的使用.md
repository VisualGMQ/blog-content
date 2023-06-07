---
title: pymysql库的使用
date: 2019-07-28 11:08:37
category:
- 杂项
---
pymysql是专门为了操控mysql而产生的库，属于外部库，需要安装:
```bash
pip3 install pymysql
```
***
假设我们现在有这样一个数据库：
![b195415e1272010cfc9907b69d76ece0.png](evernotecid://CC4AE303-7075-41F1-88CC-9FC46AD06331/appyinxiangcom/20164043/ENResource/p308)
这里我们就用test数据库为例，上面我们分别对test数据库使用了两条命令：
* SHOW TABLES;
* SELECT * FROM student;
接下来我们看看如何使用mysqldb来实现相同的事情。
***
**mysqldb的使用方法**
1. 连接到自己的数据库
连接到数据库的函数是connect，他会返回一个pymysql.connections.Connection对象：
```python
import mysqldb

db = pymysql.connnect(host="127.0.0.1",user="root",password="这里是我的密码，不给你看",database="test")
```
connect函数需要的参数想必都很明确了。其中database表示你要连接到的数据库，这里就是test了。
这是一个通用连接函数，如果你只想连接到本机的数据库，可以简化成这样：
```python
db = pymysql.connect("localhost","root","密码","test")
```
或者你也可以先连到mysql，然后再选择数据库。使用成员函数select_db()函数：
```python
db.select_db("test")
```

2. 获得游标
只有获得游标，我们才能操控数据库：
```python
cursor = db.cursor()
```

3. 通过游标执行各种sql命令
接下来就可以通过游标执行各种sql命令了。执行命令的函数为execute()：
```python
cursor.execute("SHOW TABLES")
```
注意在这里执行命令的时候不需要在字符串里面加;了。

4. 获得命令的返回值
你可以通过成员函数fetchall(),fetchone(),fetchmany(num)来获得返回的结果。比如我们想要获得student里面的所有字段：
```python
cursor.execute("SELECT * FROM student")
cursor.fetchall()
```
就得到：
![4c78acc78ee514e1994db117ca3e6342.png](evernotecid://CC4AE303-7075-41F1-88CC-9FC46AD06331/appyinxiangcom/20164043/ENResource/p309)
也即是说返回的字段会以元祖的形式返回。
你也可以使用fetchone()来获得第一条字段，或者使用fetchmany(num)获得前num条字段。
**值得注意的是：如果没有一次性拿出所有的字段，那么慢剩下的字段还会保留在cursor中。比如现在有4个字段，我使用了fetchmany(2)，那么后两条字段会留在cursor中，你可以再次使用fetch系列
函数来获取**
![2327959230be160aec77800af6f3da8f.png](evernotecid://CC4AE303-7075-41F1-88CC-9FC46AD06331/appyinxiangcom/20164043/ENResource/p310)

5. 改变数据库内容
有时候需要改变数据库的内容，首先想到的是使用cursor.execute函数：
```python
cursor.execute("INSERT INTO student(name,credit,info) VALUES('王骏龙','2017303138',NULL)")
```
但是数据库并不一定会立刻将数据插入进去，这个时候你需要使用db.commit()函数提交修改：
```python
db.commit()
```
这样就可以了。

6. 关闭数据库连接
当你不需要使用到数据库的时候，可以关闭连接：
```python
db.close()
```