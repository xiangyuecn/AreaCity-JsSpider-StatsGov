/*
格式并且输出为csv

先加载数据
	拼音页面如果没有关闭，直接运行本代码，或者：
	先直接运行本代码，根据提示输入PinyinWebApiSaveName对应文件到文本框 (内容太大，控制台吃不消，文本框快很多)
	或者使用本地网址更快：
	var url="https://地址/";
	var s=document.createElement("script");s.src=url+"Step2_2_Pinyin_WebApi.txt?t="+Date.now();document.body.appendChild(s)
	
然后再次运行本代码


导入SQL Server数据库：
	导入平面文件源
		utf-8格式
		文本限定符"
		第一行为列名
		文字字段数字的设置成4/8字节有符号整数
		文本设为DT_TEXT
		表结构映射中把text类型改成ntext类型（如果文件格式是UCS-2 Lettle Endian会轻松很多）

----【检查数据源】----
--【检查id重复项，手动修正id】
select id,COUNT(id) from [ok_data - 副本] group by id having COUNT(id)>1
--【检查名称重复项，手动修正名称】
select * from [ok_data - 副本] where len(name)=1
select * from [ok_data - 副本] where name in(select name from [ok_data - 副本] group by pid,name having COUNT(*)>1) order by pid,name

----【对比新旧数据】----
--【改名】
select * from [ok_data - 副本] where exists(select * from area_city where id=[ok_data - 副本].id and ext_name<>[ok_data - 副本].ext_name) order by id
select * from area_city where exists(select * from [ok_data - 副本] where id=area_city.id and ext_name<>[area_city].ext_name) order by id
--【新增项】
select * from [ok_data - 副本] where not exists(select * from area_city where id=[ok_data - 副本].id) order by id
--【减少项】
select * from area_city where not exists(select * from [ok_data - 副本] where id=area_city.id) order by id
	
*/
"use strict";
var Max_Level=4 //1省 2市 3区 4镇

var PinyinWebApiSaveName="Step2_2_Pinyin_WebApi";

if(!$(".DataTxt").length){
	$("body").append('<div style="position: fixed;bottom: 80px;left: 100px;padding: 20px;background: #0ca;z-index:9999999">输入'+PinyinWebApiSaveName+'.txt<textarea class="DataTxt"></textarea></div>');
};
if(!window[PinyinWebApiSaveName]){
	var val=$(".DataTxt").val();
	if(!val){
		throw new Error("需要输入"+PinyinWebApiSaveName+".txt");
	}else{
		window[PinyinWebApiSaveName]=eval(val+";"+PinyinWebApiSaveName);
	};
};

var pinyinList=window[PinyinWebApiSaveName].cityList;
window[PinyinWebApiSaveName]=null;

//添加扩展数据
var PinyinExt={
	81:{name:"香港",prefix:"~1"}
	,82:{name:"澳门",prefix:"~2"}
	,71:{name:"台湾",prefix:"~3"}
	,91:{name:"国外",prefix:"~4"}
};
function add(txt){
	var val=txt.split("|");
	pinyinList.push({
		"id": +val[0],
		"pid": +val[1],
		"deep": +val[2],
		"name": val[3],
		"P2":  val[4],
		
		"ext_id": 0
		,"ext_name": val[3]
		
		,isExt:true
	});
};
//id|pid|deep|name|pinyin
add("91|0|0|国外|guo wai");
add("9100|91|1|国外|guo wai");
add("910000|9100|2|国外|guo wai");
add("910000000|910000|3|国外|guo wai");



//准备数据
var idMP={};
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	o.child=[];
	if(idMP[o.id]){
		console.error("存在重复ID",o);
		throw new Error();
	};
	if(!/^[2469]$/.test((o.id+"").length)){
		console.error("ID非预期",o);
		throw new Error();
	}
	idMP[o.id]=o;
};

var newList=[],roots=[];
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	if(o.deep+1>Max_Level){
		continue;
	};
	newList.push(o);
	if(o.pid==0){
		roots.push(o);
	};
	
	if(o.pid){
		idMP[o.pid].child.push(o);
	};
	
	o.ext_name=o.ext_name||o.name;
	o.name2=o.name;
	if(!o.isExt){
		if(o.ext_id==0){
			console.error("ext_id=0",o)
			throw new Error();
		};
	};
};
pinyinList=newList;

