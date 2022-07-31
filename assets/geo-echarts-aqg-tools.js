//调用AreaCity-Query-Geometry坐标边界查询工具的HTTP API接口来绘制图形
$(function(){
$(".aqgToolsBox").html(`
<div>
	<span style="margin-right:20px">工具地址: <input style="width:160px"
		class="aqgToolsUrl" value="http://127.0.0.1:9527/"></span>
	<span style="margin-right:20px">查询操作: <select class="aqgToolsActions" style="padding: 4px 0;"></select></span>
	<span style="margin-right:20px">查询参数: <input class="aqgToolsArgs" style="width:200px"></span>
	<span style="margin-right:10px"><span class="Btn" onclick="aqgToolsQueryClick()">执行查询</span></span>
	
	<input class="aqgToolsAppend" type="checkbox">保留已绘制的
</div>

<div class="aqgToolsDesc"></div>
<div class="aqgToolsLogs"></div>

<div style="padding-top:10px;font-size:14px;color:#888">
	操作步骤：
	1、到<a href="https://github.com/xiangyuecn/AreaCity-Query-Geometry" target="_blank">AreaCity-Query-Geometry</a>开源库（<a href="https://gitee.com/xiangyuecn/AreaCity-Query-Geometry" target="_blank">Gitee镜像库</a>）下载工具源码；
	2、双击源码内的“编译和运行Test.java直接测试.bat”运行工具（电脑上需先装好JDK）；
	3、工具内根据菜单提示进行初始化（需先用下面“数据下载”中的转换工具将ok_geo.csv转成geojson格式）；
	4、工具内启动HTTP API服务。
</div>
`);

var log=function(msg,color){
	$(".aqgToolsLogs").prepend('<div style="padding-left:25px;border-top: 1px solid #eee;color:'+(!color?"":color==1?"red":color==2?"#0b1":color)+'">'+msg+'</div>');
};

var extPathDesc='请在查询参数中填写：`[deep:]ext_path`；ext_path部分：会查询出和ext_path完全相同值的边界（如: "湖北省 武汉市"），首尾支持*通配符（如: *武汉*），或填*匹配所有；[deep:]部分可选，来限制只返回特定层级的数据，deep取值：0省1市2区县3乡镇，比如: 2:湖北* 查询湖北所有区级数据';
var actions=[
	{
		name:"【边界】查询城市或下级边界"
		,desc:extPathDesc
		,exec:function(url,args){extPathQuery(url+"readWKT",args)}
	}
	,{
		name:"【坐标】查询坐标点所在的城市边界"
		,desc:'请在查询参数中填写坐标，格式：`lng lat`（允许有逗号）；比如：114.044346 22.691963，为广东省 深圳市 龙华区；请注意：坐标系必须和边界数据的坐标系一致'
		,exec:function(url,args){pointQuery(url+"queryPoint",args)}
	}
	,{
		name:"【Debug】读取边界网格划分图形"
		,desc:extPathDesc
		,exec:function(url,args){extPathQuery(url+"debugReadGeometryGridSplitsWKT",args)}
	}
];


var html=['<option>======请选择需要的查询操作======</option>'];
for(var i=0;i<actions.length;i++){
	html.push('<option value="'+(i+1)+'">'+actions[i].name+'</option>');
}
var actionsEl=$(".aqgToolsActions")
	.html(html.join(" "))
	.bind("change",function(){
		$(".aqgToolsDesc").html("");
		var action=actions[+this.value-1];
		if(action){
			$(".aqgToolsDesc").html('<span style="color:#fa0">'+action.name+'：</span>'+action.desc);
		}
	});

window.aqgToolsQueryClick=function(){
	var url=$(".aqgToolsUrl").val();
	var action=actions[+$(".aqgToolsActions").val()-1];
	var args=$(".aqgToolsArgs").val();
	var append=$(".aqgToolsAppend")[0].checked;
	
	var err;
	if(!err && !url) err="请填写工具地址";
	if(!err && !action) err="请选择查询操作";
	if(!err && !args) err="请选填写查询参数";
	if(err){
		log(err,1);
		return;
	}
	
	if(!append){
		$(".aqgToolsLogs").html("");
		clearFeatures();
	};
	log("正在执行："+action.name+"... "+JSON.stringify({args:args,append:append,url:url}));
	
	action.exec(url,args);
};


var pointQuery=function(url,args){
	var arr=args.split(/[,\s]+/);
	var lng=NaN,lat=NaN;
	if(arr.length==2){
		lng=+arr[0];lat=+arr[1];
	}
	if(isNaN(lng) || isNaN(lat)){
		log("坐标参数格式不正确",1);
		return;
	}
	url+="?lng="+lng+"&lat="+lat+"&returnWKTKey=polygon";
	var t1=Date.now();
	geoEChartsLib.Post(url,{},function(data){
		mapPointAdd("查询坐标点",lng,lat);
		addFeatures(Date.now()-t1,data);
	},function(err){
		log(err,1);
	});
};
var extPathQuery=function(url,args){
	var arr=/^(?:(\d)[:：\s]+)?(.*)$/.exec(args);
	if(!arr){
		log("参数格式不正确",1);
		return;
	}
	var deep=arr[1]||"",extPath=arr[2]||"";
	
	url+="?deep="+deep+"&extPath="+extPath+"&returnWKTKey=polygon";
	var t1=Date.now();
	geoEChartsLib.Post(url,{},function(data){
		addFeatures(Date.now()-t1,data);
	},function(err){
		log(err,1);
	});
};



var Features=[],QueryID=0;
var clearFeatures=function(){
	mapPointClear();
	Features=[];
};
var addFeatures=function(loadMs,data){
	var arr=data.list;
	if(!arr.length){
		log("未查询到匹配的边界！",1);
		return;
	}
	arr.sort(function(a,b){return b.polygon.length-a.polygon.length});//大的放前面，免得覆盖住小的
	
	QueryID++;
	var polygonCount=0,errCount=0;
	for(var i=0;i<arr.length;i++){
		var raw=arr[i];
		var prop={
			isTemp:true
			,id:(QueryID*-1e8)+Features.length
			,raw:raw
		};
		var feature=geoEChartsLib.WKT2Feature(prop,raw.polygon);
		if(!feature.geometry.coordinates.length){
			errCount++;
			log("第"+(i+1)+"个WKT解析后没有坐标数据: "+raw.ext_path,1);
			continue;
		}
		
		polygonCount++;
		Features.push(feature);
	}
	
	var t1=Date.now();
	drawMap();
	
	var msg="已处理完所有查询数据，查询耗时："+loadMs+"ms，绘制耗时："+(Date.now()-t1)+"ms"
		+"，新增"+polygonCount+"个边界，共"+Features.length+"个边界"
		+(errCount?"，有"+errCount+"个数据处理出错":"")
		+"。";
	log(msg,errCount?1:2);
	Toast(msg,errCount?1:2);
};


var drawMap=function(){
	//绘图，照抄GeoECharts.load
	var mapDatas=[],existsName={};
	var geojson={type: "FeatureCollection",features:[]};
	var arr=Features;
	for(var i=0;i<arr.length;i++){
		var obj=arr[i],prop=obj.properties;
		var id=prop.id;
		var name=prop.raw.name||"[无name]";
		var en=existsName[name]=(existsName[name]||0)+1;
		if(en>1){
			name=name+" ["+en+"]";
		};
		
		var o={
			id:id
			,name:name
			,isTemp:true
		};
		prop.name=name;
		
		mapDatas.push(o);
		geojson.features.push(obj);
	};
	
	geoECharts.current=levels[0];//路径定位到全国
	var end=function(){
		console.log("aqgToolsQuery draw", mapDatas, geojson);
	
		echarts.registerMap('City'+"fromAQG", geojson);
		geoECharts.draw("fromAQG", mapDatas);
	}
	var hasProcess=false;
	geoECharts.set.onLoadEnd("",null,mapDatas,geojson,function(call){
		hasProcess=true;
		call(end);
	});
	if(hasProcess){
		return;
	};
	end();
};

});