# 拼音Web API服务

提供文字转拼音的web api接口。需python3环境运行。

依赖[HanLP](https://github.com/hankcs/HanLP)语言处理库。

我提供了一个[临时测试服务器](http://pinyin-test.haozgz.com/pinyin?txt=%E9%87%8D%E5%BA%86%E7%9D%80%E9%99%86OK%EF%BC%8C%E9%87%8D%E5%8A%9B%E7%9C%8B%E7%9D%80%E6%B2%A1%E6%9C%89%E5%BC%82%E5%B8%B8)，国内的但域名备案掉了走的海外线路，仅供测试，随时可能关闭。





# 运行方法

可以稳定运行在win7、win10、server 2012中，其他环境自测。

``` bat
:: 安装一个有效的版本
> conda create -n python364 python=3.6.4
:: 切换版本
> activate python364
:: 安装jpype1
> conda install -c conda-forge jpype1
:: 安装pyhanlp
> pip install pyhanlp
:: 执行一遍，会提示要下载哪些东西
> hanlp

:: 环境都搞定后就可以运行服务了
> python server.py
```



## 【1】安装Miniconda
conda版本随意，https://conda.io/miniconda.html


## 【2】安装pyhanlp
参考：https://github.com/hankcs/pyhanlp/wiki/Windows

这个库是java库，需要有java环境，如果没有装过，需要先安装java：[下载JDK](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)

测试发现python3.7.1 windows下ssl有问题无法安装，conda切换成python 3.6.4测试安装正常

安装好后运行一下hanlp命令，会提示下载，看第3步

如果出现`XXX.dll`什么的问题，可能是C++运行库缺失，安装`微软常用运行库合集`应该能够解决，我在`Windows Server 2012`上使用时出现此问题，装上就OJBK了。


## 【3】下载字典和jar
参考半自动配置： https://github.com/hankcs/pyhanlp/wiki/%E6%89%8B%E5%8A%A8%E9%85%8D%E7%BD%AE

字典和jar存放目录一般在Miniconda3[\envs\py36]\Lib\site-packages\pyhanlp\static

jar直接下载最新releases

字典最好直接clone仓库/data目录最新版本（用svn下载速度快很多，无需model数据），一样的在存储目录内放一个data文件夹，releases对bug处理稍微滞后一点。

另外需要修改hanlp.properties，给root赋值为当前目录完整路径。

svn: `https://github.com/hankcs/HanLP/trunk/data`


## 【4】运行
python server.py

## 【5】浏览器访问
`http://127.0.0.1:9527/pinyin?txt=要拼的文字`

`拼音。m` 返回结果 `{c:0,m:"",v:["pin","yin","F。","Fm"]}`，c=0时代表正常，其他代表出错，m为错误原因，拼音如果是字母符号会用F打头

