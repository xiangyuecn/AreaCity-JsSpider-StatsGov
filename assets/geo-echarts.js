/*
GitHub: https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov
echarts map下钻功能演示demo，包含了具体的功能实现、界面、源码生成器
*/
"use strict";
(function(){


//*********** lib ***************
function GeoEChartsLib(echarts){
/*************************
GitHub: https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov
ECharts Map四级下钻核心源码，仅供参考

【使用步骤一：获取lib对象】
var libObj=GeoEChartsLib(echarts);//如果不提供echarts对象参数，将会自动加载 libObj.path对应的js到全局中

【使用步骤二：显示ECharts】
var geoECharts=libObj.Create({
	elem:".echarts_view_div" //显示到这个div
	,api:"你的接口地址" //Geo WKT数据拉取接口地址，由后端提供，可参考demo页面中显示的后端源码
});
geoECharts.load(); //开始加载数据，加载成功后会显示图形

更多高级用法请参考下面源码中的set对象；如需绘制图形到高德地图，可以自行参考demo页面html源码。
*************************/
	var lib={
		//echarts js路径，如果不提供echarts将从这个地方加载js文件
		path:"https://cdn.jsdelivr.net/npm/echarts@4.9.0/dist/echarts.min.js"
	};
	var NOOP=function(){};
	
	lib.Create=function(set){
		return new fn(set);
	};
	var fn=function(set){
		this.set={
			//elem:"css selector" 必填echarts显示容器节点
			//,api:"" geo wkt格式数据加载接口
			
			polygonPointsMax:600 //边界采样数，一个边界最多返回这么多个点
			,zoom:1 //显示缩放
			
			,onLoadBefore:NOOP /*边界数据加载开始前回调 fn(args,loadProcess)
					args: { 加载请求的参数
						id: 0||123 要加载哪个城市的id，0为全国，返回这个城市的所有下级
						level: 0 1 2 3 要加载的城市级别，0全国，1省，2市，3区
					}
					loadProcess: fn(call:fn(next)) 自行处理函数，如果调用了本方法，代表你要自己加载数据，比如特殊缓存处理
						next:fn(apiData) 加载到接口数据后，执行本方法回传，会走后续的onLoadEnd和绘制图形
				*/
			,onLoadEnd:NOOP /*边界数据加载结束回调 fn(err,apiData,mapDatas,geojson,dataProcess)
					err: "" 如果不为空，代表加载出错
					apiData: {
						list:[
							{id: 110101001, ext_path: "北京市 北京市 东城区 安定门街道", polygon:"POLYGON((...))" }
							,...
						]
					}
					mapDatas: [
						{ 
							id: 110101001
							,level: 1-4
							,name: "安定门街道", ext_path:"北京市 北京市 东城区 安定门街道"
							,tips:"id: 110101001 <br> name: 安定门街道"
							,polygon:"POLYGON((...))"
						}
						,...
					]
					geojson: {...}
					dataProcess: fn(call:fn(next)) 自行处理函数，如果调用了本方法，代表你要自己处理数据，比如修改tips
						next:fn() 处理完成后调用本方法继续后续图形绘制
				*/
				
			,reqPost:lib.Post //post请求实现方法，默认使用普通的ajax实现
		};
		for(var k in set){
			this.set[k]=set[k];
		};
	};
	fn.prototype={
		/*加载指定的数据，或不提供参数只进行初始化显示*/
		load:function(data){
			var This=this,set=This.set;
			var cur=This.current=data||{id:0,level:0,name:"全国"};
			if(cur.level>=4){
				set.onLoadEnd("已经是最后一级了");
				return;
			};
			This.init(function(err){
				if(err){
					set.onLoadEnd(err);
					return;
				};
				var args={
					id:cur.id
					,level:cur.level
					,polygonPointsMax:set.polygonPointsMax
				};
				var cacheKey=set.polygonPointsMax+"_"+cur.id;
				
				var next=function(data){
					if(This.current.id!=cur.id){
						console.warn("结果被丢弃");
						return;
					};
					
					var mapDatas=[];
					var arr=data.list||[];
					for(var i=0;i<arr.length;i++){
						var obj=arr[i];
						var paths=(obj.ext_path||"").split(" ");
						var name=paths[paths.length-1];
						var o={
							id:obj.id
							,level:cur.level+1
							,name:name
							,ext_path:obj.ext_path
							,polygon:obj.polygon
							,tips:"id: "+obj.id+"<br>name: "+name
						};
						
						mapDatas.push(o);
					};
					
					var geojson=lib.WKTList2GeoJSON(mapDatas);
					echarts.registerMap('City'+cur.id, geojson);
					
					var end=function(){
						console.log("GeoECharts draw", mapDatas);
						This.draw(cur.id, mapDatas);
					};
					var hasProcess=false;
					set.onLoadEnd("",data,mapDatas,geojson,function(call){
						hasProcess=true;
						call(end);
					});
					if(hasProcess){
						return;
					};
					end();
				};
				var loadApi=function(){
					console.log("GeoECharts api加载："+cacheKey);
					set.reqPost(set.api,args,function(data){
						lib.CacheDB.Set(cacheKey,JSON.stringify({
							time:Date.now()
							,data:data
						}),NOOP,NOOP);
						
						next(data);
					},function(err){
						err="GeoECharts api调用失败："+err;
						console.error(err,args);
						set.onLoadEnd(err);
					});
				};
				
				//开始加载数据前处理
				var hasProcess=false;
				set.onLoadBefore(args,function(call){
					hasProcess=true;
					call(next);
				});
				if(hasProcess){
					return;
				};
				
				//发起请求前先尝试读取缓存
				lib.CacheDB.Get(cacheKey,function(val){
					var obj=ParseObject(val);
					if(obj.time && Date.now()-obj.time<15*24*60*60*1000){
						console.log("GeoECharts 使用缓存: "+cacheKey);
						next(obj.data);
						return;
					}
					loadApi();
				},loadApi);
			});
		}
		/*重新加载当前数据并重绘*/
		,reload:function(){
			this.load(this.current);
		}
		
		
		/*echarts库初始化*/
		,init:function(call){
			var This=this;
			var calls=This.initCalls||[];This.initCalls=calls;
			if(call){
				calls.push(call);
			};
			
			var endCall=function(err){
				This.initStatus=0;
				if(!err){
					This.initStatus=10;
				}else{
					console.error(err);
				};
				for(var i=0;i<calls.length;i++){
					calls[i](err);
				}
				This.initCalls.length=0;
			};
			if(This.initStatus==10){
				endCall();
				return;
			};
			if(This.initStatus==1){
				return;
			};
			This.initStatus=1;
			
			
			//准备echarts库
			if(!echarts && window.echarts && window.echarts.registerMap){
				echarts=window.echarts;
			};
			if(!echarts){
				var elem=document.createElement("script");
				elem.setAttribute("type","text/javascript");
				elem.setAttribute("src",lib.path);
				elem.onload=function(){
					if(window.echarts){
						This.initStatus=0;
						This.init();//重新干它就完了
					}else{
						endCall("加载echarts.js失败:无echarts全局变量");
					};
				};
				elem.onerror=function(e){
					endCall("加载echarts.js失败:"+(e.message||"-"));
				};
				document.body.appendChild(elem);
				return;
			};
			
			var elem=This.set.elem;
			if(typeof(elem)=="string"){
				elem=document.querySelector(elem);
			};
			if(!elem){
				endCall("set.elem不存在");
				return;
			};
			this.elem=elem;
			
			//打开本地数据库
			lib.CacheDB.Ready(function(err){
				if(err){
					console.warn("GeoECharts缓存失效："+err);
				};
				
				console.log("GeoECharts init ok");
				endCall();
			});
		}
		
		
		
		
		/*echarts map绘制*/
		,draw:function(id,data){
			var This=this,set=this.set,elem=This.elem;
			if(!elem){
				return;
			};
			var chartView = elem.chartView;
			if(chartView){
				chartView.dispose();
			}
			chartView=echarts.init(elem);
			elem.chartView=chartView;
			chartView.on("click",function(e){
				console.log("map click",e);
				var o=e.data;
				This.load({id:o.id, level:o.level, name:o.name});
			});
			chartView.on("dblclick",function(e){
				console.log("map dblclick",e);
			});
			chartView.setOption({
				tooltip: {
					trigger: 'item'
					,formatter: function(e){
						return e.data.tips||"无信息";
					}
				},
				
				series: [
					{
						type: 'map'
						,mapType: 'City'+id
						,scaleLimit:{ min:1 }
						,zoom:set.zoom
						,label: {
							show:true
							,textStyle: {
								color: "#fff"
								,textShadowColor:"#000"
								,textShadowBlur:3
							}
						}
						,emphasis:{
							label: {
								color: "#fa0"
							}
						}
						,select:{
							label: {
								color: "#fa0"
							}
							,itemStyle:{
								areaColor: "#184cff",
								shadowOffsetX: 0,
								shadowOffsetY: 0,
								shadowBlur: 5,
								borderWidth: 0,
								shadowColor: "rgba(0, 0, 0, 0.5)"
							}
						}
						,itemStyle: {
							normal: {
								areaColor: "#0d0059",
								borderColor: "#389dff",
								borderWidth: 1, //设置外层边框
								shadowBlur: 5,
								shadowOffsetY: 8,
								shadowOffsetX: 0,
								shadowColor: "#01012a"
							},
							emphasis: {
								areaColor: "#184cff",
								shadowOffsetX: 0,
								shadowOffsetY: 0,
								shadowBlur: 5,
								borderWidth: 0,
								shadowColor: "rgba(0, 0, 0, 0.5)"
							}
						}
						,roam:true
						,data: data
					}
				]
			});
		}
	};

	
	
	
	
	
	
	/*post接口请求*/
	lib.Post=function(url,data,True,False){
		var xhr=new XMLHttpRequest();
		xhr.timeout=20000;
		xhr.open("POST",url);
		xhr.onreadystatechange=function(){
			if(xhr.readyState==4){
				if(xhr.status==200){
					try{
						var o=JSON.parse(xhr.responseText);
					}catch(e){};
					
					if(o.c!==0 || !o.v){
						False(o.m||"接口返回非预定义json数据");
						return;
					};
					True(o.v,o);
				}else{
					False("请求失败["+xhr.status+"]");
				}
			}
		};
		var arr=[];
		for(var k in data){
			arr.push(k+"="+encodeURIComponent(data[k]));
		};
		xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
		xhr.send(arr.join("&"));
	};

	
	
	
	
	
	/*是否隐藏三沙市*/
	lib.Polygon4603Hide=false;
	
	
	
	
	/*判断geojson是否是空的*/
	lib.IsEmptyGeoJSON=function(featureCollection){
		var arr=featureCollection&&featureCollection.features||[];
		if(!arr.length){
			return true;
		}
		for(var i=0;i<arr.length;i++){
			if(arr[i].geometry.coordinates.length){
				return false;
			}
		}
		return true;
	};
	
	
	
	/*将wkt列表转成geojson FeatureCollection对象
		wktList:[
			{
				id:123
				,name:"武汉"
				,polygon:"POLYGON((...))" "MULTIPOLYGON(((...)),((...)))" "EMPTY"
				,其他属性
			}
		]
	*/
	lib.WKTList2GeoJSON=function(wktList){
		var features=[];
		var geoJson={type:"FeatureCollection",features:features};
		
		for(var i=0;i<wktList.length;i++){
			var item=wktList[i];
			if(item.id==4603 && lib.Polygon4603Hide){//三沙市特殊处理
				continue;
			}
			features.push(lib.WKT2Feature(item,item.polygon));
		}
		return geoJson;
	};
	/*将wkt字符串转成geojson Feature元素
		prop:{
			id:123
			,name:"武汉"
			,其他属性
		}
		wkt: "POLYGON((...))" "MULTIPOLYGON(((...)),((...)))" "EMPTY"
	*/
	lib.WKT2Feature=function(prop,wkt){
		var feature={
			type: "Feature"
			,properties: prop
			,geometry:{
				type: "Polygon"
				,coordinates:[]
			}
		};
		var geometry=feature.geometry;
		
		if(wkt.indexOf("EMPTY")+1){
			//NOOP
		}else if(wkt.indexOf("POLYGON")==0){
			geometry.coordinates=parsePolygon(wkt.replace(/^POLYGON\s*\(\(|\)\)$/ig,""));
		}else if(wkt.indexOf("MULTIPOLYGON")==0){
			geometry.type="MultiPolygon";
			var ps=wkt.replace(/^MULTIPOLYGON\s*\(\(\(|\)\)\)$/ig,"").split(/\)\)\s*,\s*\(\(/g);
			var maxIdx=0,max=0;
			for(var i2=0;i2<ps.length;i2++){
				var arr=parsePolygon(ps[i2]);
				if(arr[0].length>max){
					max=arr[0].length;
					maxIdx=i2;
				}
				geometry.coordinates.push(arr);
			}
			if(prop.id==46 && lib.Polygon4603Hide){//海南省界特殊处理
				geometry.coordinates=[geometry.coordinates[maxIdx]];
			}
		}
		return feature;
	};
	var parsePolygon=function(polygon){
		var arr = polygon.split(/\)\s*,\s*\(/g);
		var vals = [];
		for (var i = 0, l = arr.length; i < l; i++) {
			var ps = arr[i].split(/\s*,\s*/g);
			var pos = [];
			for (var j = 0, jl = ps.length; j < jl; j++) {
				var v=ps[j].split(" ");
				pos.push([+v[0], +v[1]]);
			}
			vals.push(pos);
		}
		return vals;
	};
	
	
	/************Indexdb缓存数据库，边界数据量太大，缓存到Indexdb无限制*************/
	lib.CacheDB={
		Ready:function(call){
			var This=this;
			var calls=This.initCalls||[];This.initCalls=calls;
			if(call){
				calls.push(call);
			};
			
			var endCall=function(err){
				This.initStatus=0;
				if(!err){
					This.initStatus=10;
				}else{
					console.error(err);
					This.initErr=err;
				};
				for(var i=0;i<calls.length;i++){
					calls[i](err);
				}
				This.initCalls.length=0;
			};
			if(This.initErr){
				endCall(This.initErr);
				return;
			};
			if(This.initStatus==10){
				endCall();
				return;
			};
			if(This.initStatus==1){
				return;
			};
			This.initStatus=1;
			
			if(!window.indexedDB){
				endCall("浏览器不支持Indexdb");
				return;
			};
			var fail=function(e){
				var err="GeoECharts数据库打开失败："+e.message;
				console.error(err,e);
				endCall(err);
			};
			try{
				var DBi=indexedDB.open('cache_geo_echarts', 1);
				DBi.onupgradeneeded=function(e){
					var db = e.target.result;
					if (!db.objectStoreNames.contains('keyvalue')) {
						var tab = db.createObjectStore('keyvalue', {
							keyPath: "key"
						});
					};
				};
				DBi.onsuccess=function(e){
					This.DB=e.target.result;
					endCall();
				};
				DBi.onerror=fail;
			}catch(e){
				fail(e);
			}
		}
		,Get:function(key,True,False){
			if(this.initStatus!=10){
				False("GeoECharts数据库未准备好");
				return;
			};
			var fail=function(e){
				var err="GeoECharts数据库读取["+key+"]失败："+e.message;
				console.error(err,e);
				False(err);
			};
			try{
				var tran=this.DB.transaction('keyvalue');
				var req=tran.objectStore('keyvalue').get(key);
				req.onsuccess = function (e) {
					True(req.result&&req.result.value||"");
				};
				req.onerror=fail;
			}catch(e){
				fail(e);
			}
		}
		,Set:function(key,val,True,False){
			if(this.initStatus!=10){
				False("GeoECharts数据库未准备好");
				return;
			};
			var fail=function(e){
				var err="GeoECharts数据库保存数据["+key+"]失败："+e.message;
				console.error(err,e);
				False(err);
			};
			try{
				var tran=this.DB.transaction('keyvalue', 'readwrite');
				var req=tran.objectStore('keyvalue').put({
					desc:"无需采集，仔细看demo页面，数据可以直接下载",
					key:key, value:val
				});
				req.onsuccess = function (e) {
					True();
				};
				req.onerror=fail;
			}catch(e){
				fail(e);
			}
		}
	};
	
	return lib;
};
//*********** lib end ************









window.GeoECharts={
	IsMobile:/mobile/i.test(navigator.userAgent)
};
GeoECharts.GeoEChartsLib=GeoEChartsLib;







//根目录
var Root=location.href;
if(/(.+)\/assets\//.test(Root)){
	Root=RegExp.$1;
}else{
	Root=/(.+?)(\/[^\/]*)?$/.exec(Root)[1];
};


//悬浮挂件
GeoECharts.CreateWidget=function(set){
	set=set||{};
	
	var width="300px",height="260px";
	if(GeoECharts.IsMobile){
		var mel=set.mobElem;
		if(mel){
			mel.innerHTML='<div class="GeoEChartsWidget_render" style="line-height:0;padding: 12px;border-radius: 12px;background: linear-gradient(160deg, rgba(0,179,255,.7) 20%, rgba(177,0,255,.7) 80%);"></div>';
		};
	}else{
		var ls=document.querySelectorAll(".GeoEChartsWidget");
		for(var i=0;i<ls.length;i++){
			ls[0].parentNode.removeChild(ls[0]);
		};
		
		var fixedElem=document.createElement("div");
		fixedElem.innerHTML='\
<div class="GeoEChartsWidget" style="z-index:'+getZIndex()+';position: fixed;display:flex;align-items:center;justify-content:center;bottom:10px;right:5px">\
	<div onclick="GeoECharts.WidgetShow(0)" style="position: absolute;font-size:32px;cursor: pointer;top: 0;right:8px;color:#fff;">×</div>\
	<div class="GeoEChartsWidget_render" style="line-height:0;padding: 12px;border-radius: 12px;background: linear-gradient(160deg, rgba(0,179,255,.7) 20%, rgba(177,0,255,.7) 80%);"></div>\
</div>';
		document.body.appendChild(fixedElem);
	};
	var elem=document.querySelector(".GeoEChartsWidget_render");
	if(!elem){
		console.warn("GeoECharts.CreateWidget未提供显示容器",set);
		return;
	};
	
	elem.innerHTML='<iframe src="'+Root+'/assets/geo-echarts.html#widget=1" style="width:'+width+';height:'+height+';border:none">';
	
	GeoECharts.WidgetShow(localStorage["GeoEChartsWidget_SetShow"]!="0");
};
GeoECharts.WidgetShow=function(show){
	localStorage["GeoEChartsWidget_SetShow"]=show?1:0;
	
	var ls=document.querySelectorAll(".GeoEChartsWidget2");
	for(var i=0;i<ls.length;i++){
		ls[0].parentNode.removeChild(ls[0]);
	};
	
	var el=document.querySelector(".GeoEChartsWidget");
	if(!el)return;
	el.style.display=show?'block':'none';
	
	if(!show){
		var fixedElem=document.createElement("div");
		fixedElem.innerHTML='\
<div onclick="GeoECharts.WidgetShow(1)" class="GeoEChartsWidget2" style="z-index:'+getZIndex()+';position: fixed;display:flex;align-items:center;justify-content:center;bottom:10px;right:5px">\
	<div style="padding: 12px 18px;border-radius: 12px;background: linear-gradient(160deg, rgba(0,179,255,.7) 20%, rgba(177,0,255,.7) 80%); font-size:12px;color:#fff;cursor: pointer;">边界<br>预览</div>\
</div>';
		document.body.appendChild(fixedElem);
	};
};

var getZIndex=function(){
	var zIndex=1;
	var all=document.querySelectorAll("*");
	for(var i=0;i<all.length;i++){
		var v=+getComputedStyle(all[i]).zIndex||0;
		if(v>zIndex){
			zIndex=v+1;
		};
	};
	return zIndex;
};
GeoECharts.getZIndex=getZIndex;


})();