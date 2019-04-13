/*
采集省市区（不含扩展区域）三级坐标和行政区域边界，此数据的id为ok_data的id

关于未获取到坐标或边界的城市，本方案采取不处理策略，空着就空着，覆盖主要城市和主要人群，未覆盖区域实际使用过程中应该进行降级等处理。

用途示例：【尽最大可能】的根据用户坐标来确定用户所在城市，因为存在没有边界信息的区域，未匹配到的应使用ip等城市识别方法。


在百度地图测试页面，选到iframe上下文中执行
http://lbsyun.baidu.com/jsdemo.htm#c1_10

加载数据
	先直接运行本代码，根据提示输入data-pinyin.txt到文本框 (内容太大，控制台吃不消，文本框快很多)

然后再次运行本代码，如果中途因错误停止，根据提示重复运行
*/
BMap.Point;

var GeoStop=false;

var Load_Thread_Count=4;//模拟线程数






var logX=top.document.createElement("div");
logX.innerHTML='<div class="LogX" style="position: fixed;bottom: 80px;right: 100px;padding: 50px;background: #0ca;color: #fff;font-size: 16px;width: 600px;z-index:9999999"></div>';
top.document.body.appendChild(logX);
logX=top.document.querySelectorAll(".LogX");
logX=logX[logX.length-1];
var logXn=0;
function LogX(txt){
	logXn++;
	//if(logXn%100==0){
		logX.innerText=txt;
	//}
}
if(!top.document.querySelector(".DataTxt")){
	var div=top.document.createElement("div");
	div.innerHTML=('<div style="position: fixed;bottom: 80px;left: 100px;padding: 20px;background: #0ca;z-index:9999999">输入data-pinyin.txt<textarea class="DataTxt"></textarea></div>');
	top.document.body.appendChild(div);
};

if(!window.CITY_LIST_PINYIN){
	var val=top.document.querySelector(".DataTxt").value;
	if(!val){
		throw new Error("需要输入data-pinyin.txt");
	}else{
		window.CITY_LIST_PINYIN=eval(val+";CITY_LIST_PINYIN");
	};
}else{
	console.log("已读上次进度数据");
};

var pinyinList=CITY_LIST_PINYIN;


//人工fix数据，这些id的按这个字符串直接查找
var fixNames={
	4190:"" //河南省 省直辖县级行政区划
	,4290:"" //湖北省 省直辖县级行政区划
	,4690:"" //海南省 省直辖县级行政区划
	,5002:"" //重庆市 县
	,6590:"" //新疆维吾尔自治区 自治区直辖县级行政区划
	
	,3712:"莱芜市" //山东省 莱芜市
	,5406:"那曲" //西藏自治区 那曲市
	,540622:"西藏 比如县" //那曲 比如县
	,450381:"荔浦市" //广西壮族自治区 桂林市 荔浦市
	,370215:"即墨区" //山东省 青岛市 即墨区
	,140213:"平城区" //山西省 大同市 平城区
	,350112:"长乐区" //福建省 福州市 长乐区
};
//注册人工验证过fix过后也没有边界的城市，不然会有错误警告
var allowEmpty=function(itm,paths){
	var tag=itm.id+":"+itm.paths.join(" ")+"：";
	
	if(/(新区|新城|新城区|实验区|保税区|开发区|管理区|食品区|园区|产业园|名胜区|示范区|镇|管委会|街道办事处)$/.test(itm.name)){
		console.warn(tag+"为空，正则匹配接受");
		return true;
	};
	
	if((
{
	"232761": "黑龙江省 大兴安岭地区 加格达奇区",
	"232762": "黑龙江省 大兴安岭地区 松岭区",
	"232763": "黑龙江省 大兴安岭地区 新林区",
	"232764": "黑龙江省 大兴安岭地区 呼中区",
	"330112": "浙江省 杭州市 临安区",
	"371202": "莱芜市 莱城区",
	"411471": "河南省 商丘市 豫东综合物流产业聚集区",
	"460323": "海南省 三沙市 中沙群岛的岛礁及其海域",
	"620201": "甘肃省 嘉峪关市 市辖区",
	"632857": "青海省 海西蒙古族藏族自治州 大柴旦行政委员会",
	"652702": "新疆维吾尔自治区 博尔塔拉蒙古自治州 阿拉山口市",
	"441900402": "广东省 东莞市 东莞港",
	"441900403": "广东省 东莞市 东莞生态园",
	"460400500": "海南省 儋州市 华南热作学院"
}
	)[itm.id]){
		console.warn(tag+"为空，字典匹配接受");
		return true;
	};
};
var needReg={};

