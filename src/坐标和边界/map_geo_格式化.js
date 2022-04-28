/*
导出省市区三级坐标和行政区域边界为csv格式。

此数据的id为ok_data的id，本表只提供geo、polygon，其他数据需要通过id关联到ok_data，导入数据时应该完成这步操作（为什么不把pid、name等数据也包含进来？如果冗余一份，会增加更新数据的负担，ok_data更新还要保持这里更新，漏了呢？不靠谱！）。

关于数据文件超大（100M+）的问题，以前是会对polygon进行抽样到200个坐标，变成一个大概的范围轮廓，数据量不超过20M，但精简坐标后对MULTIPOLYGON几乎全毁了，比如：相连的地块可能变得不相连，所以放弃了抽样，保留原始数据。

对于geo和polygon输出格式：
geo="lng lat"
	如"133.333333 37.123333"，高德地图GCJ-02火星坐标系，POINT格式
polygon="lng lat,...;lng lat,..."
	行政区域边界，可能有多个地块用`;`分隔，每个地块的坐标点用` `空格分隔，多个地块可能是MULTIPOLYGON或者POLYGON，需用工具进行计算和对数据进行验证，js没找到求polygon并集的方法。

如果是EMPTY代表没有对应的信息：
geo="EMPTY"
polygon="EMPTY"



在高德地图测试页面，选到iframe上下文中执行
https://lbs.amap.com/api/javascript-api/example/district-search/draw-district-boundaries

加载数据
	在上一步页面基础上运行，或者
	先直接运行本代码，根据提示输入data-geo.txt到文本框 (内容太大，控制台吃不消，文本框快很多)
	或者使用本地网址更快：
	var url="https://地址/";
	var s=document.createElement("script");s.src=url+"data_geo.txt?t="+Date.now();document.body.appendChild(s)
	
然后再次运行本代码，如果中途因错误停止，根据提示重复运行


导入SQL Server数据库：
	导入平面文件源
		utf-8格式
		文本限定符"
		第一行为列名
		文字字段数字的设置成4/8字节有符号整数
		文本设为DT_TEXT
		表结构映射中把text类型改成ntext类型（如果文件格式是UCS-2 Lettle Endian会轻松很多）
		
通过下列语句生成geometry对象，polygon有可能是POLYGON，也有可能是MULTIPOLYGON，只能通过运算才能知道正确结果
全局表##tb_polygon中包含所有的数据，通过id来关联到ok_data数据所在的表（比如把数据update过去）
```SQL
--以下代码已过时，新表已增加字段，本代码未更新，仅供参考
--drop table ##tb_polygon
create table ##tb_polygon(
	id int
	,name ntext
	,geo geometry
	,polygon geometry
)
set nocount on;

print '开始分解polygon...'
declare @startTime datetime=getdate()

declare rs cursor
for
select polygon,geo,id,ext_path from ok_geo order by id;

declare @polygon varchar(max),@geo varchar(max),@id varchar(50),@name varchar(max)
declare @row int=0
open rs
	fetch next from rs into @polygon,@geo,@id,@name
	while @@FETCH_STATUS=0 begin
		set @row=@row+1
		if @row%100=0 begin
			print cast(@row as varchar(10))+' '+@id
		end
		
		declare @polygonObj geometry=geometry::STGeomFromText('POLYGON EMPTY',0)
		declare @geoObj geometry=geometry::STGeomFromText('POINT EMPTY',0)
		
		if @geo<>'EMPTY' begin
			set @geoObj=geometry::STGeomFromText('POINT('+@geo+')',0)
		end
		
		if @polygon<>'EMPTY' begin
			declare @blockIdx int=1;
			declare @find int=1
			
			declare @loop int=1;
			while @loop<>0 begin
				--找到一个block块
				set @find=CHARINDEX(';', @polygon, @blockIdx)
				declare @block varchar(max)
				if @find=0 begin
						set @loop=0
						set @block=SUBSTRING(@polygon,@blockIdx,LEN(@polygon)+1-@blockIdx)
				end else begin
					set @block=SUBSTRING(@polygon,@blockIdx,@find-@blockIdx)
				end
				
				set @blockIdx=@find+1
				
				--闭环
				set @block=@block+','+SUBSTRING(@block,0,CHARINDEX(',',@block))
				
				--构造出子polygon
				declare @polygonChild geometry=geometry::STGeomFromText('POLYGON(('+@block+'))',0)
				
				--合并
				set @polygonObj=@polygonObj.STUnion(@polygonChild)
			end
		end
		
		if @polygonObj.STIsValid()=0 begin
			print @name+' '+@id+' polygon无效'
		end else begin
			if @geoObj.STIsValid()=0 begin
				print @name+' '+@id+' geo无效'
			end else begin
				insert ##tb_polygon(id,name,geo,polygon) values(@id,@name,@geoObj,@polygonObj)
			end
		end
		
		fetch next from rs into @polygon,@geo,@id,@name
	end
close rs
deallocate rs
print '分解polygon完成，耗时'+cast(datediff(ms,@startTime,getdate()) as varchar(max))+'ms'

--********保存数据到表********
--select * into geoTableName from ##tb_polygon

--********计算上下级之间差异超过1平方公里的数据*********
--drop table #tb2;select polygon.STArea()*10000 as a1,(select sum(t2.polygon.STArea()) from 【此处改成你的表名】 as t2 where t2.deep=t1.deep+1 and CHARINDEX(t1.ext_path, t2.ext_path)=1)*10000 as a2,* into #tb2 from 【此处改成你的表名】 as t1; select Round((a1-a2)/a1*100,2) as '%',a1-a2 as loss,* from #tb2 where deep<2 and a1-a2>1 order by [%] desc

--********校验pid的边界包含程度，应当全部是100%********
select case when t1.polygon.STArea()=0 then 0 else round(tg.polygon.STIntersection(t1.polygon).STArea()/t1.polygon.STArea()*100,2) end as bl,t1.id,t1.pid,t1.ext_path,t1.deep from 【表名】 as t1 left join 【表名】 as tg on tg.id=t1.pid where t1.deep>0 and t1.id not like '71%' order by bl

--********计算同一级之间的重叠区域，应当不存在明显重叠*********
select * from (select round(t2.polygon.STIntersection(t1.polygon).STArea()/t1.polygon.STArea()*100,2) as bl,t1.id,t1.ext_path,t1.deep,t2.id as id2,t2.ext_path as ext_path2,t2.deep as deep2 from 【表名】 as t1,【表名】 as t2 where t1.deep=【0 1 2】 and t2.deep=【一样】 and t1.id!=t2.id and t1.polygon.STIsEmpty()=0 and t1.polygon.STIntersects(t2.polygon)=1) as t where bl>0.5 order by bl desc,id2


--select id,ext_path,geo.STAsText(),polygon from 【此处改成你的表名】 where ext_path not like '% %' or ext_path like '%港澳台%'

--select id,name,geo.STAsText(),polygon from ##tb_polygon where name like '%广东省%'
--select id,name,polygon from ##tb_polygon where polygon.STIntersects(geometry::STGeomFromText('POINT(114.044346 22.691963)',0))=1

--合并数据到ok_data_level4
--update t1 set geo=t2.geo,polygon=t2.polygon from ok_data_level4 as t1,##tb_polygon as t2 where t1.id=t2.id
```
*/
"use strict";
AMap.LngLat;
console=top.console;

