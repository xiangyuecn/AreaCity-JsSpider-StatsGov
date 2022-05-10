$(function(){
$(".dropChoiceBox").html(`
<div class="${GeoECharts.IsMobile?'':'FlexBox'}">
	<style>
	.dropChoiceFileBox{border: 3px dashed #a2a1a1;background:#eee;}
	.dropChoiceWKTBox{border: 3px solid #bbb;background:#eee;}
	.dropChoiceFileBox:hover,.dropChoiceWKTBox:hover{border-color:#fa0;background:#fff6e3}
	</style>
	<div class="FlexItem">
		<div class="dropChoiceFileBox" onclick="$('.dropChoiceInputFile').click()" style="padding:30px 0; text-align:center;cursor: pointer;">
			拖拽多个 .geojson|.json 文件到本页面，或点此选择文件立即绘图
		</div>
		<input type="file" class="dropChoiceInputFile" style="display:none" multiple="multiple">
	</div>
	<div style="padding-left:10px">
		<div class="dropChoiceWKTBox input" onclick="dropChoiceWKTClick()" style="padding:18px 10px; text-align:center;cursor: pointer;">
			<div>点此粘贴</div>
			WKT文本
		</div>
	</div>
	<div style="padding:8px 0 0 10px">
		<div>文件编码：<input class="dropChoiceEncode" style="width:80px" value="utf-8"></div>
		<div>保留已绘制的：<input class="dropChoiceAppend" type="checkbox" checked></div>
		<div>名称字段：<input class="dropChoiceNameKey" style="width:80px" value="name"></div>
	</div>
</div>
<div class="dropChoiceLogs"></div>
`);

//处理拖拽进来的geojson文件，直接绘制
$("body").bind("dragover",function(e){
	e.preventDefault();
}).bind("drop",function(e){
	e.preventDefault();
	
	readChoiceFile(e.originalEvent.dataTransfer.files);
});
$(".dropChoiceInputFile").bind("change",function(e){
	readChoiceFile(e.target.files);
});


//输入的wkt文本，解析成geojson后绘制
window.dropChoiceWKTClick=function(){
	PageModule.prompt({useTextarea:1,tips:"请输入WKT文本:"},"",function(val){
		readChoiceWKT(val);
	});
	$(".ConfirmBox").css("width","65vw")
	$(".PromptBox textarea").attr("placeholder",`【支持粘贴文本内容格式】：
- 查询结果的单个纯WKT文本（需留意WKT过长时有没有被查询工具截断），如：
	POLYGON(( ... ))

- 查询结果复制为多行文本，如：
	POLYGON(( ... ))
	可选名称 POLYGON(( ... ))
	.. 可选名称 MULTIPOLYGON((( ... ))) ..

- 查询结果复制为Insert、Update多行SQL语句，如：
	insert xx(..) values(..,'前一字符串始终作为名称','MULTIPOLYGON(( ... ))',..)
	update xx set name='前一字符串始终作为名称',polygon=ST_GeomFromText('POLYGON(( ... ))')
`).css("height","260px");
};



var choiceFeatures=[],choiceID=0;
var log,encode,nameKey,append;
var init=function(msg){
	encode=$(".dropChoiceEncode").val()||"utf-8";
	nameKey=$(".dropChoiceNameKey").val()||"name";
	append=$(".dropChoiceAppend")[0].checked;
	if(!append){
		choiceFeatures=[];
		$(".dropChoiceLogs").html("");
	};
	
	log=function(msg,color){
		$(".dropChoiceLogs").prepend('<div style="padding-left:25px;border-top: 1px solid #eee;color:'+(!color?"":color==1?"red":color==2?"#0b1":color)+'">'+msg+'</div>');
	};
	log(msg+"，配置: "
		+JSON.stringify({encode:encode,append:append,nameKey:nameKey})
		+"，开始处理...");
};
var drawMap=function(){
	//绘图，照抄GeoECharts.load
	var mapDatas=[],existsName={};
	var geojson={type: "FeatureCollection",features:[]};
	var arr=choiceFeatures;
	for(var i=0;i<arr.length;i++){
		var obj=arr[i],prop=obj.properties;
		var id=prop.id;
		var name=prop.raw[nameKey];
		if(name==null){
			name="[数据中无"+nameKey+"字段]";
		}else{
			name=name||"[无名称]";
		}
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
		console.log("readChoiceFile draw", mapDatas, geojson);
	
		echarts.registerMap('City'+"fromFile", geojson);
		geoECharts.draw("fromFile", mapDatas);
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





var readChoiceWKT=function(txt){
	var lines=[];
	txt=txt.trim();
	if(txt){
		lines=txt.split(/(?:\s*[\r\n]+\s*)+/);
	}
	
	init("发现"+lines.length+"行WKT数据");
	console.log("WKT文本行",lines);
	
	choiceID++;
	var polygonCount=0,errCount=0,isCSV=0,oneLineErr=0;
	for(var idx=0;idx<lines.length;idx++){
		var line=lines[idx];
		var m=/^(.*?)(POLYGON\s*\(\(.+?\)\)|MULTIPOLYGON\s*\(\(\(.+?\)\)\))/i.exec(line);
		if(!m){
			if(idx==0)oneLineErr=1;
			errCount++;
			log("第"+(idx+1)+"行未发现WKT数据: "+FormatText(line.substr(0,50)),1);
			continue;
		}
		var leftTxt=m[1],wkt=m[2],name="";
		
		//提取左边的名称
		if(/'([^']+)'\s*,\s*(\s*[`\[\]\w]+\s*[=\(])*\s*'$/.test(leftTxt)){//SQL Insert Update ST_GeomFromText(
			name=RegExp.$1;
		}else if(/([\s,])["']?$/.test(leftTxt)){//分隔符类的，csv
			var arr=leftTxt.split(RegExp.$1);
			name=arr[arr.length-2].replace(/["']/g,"");
			isCSV=1;
		}
		name=name.trim();
		
		var raw={
			id:(choiceID*-1e8)+choiceFeatures.length
		};raw[nameKey]=name;
		var prop={
			isTemp:true
			,id:raw.id
			,raw:raw
		};
		
		var feature=geoEChartsLib.WKT2Feature(prop,wkt);
		if(!feature.geometry.coordinates.length){
			errCount++;
			log("第"+(idx+1)+"行WKT解析后没有坐标数据: "+FormatText(line.substr(0,50)),1);
			continue;
		}
		
		polygonCount++;
		choiceFeatures.push(feature);
	};
	if(isCSV && oneLineErr && polygonCount){
		errCount--;
	}
	
	var msg="已处理完所有WKT数据行，新增"+polygonCount+"个边界，共"+choiceFeatures.length+"个边界"
		+(errCount?"，有"+errCount+"行WKT数据处理出错":"")
		+"。";
	log(msg,errCount?1:2);
	Toast(msg,errCount?1:2);
	
	drawMap();
};



var readChoiceFile=function(files){
	if(!files.length){
		return;
	};
	PageModule.maskLoad("文件处理中...");
	
	init("发现"+files.length+"个文件");
	
	var idx=-1,errCount=0;
	var run=function(){
		idx++;
		if(idx>=files.length){
			PageModule.closeMask();
			var msg="已处理完所有文件，共"+choiceFeatures.length+"个边界"
				+(errCount?"，有"+errCount+"个文件处理出错":"")
				+"。";
			log(msg,errCount?1:2);
			Toast(msg,errCount?1:2);
			
			drawMap();
			return;
		};
		
		var fileID=++choiceID;
		var file = files[idx];
		var reader = new FileReader();
		reader.onload = function(e){
			var txt=reader.result;
			try{
				if(!/^\s*\{/.test(txt)){
					throw new Error("不是geojson文件");
				}
				var json=JSON.parse(txt);
				if(json.type!="FeatureCollection"){
					throw new Error("不是FeatureCollection");
				}
				var features=json.features||[];
				if(!features.length){
					throw new Error("没有一个feature，空文件无需处理");
				}
				var polygonCount=0;
				for(var i=0;i<features.length;i++){
					var o=features[i]||{},geom=o.geometry||{};
					if(geom.type=="Polygon" || geom.type=="MultiPolygon"){
						polygonCount++;
						choiceFeatures.push(o);
						
						var prop=o.properties||{};
						o.properties={
							isTemp:true
							,id:(fileID*-1e8)+choiceFeatures.length
							,raw:prop
						};
					}
				}
				log("文件："+file.name+" 解析成功，发现："+polygonCount+"个边界"+(polygonCount!=features.length?"，"+(features.length-polygonCount)+"个其他数据":""),2);
				
				run();
			}catch(e){
				errCount++;
				var msg="文件："+file.name+" 解析json失败："+e.message;
				log(msg,1);Toast(msg,1);
				run();
			};
		}
		reader.readAsText(file,encode);
	};
	run();
};
});









//地图坐标显示
$(function(){
if(!window.map)return;

$(".mapPointView").html(`
<style>
.mapView .amap-marker-label{
	border:none;
	background:none;
	padding:0;
}
</style>
<div class="FlexBox" style="line-height:24px;">
	<div style="font-size:13px">
		坐标
		<input class="mapPointTxt" placeholder="单击高德地图|填：经度 纬度" style="width:170px;font-size:13px;height:16px;">
		<span class="Btn BtnMin" onclick="mapPointShowClick()">标注</span>
		<span class="Btn BtnMin mapPointClearBtn" onclick="mapPointReview(1)" style="display:none">清空</span>
	</div>
	<div class=""></div>
	<div class="FlexItem"></div>
</div>
<div class="mapPointLogs"></div>
`);
map.on("click",function(e){
	$(".mapPointTxt").val(e.lnglat.lng+" "+e.lnglat.lat);
});

var log=function(msg,color){
	$(".mapPointLogs").prepend('<div style="padding-left:25px;border-top: 1px solid #eee;color:'+(!color?"":color==1?"red":color==2?"#0b1":color)+'">'+msg+'</div>');
};
window.mapPointShowClick=function(){
	var val=$(".mapPointTxt").val().trim();
	if(!val){
		return Toast("请填写坐标",1);
	}
	var m=/^([\d\.]+)[^\d]+([\d\.]+)$/.exec(val)||[];
	var lng=+m[1]||0,lat=+m[2]||0;
	if(!lng || !lat){
		return Toast("请正确填写坐标",1);
	}
	if(lat>lng){
		var v=lng;lng=lat;lat=v;
		log("已交换经纬度顺序","#fa0");
	};
	var gpsObj=PointConvert.gcj_encrypt(lat,lng);
	var bd09Obj=PointConvert.bd_decrypt(lat,lng);
	
	var gcj02=[+lng.toFixed(6),+lat.toFixed(6)];
	var bd09=[+bd09Obj.lon.toFixed(6),+bd09Obj.lat.toFixed(6)];
	var gps=[+gpsObj.lon.toFixed(6),+gpsObj.lat.toFixed(6)];
	
	var tag='['+(++tagIdx)+"] ";
	var ss=function(v){ return v[0].toFixed(6)+" "+v[1].toFixed(6); };
	log('<div style="font-family: monospace;">'
		+'<div>'+tag+'输入GCJ-02坐标 原样显示 ：'+ss(gcj02)+'</div>'
		+'<div style="color:#ba4e4e"'
			+'>'+tag+'输入WGS-84坐标转成GCJ-02：'+ss(gps)+'</div>'
		+'<div style="color:#d89c09"'
			+'>'+tag+'输入BG-09转成GCJ-02显示 ：'+ss(bd09)+'</div>'
	+'</div>');
	
	var arr=[
		{p:gcj02,t:"GCJ-02",c:"#666"}
		,{p:gps,t:"WGS-84",c:"#ba4e4e"}
		,{p:bd09,t:"BG-09",c:"#d89c09"}
	];
	for(var i=0;i<arr.length;i++){
		var o=arr[i];
		markerList.push(new AMap.Marker({ position: o.p,
			label:{
				offset: new AMap.Pixel(2, -5), direction: "right",
				content: '<div style="padding:3px 5px;border-radius:4px;color:#fff;background:'+o.c+'">'+tag+o.t+'</div>'
			}
		}));
	};
	$(".mapPointClearBtn").show();
	mapPointReview();
};
var markerList=[],tagIdx=0;
window.mapPointReview=function(clear){
	for(var i=0;i<markerList.length;i++){
		markerList[i].setMap(clear?null:map);
	}
	if(clear){
		markerList=[];tagIdx=0;
		$(".mapPointLogs").html("");
	}
};




// 转换算法来自 https://www.oschina.net/code/snippet_260395_39205 《GPS坐标互转：WGS-84(GPS)、GCJ-02(Google地图)、BD-09(百度地图) 》已无法访问，镜像搬运： https://www.cnblogs.com/yzycoder/p/6531890.html
window.PointConvert= {
    PI : 3.14159265358979324,
    x_pi : 3.14159265358979324 * 3000.0 / 180.0,
    delta : function (lat, lon) {
        // Krasovsky 1940
        //
        // a = 6378245.0, 1/f = 298.3
        // b = a * (1 - f)
        // ee = (a^2 - b^2) / a^2;
        var a = 6378245.0; //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
        var ee = 0.00669342162296594323; //  ee: 椭球的偏心率。
        var dLat = this.transformLat(lon - 105.0, lat - 35.0);
        var dLon = this.transformLon(lon - 105.0, lat - 35.0);
        var radLat = lat / 180.0 * this.PI;
        var magic = Math.sin(radLat);
        magic = 1 - ee * magic * magic;
        var sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * this.PI);
        dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * this.PI);
        return {'lat': dLat, 'lon': dLon};
    },
     
    //WGS-84 to GCJ-02
    gcj_encrypt : function (wgsLat, wgsLon) {
        if (this.outOfChina(wgsLat, wgsLon))
            return {'lat': wgsLat, 'lon': wgsLon};
 
        var d = this.delta(wgsLat, wgsLon);
        return {'lat' : wgsLat + d.lat,'lon' : wgsLon + d.lon};
    },
    //GCJ-02 to WGS-84
    gcj_decrypt : function (gcjLat, gcjLon) {
        if (this.outOfChina(gcjLat, gcjLon))
            return {'lat': gcjLat, 'lon': gcjLon};
         
        var d = this.delta(gcjLat, gcjLon);
        return {'lat': gcjLat - d.lat, 'lon': gcjLon - d.lon};
    },
    //GCJ-02 to WGS-84 exactly
    gcj_decrypt_exact : function (gcjLat, gcjLon) {
        var initDelta = 0.01;
        var threshold = 0.000000001;
        var dLat = initDelta, dLon = initDelta;
        var mLat = gcjLat - dLat, mLon = gcjLon - dLon;
        var pLat = gcjLat + dLat, pLon = gcjLon + dLon;
        var wgsLat, wgsLon, i = 0;
        while (1) {
            wgsLat = (mLat + pLat) / 2;
            wgsLon = (mLon + pLon) / 2;
            var tmp = this.gcj_encrypt(wgsLat, wgsLon)
            dLat = tmp.lat - gcjLat;
            dLon = tmp.lon - gcjLon;
            if ((Math.abs(dLat) < threshold) && (Math.abs(dLon) < threshold))
                break;
 
            if (dLat > 0) pLat = wgsLat; else mLat = wgsLat;
            if (dLon > 0) pLon = wgsLon; else mLon = wgsLon;
 
            if (++i > 10000) break;
        }
        //console.log(i);
        return {'lat': wgsLat, 'lon': wgsLon};
    },
    //GCJ-02 to BD-09
    bd_encrypt : function (gcjLat, gcjLon) {
        var x = gcjLon, y = gcjLat;  
        var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * this.x_pi);  
        var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * this.x_pi);  
        bdLon = z * Math.cos(theta) + 0.0065;  
        bdLat = z * Math.sin(theta) + 0.006; 
        return {'lat' : bdLat,'lon' : bdLon};
    },
    //BD-09 to GCJ-02
    bd_decrypt : function (bdLat, bdLon) {
        var x = bdLon - 0.0065, y = bdLat - 0.006;  
        var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * this.x_pi);  
        var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * this.x_pi);  
        var gcjLon = z * Math.cos(theta);  
        var gcjLat = z * Math.sin(theta);
        return {'lat' : gcjLat, 'lon' : gcjLon};
    },
    //WGS-84 to Web mercator
    //mercatorLat -> y mercatorLon -> x
    mercator_encrypt : function(wgsLat, wgsLon) {
        var x = wgsLon * 20037508.34 / 180.;
        var y = Math.log(Math.tan((90. + wgsLat) * this.PI / 360.)) / (this.PI / 180.);
        y = y * 20037508.34 / 180.;
        return {'lat' : y, 'lon' : x};
    },
    // Web mercator to WGS-84
    // mercatorLat -> y mercatorLon -> x
    mercator_decrypt : function(mercatorLat, mercatorLon) {
        var x = mercatorLon / 20037508.34 * 180.;
        var y = mercatorLat / 20037508.34 * 180.;
        y = 180 / this.PI * (2 * Math.atan(Math.exp(y * this.PI / 180.)) - this.PI / 2);
        return {'lat' : y, 'lon' : x};
    },
    // two point's distance
    distance : function (latA, lonA, latB, lonB) {
        var earthR = 6371000.;
        var x = Math.cos(latA * this.PI / 180.) * Math.cos(latB * this.PI / 180.) * Math.cos((lonA - lonB) * this.PI / 180);
        var y = Math.sin(latA * this.PI / 180.) * Math.sin(latB * this.PI / 180.);
        var s = x + y;
        if (s > 1) s = 1;
        if (s < -1) s = -1;
        var alpha = Math.acos(s);
        var distance = alpha * earthR;
        return distance;
    },
    outOfChina : function (lat, lon) {
        /*if (lon < 72.004 || lon > 137.8347)
            return true;
        if (lat < 0.8293 || lat > 55.8271)
            return true;*/
        return false;
    },
    transformLat : function (x, y) {
        var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * this.PI) + 40.0 * Math.sin(y / 3.0 * this.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * this.PI) + 320 * Math.sin(y * this.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    },
    transformLon : function (x, y) {
        var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * this.PI) + 40.0 * Math.sin(x / 3.0 * this.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * this.PI) + 300.0 * Math.sin(x / 30.0 * this.PI)) * 2.0 / 3.0;
        return ret;
    }
};

});