//检测条数据是否有足够的深度数据
var deepCheck=function(arr,level){
	for(var i=0;i<arr.length;i++){
		var o=arr[i];
		if(level<Max_Level){
			if(o.child.length==0){
				console.error("层级深度不足",arr[i]);
				throw new Error();
			};
		};
		if(o.deep+1!=level){
			console.error("层级错误",arr[i]);
			throw new Error();
		};
		deepCheck(o.child,level+1);
	};
};
deepCheck(roots,1);

//人工fix数据
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	
	//fix issues#2
	if((o.id+"").indexOf("130225")==0 && /乐[亭安]/.test(o.name)){
		o.P&&(o.P=o.P.replace(/le([\s\|]+(?:ting|an))/g,"lao$1"));
		o.P2&&(o.P2=o.P2.replace(/le([\s\|]+(?:ting|an))/g,"lao$1"));
		
		console.log("人工fix数据", "乐亭", o.name, o);
	};
	
	//fix QQ 85005150 2020-8-23
	if(o.id==621223 && /宕昌县?/.test(o.name)){
		o.P&&(o.P=o.P.replace(/dang/g,"tan"));
		o.P2&&(o.P2=o.P2.replace(/dang/g,"tan"));
		
		console.log("人工fix数据", "宕:tan", o.name, o);
	};
	//fix QQ 85005150 2021-2-21
	if(o.id==131025 && /大城县/.test(o.name)){
		o.P&&(o.P=o.P.replace(/dai/g,"da"));
		o.P2&&(o.P2=o.P2.replace(/dai/g,"da"));
	};
	if(o.id==141024 && /洪洞县/.test(o.name)){
		o.P&&(o.P=o.P.replace(/dong/g,"tong"));
		o.P2&&(o.P2=o.P2.replace(/dong/g,"tong"));
	};
	if((o.id+"").indexOf("540531")==0 && /浪卡子/.test(o.name)){
		o.P&&(o.P=o.P.replace(/qia/g,"ka"));
		o.P2&&(o.P2=o.P2.replace(/qia/g,"ka"));
	};
	
	
	if(/lve/.test(o.P)){
		o.P&&(o.P=o.P.replace(/lve/g,"lue"));
	};
	if(/lve/.test(o.P2)){
		o.P2&&(o.P2=o.P2.replace(/lve/g,"lue"));
	};
};


//清理后缀
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	
	
	var name=o.name;
	name=name.replace(/(..)(?:(?:各|汉|满|回|藏|苗|彝|壮|侗|瑶|白|傣|黎|佤|畲|水|土|羌|怒|京)族|(蒙古|维吾尔|布依|土家|哈尼|哈萨克|傈僳|高山|拉祜|东乡|纳西|景颇|柯尔克孜|达斡尔|仫佬|布朗|撒拉|毛南|仡佬|锡伯|阿昌|普米|朝鲜|塔吉克|乌孜别克|俄罗斯|鄂温克|德昂|保安|裕固|塔塔尔|独龙|鄂伦春|赫哲|门巴|珞巴|基诺)族?)+(自治[区州县旗]|(?:民族)?[区县乡镇])$/g,"$1");
	
	name=name.replace(/(自治区|特别行政区)$/ig,"");
	
	if(o.deep==0){
		name=name.replace(/(省|市)$/ig,"");
	}else if(o.deep==1){
		if(o.pid==50){
			//NOOP 重庆的两个子级明确的用高德的名称，此处优待优待
		}else if(name.length>2){
			name=name.replace(/(市|区|县|盟|地区|林区)$/ig,"");
		};
	}else{
		if(o.deep==2&&/高新技术(产业)?开发区$/.test(name)){
			name="高新区";
			o.P2_2=o.P2;
			o.P2="gao xin qu";
		}else if(o.deep==2&&/高新技术(产业)?园区$/.test(name)){
			name="高新产业园";
			o.P2_2=o.P2;
			o.P2="gao xin chan ye yuan";
		}else if(o.deep==2&&/现代产业园区$/.test(name)){
			name="现代产业园";
			o.P2_2=o.P2;
			o.P2="xian dai chan ye yuan";
		}else if(o.deep==2&&/工业园区$/.test(name)){
			name="工业园区";
			o.P2_2=o.P2;
			o.P2="gong ye yuan qu";
		}else if(o.deep==2&&/经济(技术)?开发区$/.test(name)){
			name="经济开发区";
			o.P2_2=o.P2;
			o.P2="jing ji kai fa qu";
		}
		
		
		else if(/区$/.test(name)){//区结尾的太复杂单独处理
			if(o.deep==2 && (name.length==3||name.length==4)){//只处理区的	只处理34个字的			
				if(!/^市辖区$|(矿区|新区)$/.test(name)){
					name=name.replace(/区$/ig,"");
				};
			};
		}else if(name.length>2
			&& !/自治.|直属乡镇$/.test(name)){//保留XX自治X，和特例
			name=name.replace(/(..)(市|县|镇|乡|街道|街道办事处|地区办事处|社区服务中心)$/ig,"$1");
			/*
			后缀主要集中在 镇、乡、办事处、街道
select k,COUNT(*) as c from (select SUBSTRING(ext_name, len(ext_name), 1) as k from data2019) as t1 group by k order by c desc

declare @t varchar(max)='处'
select k,COUNT(*) as c from (select SUBSTRING(ext_name, len(ext_name)-LEN(@t), LEN(@t)+1) as k from data2019 where ext_name like '%'+@t) as t1 group by k order by c desc
镇	21210
乡	10198
处	5241
道	3258
区	1999
县	1453
场	1361
市	669
会	213
			*/
		};
	};
	
	
	o.minName=name;
	var pobj=idMP[o.pid];
	//简化后是否和兄弟重名
	var pcs=o.pid?pobj.child:[];
	for(var i2=0;i2<pcs.length;i2++){
		var o2=pcs[i2];
		if(o2!=o && (o2.name==name||o2.minName==name)){
			console.warn("重名",name,o.name2,o2.name2,o,o2);
			
			//两个都恢复原名，本身这种就没有多少，如果保留一个短的会有歧义
			name=o.name2;
			o.P2=o.P2_2||o.P2;
			o2.name=o2.name2;
			o2.P2=o2.P2_2||o2.P2;
		};
	};
	//简化后是否和【直接】上级重名
	if(pobj){
		//上下级是按顺序的，因为拼音前就是按顺序来push的
		if(pobj.child.length>1 && (pobj.name==name||pobj.minName==name)){
			console.warn("和上级重名",name,o.name2,pobj.name2,o,pobj);
			
			//恢复原名，这种和上级重名的蛮多，如：市下面的同名区、县
			name=o.name2;
			o.P2=o.P2_2||o.P2;
		};
	};
	
	o.name=name;
};