var Validate=false;//是否开启验证区域有效性，验证算法写的非常缓慢，经过一轮测试发现高德数据没有错误的，一般情况下没必要开启。

if(!top.document.querySelector(".DataTxt")){
	var div=top.document.createElement("div");
	div.innerHTML=('<div style="position: fixed;bottom: 80px;left: 100px;padding: 20px;background: #0ca;z-index:9999999">输入data-geo.txt<textarea class="DataTxt"></textarea></div>');
	top.document.body.appendChild(div);
};

if(!window.DATA_GEO){
	var val=top.document.querySelector(".DataTxt").value;
	if(!val){
		throw new Error("需要输入data-geo.txt");
	}else{
		window.DATA_GEO=eval(val+";DATA_GEO");
	};
};

var FixTrim=function(name){
	return name.replace(/^\s+|\s+$/g,"");
};
function CSVName(name){
	return '"'+FixTrim(name).replace(/"/g,'""')+'"';
};

var csv=["id,pid,deep,name,ext_path,geo,polygon"];
for(var k=0;k<DATA_GEO.length;k++){
	var o=DATA_GEO[k];
	console.log(k,o.ext_path);
	
	/**此处对polygon格式进行解析、有效性验证**/
	var polygon=o.polygon;
	loop:
	while(polygon!="EMPTY"){
		var polygon=o.polygon.split(";");
		for(var j=0;j<polygon.length;j++){
			var arr=[];
			var list=polygon[j].split(",");
			for(var i = 0; i < list.length; i++){
				var point=list[i].split(" ");
				arr.push([
					+(+point[0]).toFixed(6)
					,+(+point[1]).toFixed(6)
				]);
			};
			if(arr.length<3){
				console.error(o);
				throw new Error("polygon无效");
			};
			while(arr[0].join(" ")==arr[arr.length-1].join(" ")){
				arr.pop();
			};
			polygon[j]=arr;
		};
		
		polygon=checkAndBuildPolygon(polygon,o);
		break;
	};
	
	csv.push(o.id+","+o.pid+","+o.deep
		+","+CSVName(o.name)+","+CSVName(o.ext_path)
		+","+CSVName(o.geo)+","+CSVName(polygon));
};
csv.push("");

var url=URL.createObjectURL(
	new Blob([
		new Uint8Array([0xEF,0xBB,0xBF])
		,csv.join("\n")
	]
	,{"type":"text/plain"})
);
var downA=document.createElement("A");
downA.innerHTML="下载查询好坐标的文件";
downA.href=url;
downA.download="ok_geo.csv";
document.body.appendChild(downA);
downA.click();










function checkAndBuildPolygon(polygon,itm){
	var tag=itm.id+":"+itm.ext_path+" "+itm.polygon+"\n   "
	var polygonList=[];
	var maxSize=0,failTotalSize=0;
	for(var i=0;i<polygon.length;i++){
		var size=Validate?AMap.GeometryUtil.ringArea(polygon[i]):0;
		maxSize=Math.max(maxSize,size);
		
		if(Validate&&!validateLines(polygon[i])){
			failTotalSize+=size;
			console.warn(tag+"第"+(i+1)+"块无效，已移除");
		}else{
			polygonList.push(polygon[i]);
		};
	};
	if(failTotalSize&&failTotalSize>maxSize/2){
		console.error("已移除地块超过最大值一半，已清除所有边界");
		polygonList=[];
	};
	
	//导出
	var res=[];
	if(polygonList.length==0){
		return "EMPTY";
	};
	for(var i=0;i<polygonList.length;i++){
		var pos=polygonList[i];
		var arr=[];
		for(var j=0;j<pos.length;j++){
			var point=pos[j];
			arr.push(point[0]+" "+point[1]);
		};
		res.push(arr.join(","));
	};
	return res.join(";");
};
function equals(a,b){
	return a&&b&&a[0]==b[0]&&a[1]==b[1];
};
//检测构成区域的所有线条是否合法，没有相交的
function validateLines(pos){
	if(pos.length<3){
		return false;
	};
	if(equals(pos[0],pos[pos.length-1])){
		return false;
	};
	for(var i=1;i<pos.length;i++){
		var a=pos[i-1];
		var b=pos[i];
		if(equals(a,b)||equals(a,pos[i+1])){
			return false;
		};
		for(var j=i+1;j<pos.length;j++){
			var c=pos[j+1];
			if(!c){
				if(i!=1){
					c=pos[0];
				}else if(j==pos.length-1){
					break;
				};
			};
			var d=pos[j];
			
			var a_lng=a[0],a_lat=a[1];
			var b_lng=b[0],b_lat=b[1];
			var c_lng=c[0],c_lat=c[1];
			var d_lng=d[0],d_lat=d[1];
			//https://blog.csdn.net/qq826309057/article/details/70942061
			//快速排斥实验
			if ((a_lng > b_lng ? a_lng : b_lng) < (c_lng < d_lng ? c_lng : d_lng) ||
				(a_lat > b_lat ? a_lat : b_lat) < (c_lat < d_lat ? c_lat : d_lat) ||
				(c_lng > d_lng ? c_lng : d_lng) < (a_lng < b_lng ? a_lng : b_lng) ||
				(c_lat > d_lat ? c_lat : d_lat) < (a_lat < b_lat ? a_lat : b_lat))
			{
				continue;
			}
			//跨立实验
			if((((a_lng - c_lng)*(d_lat - c_lat) - (a_lat - c_lat)*(d_lng - c_lng))*
				((b_lng - c_lng)*(d_lat - c_lat) - (b_lat - c_lat)*(d_lng - c_lng))) > 0 ||
			   (((c_lng - a_lng)*(b_lat - a_lat) - (c_lat - a_lat)*(b_lng - a_lng))*
				((d_lng - a_lng)*(b_lat - a_lat) - (d_lat - a_lat)*(b_lng - a_lng))) > 0)
			{
				continue;
			}
			return false;
		};
	};
	return true;
};