/*********显示源代码********/
$(function(){
	var elem=$(".codeEditJs");
	var w=elem.width();
	var edit=CodeMirror.fromTextArea(elem[0],{
			mode:"javascript"
			,lineNumbers:true
			,lineWrapping:true
		});
	window.CodeEditJs=edit;
	edit.setSize(w+"px","auto");

	edit.setValue(GeoECharts.GeoEChartsLib.toString());
	edit.refresh();
	
	elem=$(".codeEditCs");
	var w=elem.width();
	var edit=CodeMirror.fromTextArea(elem[0],{
			mode:"javascript"
			,lineNumbers:true
			,lineWrapping:true
		});
	window.CodeEditJs=edit;
	edit.setSize(w+"px","auto");

	var CS_Code=`
/*************************
这个源码就是本页面用到的api接口源码（C#），贴出来主要是方便大家借鉴，直接copy是无法使用的。

【禁】 > 源码都让你看了，请不要搞我的服务器哦~ <


【WKT】mysql、sqlserver直接查询出来的 polygon 一般是二进制格式，需要使用数据库内置的 ST_AsText 方法转换成 WKT (Well Known Text) 文本；sql查询语句：
[MySQL] select id,ext_path,ST_AsText(polygon) as polygon from AreaCity_Geo where id=11
[MSSQL] select id,ext_path,polygon.STAsText() as polygon from AreaCity_Geo where id=11


【采样抽稀】省市区三级边界数据，一半以上边界的坐标点超过1000个点，超过1万个坐标点边界有80个，超过3万个坐标点的边界有11个；内蒙的边界坐标点数最多（5万个点），转成文本后超过1MB大小，重采样成600个点后变成16KB大小；在大部分ECharts显示场合，重采样抽稀后边界外观基本上是一致的（下面源码中有一段边界质量优化的代码对超大的边界进行了增强处理），数据量已经大幅减少；本算法仅为简单的对一个环进行坐标删除，未考虑相邻区域的拓扑结构，如需高质量的精简+保持拓扑结构，可以参考MapShaper的simplify实现：https://github.com/mbloch/mapshaper/tree/master/src/simplify

【GeoZip压缩、解压】本代码内实现了一套压缩解压的代码，6位小数精度下可压缩到 1/3 - 1/5 大小。压缩代码参考自echarts（ZigZag算法）：https://github.com/apache/echarts/blob/8eeb7e5abe207d0536c62ce1f4ddecc6adfdf85e/src/util/mapData/rawData/encode.js
*************************/



	/// <summary>
	/// GitHub测试页面 ECharts Map四级下钻需要用到的边界拉取接口
	/// AreaCity-JsSpider-StatsGov
	/// </summary>
	public class areacity_geo {

		static private readonly Dictionary<string, Dictionary<string, object>> Cache = new Dictionary<string, Dictionary<string, object>>();

		static public void main() {
			var ctx = ServiceContext.Current;
			var req = RequestContext.Current;

			string refHost = "";
			if (req.Context.RequestReferrer != null) {
				refHost = req.Context.RequestReferrer.Host;
			}
			if (Exp_Host.IsMatch(refHost)) {
				req.Context.ResponseHead("Access-Control-Allow-Origin", "*");
			} else {
				ctx.error("当前页面不可以调用本接口");
				return;
			}



			var rtvData = new Dictionary<string, object>();
			ctx.Value = rtvData;

			var pid = req.getInt("id");
			var level = req.getInt("level");
			var polygonPointsMax = req.getInt("polygonPointsMax");

			polygonPointsMax = Math.Max(polygonPointsMax, 100);
			if (polygonPointsMax > 1200) {
				ctx.error("边界采样数超过限制");
				return;
			}


			var useCache = polygonPointsMax == 600;
			if (level == 3) {
				polygonPointsMax = 80;
				useCache = true;
			}
			rtvData["_PolygonPointsMax"] = polygonPointsMax;
			rtvData["_Pid"] = pid;

			if (useCache) {
				var cache = Cache.getOrNull(pid + "");
				if (cache != null) {
					long time = cache.getLong("time");
					if (Unit.GetMS() - time < 24 * 60 * 60 * 1000) {
						rtvData["list"] = cache.getOrNull("list");
						rtvData["_Cache"] = time;
						return;
					}
				}
			}



			List<Dictionary<string, object>> dbList;
			if (level == 0 || level == 1 || level == 2) {

				//省市区边界
				FieldRead FR = DBTable.AreaCityGeo.FRReadOrWrite();
				FR.AddInt("id");
				FR.AddString("ext_path");
				FR.AddString("polygon", "polygon.STAsText()", "", true);
				dbList = FR.QueryAll(new SQL().Cmd("pid=").Int(pid));

			} else if (level == 3) {

				//乡镇边界，最高80个点，数据库中只有最后一个是有边界数据，其他的都是外接矩形框
				FieldRead FR = DBTable.AreaCityGeo4.FRReadOrWrite();
				FR.AddInt("id", "unique_id");
				FR.AddString("ext_path");
				FR.AddString("last_time");
				FR.AddString("polygon", "polygon.STAsText()", "", true);
				dbList = FR.QueryAll(new SQL().Cmd("pid=").Int(pid));

			} else {
				ctx.error("level值" + level + "无效");
				return;
			}

			List<Dictionary<string, object>> list = new List<Dictionary<string, object>>();
			rtvData["list"] = list;
			foreach (var item in dbList) {
				Dictionary<string, object> obj = new Dictionary<string, object>();
				list.Add(obj);

				obj["id"] = item.getOrNull("id");
				obj["ext_path"] = item.getOrNull("ext_path");
				if (level == 3) {
					obj["last_time"] = item.getOrNull("last_time");
				}
				obj["polygon"] = FormatPolygon(item.getString("polygon"), polygonPointsMax);
			}

			if (useCache) {
				Dictionary<string, object> cache = new Dictionary<string, object>();
				cache["time"] = Unit.GetMS();
				cache["list"] = list;
				Cache[pid + ""] = cache;
			}
		}


		static private string FormatPolygon(string wkt, int pointsMax) {
			string[] wkts;
			if (wkt.Contains("EMPTY")) {
				return wkt;
			} else if (wkt.StartsWith("POLYGON")) {
				wkt = Exp_1.Replace(wkt, "");
				wkts = new string[] { wkt };
			} else if (wkt.StartsWith("MULTIPOLYGON")) {
				wkt = Exp_2.Replace(wkt, "");
				wkts = Exp_3.Split(wkt);
			} else {
				return "POLYGON EMPTY";
			}

			var multiArr = new List<List<List<double[]>>>();
			var allPs = new List<List<double[]>>();
			foreach (var pl in wkts) {
				var pls = Exp_4.Split(pl);
				var plArr = new List<List<double[]>>();
				multiArr.Add(plArr);

				foreach (var line in pls) {
					var ps = new List<string>(Exp_5.Split(line));
					var ps2 = new List<double[]>(ps.Count);
					plArr.Add(ps2);
					allPs.Add(ps2);
					foreach (var p in ps) {
						var p2 = p.Split(' ');
						var x = double.Parse(p2[0]);
						var y = double.Parse(p2[1]);
						ps2.Add(new double[] { x, y });
					}
				}
			}
			allPs.Sort((a, b) => {
				return b.Count - a.Count;
			});

			int count3j = 0;
			for (int i = 3; i < allPs.Count; i++) {
				count3j += allPs[i].Count;
			}
			for (int i = 0; i < allPs.Count; i++) {
				List<double[]> arr = allPs[i];
				int max = pointsMax;
				if (i == 0) {//首个环使用最大点数
					//NOOP
				} else if (i == 1 || i == 2) {//后两个环各使用1/3点数
					max = pointsMax / 3;
				} else {//后续的共享1/3点数，但最大可以有8个点
					max = pointsMax / 3 * arr.Count / count3j;
					max = Math.Max(max, 8);
				}
				if (arr.Count <= max) {
					continue;//无需处理
				}

				//如果是第一个环，并且点数非常多，将进行质量控制，间距过大的点优先保留，间距低的点优先删除
				bool quality = i == 0 && arr.Count > max * 10;

				double lineTotal = 0;//粗略计算边界长度
				if (quality) {
					double[] prev = null;
					for (var i2 = 0; i2 < arr.Count; i2++) {
						var cur = arr[i2];
						if (prev != null) {
							lineTotal += (Math.Abs(prev[0] - cur[0]) + Math.Abs(prev[1] - cur[1]));
						}
						prev = cur;
					}
				}
				double widthBase = lineTotal / max; //均分长度


				List<double[]> arr2 = null;
				for (var i2 = 1; i2 <= 2; i2++) {//质量处理 或者 放弃
					bool useQuality = quality && i2 != 2;//最后一次将放弃
					double widthMax = widthBase * 2;//超过这个间距的点全部保留
					double widthMin = widthBase * (0.1 * i2);//低于这个间距的点全部删除

					arr2 = new List<double[]>();

					//抽样处理
					double c = 1d * max / arr.Count;//采样率
					double pos = 0;
					int posCur = -1;
					double[] cur, prev = null;
					for (int j = 0; j < arr.Count - 1; j++) {
						cur = arr[j];
						if (useQuality && prev != null) {
							//质量控制，粗略计算间距
							var jl = (Math.Abs(prev[0] - cur[0]) + Math.Abs(prev[1] - cur[1]));
							if (jl > widthMax) {
								//间距过大的全部保留
								prev = cur;
								arr2.Add(cur);
								pos = 0;
								posCur = 0;
								continue;
							}
							if (jl < widthMin) {
								//间距过低的全部不要
								continue;
							}
						}

						pos += c;
						if (posCur != (int)pos) {
							prev = cur;
							arr2.Add(cur);
							posCur = (int)pos;
						}
					}

					if (!useQuality || arr2.Count < max * 1.5) {
						//基本达标，不用再抽了
						break;
					}
				}
				arr.Clear();
				arr.AddRange(arr2);
			}

			//还原成wkt文本
			StringBuilder str = new StringBuilder();
			if (multiArr.Count > 1) {
				str.Append("MULTIPOLYGON(");
			} else {
				str.Append("POLYGON");
			}
			for (int i = 0; i < multiArr.Count; i++) {
				var plArr = multiArr[i];
				if (i > 0) {
					str.Append(",");
				}
				str.Append("((");
				for (var j = 0; j < plArr.Count; j++) {
					var ps = plArr[j];
					if (j > 0) {
						str.Append("),(");
					}

					if (true) {
						//返回压缩后的边界数据，大幅减少流量
						ps.Add(ps[0]);//闭环
						str.Append(GeoZip(ps));
					} else { 
						//返回原始wkt数据
						for (var n = 0; n < ps.Count; n++) {
							if (n > 0) {
								str.Append(",");
							}
							str.Append(ps[n][0] + " " + ps[n][1]);
						}

						str.Append(",");
						str.Append(ps[0][0] + " " + ps[0][1]);//闭环
					}
				}
				str.Append("))");
			}
			if (multiArr.Count > 1) {
				str.Append(")");
			}
			return str.ToString();
		}
		static private readonly Regex
			Exp_1 = new Regex(@"^POLYGON\s*\(\(|\)\)$")
			, Exp_2 = new Regex(@"^MULTIPOLYGON\s*\(\(\(|\)\)\)$")
			, Exp_3 = new Regex(@"\)\)\s*,\s*\(\(")
			, Exp_4 = new Regex(@"\)\s*,\s*\(")
			, Exp_5 = new Regex(@"\s*,\s*")

			, Exp_Host = new Regex(@"(?:\.(?:gitee|github)\.io)(?:\:\d+)?$")
			;



		static private long Zip_Scale = 1000000;//最大支持6位小数精度
		/// <summary>
		/// 边界坐标压缩，返回base64字符串
		/// </summary>
		static public string GeoZip(List<double[]> points) {
			var bytes = GeoZipBytes(points);
			return "Z:" + Convert.ToBase64String(bytes);
		}
		/// <summary>
		/// 边界坐标解压，返回坐标数组
		/// </summary>
		static public List<double[]> GeoUnZip(string base64) {
			if (string.IsNullOrEmpty(base64) || base64.Length<3) {
				return new List<double[]>();
			}
			var bytes = Convert.FromBase64String(base64.Substring(2));
			return GeoUnZipBytes(bytes);
		}
		/// <summary>
		/// 边界坐标压缩，返回二进制
		/// </summary>
		static public byte[] GeoZipBytes(List<double[]> points) {
			if (points == null || points.Count < 1) {
				return new byte[0];
			}

			var point0 = points[0];
			var x = (long)Math.Ceiling(point0[0] * Zip_Scale);
			var y = (long)Math.Ceiling(point0[1] * Zip_Scale);

			var rtv = new MemoryStream();
			rtv.write(x + " " + y + ":");
			int markPos = 0, markLen = 4;
			for (var i = 1; i < points.Count; i++) {
				if (markLen == 4) {
					markLen = 0;
					markPos = (int)rtv.Length;
					rtv.WriteByte(0);
				}
				var point = points[i];
				x = _GeoZip(rtv, point[0], x, markPos, markLen++);
				y = _GeoZip(rtv, point[1], y, markPos, markLen++);
			}

			byte[] rtv2 = rtv.ToArray();
			if (true) {//测试一下压缩的精度
				var un = GeoUnZipBytes(rtv2);
				if (un.Count != points.Count) {
					throw new Exception("压缩结果还原长度不一致");
				}
				for (var i = 0; i < un.Count; i++) {
					double[] p1 = un[i], p2 = points[i];
					if (Math.Abs(p1[0] - p2[0]) > 0.000002 || Math.Abs(p1[1] - p2[1]) > 0.000002) {
						throw new Exception("压缩结果还原精度不足"+ un[i]+" - "+ points[i]);
					}
				};
			};
			return rtv2;
		}
		static private long _GeoZip(MemoryStream rtv, double cur_, long prev, int markPos, int markLen) {
			long cur = (long)Math.Ceiling(cur_ * Zip_Scale);
			long val = cur - prev;
			var mark0 = val < 0 ? 1 : 0;//符号位
			val = Math.Abs(val);
			var mark1 = val > 0xff ? 1 : 0;//单字节是否溢出

			if (mark1>0) {//溢出了，用多个字节来存储，2字节+
				if (val > 1073741823) {//parseInt('00111111'+'11111111'+'11111111'+'11111111',2)
					throw new Exception("差值超过支持范围");
				}
				//4个字节对应的byte，ps：java byte是有符号的
				byte v1 = (byte)(val & 0b00111111)
					, v2 = (byte)((val >> 6) & 0xff)
					, v3 = (byte)((val >> (6 + 8)) & 0xff)
					, v4 = (byte)((val >> (6 + 16)) & 0xff);
				//实际多用了几个字节
				var more = 0;//0就是2字节来存
				if (v4 > 0) {
					more = 2;//2+2=4字节来存
				} else if (v3 > 0) {
					more = 1;
				};
				//写入字节数
				v1 = (byte)(v1 | (more << 6));

				rtv.WriteByte(v1);
				rtv.WriteByte(v2);
				if (more > 0) rtv.WriteByte(v3);
				if (more > 1) rtv.WriteByte(v4);
			} else {//没有溢出，直接存
				rtv.WriteByte((byte)val);
			}

			//写入符号位和溢出位标识
			var bakPos = rtv.Position;
			rtv.Position = markPos;
			var mark = rtv.ReadByte();
			mark |= (mark0 | (mark1 << 1)) << (markLen * 2);

			rtv.Position = markPos;
			rtv.WriteByte((byte)mark);
			rtv.Position = bakPos;

			return cur;
		}

		/// <summary>
		/// 二进制边界坐标解压，返回坐标数组
		/// </summary>
		static public List<double[]> GeoUnZipBytes(byte[] bytes) {
			List<double[]> rtv = new List<double[]>();
			if (bytes==null || bytes.Length<1) {
				return rtv;
			}

			//先提取出第一个坐标
			string xS = "", yS = "";
			bool isY = false;
			var i = 0;
			for (; i < bytes.Length; i++) {
				var chr = bytes[i];
				if (chr == ':') {
					i++; break;
				}
				if (chr == ' ') {
					isY = true;
				} else if (isY) {
					yS += (char)chr;
				} else {
					xS += (char)chr;
				}
			};
			long x = long.Parse(xS);
			long y = long.Parse(yS);
			rtv.Add(new double[] { 1d * x / Zip_Scale, 1d * y / Zip_Scale });

			//继续，连续解码
			int markLen = 4;byte mark = 0;
			int[] refOut = new int[] { -1, 0 };
			for (; i < bytes.Length; i++) {
				if (markLen == 4) {//提取出符号+溢出标识字节
					markLen = 0;
					mark = bytes[i];
					continue;
				};
				refOut[1] = i;
				x = _GeoUnZip(bytes, refOut, x, mark, markLen++);
				y = _GeoUnZip(bytes, refOut, y, mark, markLen++);
				i = refOut[1] - 1;

				rtv.Add(new double[] { 1d * x / Zip_Scale, 1d * y / Zip_Scale });
			}
			return rtv;
		}
		static private long _GeoUnZip(byte[] bytes, int[] refOut, long prev, byte mark, int markLen) {
			var i = refOut[1];
			mark = (byte)(mark >> (markLen * 2));
			var mark0 = mark & 0b1;//符号位
			var mark1 = (mark & 0b10) >> 1;//单字节是否溢出

			var val = (int)bytes[i++];
			if (mark1>0) {//已溢出，需要读取比2字节多用了几个字节0-3
				var more = (val & 0b11000000) >> 6;
				val &= 0b111111;
				val |= bytes[i++] << 6;
				if (more > 0) val |= bytes[i++] << (6 + 8);
				if (more > 1) val |= bytes[i++] << (6 + 16);
			};
			if (mark0>0) {//负数
				val = -val;
			};

			refOut[1] = i;
			return val + prev;
		}

	}
`;

	edit.setValue(CS_Code.trim());
	edit.refresh();
});