---
title: Python3操纵压缩文件
date: 2019-07-28 11:10:35
category:
- 杂项
---
### tarfile库
***
tarfile库用于控制tar命令压缩的压缩文件，这里来看一下有哪些值得学习的函数：
* 首先是tarfile.open(path)，用于打开一个压缩文件：
```python
>>> import tarfile
>>> tar = tarfile.open('test.gz')
>>> tar
<tarfile.TarFile object at 0x102db5da0>
```
* 你可以用is_tarfile(filename)来确定一个文件是不是tar类型：
```python
>>> tarfile.is_tarfile('test.gz')
True
```
* 获得压缩文件里的信息
    可以使用getnames(),getmembers(),list等函数获得信息，具体的效果看下面：
```python
>>> tar.getnames()
['./._数码管.png', '数码管.png', './._四角按键.png', '四角按键.png', './._六脚自锁开关.jpg', '六脚自锁开关.jpg']
>>> tar.getmembers()
[<TarInfo './._数码管.png' at 0x102895f20>, <TarInfo '数码管.png' at 0x102e18048>, <TarInfo './._四角按键.png' at 0x102e18110>, <TarInfo '四角按键.png' at 0x102e181d8>, <TarInfo './._六脚自锁开关.jpg' at 0x102e182a0>, <TarInfo '六脚自锁开关.jpg' at 0x102e18368>]
>>> tar.list()
?rw-r--r-- visualgmq/staff        531 2018-10-31 19:52:00 ./._数码管.png 
?rw-r--r-- visualgmq/staff     180999 2018-10-31 19:52:00 数码管.png 
?rw-r--r-- visualgmq/staff        423 2018-10-30 17:27:12 ./._四角按键.png 
?rw-r--r-- visualgmq/staff      14592 2018-10-30 17:27:12 四角按键.png 
?rw-r--r-- visualgmq/staff        266 2018-10-30 17:35:38 ./._六脚自锁开关.jpg 
?rw-r--r-- visualgmq/staff       3436 2018-10-30 17:35:38 六脚自锁开关.jpg 
```
这里显示我的压缩文件里面有三个图片，分别是“数码管.png”，"六角自锁开关.jpg"和"四角按键.png"。

* 解压缩文件
    可以通过tarfile.extract()和tarfile.extarctall()来实现解压缩。前者是解压缩制定文件，后者会全部解压缩。你也可以给出解压缩的目的地。
```python
>>> tar.extractall()
```
这样的话文件会全部解药到当前路径下。

```python
>>> tar.extractall('图片')
```
这样会在当前路径下创建“图片”文件夹，然后解压到里面去。

```python
>>> tar.extract('四角按键.png')
```
这里制定了解压哪一个文件

```python
>>> tar.extract('四角按键.png','test')
```
这里制定了解压到哪一个文件夹中。

你也可以通过遍历tar来获得tarinfo:
```pythonm
for tarinfo in tar:
```
或者使用next方法来返回当前位置的下一个元素的tarinfo:
```python
>>> tarinfo = tar.next()
```
这里tarinfo是压缩包里面元素的信息，有下面的属性：
```python
>>> for tarinfo in tar:
...     print(tarinfo.name) #name属性
... 
./._数码管.png
数码管.png
./._四角按键.png
四角按键.png
./._六脚自锁开关.jpg
六脚自锁开关.jpg

>>> for tarinfo in tar:
...     print(tarinfo.size) #size属性
... 
531
180999
423
14592
266
3436

>>> for tarinfo in tar:
...     print(tarinfo.mtime) #最近一次的修改时间
... 
1540986720.5672143
1540986720.5672143
1540891632.1421418
1540891632.1421418
1540892138.9489677
1540892138.9489677

>>>for tarinfo in tar:
...     print(tarinfo.mode) #文件权限
... 

>>> for tarinfo in tar:
...     print(tarinfo.gid,tarinfo.uid) #Group ID & User ID
... 
20 501
20 501
20 501
20 501
20 501
20 501

>>> for tarinfo in tar:
...     print(tarinfo.uname,tarinfo.gname) #User name & Group name
... 
visualgmq staff
visualgmq staff
visualgmq staff
visualgmq staff
visualgmq staff
visualgmq staff
```
还有一些方法：
```python 
>>> for tarinfo in tar:
...     print(tarinfo.isfile(),tarinfo.isdir()) #是否是文件，是否是目录（其中isfile()可以被isreg()替换）
... 
True False
True False
True False
True False
True False
True False

>>> for tarinfo in tar:
...     print(tarinfo.issym(),tarinfo.islnk()) #是否是字符链接，是否是硬链接
... 
False False
False False
False False
False False
False False
False False

>>> for tarinfo in tar:
...     print(tarinfo.ischr(),tarinfo.isblk())  #是否是字符设备，是否是块设备
... 
False False
False False
False False
False False
False False
False False
```

