---
title: KMP算法详解
date: 2020-07-05 17:34:36
category:
- 算法和数据结构
---

这里通俗易懂地一步一步理解KMP算法。

<!--more-->

# KMP算法

KMP算法是字符串匹配中必须掌握的快速匹配算法。给定一个字符串S1，和一个字符串S2，要求从S1中找到第一个匹配的S2的位置。即在S1中寻找字串S2第一次出现的位置。



算法的基本思想是这样的（这一部分可以观看[天勤的公开课](https://www.bilibili.com/video/BV1jb411V78H)，讲得很好）：

假设存在`ABBABBABABAAABABAAA`这个串S1，要求从中找到子串S2：`ABBABAABABAA`，首先将串和串对齐，从第一位开始寻找：

```text
p1
|
ABBABBABABAAABABAAA
ABBABAABABAA
|
p2
```

P1指针指向S1的开头，P2指向S2的开头，然后P1和P2逐个向后移动，直到发生不匹配的情况：

```text
     p1
     |
ABBABBABABAAABABAAA
ABBABAABABAA
     |
     p2
```

这个时候，按一般的方法是将P1回到第二个位置，P2回到S2首部，P1和P2对齐后继续下一次匹配：

```
 p1
 |
ABBABBABABAAABABAAA
 ABBABAABABAA
 |
 p2
```

但是KMP算法为了效率，不会这样简单地回溯。这里我们看一下P2指针之前的字符串：

```
ABBAB
```

KMP的核心思想就来了：KMP会在P2指针的前面的字符串中找到**相同的最长前缀和后缀**。

前缀是指在一个字符串中，从字符串开头到**除了字符串结尾**的所有字符串集合。也就是说，对于`ABBAB`，其前缀集合为$\{A, AB, ABB, ABBA\}$。

后缀是和前缀相对的概念，从字符串中间某个字符开始（不能是首字符），到字符串末尾的所有字符串的集合。对于`ABBAB`，后缀为$\{BBAB, BAB, AB, B\}$

然后KMP算法找出相同且最长的前缀和后缀，这里显然是`AB`。记录下其长度，长度为2。

然后将P2移动到S2头部后`公共前后缀长度`的地方即可。这里长度为2，所以需要从S2头部往后移动2位：

```
     p1
     |
ABBABBABABAAABABAAA
   ABBABAABABAA
     |
     p2
```

这样就不必回溯P1到第二位，P2到S2开头了。匹配效率大大增加。

然后继续匹配直到发生不匹配字符：

```
         p1
         |
ABBABBABABAAABABAAA
   ABBABAABABAA
         |
         p2
```

然后看P2前面的字符串`ABBABA`找到最长相等前后缀的长度，这里前后缀为`A`，长度为1，那么P2移动到距离S2开头1个长度的地方：

```
         p1
         |
ABBABBABABAAABABAAA
        ABBABAABABAA
         |
         p2
```

这个时候S2的末尾已经超出S1了，显然匹配失败。

如果没有失败，就一直按照这个方法进行下去，直到找到了字串或失败。

## 初版的KMP算法

现在再来回头看一下上面的方法，其核心思想如下：

假如现在遇到了不匹配字符串，记$l$为P2之前字符串的最长相同前后缀的长度，那么我们需要将P2移动到下标$l$处，即可开始新的匹配。

由于P2在任意位置时，P2之前的字符串（其实就是S2的前缀）的最长相同前后缀的长度是一定的，在比较时不会发生改变的，所以我们可以预先求出所有的长度，存放在数组里面。对于这里的S2，我们的数组元素为：

```
 A  B  B  A  B  A  A  B  A  B  A  A
-1  0  0  0  1  2  1  1  2  1  2  1
```

第一个元素之所以为-1，是因为如果第一个元素就不匹配，那么P2不应当回溯，而应当和P1一同向后移动一个字符，所以这里给出了一个特殊值（当然你也可以直接判断P2是否为0，但是不推荐这样做，因为下文有依赖于这个-1的算法）。

第二个元素恒为0，因为如果P2指向第二位就出错了，那显然P2只能回溯到0位置。你也可以理解“因为当P2=1时，P2前面的字符串只有一个字符，一个字符的字符串是没有前缀和后缀的，所以前缀后缀长度为0”。

这个数组我们暂时称为`dst`数组吧，dst意味着距离S2开头的距离。

那么这个时候我们就能写出KMP算法了，其实主要的难点就是求dst数组：

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

//求dst数组
void GetNextArr(const char* s, int* dst, int len){
    dst[0] = -1;
    dst[1] = 0;
    for(int i=2;i<len;i++){
        for(int j=0;j<i-1;j++){
            int comp1 = 0;
            int comp2 = i-j-1;
            for(;comp1<=j;comp1++,comp2++)
                if(s[comp1]!=s[comp2])
                    break;
            if(comp1==j+1)
                dst[i] = j+1;
        }
    }

    //输出dst数组,以方便人工确认
    for(int i=0;i<len;i++)
        printf("%3d", dst[i]);
    printf("\n");
}

int KMP(const char* s1, const char* s2){
    int p1 = 0, p2 = 0; 
    int len1 = strlen(s1),
        len2 = strlen(s2);
    
    int* dst = (int*)malloc(sizeof(int)*len2);

    //得到dst数组
    GetNextArr(s2, dst, len2);

    while(p2!=len2 && p1-p2+len2<=len1){   //当s2还未超出s1的长度时，进行匹配
        if(s1[p1]==s2[p2]){ //如果当前匹配的话，直接检查下一个字符
            p1++;
            p2++;
        }else{  //如果不匹配，移动p2或者p2 p1一起移动
            if(dst[p2]==-1){
                p2++;
                p1++;
            }else
                p2 = dst[p2];
        }
    }

    free(dst);

    //如果超出则匹配失败
    if(p1-p2+len2>len1)
        return -1;
    //否则返回匹配位置
    return p1-p2;
}


int main(int argc, char** argv){
    char buffer1[64] = {0};
    char buffer2[64] = {0};
    printf("input S1:");
    scanf("%s", buffer1);
    printf("input S2:");
    scanf("%s", buffer2);
    printf("result:%3d\n", KMP(buffer1, buffer2));
    return 0;
}
```

这样第一版本的KMP算法就完成了。

这里的dst数组在KMP中被称为next数组，意思是**S2应当向后移动"已匹配长度-next[P2]"个长度**。也就是说我们得到这个公式：
$$
P2 -= P2-next[P2]=next[P2]
$$
和我们上面思考的一样，所以也就不需要改动了。

但是教科书上一般将next数组的第一个元素下标记为1，这个时候代码可能就需要进行相应的改动。不过我在编写代码的时候实在是想不明白空一个next[0]出来是要干嘛，简直浪费空间。所以我这里就直接以next[0]为首元素存储了。

## 更加快速的计算next数组的方法

KMP算法的时间复杂度是`O(m+n)`，其中m是计算next数组的事件，也是S2的长度，而n则是S1的长度。n的来历很清楚：在匹配的过程中只用了一次i到n的循环。但是我们这里构造next数组的时间复杂度显然不止m，所以显然KMP算法中有更加好的计算next数组的方法。

为了理解更快的算法，我们再来看一遍next数组的生成：

```
comp1   p2
  |     |
  A  B  B  A  B  A  A  B  A  B  A  A
     |
   comp2
```

当P2=2时，comp1指针要和comp2指针进行比较，这个时候由于`s2[comp1]!=s2[comp2]`，所以`next[p2]=0`。

然后P2向后移动，comp2向后移动：

```
comp1      p2
  |        |
  A  B  B  A  B  A  A  B  A  B  A  A
        |
        comp2
```

这个时候本来要进行两次比较：

* 假设前缀和后缀的长度均为1：这个时候`comp1=0`,`comp2=2`，然后我们发现`s[comp1]!=s[comp2]`，所以这种情况否定。
* 假设前缀和后缀长度均为2：这种情况是不可能的，因为在`p2=2`时，我们就知道`s[0]!=s[1]`，所以这种情况其实可以直接跳过。

也就是说，这一轮我们直接比较`s2[comp1]`是否等于`s2[comp2]`即可。

然后P2向后移动，comp2向后移动：

```
comp1         p2
  |           |
  A  B  B  A  B  A  A  B  A  B  A  A
           |
         comp2
```

这个时候分三种情况：

* 假设前缀和后缀长度为1：这个时候`s2[comp1]==s2[comp2]`，所以`next[p2]=1`
* 假设前缀和后缀长度为2：不可能，因为如果长度为2，意味着我们需要比较`s2[0],s2[2]`，但是在`p2=3`时已经否定了这种情况。
* 假设前置和后缀长度为3：不可能，因为如果长度为3，一位置需要比较`s2[0],s2[1]`，这在`p2=2`是已经否定了。

然后P2向后移动，由于comp1比较成功了，所以向后移动，comp2向后移动：

```
   comp1         p2
     |           |
  A  B  B  A  B  A  A  B  A  B  A  A
              |
              comp2
```

这个时候由于我们已经知道`s2[comp1]==s2[comp2]`了，所以我们只需要判断`s2[comp1]?=s2[comp2]`即可。如果成功，我们可以得到长度为`next[p2-1]+1`。这里显然可以，所以`next[p2]=next[p2-1]+1`。

这里我们不需要判断前后缀长度为1的情况，因为前后缀长度为2的情况已经成立了。我们也不需要判断前后缀为3，4的情况，因为`p2=2`,`p2=3`时就已经帮我们否定掉了。

然后P2向后移动，comp1，comp2向后移动：

```
       comp1        p2
        |           |
  A  B  B  A  B  A  A  B  A  B  A  A
                 |
                 comp2
```

这个时候我们应当先判断`s2[comp1]?=s2[comp2]`，因为前后缀大于3的情况已经确定了，而如果前后缀长度为3的情况确定了，我们也就不用判断前后缀长度为2和1的情况了。

这里显然B和A不一样。那怎么办？这里KMP算法中提出了很精妙的思想，在这种情况下会执行这个代码：

```c
comp1 = next[comp1];
```

将comp1按照next值进行回溯。

这里的道理是这样：

其实比较前后缀的本质是字符串查找，即在`s2[1:p2-1]`（comp1当做指针）中找到`s2[0:n]`（comp2当做指针），使得n尽可能大。那么在匹配发生不了的时候怎么快速地进行下次匹配呢？显然KMP已经给了我们答案：让comp1根据next数组回溯。所以这里就有了这个代码。

所以整个过程就比较简单了：comp1和comp2持续地向后移动并比较。如果s2[comp1]和s2[comp2]不相等，则根据`next[conp1]`回溯comp1，再次进行比较。如果还不行，则再次回溯。

所以整个代码可以改成这样：

```c
void GetNextArr2(const char* s, int* next, int len){
    int comp1 = -1;
    int comp2 = 0;
    next[0] = -1;
    while(comp2<len-1){
        if(comp1==-1 || s[comp1]==s[comp2]){	//如果现在s[comp1]==s[comp2]，表示出现了最大值
            next[++comp2] = ++comp1;
        }else{
            comp1 = next[comp1];
        }
    }
}
```

这也是KMP中最让人摸不着头脑的代码。

## 最终版本的KMP

最后改进获得next数组的函数后，我们得到最终的代码：

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void GetNextArr(const char* s, int* next, int len){
    int comp1 = -1，comp2 = 0;
    next[0] = -1;
    while(comp2<len-1){
        if(comp1==-1 || s[comp1]==s[comp2])
            next[++comp2] = ++comp1;
        else
            comp1 = next[comp1];
    }
}

int KMP(const char* s1, const char* s2){
    int p1 = 0, p2 = 0;
    int len1 = strlen(s1),
        len2 = strlen(s2);

    int* dst = (int*)malloc(sizeof(int)*len2);

    //得到dst数组
    GetNextArr(s2, dst, len2);

    while(p2!=len2 && p1-p2+len2<=len1){   //当s2还未超出s1的长度时，进行匹配
        if(s1[p1]==s2[p2]){ //如果当前匹配的话，直接检查下一个字符
            p1++;
            p2++;
        }else{  //如果不匹配，移动p2
            if(dst[p2]==-1){
                p1++;
                p2++;
            }else
                p2 = dst[p2];
        }
    }

    free(dst);

    //如果超出则匹配失败
    if(p1-p2+len2>len1)
        return -1;
    //否则返回匹配位置
    return p1-p2;
}


int main(int argc, char** argv){
    char buffer1[64] = {0};
    char buffer2[64] = {0};
    printf("input S1:");
    scanf("%s", buffer1);
    printf("input S2:");
    scanf("%s", buffer2);
    printf("mathcing...\n");
    printf("result:%3d\n", KMP(buffer1, buffer2));
    return 0;
}
```

# 参考

[天勤公开课](https://www.bilibili.com/video/BV1jb411V78H)