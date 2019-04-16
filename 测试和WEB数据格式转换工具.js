/*
【WEB数据格式转换工具】
用来将csv数据转换成js或者json，当然改造一下转成任意格式都是可以的。

在任意网页控制台执行本代码。另外：index.html已经包含了此代码，双击就能运行，使用http访问更佳。
*/
"use strict";
var AllowAccessFolder="2019/采集到的数据";
var AllowAccessFiles=["ok_data_level3.csv(省市区)","ok_data_level4.csv(省市区镇)"];


/******************************
** 具体格式化实现函数
*****************************/
function UserFormat(list,mapping){
	//修改此方法实现自定义格式，可参考JsonArrayFormat的实现
	//list中的字段如果不够，请修改Format中csv数据提取，默认只提取了id、name、pid、pinyin(为前缀)
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
			,y:itm.pinyin
		});
	}
	var code=JSON.stringify(data);
	var codeLen=new Blob([code],{"type":"text/plain"}).size+3;
	
	return Result("",code,"area_format_array.json",`${codeLen}字节`);
};
function JsonObjectFormat(list,mapping){
	var data={}
	var x=function(obj){
		if(!obj.childs.length){
			return;
		};
		for(var i=0;i<obj.childs.length;i++){
			var itm=obj.childs[i];
			data[itm.id]={
				n:itm.name
				,y:itm.pinyin
			};
			x(itm);
		};
	};
	x(mapping[0]);
	
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
			data.push(itm.pinyin);
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
	
	return Result("",code,"area_format.js",info);
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
	
	var info=res.maxLevel+"级转换完成，共"+res.list.length+"条数据，"+res.i+" <span class='FormatDownA'></span>";
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
window.TestClick=function(type){
	var res=Format(type);
	if(res.m){
		log(res.m,1);
		return;
	};
	
	var info=res.maxLevel+"级转换完成，共"+res.list.length+"条数据，"+res.i+" <div class='TestBox'></div>";
	log(info);
	
	el(".TestBox").innerHTML="联动生成和测试代码还没有写~ TODO";
};

//城市数据数组按拼音排序，返回{id:,name}标准选项数组或buildFn(cityObject,newName)处理数组
function CityPinYinSort(arr,buildFn){
	var rtv=[];
	arr.sort(function(a,b){return a.p.localeCompare(b.p);});
	for(var i=0,o,name;i<arr.length;i++){
		o=arr[i];
		name=o.p.substr(0,1).toUpperCase()+" "+o.name;
		if(buildFn){
			rtv.push(buildFn(o,name));
		}else{
			rtv.push({id:o.id,name:name});
		};
	};
	return rtv;
};








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
				,level:-1
				,name:arr[3].replace(/""/g,'"').replace(/^"|"$/g,'')
				,pinyin:arr[4].replace(/""/g,"").replace(/^"|"$/g,'')
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
			obj.childs[i].level=obj.level+1;
			xLevel(obj.childs[i]);
		};
	};
	xChild();
	xLevel(mapping[0]);
	
	//移除不符合level的数据，并重建映射
	mapping={"0":{level:0,childs:[]}};
	for(var i=0;i<list.length;i++){
		var itm=list[i];
		if(itm.level>maxLevel){
			list.splice(i,1);
			i--;
			continue;
		};
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
.AreaFormat_Title{
	line-height: 80px;
	font-size: 40px;
	text-align: center;
}
.AreaFormat_Btn{
	padding: 5px 20px;
}

.F2{
	font-size:18px;
}
</style>
<div class="AreaFormat">
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
				<option value="1">省</option>
				<option value="2">省市</option>
				<option value="3" selected>省市区</option>
				<option value="4">省市区镇</option>
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
				自行修改源码实现UserFormat方法，导出自己想要的格式
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
document.documentElement.scrollTo(0,0);

elem.addEventListener("click",function(e){
	var exec=e.target.getAttribute("exec");
	if(exec){
		var arr=exec.split(",");
		window[arr[0]](arr[1]);
	};
});

})();