var FixTrim=function(name){
	return name.replace(/^\s+|\s+$/g,"");
};
function CSVName(name){
	return '"'+FixTrim(name).replace(/"/g,'""')+'"';
};

var CITY_CSV=["id,pid,deep,name,pinyin_prefix,pinyin,ext_id,ext_name"];
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	
	//生成拼音
	var p1=FixTrim(o.P||"");
	p1=p1?p1.split("||"):[];
	var p2=FixTrim(o.P2||"");
	p2=p2?p2.split(" "):[];
	if(p1.length){
		//以本地翻译长度为准，对p2进行长度修剪
		var arr=[];
		for(var i2=0;i2<p1.length&&i2<o.name.length;i2++){
			var itm=p1[i2];
			if(itm[0]!="F"){
				arr.push(itm);
			};
		};
		p1=arr;
		
		p2.length=Math.min(p2.length,p1.length);
	}else{
		p2.length=Math.min(p2.length,o.name.length);
	};
	var ps=p2.length?p2:p1;
	var pinyin=ps.join(" ").toLowerCase();
	var pinyinPrefix=pinyin.substr(0,1);
	var pyExtSet=PinyinExt[o.id];
	if(pyExtSet){
		pyExtSet.use=true;
		if(pyExtSet.name!=o.name){
			console.error("扩展拼音名称不符",pyExtSet,o);
			throw new Error();
		};
		pinyinPrefix=pyExtSet.prefix;
	};
	
	CITY_CSV.push(o.id+","+o.pid+","+o.deep+","+CSVName(o.name)
		+","+CSVName(pinyinPrefix)+","+CSVName(pinyin)
		+","+CSVName(o.ext_id+"")+","+CSVName(o.ext_name+""));
};
CITY_CSV.push("");

for(var k in PinyinExt){
	if(!PinyinExt[k].use){
		console.error("PinyinExt存在未使用项",PinyinExt[k]);
		throw new Error();
	};
};

var url=URL.createObjectURL(
	new Blob([
		new Uint8Array([0xEF,0xBB,0xBF])
		,CITY_CSV.join("\n")
	]
	,{"type":"text/plain"})
);
var downA=document.createElement("A");
downA.innerHTML="下载查询好城市的文件";
downA.href=url;
downA.download="ok_data_level"+Max_Level+".csv";
document.body.appendChild(downA);
downA.click();
