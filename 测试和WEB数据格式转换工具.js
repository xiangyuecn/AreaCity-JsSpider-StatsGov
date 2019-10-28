/*
GitHub: https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov
【WEB数据格式转换工具】
用来将csv数据转换成js或者json，当然改造一下转成任意格式都是可以的。

在任意网页控制台执行本代码。另外：index.html已经包含了此代码，双击就能运行，使用http访问更佳。
*/
"use strict";
var AllowAccessFolder="2019/采集到的数据";
var AllowAccessFiles=["ok_data_level3.csv(3级省市区)","ok_data_level4.csv(4级省市区镇)"];


/******************************
** 具体格式化实现函数
*****************************/
function UserFormat(list,mapping){
	//修改此方法实现自定义格式，可参考JsonArrayFormat的实现
	//list为所有城市平铺列表，[{id,pid,deep,name,pinyin_prefix,pinyin,ext_id,ext_name,child:[]},...]
	//mapping为id城市映射，0索引的是省级0:{child:[]}，其他为id：{id,pid,deep,name,pinyin_prefix,pinyin,ext_id,ext_name,child:[]}
	return Result("自定义方法未实现，请修改UserFormat方法源码");
};


function JsonArrayFormat(list,mapping){
	var data=[];
	for(var i=0;i<list.length;i++){
		var itm=list[i];
		//json 键名称在此修改
		data.push({
			n:itm.name
			,i:itm.id
			,p:itm.pid
			,y:itm.pinyin_prefix
		});
	}
	var code=JSON.stringify(data);
	var codeLen=new Blob([code],{"type":"text/plain"}).size+3;
	
	return Result("",code,"area_format_array.json",`${codeLen}字节`);
};
function JsonObjectFormat(list,mapping){
	var x=function(obj){
		if(!obj.childs.length){
			return;
		};
		var p={};
		for(var i=0;i<obj.childs.length;i++){
			var itm=obj.childs[i];
			p[itm.id]={
				n:itm.name
				,y:itm.pinyin_prefix
			};
			var c=x(itm);
			if(c){
				p[itm.id].c=c;
			};
		};
		return p;
	};
	var data=x(mapping[0]);
	
	var code=JSON.stringify(data);
	var codeLen=new Blob([code],{"type":"text/plain"}).size+3;
	
	return Result("",code,"area_format_object.json",`${codeLen}字节`);
};
function JsFormat(list,mapping){
	var data=[]
	var x=function(obj){
		if(!obj.childs.length){
			return;//没有子集的 []都精简掉
		};
		data.push("[");
		for(var i=0;i<obj.childs.length;i++){
			var itm=obj.childs[i];
			if(i>0){
				data.push(";");
			};
			data.push(itm.id);
			data.push(",");
			data.push(itm.name);
			data.push(",");
			data.push(itm.pinyin_prefix);
			x(itm);
		};
		data.push("]")
	};
	x(mapping[0]);
	
/* 自定义紧凑格式解压算法
[1,a,b;2,a,b[3,a,b[4,a,b]];5,a,b]

[		","c":{" 开头去掉

]+;	]+	},"
;		"},"


]+	]	}}
		]	"}}
*/
	var raw=data.join("");
	//var raw="[1,a,b;2,a,b[3,a,b[4,a,b]];5,a,b]";
	
	//js的键名称在下面代码中修改
	var fn=function(r){
		var x=function(a){
			return '"}}'+Array(a.length).join('}}')
		}
		,i=0;
		return JSON.parse(r
			.replace(/\[/g,'"!"c":{"')
			.replace(/(\]+);/g,function(a,b){
				return x(b)+'}!"';
			})
			.replace(/;/g,'"}!"')
			.replace(/\]+/g,x)
			.replace(/,/g,function(){
				return ++i%2==1?'":{"n":"':'","y":"'
			})
			
			.replace(/!/g,',')
			
			.substr(6))
	};
	var code=('var AreaCityData=('+fn.toString()+')("'+raw+'");').replace(/\r|\n|\t|\s\s+/g,"");
	
	var orgLen=new Blob([JSON.stringify(fn(raw))],{"type":"text/plain"}).size+3;
	var codeLen=new Blob([code],{"type":"text/plain"}).size+3;
	var info=`${codeLen}字节 解压${orgLen}字节 压缩率`+(codeLen/orgLen*100).toFixed(2)+"%"
	
	return Result("",code,"area_format_js.js",info);
};


