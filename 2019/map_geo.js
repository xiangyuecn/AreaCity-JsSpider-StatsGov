/*
采集省市区三级坐标和行政区域边界，结束后输出csv，此表的id为ok_data的id

关于未获取到坐标或边界的城市，本方案采取不处理策略，空着就空着，覆盖主要城市和主要人群，未覆盖区域实际使用过程中应该进行降级等处理。

用途示例：【尽最大可能】的根据用户坐标来确定用户所在城市，因为存在没有边界信息的区域，未匹配到的应使用ip等城市识别方法。

坐标和边界结构：
geo="lng lat" 如"133.333333 37.123333" 百度地图bd09坐标
polygon="(lng lat,lng lat,...),(lng lat,...),..." 如："(60 60, 75 60, 75 75, 60 75, 60 60),(-20 -20, -20 20, 20 20, 20 -20, -20 -20)"，每个图形首尾两个坐标是一样的，大部分情况下是一个图形，如果存在飞地这种的，就会有多个环，比如廊坊就是两块组成。

如果是EMPTY代表没有对应的信息：
geo="EMPTY"
polygon="EMPTY"




在百度地图测试页面，选到iframe上下文中执行
http://lbsyun.baidu.com/jsdemo.htm#c1_10

加载数据
	先直接运行本代码，根据提示输入data-pinyin.txt到文本框 (内容太大，控制台吃不消，文本框快很多)

然后再次运行本代码，如果中途因错误停止，根据提示重复运行
*/

var GeoStop=false;

var Load_Thread_Count=4;//模拟线程数

var PolygonMaxPoint=200;//行政区域边界最大坐标点数，如果构成polygon的point数量超过这个值，就进行抽样，相当于把过于曲折的边界稍微拉直点降低点点精度，点数过多的意义也不大
var PolygonPointFixed=6;//构成行政区域边界的坐标小数位数，5位可达到1米精度，6位是bmap的坐标转换精度






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


//人工fix数据
var fixNames={
	4190:"" //河南省 省直辖县级行政区划
	,4290:"" //湖北省 省直辖县级行政区划
	,4690:"" //海南省 省直辖县级行政区划
	,5002:"" //重庆市 县
	,6590:"" //新疆维吾尔自治区 自治区直辖县级行政区划
	
	,3712:"莱芜市" //山东省 莱芜市
};
//注册人工验证过没有边界的城市，如果发现未注册的将停止运行，修改此处后恢复
var regEmpty={

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
	
	if(o.polygon=="EMPTY" && !regEmpty[o.id]){
		o.polygon="";
		o.geo="";
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


function load(itm, next){
	if(GeoStop){
		console.error("已停止");
		return;
	};
	
	var keys=Object.keys(BMap._rd);
	var geo="EMPTY";
	var polygon="EMPTY";
	var paths=itm.paths.join(" ");
	
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
	new BMap.Boundary().get(paths,function(rs){
		if(!rs.boundaries.length){
			geo="EMPTY";//不可靠
			
			var find=regEmpty[itm.id];
			if(find){
				delete regEmpty[itm.id];
			};
			if(!find && /(新区|新城|新城区|实验区|保税区|开发区|管理区|食品区|园区|产业园|名胜区|示范区|镇|管委会|街道办事处)$/.test(itm.name)){
				find=true;//不一一列出来
			};
			if(!find){
				needReg[itm.id]=paths;
				console.error(itm.id+":"+paths+"：为空，且未在regEmpty中注册");
				
				geo="";
				polygon="";
			};
		}else{
			polygon=[];
			for(var v in rs.boundaries){
				var arr=[];
				var list=rs.boundaries[v].split(";");
				var count = list.length;
				var c=Math.floor(count/PolygonMaxPoint);//采样
				for(var i = 0; i < count; i++){
					var point=list[i].split(",");
					if(count<PolygonMaxPoint || i%c==0){
						arr.push(
							(+(+point[0]).toFixed(PolygonPointFixed))
							+" "
							+(+(+point[1]).toFixed(PolygonPointFixed)));
					}
				};
				arr.push(arr[0]);
				polygon.push(arr.join(","));
			};
			polygon="("+polygon.join("),(")+")";
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
			if(Object.keys(regEmpty).length){
				console.error("regEmpty未消除", regEmpty);
			};
			
			console.log("==完成==");
			setTimeout(endCSV);
		};
		return;
	};
	
	var next=function(){
		threadCount--;
		thread();
	};
	
	load(itm, next);
};
(function(){
	for(var i=0;i<Load_Thread_Count;i++){
		thread();
	};
})();





var FixTrim=function(name){
	return name.replace(/^\s+|\s+$/g,"");
};
function CSVName(name){
	return '"'+FixTrim(name).replace(/"/g,'""')+'"';
};
function endCSV(){
	var csv=["id,name,geo,polygon"];
	for(var i=0;i<pinyinList.length;i++){
		var o=pinyinList[i];
		
		csv.push(o.id+","+CSVName(o.name)
			+","+CSVName(o.geo)+","+CSVName(o.polygon));
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
};