最后用完了tar需要关闭：
```python
tar.close()
```
<br/>
你也可以创建自己的压缩包，在taropen的时候指定压缩方式即可：
```python
>>> tar = tarfile.open("test.gz",'w:gz') #可写的gz压缩格式
```
除了'gz'表示gzip格式外，还有bz2（bzip2格式），xz(lzma格式)。

然后可以使用add方法来添加文件啦:
```python
>>> tar.add('./test/数码管.png')
>>> tar.getnames()
['./test/数码管.png']
>>> tar.add('./test/四角按键.png')
>>> tar.getnames()
['./test/数码管.png', './test/四角按键.png']
```
你也可以使用addfile()来添加文件，不过这个函数的参数是tarinfo对象.
***
***
### zipfile库
zipfile库是用来对zip文件进行操作的库。
zipfile本身是没有open函数的，你必须声明zipfile对象才可以对zip文件进行操作：
```python
>>> zf = zipfile.ZipFile('test.zip','r')
>>> zf
<zipfile.ZipFile filename='test.zip' mode='r'>
```
这里如果省略第二个参数默认为r（只读）

<br/>
接下来看看有哪些可以获得信息的方法：
```python
>>> zf.namelist()
['单片机/数码管.png', '单片机/六脚自锁开关.jpg', '单片机/四角按键.png']
>>> zf.infolist()
[<ZipInfo filename='单片机/数码管.png' filemode='-rw-r--r--' file_size=180999>, <ZipInfo filename='单片机/六脚自锁开关.jpg' filemode='-rw-r--r--' file_size=3436>, <ZipInfo filename='单片机/四角按键.png' filemode='-rw-r--r--' file_size=14592>]
>>> zf.filename
'test.zip'
```
<br/>
抽取的方法和tarfile一样：
```python
>>> zf.extract('单片机/数码管.png')
'/Users/visualgmq/Desktop/单片机/数码管.png'
>>> zf.extractall()
```
zip文件还有一个特别的地方是可以设置解压密码，没有这个密码的话是无法操作和解压里面的内容的：
```python
>>> zf.setpassword(bytes("this is a zip",'ascii'))
```
这里setpassword只能够给入bytes作为密码，我们这里使用bytes的构造函数将string编程bytes。语法是bytes(data,encode_type)，其中encode_type表示以什么方式转码，这里转换成ascii码。

那么我们在抽取的时候就需要指定pwd参数来给出密码：
```pyton
zf.extractall(pwd='this is a zip')
```
<br/>
你还可以使用read函数来读取一个元素，返回其字节信息：
```python
>>> zf.read('单片机/六脚自锁开关.jpg')
b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x01*\x00\x00\x00\x98\x08\x02\x00\x00\x00\xdc-3\xb2\x00\x00\x00\x01sRGB\x00\xae\xce\x1c\xe9\x00\x00\x00\x04gAMA\x00\x00\xb1\x8f\x0b\xfca\x05\x00\x00\x00\tpHYs\x00\x00\x0e\......
```

或者使用write函数增加一个文件：
```python
>>> zf.write('test.png')
```
使用完之后要关闭：
```python
zf.close()
```
<br/>
和tarinfo一样，我们也有zipinfo。你可以通过两种方式来获得zipinfo：
```python
    >>> zf.infolist()  #返回所有元素的zipinfo
[<ZipInfo filename='单片机/数码管.png' filemode='-rw-r--r--' file_size=180999>, <ZipInfo filename='单片机/六脚自锁开关.jpg' filemode='-rw-r--r--' file_size=3436>, <ZipInfo filename='单片机/四角按键.png' filemode='-rw-r--r--' file_size=14592>]
>>> zf.getinfo('单片机/数码管.png')  #返回单个元素的zipinfo
<ZipInfo filename='单片机/数码管.png' filemode='-rw-r--r--' file_size=180999>
```
<br/>
那么我们来看看zipinfo有什么有用的属性；
```python
>>> info.filename  #元素名称
'单片机/数码管.png'
>>> info.date_time  #最后修改的时间
(2018, 10, 31, 19, 52, 0)
>>> info.compress_type  #压缩的方式
0  
>>> info.comment  #这个元素的注释
b''
>>> info.create_system  #是从那个系统创建的
3
>>> info.create_version #创建时zip的版本
20
>>> info.extract_version #抽取出来需要的最低zip版本
20
>>> info.CRC #CRC编码
2392735222
>>> info.compress_size #压缩之后的大小
180999
>>> info.file_size #压缩之前（原文件）大小
180999
```
还有一个is_dir()方法：
```python
>>> info.is_dir() #是不是目录
False
```
***
***
除了这两个库还有gzip,bz2,lzma三个库，但是有了这两个库基本上可以搞定所有问题了，就不再学习那三个库了。