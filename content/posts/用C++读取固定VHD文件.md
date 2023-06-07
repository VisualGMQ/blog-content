---
title: 用C++读取固定VHD文件
date: 2019-12-11 18:29:12
category:
- 杂项
---
在学习《x86汇编语言-从实模式到保护模式》一书的时候，由于书上需要将编译后的代码写入到虚拟硬盘VHD文件中，而作者给出的又是Windows的写入程序，所以在这里我自己写了一个在Windows，Linux，Mac上都可以使用的，纯C++11的命令行工具。工具在[github上](https://github.com/VisualGMQ/Cpp/tree/master/VHDOperator)。这里分享一下编写时出现的坑和编写过程。

**注：这个工具只能将数据写入固定VHD文件中**
<!--more-->

# 固定VHD文件格式
既然要写文件，当然要先知道文件的格式了。这里我踩了第一个坑：在知网上找到一篇《VHD文件结构解析》，很可惜这个文章里面有错的。真正正确的格式请看[百度百科](https://baike.baidu.com/item/VHD%E7%BB%93%E6%9E%84/3904572?anchor=3)。

这里还是简单说一下固定VHD文件的格式：

![VHD格式](/images/VHD格式.png)

VHD是模拟磁盘的，所以其是通过一个扇区一个扇区划分的，每个扇区固定占512字节。最左边是0号扇区，号码向右递增。

VHD和其他文件不同，将其信息放在尾部，也就是最后一个扇区中。所以我们应当首先读取最后一个扇区的内容。而百度百科上说的也就是这个VHD尾部各种字段的大小和意义啦。

通过百度百科我们可以编写一下的结构体：
```c++
struct _FixedVHD_Field_Creator{
    uint8_t author[5];      /**< 创建者,   4字节 */
    uint16_t version[2];    /**< 应用版本, 4字节 */
    uint8_t system[5];      /**< 应用系统, 4字节 */
};//12字节

struct FixedVHD_Head{
    uint8_t identification[9];  /**< 开头的标识,8字节 */
    uint32_t feature;           /**< 特性,4字节 */
    uint16_t version[2];        /**< 版本,4字节 */
    uint64_t offset;            /**< 数据偏移 8字节 */
    uint32_t timestamp;         /**< 时间戳 4字节 */
    _FixedVHD_Field_Creator creator;    /**< 创建者字段 12字节 */
    uint64_t init_len;          /**< 初始长度，创建时的初始大小    8字节 */
    uint64_t fixed_len;         /**< 即时长度，VHD的长度         8字节 */
    uint32_t geomentry;         /**< 记录了C/H/S（磁道，磁头，扇区）信息 4字节 */
    uint32_t type;              /**< 类型                      4字节 */
    uint32_t crc;               /**< 校验和                    4字节 */
    uint8_t  uuid[16];          /**< 通用唯一识别码              16字节 */
    uint8_t saved;              /**< 是否在保存状态              1字节 */
    uint8_t hidden;             /**< VDI是否隐藏                1字节 */
    //uint8_t  reserv[427];     /**< 保留字段，全部为0         426字节 */
};
```
这里由于最后的426字节都是空，对我们来说没有任何意义，所以就不去读取了。

那么接下来就是逐个读取结构了。这里的第二个坑是**VHD是采用大段存储的**，但是C++是采用小端存储的，所以你在读取的时候得把字节反过来，而表示字符串的字节又不能反过来。所以我写了一些辅助函数来进行读取：

```c++
void ReadByte(ifstream& f, uint8_t& byte){
    f.read((char*)&byte, 1);
}

void ReadWord(ifstream& f, uint16_t& word){
    unsigned char tmp[2];
    f.read((char*)&tmp[1], 1);
    f.read((char*)&tmp[0], 1);
    memcpy(&word, tmp, 2);
}

void ReadDoubleWord(ifstream& f, uint32_t& doubleword){
    unsigned char tmp[4];
    for(int i=3;i>=0;i--)
        f.read((char*)&tmp[i], 1);
    memcpy(&doubleword, tmp, 4);
}

void ReadQuad(ifstream& f, uint64_t& quad){
    unsigned char tmp[8];
    for(int i=7;i>=0;i--)
        f.read((char*)&tmp[i], 1);
    memcpy(&quad, tmp, 8);
}

void ReadString(ifstream& f, uint8_t* str, int len){
    f.read((char*)str, len);
    str[len] = '\0';    //自动在末尾加\0防止输出乱码
}
```

然后就可以读写了：
```c++
void Open(string filename){
    ifstream file(filename);
    this->filepath = filename;
    char byte[4];
    char word[8];
    if(file.fail())
        failed = true;
    else
        failed = false;
    file.seekg(-512, ios::end);
    ReadString(file, head.identification, 8);
    ReadDoubleWord(file, head.feature);
    uint8_t tmp4[4];
    for(int i=3;i>=0;i--)
        file.read((char*)&tmp4[i], 1);
    memcpy(&head.version[0], tmp4, 2);
    memcpy(&head.version[1], &tmp4[2], 2);
    ReadQuad(file, head.offset);
    ReadDoubleWord(file, head.timestamp);
    ReadString(file, head.creator.author, 4);
    for(int i=3;i>=0;i--)
        file.read((char*)&tmp4[i], 1);
    memcpy(&head.creator.version[0], tmp4, 2);
    memcpy(&head.creator.version[1], &tmp4[2], 2);
    ReadString(file, head.creator.system, 4);
    ReadQuad(file, head.init_len);
    ReadQuad(file, head.fixed_len);
    ReadDoubleWord(file, head.geomentry);
    ReadDoubleWord(file, head.type);
    ReadDoubleWord(file, head.crc);
    uint8_t tmp16[16];
    for(int i=15;i>=0;i--)
        file.read((char*)&tmp16[i], 1);
    memcpy(head.uuid, tmp16, 16);
    ReadByte(file, head.saved);
    ReadByte(file, head.hidden);
    file.seekg(0, ios::end);

    //这里顺便得到了文件的大小
    totlesize = file.tellg();
    contentsize =  totlesize - 512;
    file.close();
}
```

这里就有人会问了：哎我只要把结构体声明好了，每一部分对应VHD结构中的每个字段，然后直接`file.read((char*)&head, 512)`不就行了，你干嘛要每个字段都手动读取，多累啊。
这样看上去可行但是实际上是不可行的。因为结构体的定义会遵守[内存对齐](https://www.zhihu.com/question/27862634)，导致其最终大小比看上去的要大。所以我们不能直接read 512字节。

# 写入固定VHD文件把

接下来就是写入固定VHD文件了。VHD文件规定读写需要针对磁道，也就是说你每次读写必须要在某个磁道的开头处，然后读取n个磁道（也就是n*512字节）。如果你的数据不够512的倍数VHD是不管的。所以我们在写入的时候需要将数据凑到512字节的倍数，多的补0:

```c++
bool Write(unsigned int start, void* data, int size, int contentsize){
//看看是不是试图写到超出文件外的部分
    if((size+start)*SECTION_SIZE>contentsize){
        cerr<<"Beyond the scope of VHD"<<endl;
        return false;
    }
    if(size<0){
        cerr<<"size most big than 0"<<endl;
        return false;
    }
    if(size==0)
        return false;
    //输出提示xin x
    cout<<"write "<<size<<" at "<<start<<endl;
    //这里也是一个坑，放在《C++小知识点，注意点》文章里面了。
    fstream file(filepath, ios::binary|ios::out|ios::in);
    file.seekp(start*SECTION_SIZE, ios::beg);
    char* buffer = nullptr;
    unsigned int final_size;
    //这里将大小凑齐512的倍数
    if(size%SECTION_SIZE!=0)
        final_size = (size/SECTION_SIZE+1)*SECTION_SIZE;
    else
        final_size = size;
    cout<<"final size:"<<final_size<<endl;
    buffer = new char[final_size];
    memset(buffer, 0, final_size);
    memcpy(buffer, data, size);
    file.write(buffer, final_size);
    file.close();
    delete buffer;
    return true;
}
```

这样我们就可以写入了。

整个程序我最后编写成了类，源代码放在github上了，需要的拿下来编译就可以了。

# 使用dd命令读取和写入

你也可以使用dd命令读取和写入vhd文件，比如将main.bin文件写入到test.vhd文件的第一个扇区中：

```bash
dd -if=main.bin -of=main.bin bs=512 count=1 conv=notrunc
```

`-if`指令代表要写入的文件，`-of`指令代表要写入的文件，`bs`代表依次写入多少字节，这里是一个扇区512字节，`count`代表写入多少个bs，这里是一个。最后的`conv=notrunc`代表不截断文件。如果你的VHD文件是虚拟VHD，那么根据其文件格式，文件尾会附加VHD的信息。使用notrunc可以不覆盖这个信息。