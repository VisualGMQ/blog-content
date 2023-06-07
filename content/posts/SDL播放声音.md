---
title: SDL播放/录制声音
date: 2021-11-26 15:31:49
category:
- game development
tags:
- SDL2
---

本文介绍了如何在不使用SDL\_mixer的情况下，只使用SDL2进行声音的播放和录制。

<!--more-->

我在移植我的引擎到安卓平台的时候发现SDL\_mixer的CMake有问题，而且这个玩意经常整些bug。于是翻了翻SDL的wiki，百度了之后决定使用SDL2进行一个音频的播放。

## 播放音频的原理

SDL2播放音频的原理非常底层：首先需要打开一个音频设备，然后对这个设备写入音频数据就可以播放了。  

## 示例

在进行`SDL_Init(SDL_INIT_AUDIO)`初始化Audio模块后，我们首先载入一个WAV文件：

```c++
Uint8* soundData = nullptr;
Uint32 soundLen = 0;
SDL_AudioSpec soundSpec;

if (!SDL_LoadWAV("assets/pickup.wav", &soundSpec, &soundData, &soundLen)) {
    SDL_Log("wav load failed: %s", SDL_GetError());
}
```

SDL本身只能通过`SDL_LoadWAV`函数载入WAV格式文件。如果你想要加载Ogg可以使用[libvorbis](https://xiph.org/vorbis/)或者[stb\_vorbis](https://github.com/nothings/stb/blob/master/stb_vorbis.c)。其他的格式找对应的库就行了。  
读入之后我们获得了声音的数据`soundData`以及数据的大小`soundLen`，和音频的格式`soundSpec`。不要忘记`SDL_FreeWAV()`来释放`soundData`。

接下来我们打开一个音频输出设备。这里有两种方法：

### 使用`SDL_OpenAudio`打开

这是推荐的方法，这个方法的优点是不易用错，缺点是只能打开一个音频设备，如果你电脑上有多个音频设备你想要打开，可以使用`SDL_OpenAudioDevice`。  

```c++
if (SDL_OpenAudio(&soundSpec, nullptr) < 0) {
    SDL_Log("open audio deivce failed: %s", SDL_GetError());
}
```

第一个参数是我们希望的AudioSpec，第二个参数是它有的AudioSpec，是一个输出参数。我们这里不需要这个参数，直接给NULL。  
SDL会自己帮我们从soundSpec转换为设备的格式，所以不需要担心。  

在文件结束的时候不要忘记`SDL_CloseAudio()`关闭设备。

### 使用`SDL_OpenAudioDevice`打开

使用`SDL_OpenAudioDevice`的话，可以打卡多个音频设备。但是也会打开一些不存在的音频设备。在我的Mac电脑上就打开了不存在的音频设备，导致没办法输出声音。但是我看别人的视频确实是有成功的。  

这个函数原型如下：

```c++
SDL_AudioDeviceID SDL_OpenAudioDevice(
                          const char *device,
                          int iscapture,
                          const SDL_AudioSpec *desired,
                          SDL_AudioSpec *obtained,
                          int allowed_changes);
```

* `device`：要打开的设备的名字，为NULL就是打开一个默认的。
* `iscapture`：要打开的设备是否是录音设备。在SDL2.0.5及之后，SDL可以打开录音设备来录音。
* `desired`和`obtained`：和`SDL_OpenAudio()`的参数一样，一个是我们希望打开的设备格式，一个是设备真正的格式
* `allowed_changes`：是否允许改变设备的某些格式。一般直接给0表示不允许。

这个函数返回的是一个设备ID，如果ID < 0就是打开失败了。其实ID总是大于等于2的。  
使用这个方法打开设备后，后面所有对设备操作的函数都要加上`Device`，比如`SDL_CloseAudioDevice()`，`SDL_PauseAudioDevice()`等。
不要忘记使用`SDL_CloseAudioDevice(id)`来关闭。

### SDL\_AudioSpec

打开音频我们需要一个`SDL_AudioSpec`，这里我建议你直接传通过`SDL_LoadWAV`得到的spec，这样不需要进行音频的格式转换。  
不过我们这里还是看一下初始化它时需要填充的各个成员，以便于后面讲格式转换：

* `channels`：声道数
  * 1： 单声道
  * 2： 双声道（立体声）
  * 4： 四声道
  * 6： 5.1声道，是用于影院的那种。
* `format`：设备接收的音频数据的格式，这里`AUDIO_F32`是指32位浮点数格式
* `freq`：播放频率，即每秒送往音频设备的声音帧数。44100是CD频率，48000是DVD频率。不建议高于48000，这会造成更多的内存和CPU损耗。
* `samples`：音频采样帧中的音频缓冲区大小，**只能是2的倍数**，一般给个4096就行了。
* `callback`：回调函数，当音频设备没有音频播放的时候就会调用这个函数。我们可以在这个函数里面给他音频数据
* `userdata`：用户自定义数据。

### 在回调函数中写入音频数据

接下来我们要配置回调函数，让其在音频空闲的时候写入数据。为此，我们需要一个结构体来封装我们需要的音频数据信息：  

```c++
struct Sound {
    Uint8* data;    // 音频的数据
    Uint32 len;     // 数据的大小
    Uint32 curPos;  // 当前播放到的位置
};
```

然后配置AudioSpec的`userdata`:

```c++
Sound sound;
sound.data = soundData;
sound.len = soundLen;
sound.curPos = 0;
```

然后编写回调函数：

```c++
// 这里的stream就是音频设备的缓冲区了，要往里面写入音频数据。len是这个缓冲区的大小
void AudioCallback(void* userdata, Uint8* stream, int len) {
    Sound* sound = (Sound*)userdata;  // 得到我们的Sound结构体
    if (sound->data && sound->curPos < sound->len) {  // 当我们的音频数据存在，且没有播放完这个音频时进行播放
        SDL_memset(stream, 0, len);  // SDL要求首先设置为0
        int64_t remaning = sound->len - sound->curPos;  // 算一下剩下的音频长度
        if (remaning > len) {
            // 使用SDL_MixAudio对音频进行混合。这里因为我们只有一个音频，最后的参数就给SDL_MIX_MAXVOLUME来让此音频以最大声音播放。
            // 如果你有多个音频，需要对这个参数进行调整来确定不同音频的播放声音(0~128)
            SDL_MixAudio(stream, sound->data + sound->curPos, len, SDL_MIX_MAXVOLUME);
            sound->curPos += len;
        } else {
            SDL_MixAudio(stream, sound->data + sound->curPos, remaning, SDL_MIX_MAXVOLUME);
            sound->curPos += remaning;
        }
    }
}
```

这里我是让音频只播放一遍。你也可以选择让他循环播放。  

最后，我们要让音频设备开始工作：

```c++
SDL_PauseAudio(0);
```

这个函数参数如果是1则是暂停音频设备。

至此，所有的工作就完成了。然后你可以选择Delay个1.5秒来听听播放的声音。  

整个代码实例在[这里](/codes/testSDLAudio.cpp)

## 音频格式的转换

当你打开的音频设备的格式和你的音频文件格式不一样的时候，你需要进行音频格式的转换。  
SDL2新推出了`SDL_AudioStream`，而老的`SDL_AudioCVT`不再推荐使用。  
[这里](https://wiki.libsdl.org/Tutorials-AudioStream)有SDL的官方教程

这里就简单说一下吧。首先创建一个AudioStream：  

```c++
SDL_AudioStream* stream = SDL_NewAudioStream(soundSpec.format,
                                             soundSpec.channels,
                                             soundSpec.freq,

                                             audioSpec.format,
                                             audioSpec.channels,
                                             audioSpec.freq);
if (!stream) {
    SDL_Log("create audio stream failed: %s", SDL_GetError());
}
```

前三个参数是关于音频的各种格式，后三个是音频设备的各种格式。  

然后我们要把音频数据送给stream进行转换：

```c++
if (SDL_AudioStreamPut(stream, soundData, soundLen) < 0) {
    SDL_Log("resample sound failed: %s", SDL_GetError());
}
```

然后得到转换后的数据大小(字节为单位)：

```c++
int avali = SDL_AudioStreamAvailable(stream);
```

然后我们拿出数据：  

```c++
Uint8* cvtData = new Uint8[avali];

if (SDL_AudioStreamGet(stream, cvtData, avali) < 0) {
    SDL_Log("get converted audio failed: %s", SDL_GetError());
}
```

这样数据就拿出来了。如果你分多次放入数据，你必须多次拿出数据，因为每次使用`SDL_AudioStreamPut`时SDL会将你的数据大小记下来，等到拿出来时也只是给你这一块数据的转换结果。  

## 录制声音

原理和播放声音一样：打开录音设备，然后从设备中读取音频信息即可。  

打开录音设备要使用`SDL_OpenAudioDevice()`。

这里给个录音的回调函数作为例子：

```c++
struct Record {
    Uint8 buffer[1024 * 1024];
    Uint32 len;
};


void RecordCallback(void* userdata, Uint8* stream, int len) {
    Record* record = (Record*)userdata;
    memset(record->buffer, 0, sizeof(record->buffer));
    memcpy(record->buffer, stream, len);
    record->len = len;
}
```

然后你就可以对这个音频数据为所欲为了，比如传给播放设备播放出来，或者保存到本地等。
