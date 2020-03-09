# :open_book:省市区数据采集并标注拼音、坐标和边界范围

[在线测试和预览（转换成JSON）](https://xiangyuecn.github.io/AreaCity-JsSpider-StatsGov/)；当前最新版为 **src文件夹** 内的数据，此数据发布于`统计局2020-02-25`、`民政部2020-03-06`、`腾讯地图行政区划2020-02-20`、`高德地图行政区划采集当天`。


<p align="center"><a href="https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov"><img width="100" src="https://gitee.com/xiangyuecn/AreaCity-JsSpider-StatsGov/raw/master/assets/icon.png" alt="AreaCity logo"></a></p>

<p align="center">
  <a title="Stars" href="https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov"><img src="https://img.shields.io/github/stars/xiangyuecn/AreaCity-JsSpider-StatsGov?color=15822e&logo=github" alt="Stars"></a>
  <a title="Forks" href="https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov"><img src="https://img.shields.io/github/forks/xiangyuecn/AreaCity-JsSpider-StatsGov?color=15822e&logo=github" alt="Forks"></a>
  <a title="Releases Downloads" href="https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/releases"><img src="https://img.shields.io/github/downloads/xiangyuecn/AreaCity-JsSpider-StatsGov/total?color=15822e&logo=github" alt="Releases Downloads"></a>
  <a title="Version" href="https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/releases"><img src="https://img.shields.io/github/v/release/xiangyuecn/AreaCity-JsSpider-StatsGov?color=f60&label=version&logo=github" alt="Version"></a>
  <a title="License" href="https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/blob/master/LICENSE"><img src="https://img.shields.io/github/license/xiangyuecn/AreaCity-JsSpider-StatsGov?color=f60&logo=github" alt="License"></a>
</p>


在[Releases](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/releases)中下载最新发布数据文件；如果下载缓慢可以[点此处](https://xiangyuecn.github.io/AreaCity-JsSpider-StatsGov/assets/download.html)通过GitHub Pages外链来下载；也可直接打开 `src/采集到的数据` 文件夹内的文件来使用：
- [/src/采集到的数据/ok_data_level3.csv](src/采集到的数据/ok_data_level3.csv) : 省市区3级数据(可以预览)。
- [/src/采集到的数据/ok_data_level4.csv](src/采集到的数据/ok_data_level4.csv) : 省市区镇4级数据(3M+大小GitHub不能预览)。
- [/src/采集到的数据/ok_geo.csv.7z](src/采集到的数据/ok_geo.csv.7z) : 为省市区3级的坐标和行政区域边界范围数据，csv格式，解压后130M+。

> csv格式非常方便解析成其他格式，算是比较通用；如果在使用csv文件过程中出现乱码、错乱等情况，需自行调对utf-8（带BOM）编码（或者使用文本编辑器 `如 notepad++` 把文件转成需要的编码），文本限定符为`"`。
> 
> csv文件导入数据库如果接触的比较多应该能很快能完成导入，城市数据参考[导入教程](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/blob/master/src/3_%E6%A0%BC%E5%BC%8F%E5%8C%96.js)、坐标和边界参考[导入教程](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/blob/master/src/%E5%9D%90%E6%A0%87%E5%92%8C%E8%BE%B9%E7%95%8C/map_geo_%E6%A0%BC%E5%BC%8F%E5%8C%96.js) ，教程在代码开头注释中，是SQL Server的导入流程和SQL语句。

**温馨建议：不要在没有动态更新机制的情况下把数据嵌入到Android、IOS、等安装包内；缓存数据应定期从服务器拉取更新**

注：本库最高采集省市区镇4级数据、省市区3级边界范围，如果需要街道5级数据、或者更高精度的边界范围，请参考底下的`其他资源`。


## 数据源

- [国家统计局](http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/) ：统计用区划和城乡划分代码，此数据比较齐全但是比较杂，并且数据是一年一更可能会存在滞后，需额外移除和处理开发区、经济区、高新区、国家级新区等区域；此数据源为省市区三级数据的主要数据源，镇级辅助数据源。

- [民政部](http://www.mca.gov.cn/article/sj/xzqh/) ：行政区划代码，提供省市区三级数据，一月一更；为辅助数据源。

- [腾讯地图行政区划](https://lbs.qq.com/webservice_v1/guide-region.html)：提供省市区镇四级数据，更新比较频繁；为镇级主要数据源，省市区三级辅助数据源。

- [高德地图行政区域](https://lbs.amap.com/api/webservice/guide/api/district)：提供省市区镇数据，实际采用前三级，更新比较频繁但具体时间未知；为辅助数据源。

- [高德地图坐标和行政区域边界范围](https://lbs.amap.com/api/javascript-api/example/district-search/draw-district-boundaries)：当城市数据有变化时，主动从高德查询坐标和边界信息。


## 采集环境

chrome 控制台，`Chrome 41`这版本蛮好，win7能用，`Chrome 46`这版本win10能用；新版本`Chrome 72+`乱码（统计局内页编码为`gb2312`，新版本`xhr`对编码反而支持的超级不友好，估计是印度阿三干的）、SwitchyOmega代理没有效果、各种问题（[简单制作chrome便携版实现多版本共存](https://github.com/xiangyuecn/Docs/blob/master/Other/%E8%87%AA%E5%B7%B1%E5%88%B6%E4%BD%9Cchrome%E4%BE%BF%E6%90%BA%E7%89%88%E5%AE%9E%E7%8E%B0%E5%A4%9A%E7%89%88%E6%9C%AC%E5%85%B1%E5%AD%98.md)）。

乱码的根本原因在于统计局服务器响应的内容编码为`gb2312`，但服务器响应头只给了`Content-Type: text/html`，因此可用Fiddler篡改`Content-Type`响应头为`Content-Type: text/html; charset=gb2312`也可解决新版Chrome乱码问题。


## 采集深度

- 2019.200306.0220版(2020)采集了4层，省、市、区、镇，来源：[统计局2019版数据](http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2019/index.html)；省市区3级合并了[民政部2020-03-06数据](http://www.mca.gov.cn/article/sj/xzqh/2020/2020/202003061536.html)、[高德地图行政区域](https://lbs.amap.com/api/webservice/guide/api/district)、[腾讯地图行政区划v20200220](https://lbs.qq.com/webservice_v1/guide-region.html)数据；镇级采用腾讯地图行政区划作为主要数据，综合高德和统计局的镇级。采集高德省市区三级坐标和行政区域边界范围。
- 2018版(2019)采集了4层，省、市、区、镇，来源：[统计局2018版数据](http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2018/index.html)；省市区3级额外合并了[民政部2019-08-27数据](http://www.mca.gov.cn/article/sj/xzqh/2019/201908/201908271607.html)。采集高德省市区三级坐标和行政区域边界范围。
- 2017版(2018)采集了3层，省、市、区，来源：[统计局2017版数据](http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2017/index.html)。
- 2016版(2017)采集了3层，省、市、区，来源：[统计局2016版数据](http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2016/index.html)。
- 2013版(2013)采集了4层，省、市、区、镇，来源：[统计局2013版数据](http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2013/index.html)。


## 数据有效性和完整性
本库会尽量和民政部的更新频率保持一致，但由于最为主要的两个数据源`国家统计局`、`腾讯地图行政区划`更新频度并没有民政部高；因此省市区三级准确度和民政部准确度是一量级，并且要更完整些；第四级镇级主要由`腾讯地图行政区划`提供，腾讯数据源并不经常更新，因此会导致小部分新增、调整的城市第四级没有数据（会用上级数据补齐），使用前应该考虑此缺陷。

数据通过使用上级数据补齐的形式（具体细节请参考后面的数据规则），使得任何一个数据都能满足省市区镇4级结构，没有孤立的（ID全局唯一），因此不管从哪级进行下级选择，都能进行有效操作。可以通过ID结构来识别这种补齐填充的数据，只要ID为上级的ID+多个0，就代表此数据为补齐填充数据，比如：东莞（4419）-东莞（441900），很容易鉴别出441900为补齐用的填充数据。

会发生补齐行为的数据很少，约50来个（不含台湾），主要为：直筒子市（东莞、儋州等）、省直辖县级市（济源、潜江等），他们的下一级仅有补齐的这条数据。另外直辖市（北京、天津等）下级也仅有一条数据，ID结尾为01（不包括重庆，重庆下级分成了市、县两个）。

直筒子等这种为什么不直接把下级往上提一级来做区级，采用补齐填充的方式来对齐数据的原因，请参考[issue#9](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/issues/9)。

## 【字段】ok_data表
省市区镇数据表。

字段|类型|描述
:--:|:--:|--
id|int/long|城市编号，三级用int类型，四级用long类型；省市区三级为统计局的编号经过去除后缀的`0{3,6,8}`得到的短编号，港澳台编号为民政部的编号；如果是添加的数据（国外），此编号为自定义编号；镇级主要为腾讯地图行政区划的编号，大部分和统计局的数据一致，约7.5%（约3000个）的镇级不一致；如果某级缺失(如：省直辖县级市、新增城市)，会用上级数据进行补齐，编号为上级结尾添加0{2,3}，*注意如果要恢复长编号时（简单的补上00）已有的ID会和添加的ID产生冲突，比如4位恢复到6位将导致部分上下级ID冲突，恢复时这些新加的数据要进行特殊处理*。
pid|int|上级ID
deep|int|层级深度；0：省，1：市，2：区，3：镇
name|string|城市名称；省市区三级为统计局的名称精简过后的，镇级主要为腾讯地图行政区划的名称精简过后的
pinyin_prefix|string|`name`的拼音前缀，取的是`pinyin`第一个字母，或港澳台、国外自定义前缀；用来排序时应当先根据拼音前缀的首字母来排序，相同的再根据前缀+名称进行排序
pinyin|string|`name`的完整拼音
ext_id|long|数据源原始的编号；如果是添加的数据，此编号为0
ext_name|string|数据源原始的名称，为未精简的名称

## 【字段】ok_geo表
此表为坐标和行政区域边界范围数据表，含省市区三级不含第四级；因为数据文件过大（130M+），所以分开存储。由于边界数据的解析比较复杂，请参考[src/map_geo_格式化.js](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/blob/master/src/%E5%9D%90%E6%A0%87%E5%92%8C%E8%BE%B9%E7%95%8C/map_geo_%E6%A0%BC%E5%BC%8F%E5%8C%96.js)内的SQL Server的解析语句。

字段|类型|描述
:--:|:--:|--
id|int|和`ok_data`表中的`ID`相同，通过这个`ID`关联到省市区具体数据，`map_geo_格式化.js`中有数据合并SQL语句
geo|string|城市中心坐标，高德地图`GCJ-02`火星坐标系。格式："lng lat" or "EMPTY"，少量的EMPTY（仅台湾的城市、国外）代表此城市没有抓取到坐标信息
polygon|string|行政区域边界，高德地图`GCJ-02`火星坐标系。格式："lng lat,...;lng lat,..." or "EMPTY"，少量的EMPTY（仅台湾的城市、国外）代表此城市没有抓取到边界信息；存在多个地块(如飞地)时用`;`分隔，每个地块的坐标点用`,`分隔，特别要注意：多个地块组合在一起可能是[MULTIPOLYGON](https://docs.microsoft.com/zh-cn/sql/relational-databases/spatial/multipolygon?view=sql-server-2014)或者[POLYGON](https://docs.microsoft.com/zh-cn/sql/relational-databases/spatial/polygon?view=sql-server-2014)，需用工具进行计算和对数据进行验证


## 【QQ群】交流与支持

欢迎加QQ群：484560085，纯小写口令：`areacity`

<img src="https://gitee.com/xiangyuecn/AreaCity-JsSpider-StatsGov/raw/master/assets/qq_group_484560085.png" width="220px">


## 案例效果
[<img src="https://gitee.com/xiangyuecn/AreaCity-JsSpider-StatsGov/raw/master/assets/use_picker.gif" width="280px">](https://jiebian.life/start/test/app?picker=1) [<img src="https://gitee.com/xiangyuecn/AreaCity-JsSpider-StatsGov/raw/master/assets/use_select.png" width="460px">](https://xiangyuecn.github.io/AreaCity-JsSpider-StatsGov/)




# :open_book:测试和WEB数据格式转换工具

在线测试工具地址：[https://xiangyuecn.github.io/AreaCity-JsSpider-StatsGov/](https://xiangyuecn.github.io/AreaCity-JsSpider-StatsGov/)

或者直接使用`测试和WEB数据格式转换工具.js`，在任意网页控制台中使用。

此工具主要用于把csv数据转换成别的格式，另外提供省市区多级联动测试，并且可生成js源码（含数据）下载，3级联动生成的文件紧凑版68kb，4级联动紧凑版1mb大小。

## 工具支持：
1. 数据预览和测试。
2. 将csv数据导出成压缩后的紧凑版js格式纯数据文件，省市区3级数据65kb大小。
3. 将csv数据导出成JSON对象、JSON数组纯数据文件，省市区3级数据120kb+。
4. 网页版省市区镇多级联动测试。
5. 网页版省市区多级联动js代码生成（含数据）。

## 效果图
![](https://gitee.com/xiangyuecn/AreaCity-JsSpider-StatsGov/raw/master/assets/tools.png)





# :open_book:拼音标注

## 拼音源
省市区这三级采用在线拼音工具转换，据说依据《新华字典》、《现代汉语词典》等规范性辞书校对，多音字地名大部分能正确拼音，`重庆:chong qing`，`朝阳:chao yang`，`郫都:pi du`，`闵行:min hang`，`康巴什:kang ba shi`、`六安市:lu an shi`；转换完成后会和腾讯地图行政区划存在的拼音进行对比校正。

镇级以下地名采用本地拼音库（`assets/pinyin-python-server`）转换，准确度没有省市区的高。

## 拼音前缀
目前采用的是截取第一个字拼音的首字母，和港澳台、国外特殊指定前缀。

### 排序方案：

方案一(2016版废弃)：取每个字的拼音首字母排序，比如：`河北:hb` `湖北:hb` `黑龙江:hlj` `河南:hn` `湖南:hn`

方案二(2018版废弃)：取的是第一个字前两个字母和后两个字首字母排序：`河北:heb` `黑龙江:helj` `河南:hen` `湖北:hub` `湖南:hun`

方案三(返璞归真)：取第拼音前缀首字母进行排序，如果两个字母相同，再使用(首字母前缀或自定义前缀)+(名称)进行排序：`河北:h.河北` `河南:h.河南` `黑龙江:h.黑龙江` `湖北:h.湖北` `湖南:h.湖南` `香港:~1.香港` `澳门:~2.澳门`

排序方案三看起来好些；为什么不直接用名称文本进行排序，我怕不同环境下对多音字不友好，最差情况下也不会比方案一差，并且排序可透过前缀实施自定义控制。


# :open_book:坐标和行政区域边界范围

## 数据源
使用高德接口采集的，本来想采百度地图的，但经过使用发现百度地图数据~~有严重问题(百度已更新，不能复现了)~~：

参考 `肃宁县（右下方向那块飞地）`、`路南区（唐山科技职业技术学院那里一段诡异的边界）` 边界，~~百度数据大量线段交叉的无效`polygon`(百度已更新，不能复现了)~~（[百度地图测试](http://lbsyun.baidu.com/jsdemo.htm#c1_10)），没有人工无法修正，高德没有这个问题（[高德地图测试](https://lbs.amap.com/api/javascript-api/example/district-search/draw-district-boundaries)）；

并且高德对镂空性质的地块处理比百度强，参考`天津市`对`唐山`大块飞地的处理，高德数据只需要`Union`操作就能生成`polygon`，百度既有`Union`操作又有`Difference`操作，极其复杂数据还无效。

所以放弃使用百度地图数据。


## 如何使用坐标和边界数据

`坐标和边界数据` 和 `省市区` 数据是分开存储的，通过`ID`来进行关联。

可以把`ok_geo.csv`导入到数据库内使用，由于`POLYGON`需要解析，蛮复杂的，可以参考[src/map_geo_格式化.js](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/blob/master/src/%E5%9D%90%E6%A0%87%E5%92%8C%E8%BE%B9%E7%95%8C/map_geo_%E6%A0%BC%E5%BC%8F%E5%8C%96.js)内的SQL Server导入用的SQL语句的例子。

如果需要特定的`POLYGON`格式，可以根据上面介绍的字段格式，自行进行解析和验证。

使用过程中如果遇到多种不同坐标系的问题，比如请求的参数是`WGS-84坐标(GPS)`，我们后端存储的是高德的坐标，可以通过将`WGS-84坐标`转成`高德坐标`后进行处理，百度的坐标一样。转换有相应方法，转换精度一般可以达到预期范围，可自行查找。或者直接把高德的原始坐标数据转换成目标坐标系后再存储（精度？）。

## 边界效果预览

![](https://gitee.com/xiangyuecn/AreaCity-JsSpider-StatsGov/raw/master/assets/geo-sheng.gif) ![](https://gitee.com/xiangyuecn/AreaCity-JsSpider-StatsGov/raw/master/assets/geo-guangdong.gif)


# :open_book:数据规则和相关问题

1. id编号和国家统计局的编号基本一致，方便以后更新，有很多网站接口数据中城市编号是和这个基本是一致的，包括民政部、腾讯地图和高德地图的城市数据这套编号都是大部分通用的。

2. `东莞`、`中山`、`儋州`等不设区的直筒子市没有第三级区级，自动添加同名的一级作为区级，以保证整个数据结构的一致性，添加的城区编号以上级的ID结尾加两个0作为新ID，此结构ID兼容性还不错，比如：东莞（4419）下级只有一个区 东莞（441900），*但结尾加00后会导致精简过的ID如果要恢复成指定的位数时需要将这些添加的区域进行特殊处理，否则`4419`扩充到6位后会变成`441900`和下级产生冲突*。

3. 省直辖县级市（河南济源、湖北潜江、海南五指山、新疆昆玉等）根据编号来看本来只能放到区级，但为了便于用户选择，所有直辖市自动添加一个同名的市级，比如：`湖北-直辖市-仙桃-*镇` 调整后为 `湖北-仙桃-仙桃-*镇`，新添加数据的编号规则和第二条规则相同。

4. 如果市、区没有下级，自动添加同名的一个城镇作为下级，编号规则和上一条规则相同，以保证数据层次的一致性（任何一个数据都能满足省市区镇4级结构，没有孤立的）；比如：`福建-泉州-金门`没有镇，调整后为`福建-泉州-金门-金门`；另外从民政部等数据源中补全的新增城市也会缺失下级，照此规则自动补齐。

5. 台湾数据只有省市区三级没有镇级，因此镇级通过前面几条规则自动补齐；香港、澳门数据源有两级，当做直筒子市来处理，比如把香港当做东莞，从面积和人口来看还算合理，因此港澳数据中省市区三级是完全相同的，第四级镇级才有城市数据，如：香港-香港-香港-湾仔区。

6. 地区名字是直接去掉常见的后缀进行精简的，如直接清除结尾的`市|区|县|街道办事处|XX族自治X`，数量较少并且移除会导致部分名字产生歧义的后缀并未精简。

7. 省市区前三级数据的合并：统计局采集过来的数据会先和民政部的数据交叉对比后进行合并；由于统计局的数据明显的滞后，民政部内新添加的市、区将不会有镇级（自动补齐同名镇级）；如果民政部数据存在明文撤销的市、区，那么合并的时候会删除统计局对应的数据；如果统计局中的数据在民政部数据内不存在，将原样保留。高德地图行政区域会和腾讯地图行政区划数据进行交叉对比，然后择优选取需要的数据。最后(统计局+民政部)和(高德+腾讯的数据)的前三级数据进行交叉融合，得到的【省市区】 ≈ 【统计局的数据】 - 【160来个开发区、经济区、高新区、国家级新区】 - 【撤销城市】 + 【新设城市】 + 【港澳台】。

8. 第四级镇级主要采用腾讯地图行政区划数据，综合高德和统计局的数据，和统计局的数据差异在3000个左右，占比7.5%(3000/40000)，得到的【镇级】 ≈ 【腾讯地图行政区划数据】。

9. 省市区三级的坐标和行政区域边界范围数据从高德采集，省市区总计3300+条数据，少部分城市未采集到数据（仅台湾的城市、国外）。关于未获取到坐标或边界的城市，本采集方案采取不处理策略，空着就空着，覆盖主要城市和主要人群，未覆盖区域实际使用过程中应该进行降级等处理。比如：尽最大可能的根据用户坐标来确定用户所在城市，因为存在没有边界信息的区域，未匹配到的应使用ip等城市识别方法。得到的【坐标和边界】 = 【高德地图数据】。

10. 参考链接：[统计用区划代码和城乡划分代码编制规则](http://www.stats.gov.cn/tjsj/tjbz/200911/t20091125_8667.html)，[民政部发布的行政区划代码](http://www.mca.gov.cn/article/sj/xzqh/)。


## 为什么不直接用统计局的数据

1. 存在滞后，更新没有民政部和其他数据源频繁，新采集却是老数据，并且明知道存在新数据，强迫症又要犯了。
2. 统计局的数据比较齐全但是比较杂，靠一个人来分开整理几乎不可能；比如：统计局数据包含了160多个经济区、开发区，这种区划应该算专门的区域，一般由多个城市的区域组成，在区级内算是重复的区域，因此需要剔除，但剔除后这些区域下面的镇级需要划分到实际的归属城市下面，这就很困难了，因为量太大了，一个个去查归属地几乎不可能。
3. 统计局的数据也存在缺失数据，如：港澳台、昆玉市、双河市。
4. 其他平台的数据在感官上显得都[不够完美](https://v2ex.com/t/607306)，综合一下舒畅多了。


## 修正数据

- [issues/2](https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/issues/2) `乐亭县` 的 `乐`读`lào` ，此县下面的`乐亭`读音均已修正。



# :open_book:使用js自行采集

在低版本chrome控制台内运行1、2、3打头的文件即可完成采集，这些文件按文件名顺序执行。环境配置好的情况下完成一次采集大概30分钟内。

最新采集代码内对拼音转换的接口变化蛮大，由于优秀的那个公网接口采取了IP限制措施，就算使用了全自动的切换代理，全量转换还是极为缓慢，因此采用了本地转换接口和公网转换接口结合的办法，省市区三级采用公网接口，其他的采用本地接口。公网接口转换的正确度极高，本地的略差那么一点。

统计局官网也会对请求进行限制，超过一定量的请求后会要求输入验证码。只要没有禁用浏览器缓存，一个统计局url请求过一次就不再次发起网络请求（会走缓存），最多会产生4000个有效网络请求，发现要输入验证码时，重新开始采集即可，有缓存的非常快速。

## 城市数据标准操作流程

1. 按顺序用文本编辑器打开1-3打头的js文件，阅读源码开头的注释，用浏览器打开注释内相应的目标页面。
2. 在浏览器页面内打开控制台，控制台中导入需要的数据。
3. 复制js文件内的源码到控制台内执行。
4. 数据采集或转换完成会自动弹出下载，保存好文件，然后处理下一个1-3打头的js文件。


## 坐标和行政区域边界采集

使用`坐标和边界`目录内的`map_geo.js`、`map_geo_格式化.js`在[高德地图测试页面](https://lbs.amap.com/api/javascript-api/example/district-search/draw-district-boundaries)，根据文件内的说明即可完成采集。



# :open_book:其他资源
- 行政区划吧：[百度贴吧链接](https://tieba.baidu.com/f?kw=%E8%A1%8C%E6%94%BF%E5%8C%BA%E5%88%92)，一个指点江山有味道的吧，区划变更先知道
- 全国基础地理数据库：[http://www.webmap.cn](http://www.webmap.cn)
- OpenStreetMap：[https://www.openstreetmap.org](https://www.openstreetmap.org)
- 含街道居委会（五级）数据：[https://github.com/modood/Administrative-divisions-of-China](https://github.com/modood/Administrative-divisions-of-China)


# :star:捐赠
如果这个库有帮助到您，请 Star 一下。

您也可以使用支付宝或微信打赏作者：

![](https://gitee.com/xiangyuecn/Recorder/raw/master/assets/donate-alipay.png)  ![](https://gitee.com/xiangyuecn/Recorder/raw/master/assets/donate-weixin.png)
