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


【可剥离的库：WKT转GeoJSON】短小粗暴，将数据库ST_AsText返回的文本转成GeoJSON
	libObj.WKTList2GeoJSON
	libObj.WKT2Feature

【可剥离的库：GeoZip压缩、解压】短小粗暴，强力压缩连续的坐标点
	libObj.GeoZip
	libObj.GeoUnZip
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
						console.log("GeoECharts draw", mapDatas, geojson);
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
	/*获取一个图形的信息{point:123 总坐标点数, polygon:123 图形数}*/
	lib.FeaturePolygonInfo=function(featureItem){
		var point=0,polygon=0;
		var arr=featureItem.geometry.coordinates;
		if(featureItem.geometry.type=="Polygon"){
			arr=[arr];
		};
		for(var i=0;i<arr.length;i++){
			var a2=arr[i];
			for(var j=0;j<a2.length;j++){
				polygon++;
				point+=a2[j].length;
			};
		};
		return {point:point, polygon:polygon}
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
		var isZip=polygon.substr(0,2)=="Z:";//GeoZip压缩过
		var arr = polygon.split(/\)\s*,\s*\(/g);
		var vals = [];
		for (var i = 0, l = arr.length; i < l; i++) {
			if(isZip){
				//压缩过，解压即可
				vals.push(lib.GeoUnZip(arr[i]));
			}else{
				//普通的wkt
				var ps = arr[i].split(/\s*,\s*/g);
				var pos = [];
				for (var j = 0, jl = ps.length; j < jl; j++) {
					var v=ps[j].split(" ");
					pos.push([+v[0], +v[1]]);
				}
				vals.push(pos);
			}
		}
		return vals;
	};
	
	
	
	
	/**************自定义边界坐标压缩、解压算法****************/
	/*6位小数精度下可压缩到 1/3 - 1/5 大小。压缩代码参考自echarts（ZigZag算法）：https://github.com/apache/echarts/blob/8eeb7e5abe207d0536c62ce1f4ddecc6adfdf85e/src/util/mapData/rawData/encode.js
		【前提：数值压缩原理】
		1. 状态字节：用1个字节的2位来存储一个数的状态值：符号、溢出（数值是否超过0xff）；这个字节可以存储4个数的状态，等于2个坐标。额外将2位存储到状态字节的好处就是一个很小的数可以直接存储成0xff，且两个坐标的差值很大可能是小于0xff的；不然使用ZigZag算法符号位将占据数值的一个位变成0x7f，将会导致很多数值不能用1个字节来存储。
		2. 状态字节后面连续放4个数字，一个数字占用1-4个字节，相当于一个坐标最少只需2.5个字节，最多要8.5个字节来存储。
		3. 一个数不超过0xff大小，直接存储这个数字即可，状态字节中标记这个数字未溢出。
		4. 一个数超过0xff大小，必须使用2个以上字节来存储，第一个字节只使用低6位来存储数值，高2位存储超出了2个字节几个字节，取值0-2（3为5个字节，但js 40位的位运算太复杂，不折腾，3留着以后也许就升级支持5个字节了），数值按小端存储到这些字节的位里面。
		
		【连续边界坐标的压缩】
		1. 连续的两个坐标的差值不会太大，6位小数转成整数后（*1000000）的差值大概率小于0xff；
		2. 给定一个坐标的x或y值，后一个坐标的x或y就可以根据两个坐标的差值来得到，又因为差值一般很小，甚至可以存储成1个字节。
		3. 连续边界边界只需给出起始的第一个坐标，后续坐标都可以只存储和前一个的差值，即可完成大幅压缩。
		
		【数据存储结构】
			[起始坐标值x0][起始坐标值y0]
			[状态] [x1-x0][y1-y0] [x2-x1][y2-y1]
			[状态] [x3-x2][y3-y2] [x4-x3][y4-y3]
	*/
	
	//var lib={} //独立copy出来时，给个lib变量就不用改源码了
	var Zip_Scale=1000000;//最大支持6位小数精度（32位以上的js位运算太折腾，懒得支持4个字节以上） 最大值：1073.741823=parseInt('00111111'+'11111111'+'11111111'+'11111111',2)
	
	/*边界坐标压缩，返回base64字符串*/
	lib.GeoZip=function(points){
		var bytes=lib.GeoZipBytes(points);
		return "Z:"+btoa(bytes);
	};
	/*边界坐标解压，返回坐标数组*/
	lib.GeoUnZip=function(base64){
		var bytes=atob(base64.substr(2));
		return lib.GeoUnZipBytes(bytes);
	};
	
	
	/*边界坐标压缩，返回二进制（ASCII字符串）*/
	lib.GeoZipBytes=function(points){
		if(points.length<1){
			return "";
		};
		
		//起始坐标点，这个必须直接存起来才能解码后面的数字
		var x=Math.ceil(points[0][0]*Zip_Scale);
		var y=Math.ceil(points[0][1]*Zip_Scale);
		
		var rtv=[x+" "+y+":"],markPos=0,markLen=4;
		for(var i=1;i<points.length;i++){
			if(markLen==4){
				markLen=0;
				markPos=rtv.length;
				rtv.push(String.fromCharCode(0));
			};
			var point=points[i];
			x=_GeoZip(rtv,point[0],x,markPos,markLen++);
			y=_GeoZip(rtv,point[1],y,markPos,markLen++);
		};
		
		rtv=rtv.join("");
		if(true){//测试一下压缩的精度
			var un=lib.GeoUnZipBytes(rtv);
			if(un.length!=points.length){
				throw new Error("压缩结果还原长度不一致");
			}
			for(var i=0;i<un.length;i++){
				var p1=un[i],p2=points[i];
				if(Math.abs(p1[0]-p2[0])>0.000002 || Math.abs(p1[1]-p2[1])>0.000002){
					console.log(p1,p2);
					throw new Error("压缩结果还原精度不足");
				}
			};
		};
		return rtv;
	};
	var _GeoZip=function(rtv,cur,prev,markPos,markLen){
		cur=Math.ceil(cur*Zip_Scale);
		var val=cur-prev;
		var mark0=val<0?1:0;//符号位
		val=Math.abs(val);
		var mark1=val>0xff?1:0;//单字节是否溢出
		
		if(mark1){//溢出了，用多个字节来存储，2字节+
			if(val>1073741823){//parseInt('00111111'+'11111111'+'11111111'+'11111111',2)
				throw new Error("差值超过支持范围");
			};
			//4个字节对应的byte
			var v1=val&0b00111111
				,v2=(val>>6)&0xff
				,v3=(val>>(6+8))&0xff
				,v4=(val>>(6+16))&0xff;
			//实际多用了几个字节
			var more=0;//0就是2字节来存
			if(v4>0){
				more=2;//2+2=4字节来存
			}else if(v3>0){
				more=1;
			};
			//写入字节数
			v1=v1|(more<<6);
			
			rtv.push(String.fromCharCode(v1));
			rtv.push(String.fromCharCode(v2));
			if(more>0)rtv.push(String.fromCharCode(v3));
			if(more>1)rtv.push(String.fromCharCode(v4));
		}else{//没有溢出，直接存
			rtv.push(String.fromCharCode(val));
		}
		
		//写入符号位和溢出位标识
		var mark=rtv[markPos].charCodeAt(0);
		mark|=(mark0|(mark1<<1))<<(markLen*2);
		rtv[markPos]=String.fromCharCode(mark);
		
		return cur;
	};
	
	
	
	/*二进制（ASCII字符串）边界坐标解压，返回坐标数组*/
	lib.GeoUnZipBytes=function(bytes){
		var rtv=[];
		if(!bytes){
			return rtv;
		}
		
		//先提取出第一个坐标
		var x="",y="",isY=0;
		for(var i=0;i<bytes.length;i++){
			var chr=bytes.charAt(i);
			if(chr==':'){
				i++;break;
			}if(chr==" "){
				isY=1;
			}else if(isY){
				y+=chr;
			}else{
				x+=chr;
			};
		};
		x=+x;
		y=+y;
		rtv.push([x/Zip_Scale, y/Zip_Scale]);
		
		//继续，连续解码
		var markLen=4,mark=0;
		var refOut=[bytes,0];//有些语言字符串传参会复制新字符串
		for(;i<bytes.length;i++){
			if(markLen==4){//提取出符号+溢出标识字节
				markLen=0;
				mark=bytes.charCodeAt(i);
				continue;
			};
			refOut[1]=i;
			x=_GeoUnZip(refOut,x,mark,markLen++);
			y=_GeoUnZip(refOut,y,mark,markLen++);
			i=refOut[1]-1;
			
			rtv.push([x/Zip_Scale, y/Zip_Scale]);
		};
		return rtv;
	};
	var _GeoUnZip=function(refOut,prev,mark,markLen){
		var i=refOut[1];
		mark=mark>>(markLen*2);
		var mark0=mark&0b1;//符号位
		var mark1=(mark&0b10)>>1;//单字节是否溢出
		
		var val=refOut[0].charCodeAt(i++);
		if(mark1){//已溢出，需要读取比2字节多用了几个字节0-3
			var more=(val&0b11000000)>>6;
			val&=0b111111;
			val|=refOut[0].charCodeAt(i++)<<6;
			if(more>0)val|=refOut[0].charCodeAt(i++)<<(6+8);
			if(more>1)val|=refOut[0].charCodeAt(i++)<<(6+16);
		};
		if(mark0){//负数
			val=-val;
		};
		
		refOut[1]=i;
		return val+prev;
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