function Result(errMsg,str,fileName,ext_info){
	return {m:errMsg,v:str,f:fileName,i:ext_info};
};















(function(){

/******************************
** 点击格式化导出处理
*****************************/
window.FormatClick=function(type){
	var res=Format(type);
	if(res.m){
		log(res.m,1);
		return;
	};
	
	var info=res.findMaxLevel+"级"+(res.findMaxLevel<res.maxLevel?"(数据源没有"+res.maxLevel+"级)":"")+"转换完成，共"+res.list.length+"条数据，"+res.i+" <span class='FormatDownA'></span>";
	log(info);
	
	var url=URL.createObjectURL(
		new Blob([
			new Uint8Array([0xEF,0xBB,0xBF])
			,res.v
		]
		,{"type":"text/plain"})
	);
	var downA=document.createElement("A");
	downA.innerHTML="下载"+res.f;
	downA.href=url;
	downA.download=res.f;
	el(".FormatDownA").appendChild(downA);
	downA.click();
};





/******************************
** 点击测试和联动代码生成处理
*****************************/
window.TestClick=function(type,_log,selectID){
	var res=Format(type);
	var logElem=el(_log||".AreaFormatResult");
	if(res.m){
		logElem.innerHTML=res.m;
		return;
	};
	
	var idx=TestClick.idx=(TestClick.idx||0)+1;
	var info=res.findMaxLevel+"级"+(res.findMaxLevel<res.maxLevel?"(数据源没有"+res.maxLevel+"级)":"")+" "+type+"转换完成，共"+res.list.length+"条数据，"+res.i+" <div class='TestBox"+idx+"'><div class='_select'></div><div class='_selectInfo'></div><div class='_code'></div></div>";
	logElem.innerHTML=info;
	
	var select=el(".TestBox"+idx+" ._select");
	var data;
	if(type=="js"){
		try{
			data=eval(res.v+"AreaCityData");
		}catch(e){
			select.innerHTML="类型"+type+"生成代码出错"+(e.message.indexOf("unsafe-eval")!=-1?"，此网页不允许调用eval方法，请换一个网页":"")+"："+e.message;
			return;
		};
	}else if(type=="jsonObject"){
		data=JSON.parse(res.v);
	}else if(type=="jsonArray"){
		data=JSON.parse(res.v);
	}else{
		select.innerHTML="类型"+type+"无法生成联动代码";
		return;
	};
	
	var RXOrgCityData=data;
	var buildDataFn=type=="jsonArray"?function(){
		var data=RXOrgCityData;
		var obj={};
		for(var i=0;i<data.length;i++){
			var o=data[i];
			obj[o.i]={
				id:o.i
				,pid:o.p
				,name:o.n
				,y:o.y
			};
		};
		return obj;
	}:function(){
		var data=RXOrgCityData;
		var obj={};
		var x=function(arr,p){
			for(var k in arr){
				var o=arr[k];
				obj[k]={
					id:+k
					,pid:p
					,name:o.n
					,y:o.y
				};
				x(o.c||{},+k);
			};
		};
		x(data,0);
		return obj;
	};
	AreaCityData=buildDataFn();
	BuildCitySelect(el(".TestBox"+idx+" ._select"),selectID,function(id,hasChild,data){
		var infos=[];
		var p=data[id];
		while(p){
			infos.push("("+p.id+")"+p.name);
			p=data[p.pid];
		};
		infos.reverse();
		el(".TestBox"+idx+" ._selectInfo").innerHTML=infos.join(" - ")+" 状态："+(hasChild?"还可以选择":"选择到了最后一层");
	});
	
	var code=`/* GitHub: https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov
【${res.findMaxLevel}级联动】
本代码由WEB数据格式转换工具于${new Date().toLocaleString()}生成

使用文档：
【1】在需要的地方引入本js文件

【2】在需要显示选择城市的地方调用下面方法
BuildCitySelect(element,defaultSelectID,changeCall)
	element: 必填，城市选择下拉框显示位置，可以是css选择器、dom节点、jQuery选择的节点
	defaultSelectID：可留空值，默认为0，任意级别的城市ID，创建时自动按路径选择到这个城市 
	changeCall：fn(id,hasChild,cityData) 必填，下拉框值改变时回调，用来接收结果数据
					id：当前选择的城市
					hasChild：是否还有下一级未选，如果未选，也许可以在表单最后确认时给提示
					cityData：城市数据列表，结构为{"11":{id:11,pid:0,name:"北京"},...}

调用这个方法后会立即创建相应的下拉框，用户选择城市后会调用changeCall回调，需要及时保存id信息当做结果。
*/

/***测试代码开始，使用时应该将此段注释掉***/
//将本文件内容全部复制到浏览器任意页面控制台中就能运行
setTimeout(function(){
	document.body.innerHTML='<div class="test1"></div><div class="test2"></div><div class="test3"></div>';
	
	BuildCitySelect(".test1");
	BuildCitySelect(".test2",460204);//选中 三亚 天涯
	BuildCitySelect(".test3",11);//选中 北京
});
/***测试代码结束***/


`+("var BuildCitySelect=("
		+buildCitySelectFn.toString()
		+")();")
			.replace(/buildCitySelectFn;/
				,("var AreaCityData=("
				+buildDataFn.toString()
				+")();")
					.replace(/var data=RXOrgCityData;/,type=="js"?res.v+"var data=AreaCityData;":"var data="+res.v+";"));
	
	var url=URL.createObjectURL(
		new Blob([
			new Uint8Array([0xEF,0xBB,0xBF])
			,code
		]
		,{"type":"text/plain"})
	);
	var file=res.f.replace(/\.[^.]+$/,"")+".level"+res.findMaxLevel+".js";
	var downA=document.createElement("A");
	downA.innerHTML="点此下载"+res.findMaxLevel+"级联动源码（含数据） "+file;
	downA.href=url;
	downA.download=file;
	el(".TestBox"+idx+" ._code").appendChild(downA);
};

var AreaCityData;
var buildCitySelectFn=function(){
	buildCitySelectFn;
	var BuildSelect=function(elem,set,changeFn){
		var data=AreaCityData;
		if(typeof(elem)=="string"){
			elem=document.querySelector(elem);
		}else if(elem.length){
			elem=elem[0];
		};
		
		var build=function(pid,id,ids){
			var has=false;
			var arr=[];
			for(var k in data){
				var o=data[k];
				if(o.pid==pid){
					has=true;
					arr.push(o);
				};
			};
			if(set.sort){
				arr=set.sort(arr);
			};
			var defName=set.defName||"--请选择--";
			if(pid==0&&!arr.length){
				defName=set.emptyName||defName;
			};
			var html=['<select pid="'+pid+'"><option value="0">'+defName+'</option>'];
			var idsFind=ids?" "+ids.join(" ")+" ":"";
			for(var i=0,o;i<arr.length;i++){
				o=arr[i];
				var slc=false;
				if(ids){
					slc=idsFind.indexOf(" "+o.id+" ")!=-1;
				}else{
					slc=o.id==id;
				};
				html.push('<option value="'+o.id+'" '+(slc?'selected':'')+'>'+o.name+'</option>');
			};
			html.push('</select>');
			return pid==0||has?html.join("\n"):"";
		};
		
		
		var loopid=set.id,pid=-1,html=[],hasChild=false,childSelect;
		while(pid!=0){
			pid=data[loopid]&&data[loopid].pid||0;
			html.push(build(pid,loopid,null));
			loopid=pid;
		};
		html.reverse();
		if(set.id){
			childSelect=build(set.id,0);
			if(childSelect){
				hasChild=true;
				html.push(childSelect);
			};
		};
		
		var onChange=function(tg,id,pid){
			var values=[];
			if(!id){
				id=pid;
			};
			set.id=id;
			set.values=values;
			childSelect=BuildSelect(elem,set,changeFn);
			changeFn&&changeFn(id,childSelect,data);
		};
		elem.innerHTML=html.join("\n");
		var arr=elem.querySelectorAll("select");
		for(var i=0;i<arr.length;i++){
			arr[i].addEventListener("change",function(e){
				var tg=e.target;
				onChange(tg,+tg.value,+tg.getAttribute("pid"));
			});
		};
		return hasChild;
	};
	function sort(arr,buildFn){
		var rtv=[];
		arr.sort(function(a,b){
			var y=a.y.charCodeAt(0)-b.y.charCodeAt(0);
			if(y){
				return y;
			}else{
				return (a.y+a.name).localeCompare(b.y+b.name);
			};
		});
		for(var i=0,o,name;i<arr.length;i++){
			o=arr[i];
			name=o.y.substr(0,1).toUpperCase()+" "+o.name;
			if(buildFn){
				rtv.push(buildFn(o,name));
			}else{
				rtv.push({id:o.id,name:name});
			};
		};
		return rtv;
	};
	
	return function(elem,id,changeFn){
		return BuildSelect(elem,{id:id,sort:sort},changeFn);
	};
};
window.BuildCitySelect=buildCitySelectFn();








/******************************
** 格式化逻辑
*****************************/
function Format(type){
	var maxLevel=+el(".AreaFormatLevel").value;
	var txt=el(".AreaFormatInput").value;
	if(!txt){
		return Result("请在数据源内粘贴csv数据");
	};
	
	//解析csv数据
	var lines=txt.split("\n");
	var list=[];
	var mapping={"0":{level:0,childs:[]}};
	var arr=lines[0].split(",");
	if(arr.length!=8 || arr[0]!="id"){
		return Result("粘贴csv数据不合法");
	};
	for(var i=1;i<lines.length;i++){
		var line=lines[i];
		if(line){
			var arr=line.split(",");
			if(arr.length!=8){
				return Result("粘贴csv数据第"+(i+1)+"行不合法");
			};
			var itm={
				id:+arr[0]
				,pid:+arr[1]
				,deep:+arr[2]
				,name:arr[3].replace(/""/g,'"').replace(/^"|"$/g,'')
				,pinyin_prefix:arr[4].replace(/""/g,"").replace(/^"|"$/g,'')
				,pinyin:arr[5].replace(/""/g,"").replace(/^"|"$/g,'')
				,ext_id:arr[6].replace(/""/g,"").replace(/^"|"$/g,'')
				,ext_name:arr[7].replace(/""/g,"").replace(/^"|"$/g,'')
				
				,level:-1
				,childs:[]
			};
			list.push(itm);
			mapping[itm.id]=itm;
		};
	};
	
	//添加childs关系
	var xChild=function(){
		for(var i=0;i<list.length;i++){
			var itm=list[i];
			if(!mapping[itm.pid]){
				return Result("粘贴csv数据中【"+itm.id+"】数据无效");
			};
			mapping[itm.pid].childs.push(itm);
		};
	};
	//计算level值
	var xLevel=function(obj){
		for(var i=0;i<obj.childs.length;i++){
			var o=obj.childs[i];
			o.level=obj.level+1;
			if(o.level!=o.deep+1){
				var msg="数据存在错误，级别不对，请看控制台输出";
				alert(msg);
				console.error(msg,obj,o);
				throw new Error();
			};
			xLevel(o);
		};
	};
	xChild();
	xLevel(mapping[0]);
	
	//移除不符合level的数据，并重建映射
	var findMaxLevel=0;
	mapping={"0":{level:0,childs:[]}};
	for(var i=0;i<list.length;i++){
		var itm=list[i];
		if(itm.level>maxLevel){
			list.splice(i,1);
			i--;
			continue;
		};
		findMaxLevel=Math.max(findMaxLevel,itm.level);
		itm.childs=[];
		mapping[itm.id]=itm;
	};
	xChild();
	
	
	//实际格式化
	var rtv;
	if(type=="user"){
		rtv=UserFormat(list,mapping);
	}else if(type=="js"){
		rtv=JsFormat(list,mapping);
	}else if(type=="jsonObject"){
		rtv=JsonObjectFormat(list,mapping);
	}else if(type=="jsonArray"){
		rtv=JsonArrayFormat(list,mapping);
	}else{
		return Result("未知类型："+type);
	};
	
	rtv.maxLevel=maxLevel;
	rtv.findMaxLevel=findMaxLevel;
	rtv.list=list;
	rtv.mapping=mapping;
	return rtv;
};














/******************************
** 界面操作
*****************************/

function el(cls){
	return document.querySelector(cls);
};
function log(html,err){
	if(err){
		console.error(html);
	};
	el(".AreaFormatResult").innerHTML=`<div style="${err?'color:red':''}">`+html+'</div>';
};
window.FormatLog=log;

var bodyHtml=`
<style>
body{
	min-height:1500px;
}
.AreaFormat{
	position: absolute;
	z-index:99999999;
	width:90%;
	left:5%;
	top:20px;
	background:#15822e;
	color: #fff;
	font-size:14px;
}
.AreaFormat select {
	height: 30px;
	margin:8px 0;
}
a{text-decoration: none;}
.GitHub a{color:#fff}

.AreaFormat_Title{
	line-height: 80px;
	font-size: 40px;
	text-align: center;
}
.AreaFormat_Btn{
	padding: 10px 20px;
}

.F2{
	font-size:18px;
}
</style>
<div class="AreaFormat">
	<div class="GitHub" style="position: absolute;left:30px; top:20px;">
		<a href="https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov">返回 GitHub</a>
	</div>
	<div class="AreaFormat_Title">
		测试和WEB数据格式转换工具
	</div>
	<div style="display: flex;">
		<div style="flex: 1;"></div>
		<div style="width:600px">
			<div>
				<span class="F2">【数据源】</span>
				<span class="AreaFormatFrom"></span>
			</div>
			<textarea class="AreaFormatInput" style="width:600px;height:160px"
				placeholder="请先粘贴《${AllowAccessFolder}》目录下的《${AllowAccessFiles.join('》或者《')}》文件内容，数据量大可能粘贴会很慢。

然后再点击右侧需要的格式按钮进行转换。"></textarea>
			
			<div>
				<span class="F2">【导出数据级别】</span>
				选择的级别需要数据源内包含此级的数据，比如level3不包含镇级，就算选了镇，也不会导出此级数据
			</div>
			<select class="AreaFormatLevel">
				<option value="1">(1级)省</option>
				<option value="2">(2级)省市</option>
				<option value="3">(3级)省市区</option>
				<option value="4" selected>(4级)省市区镇</option>
			</select>
			
			<hr>
			<div>
				<span class="F2">【运行结果】</span>
			</div>
			<div class="AreaFormatResult" style="background: #fff;color: #000;padding: 10px;"></div>
		</div>
		<div style="padding-left:30px; width:400px">
			<input class="AreaFormat_Btn" type="button" value="(小)导出为紧凑JS" exec="FormatClick,js">
			<input type="button" value="多级联动测试和生成代码" exec="TestClick,js">
			<div>
				js格式会对数据进行压缩成紧凑格式，大幅减少冗余数据，格式如: var AreaCityData=(function(r){})("[20,省名,shm[2001,市名,shm;];]"); 在js运行时自动解压，还原后的格式和下面的JSON对象格式一致，如果对键名称不满意，可以自行修改JsFormat方法
			</div>
			
			<hr/>
			<input class="AreaFormat_Btn" type="button" value="(中)导出为JSON对象" exec="FormatClick,jsonObject">
			<input type="button" value="多级联动测试和生成代码" exec="TestClick,jsonObject">
			<div>
				格式如：{"20":{"n":"省名","y":"shm","c":{"2001":{"n":"市名","y":"shm"}}}} ，数字key为id，n为名称，y为拼音前缀，c为子集，如果对键名称不满意，可以自行修改JsonObjectFormat方法
			</div>
			
			<hr/>
			<input class="AreaFormat_Btn" type="button" value="(大)导出为JSON数组" exec="FormatClick,jsonArray">
			<input type="button" value="多级联动测试和生成代码" exec="TestClick,jsonArray">
			<div>
				格式如：[{"n":"省名","i":20,"p":0,"y":"shm"},{"n":"市名","i":2001,"p":20,"y":"shm"}]，n为名称，i为id，p为pid，y为拼音前缀，如果对键名称不满意，可以自行修改JsonArrayFormat方法
			</div>
			
			<hr/>
			<input class="AreaFormat_Btn" type="button" value="导出为自定义" exec="FormatClick,user">
			<div>
				自行修改源码实现UserFormat方法，导出自己想要的格式。<a href="https://xiangyuecn.github.io/Recorder/assets/%E5%B7%A5%E5%85%B7-%E4%BB%A3%E7%A0%81%E8%BF%90%E8%A1%8C%E5%92%8C%E9%9D%99%E6%80%81%E5%88%86%E5%8F%91Runtime.html#sha1=FD144040A790A9B055DD07A93B7501512DF5ED5A&shareCode=v1_LypAUnVudGltZSBNZXRhQCoqIOOAikFyZWFDaXR55a-85Ye65Li66Ieq5a6a5LmJ56S65L6L44CLCkDmupDnoIHmoIfpopgoVGl0bGUp77yaQXJlYUNpdHnlr7zlh7rkuLroh6rlrprkuYnnpLrkvosKQOS9nOiAhShBdXRob3Ip77ya6auY5Z2a5p6cCkDniYjmnKwoVmVyKe-8mjEuMApA5pe26Ze077yaMjAxOS8xMC8yOCDkuIvljYgxOjQwOjA2CkDmj4_ov7AoRGVzYynvvJpgYGAi5L6_5LqO5b-r6YCf5LiK5omL5a-85Ye6QXJlYUNpdHktSnNTcGlkZXItU3RhdHNHb3blupPnmoTmlbDmja7kuLroh6rlt7HpnIDopoHnmoTmoLzlvI_vvIzov5nkuKrnpLrkvovlr7zlh7rmoLzlvI_kuLrvvJpbe2lkOiIiLG5hbWU6IiIs5omA5pyJ5a2X5q61Li4uLGNoaWxkczpbLi4uXX0sLi4uXSJgYGAKLS0tLS0tLS0tLS0KQOWFrOmSpeaMh-aVsChSU0FfUHVibGljX0V4cG9uZW50Ke-8mkFRQUIKQOaooeaVsChSU0FfTW9kdWx1cynvvJpwaW12REdiQWZ4cFBmeGcrTlNMd1I3VXZ2OUhBQlpBQVFPKzQ4alFoYW0vQzl0Ry9MbzJyNDhxRnJzYTBoQ0l1azVUNzAyWkVTNXYvTlRSNEZuVys4ZGlyM2RneVoyUkMzV0lIcnRBZjlOT0tWWDBZb3UxS29Sa3F2YWRuRGhmbHFCUTVXUE9aWVdZbWgwWEFEcDJKdlM5Ykg0aUVZY2tMZ3FFWjB5bFZQMFU9CkDorqTor4Hkv6Hmga8oUlNBX1RydXN0Ke-8mmBgYCJ7IlZlciI6IjEuMCIsIlRpbWUiOiIxNTY4NDY0MTk4NjU4IiwiUm9vdCI6IkcwMSIsIk5hbWUiOiLpq5jlnZrmnpwiLCJUcnVzdCI6InFMenFReTkvRFRLbGVoT1ZXSXRRYWRBWUQ5aUUwTFNzR3BjOTdHdUloOVhNa3h3UkU0L3U2K2lla1BNUkhwMXJWSDhMbDUvbW92TmIyVnlhT1NhVDNIQlpXYTVhakFsN1JVdXNrSkRPZmlwQ2RlVWE1YzVLNExiczI5NElkUldLc2lRdjJtNWFxcTcyN1U4dGdQcUFCL2NKVzdpdHY5S2tranM1cmloS3JHcz0ifSJgYGAKQOetvuWQjShSU0FfU2lnbinvvJpMbHZxZUNQLzZvb01YSlBRMVhKNE5oSi92ZWlybkJWTEV2dWtzT2NPM05BMDVYWmRuRFoxZ3lMSzRkakE1WHd6MWxHUDBqQWdUZlV6RGNMdHZyL1VKb29qeTFWdE5UOUJnT3FoT1NCQU5sVDFFTGIyNko5UDQ0Skx0c1VVeG1vK1UyRHhOWVR1NUFRZHJDZGVuQVhPR01SWnFXVUxoZEZoSDRsdUVoSXN4MTg9CioqQFJ1bnRpbWVAKi8KCgovKioqKuWvvOWHuueahGpzb24ga2V56YWN572uKioqKi8KdmFyIFNldHRpbmdzPXsKCUlEOiJpZCIKCSxJRE1pbkxlbjoyIC8vaWTmnIDlsJHopoHov5nkuYjplb_vvIzlj5blgLwy77yMNO-8jDYKCQoJLy_lpoLmnpzorr7kuLrnqbrvvIzkvJrlsIbmiYDmnInln47luILlsZXlvIDliLDmlbDnu4TlhoXvvIzkuI3ov5vooYzkuIrkuIvnuqfltYzlpZcKCSxDaGlsZHM6ImNoaWxkcyIKCQoJLy_ku6XkuIvlrZfmrrXlpoLmnpzorr7kuLrnqbrvvIzlr7nlupTlrZfmrrXlsLHkuI3mt7vliqDliLDnu5PmnpzkuK0KCSxwaWQ6InBpZCIKCSxkZWVwOiJkZWVwIgoJLG5hbWU6Im5hbWUiCgkscGlueWluOiJwaW55aW4iCgkscGlueWluX3ByZWZpeDoicGlueWluX3ByZWZpeCIKCSxleHRfaWQ6ImV4dF9pZCIKCSxleHRfbmFtZToiZXh0X25hbWUiCn07CgovKioqKioqVXNlckZvcm1hdOWHveaVsOWunueOsCoqKioqKi8KdmFyIHVzZXJGb3JtYXQ9ZnVuY3Rpb24obGlzdCxtYXBwaW5nKXsKCS8vbGlzdOS4uuaJgOacieWfjuW4guW5s-mTuuWIl-ihqO-8jFt7aWQscGlkLGRlZXAsbmFtZSxwaW55aW5fcHJlZml4LHBpbnlpbixleHRfaWQsZXh0X25hbWUsY2hpbGQ6W119LC4uLl0KCS8vbWFwcGluZ-S4umlk5Z-O5biC5pig5bCE77yMMOe0ouW8leeahOaYr-ecgee6pzA6e2NoaWxkOltdfe-8jOWFtuS7luS4umlk77yae2lkLHBpZCxkZWVwLG5hbWUscGlueWluX3ByZWZpeCxwaW55aW4sZXh0X2lkLGV4dF9uYW1lLGNoaWxkOltdfQoJCgl2YXIgZXhlYz1mdW5jdGlvbihvYmosZGlzdCl7CgkJaWYoIW9iai5jaGlsZHMubGVuZ3RoKXsKCQkJcmV0dXJuOwoJCX07CgkJZm9yKHZhciBpPTA7aTxvYmouY2hpbGRzLmxlbmd0aDtpKyspewoJCQl2YXIgaXRtPW9iai5jaGlsZHNbaV07CgkJCXZhciBvPXt9OwoJCQlkaXN0LnB1c2gobyk7CgkJCQoJCQl2YXIgaWQ9KGl0bS5pZCsiIikucmVwbGFjZSgvKDAwMHwwMDAwMDB8MDAwMDAwMDB8MDAwMDAwMDAwMCkkLywiIik7CgkJCW9bU2V0dGluZ3MuSURdPWlkLmxlbmd0aDxTZXR0aW5ncy5JRE1pbkxlbj8oaWQrIjAwMDAwMDAwMDAwMCIpLnN1YnN0cigwLFNldHRpbmdzLklETWluTGVuKTppZDsKCQkJCgkJCXZhciBhZGQ9ZnVuY3Rpb24oa2V5KXsKCQkJCXZhciBzZXRLZXk9U2V0dGluZ3Nba2V5XTsKCQkJCWlmKHNldEtleSl7CgkJCQkJb1tzZXRLZXldPWl0bVtrZXldOwoJCQkJfTsKCQkJfTsKCQkJYWRkKCJwaWQiKTsKCQkJYWRkKCJkZWVwIik7CgkJCWFkZCgibmFtZSIpOwoJCQlhZGQoInBpbnlpbiIpOwoJCQlhZGQoInBpbnlpbl9wcmVmaXgiKTsKCQkJYWRkKCJleHRfaWQiKTsKCQkJYWRkKCJleHRfbmFtZSIpOwoJCQkKCQkJaWYoU2V0dGluZ3MuQ2hpbGRzKXsKCQkJCXZhciBjPWV4ZWMoaXRtLFtdKTsKCQkJCWlmKGMpewoJCQkJCW9bU2V0dGluZ3MuQ2hpbGRzXT1jOwoJCQkJfTsKCQkJfWVsc2V7CgkJCQlleGVjKGl0bSxkaXN0KTsKCQkJfTsKCQl9OwoJCXJldHVybiBkaXN0OwoJfTsKCXZhciBkYXRhPWV4ZWMobWFwcGluZ1swXSxbXSk7CgkKCXZhciBjb2RlPUpTT04uc3RyaW5naWZ5KGRhdGEsbnVsbCwiXHQiKTsKCXZhciBjb2RlTGVuPW5ldyBCbG9iKFtjb2RlXSx7InR5cGUiOiJ0ZXh0L3BsYWluIn0pLnNpemUrMzsKCQoJcmV0dXJuIHNjb3BlV2luLlJlc3VsdCgiIixjb2RlLCJhcmVhX2Zvcm1hdF91c2VyLmpzb24iLGAke2NvZGVMZW595a2X6IqCYCk7Cn07CgoKLyoqKioqKueVjOmdouazqOWFpSoqKioqKi8KJCgiLmFyZWFDaXR5IikucmVtb3ZlKCk7ClJ1bnRpbWUuTG9nKCc8aWZyYW1lIGNsYXNzPSJhcmVhQ2l0eSIgc3R5bGU9IndpZHRoOjEwMDBweDtoZWlnaHQ6NTAwcHgiIHNyYz0iL0FyZWFDaXR5LUpzU3BpZGVyLVN0YXRzR292LyI-PC9pZnJhbWU-Jyk7CnZhciBzY29wZVdpbjsKJCgiLmFyZWFDaXR5IikuYmluZCgibG9hZCIsZnVuY3Rpb24oKXsKCXNjb3BlV2luPSQoIi5hcmVhQ2l0eSIpWzBdLmNvbnRlbnRXaW5kb3c7CglzY29wZVdpbi5Vc2VyRm9ybWF0PXVzZXJGb3JtYXQ7CglSdW50aW1lLkxvZygiVXNlckZvcm1hdOW3suazqOWFpe-8jOWPr-S7peeCueWHu-WvvOWHuuS4uuiHquWumuS5ieaMiemSruS6hiIsMik7Cn0pOw.." target="_blank">在线编辑UserFormat源码>></a>
			</div>
		</div>
		<div style="flex: 1;"></div>
	</div>
	
	<div style="padding:30px"></div>
</div>
`;

while(true){
	var elem=el(".AreaFormat");
	if(!elem){
		break;
	};
	elem.parentNode.removeChild(elem);
};
var elem=document.createElement("div");
elem.innerHTML=bodyHtml;
document.body.appendChild(elem);
document.body.scrollTop=0;
document.documentElement.scrollTop=0;

elem.addEventListener("click",function(e){
	var exec=e.target.getAttribute("exec");
	if(exec){
		var arr=exec.split(",");
		window[arr[0]](arr[1]);
	};
});

})();