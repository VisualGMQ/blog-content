---
title: vim利用ccls进行补全
date: 2020-7-3 19:02:09
category:
- vim
---

coc.vim的补全有三种lsp：clangd, ccls, cquery。这里说明如何使用ccls补全。

<!--more-->

# ccls的配置

ccls是lsp(language server Protocal)（语言补全协议）中的一个，用于补全C/C++

## 下载ccls

ccls的GitHub地址在[这里](https://github.com/MaskRay/ccls),你可以从源码下载并编译。

### MacOSX

Mac下使用brew可快速安装:
```bash
brew install ccls
```

## 配置ccls为补全插件

ccls官方提供了很多方法，这里我说明如何使在coc.nvim中进行补全。
打开VIM，输入`:CocConfig`后回车可打开coc的配置文件，然后输入:

```json
{
  "languageserver": {
    "ccls": {
      "command": "ccls",
      "filetypes": ["c", "cpp", "cuda", "objc", "objcpp"],
      "rootPatterns": [".ccls-root", "compile_commands.json"],
      "initializationOptions": {
        "cache": {
          "directory": ".ccls-cache"
        },
        "client": {
          "snippetSupport": true
        }
      }
    }
  }
}
```

即可配置完成。

## 一些快捷键

在函数或变量上按`shift+K`可以显示函数或变量的原型。

# 如何找到自定义头文件并补全

# 小程序的情况下使用.ccls

如果你的程序足够小，可以通过在工程根目录下编写`.ccls`文件来让ccls找到自己的头文件。
`.ccls`中的每一行都是一个编译指令:
```cpp
-Iinclude
-std=c++11
```
但是注意不能够在里面使用\`\`执行命令。

然后每次打开vim，ccls都会检车这个文件，并且根据这个文件进行补全配置。

## MacOS的特殊情况

在MacOS下，ccls没办法找到系统头文件，这个时候你必须自己编写`.ccls`文件，在文件中加入如下内容帮助ccls找到头文件:
```
-isystem
/usr/local/include
-isystem
/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include/c++/v1
-isystem
/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/lib/clang/10.0.1/include
-isystem
/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/include
-isystem
/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX10.14.sdk/usr/include
```

# 工程的情况下使用compile_commands.json

如果你使用的是大工程的话，可以考虑编写`compile_commands.json`文件：
```json
[
	{
	"arguments": ["c++", "-Iinclude", "-std=c++11", "main.cpp"],
	"file": "main.cpp"
	}
]
```
`arguments`通过将编译指令各个部分拆开称数组。`file`则指定了你要编译的文件。

但是每次都编写compile_commands.json也很烦，有一些工具可以帮助你自动生成。

## CMake

如果你使用的是CMake，可以加上构建选项`-DCMAKE_EXPORT_COMPILE_COMMANDS=YES`让cmkae自动生成。

## bear

bear工具可以帮助你生成，在MacOS上使用
`brew install bear`
安装之后即可使用。
bear可以根据多个构建工具来帮助你生成，如果你使用的是make，那么可以使用:
`bear make`来自动生成。

## 其他的构建工具

其他的构建工具见[这里](https://github.com/MaskRay/ccls/wiki/Project-Setup#compile_commandsjson)