//准备数据
var idMP={};
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	o.child=[];
	idMP[o.id]=o;
};
var newList=[];
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	if(o.deep>2){//0 1 2
		continue;
	};
	newList.push(o);
	
	if(o.polygon=="EMPTY"){
		/**代码变更，对未抓取到的重新抓取**/
		/*
		o.polygon="";
		o.geo="";
		*/
	};
	
	var paths=[];
	var p=o;
	while(p){
		var path=fixNames[p.id];
		if(path==null){
			path=p.name;
		}else{
			paths.push(path);
			break;
		};
		
		if(path){
			paths.push(path);
		}else if(p==o){
			paths=[];
			break;
		};
		p=idMP[p.pid];
	};
	o.paths=paths.reverse();
};
pinyinList=newList;


function load(itm, next, _try){
	if(GeoStop){
		console.error("已停止");
		return;
	};
	
	var keys=Object.keys(BMap._rd);
	var geo="EMPTY";
	var polygon="EMPTY";
	var paths=itm.paths.join(" ");
	_try=_try||0;
	if(_try==1){
		paths=itm.paths[0]+" "+itm.paths[2]; //去除市级进行操作
	}else if(_try==2){
		paths=itm.paths[1]+" "+itm.paths[2]; //去除省级进行操作
	};
	
	var end=function(){
		itm.geo=geo;
		itm.polygon=polygon;
		next();
	};
	if(!paths){
		end();
		return;
	};
	
	LogX(loadIdx+"/"+pinyinList.length+paths);
	var hook_cname="";
	new BMap.Boundary().get(paths,function(rs){
		var isMatch=!!rs.boundaries.length;
		var isNameNotMatch=false;
		if(isMatch && hook_cname!=itm.name){
			//对名称进行匹配
			if(hook_cname.indexOf(itm.name.substr(0,itm.name.length==3?2:3))!=0){
				isNameNotMatch=true;
				isMatch=false;
			};
		};
		
		if(!isMatch){
			if(_try<2&&_try<itm.paths.length){
				load(itm, next, _try+1);
				return;
			};
			
			geo="EMPTY";//已获取到的geo不可靠
			
			if(!allowEmpty(itm,paths)){
				needReg[itm.id]=itm.paths.join(" ");
				console.error(itm.id+":"+itm.paths.join(" ")
					+(isNameNotMatch?
						"：结果名称不匹配"
						:"：为空，且未在empty中注册"));
				
				geo="";
				polygon="";
			};
		}else{
			polygon=[];
			for(var v in rs.boundaries){
				var arr=[];
				var list=rs.boundaries[v].split(";");
				for(var i = 0; i < list.length; i++){
					var point=list[i].split(",");
					arr.push(point[0].trim()+" "+point[1].trim());
				};
				polygon.push(arr.join(","));
			};
			polygon=polygon.join(";");
		};
		
		end();
	});
	
	//注入 获取中心坐标
	var keys2=Object.keys(BMap._rd);
	for(var i=0;i<keys2.length;i++){
		var key=keys2[i];
		if(keys.indexOf(key)==-1){
			var _fn=BMap._rd[key];
			BMap._rd[key]=function(data){
				var o=data.content||{};
				hook_cname=o.cname||"";
				if(o.geo){
					//var coord=o.ext.detail_info.point;
					//var xp=BMap.MercatorProjection.Ab(new BMap.Point(coord.x,coord.y));
					var xp=C0.vb(o.geo,true).point;
					
					geo=xp.lng+" "+xp.lat;
				};
				
				_fn(data);
			};
			break;
		};
	};
};

var threadCount=0;
var loadIdx=0;
function thread(){
	threadCount++;
	var itm=null;
	for(;loadIdx<pinyinList.length;){
		var o=pinyinList[loadIdx];
		loadIdx++;
		
		if(!o.polygon){
			itm=o;
			break;
		};
	};
	if(!itm){
		threadCount--;
		if(threadCount==0){
			if(GeoStop){
				console.error("已停止");
				return;
			};
			GeoStop=true;
			console.log(Object.keys(needReg).length,needReg);
			console.log(JSON.stringify(needReg,null,'\t'));
			
			console.log("==完成== 耗时："+(Date.now()-startTime)+"ms");
			setTimeout(endload);
		};
		return;
	};
	
	var next=function(){
		threadCount--;
		thread();
	};
	
	load(itm, next);
};
var startTime=Date.now();
(function(){
	for(var i=0;i<Load_Thread_Count;i++){
		thread();
	};
})();





function endload(){
	var list=[];
	for(var i=0;i<pinyinList.length;i++){
		var o=pinyinList[i];
		
		list.push({
			id:o.id
			,pid:o.pid
			,name:o.name
			,geo:o.geo
			,polygon:o.polygon
		});
	};
	window.DATA_GEO=list;

	var url=URL.createObjectURL(
		new Blob([
			new Uint8Array([0xEF,0xBB,0xBF])
			,"var DATA_GEO="
			,JSON.stringify(list,null,"\t")
		]
		,{"type":"text/plain"})
	);
	var downA=document.createElement("A");
	downA.innerHTML="下载查询好坐标的文件";
	downA.href=url;
	downA.download="data_geo.txt";
	document.body.appendChild(downA);
	downA.click();
};