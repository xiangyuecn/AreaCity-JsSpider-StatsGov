/******************
《【测试框架】测试GCJ-02坐标转换成其他坐标后的精度》
作者：高坚果
时间：2020-05-30 23:39:53
******************/
(function(){
window.test_translateGeos=function(toType,loop){
	if(!Runtime.AppCalls.translateGeos){
		Runtime.Log("无启用的转换插件",1);
		return;
	};
	Runtime.Mask("测试中...");
	loop=loop||1000;
	
	var t1=Date.now();
	for(var n=0;n<loop;n++){
		var results=[];
		for(var i=0;i<Points.length;i++){
			var itm=Points[i];
			var val=Runtime.AppCalls.translateGeos(itm.GCJ02);
			results.push({obj:itm,val:val});
		};
	};
	var t2=Date.now();
	
	//统计数据
	var count=n*Points.length;
	var ms=((t2-t1)/count).toFixed(4);
	
	for(var i=0;i<results.length;i++){
		var itm=results[i];
		var pt=itm.obj[toType];
		var p1=pt.split(" ");
		var p2=itm.val.split(" ");
		var p3=itm.obj.GCJ02.split(" ");
		itm.distance=GetDistance(+p1[0],+p1[1],+p2[0],+p2[1]);
		itm.distance2=GetDistance(+p1[0],+p1[1],+p3[0],+p3[1]);
		itm.pt=pt;
	};
	results.sort(function(a,b){
		return b.distance-a.distance;
	});
	
	//显示数据
	var html=['<table border=1><tr><td>地点</td><td>GCJ02偏移量</td><td>GCJ02</td><td>真实'+toType+'</td><td>转换结果</td><td>转换误差</td></tr>'];
	for(var i=0;i<results.length;i++){
		var itm=results[i];
		html.push("<tr>");
		html.push("<td>"+itm.obj.Name+"</td>");
		html.push("<td>"+itm.distance2.toFixed(2)+"米</td>");
		html.push("<td>"+itm.obj.GCJ02+"</td>");
		html.push("<td>"+itm.pt+"</td>");
		html.push("<td style='color:"+(itm.distance<10?"green":"red")+"'>"+itm.val+"</td>");
		html.push("<td style='color:"+(itm.distance<10?"green":"red")+"'>"+itm.distance.toFixed(2)+"米</td>");
		html.push("</tr>");
	};
	html.push('</table>');
	
	Runtime.Log(
		(toType=="WGS84"?"测试用的真实WGS84坐标为Google卫星地图上先手动获取的原始粗略GPS坐标点，并经过高德地图官方接口反向转换后进行微调，使GPS坐标转换成高德坐标和原始高德坐标一致，但两个坐标在各自卫星地图上观察存在10米内的偏差(应该是不同卫星图片之间的误差，海拔越高偏差越大？)。<br>":"")
		+(toType=="BD09"?"测试用的真实BD09坐标采用百度地图的官方接口从GCJ02转换而来，并经过高德地图官方接口反向校对，虽然都是官方接口，但两个坐标在各自卫星地图上观察存在1米内的误差(应该是不同卫星图片之间的误差)。<br>":"")
		
		+count+"次坐标计算共耗时"+(t2-t1)+"ms，单个："+ms+"ms"
		+html.join("\n"));
	Runtime.Mask(false);
};

//真实GCJ-02和目标坐标对照表，手动测量了要测试的坐标点，手动量点误差10米左右算是正常
var Points=[
	{
		Name:"北京西站" //站台右下角
		,GCJ02:"116.324945 39.893892"
		,WGS84:"116.318830 39.892596"//此值通过高德地图接口反向转换后和GCJ02基本一致就ok
		,BD09 :"116.331535 39.899648"//此值通过高德地图接口反向转换后和GCJ02基本一致就ok
	},
	
	{
		Name:"伊春市博物馆" //旁边水上公园中间这个圆心
		,GCJ02:"128.886140 47.722157"
		,WGS84:"128.879130 47.719938"
		,BD09 :"128.892487 47.728517"
	},
	
	{
		Name:"阿勒泰政府" //大楼右下角旁边圆心
		,GCJ02:"88.131565 47.826797"
		,WGS84:"88.128159 47.825456"
		,BD09 :"88.138189 47.832555"
	},
	
	{
		Name:"喀什人民广场" //右下角圆心
		,GCJ02:"75.993829 39.466443"
		,WGS84:"75.990850 39.466199"
		,BD09 :"76.000341 39.472392"
	},
	
	{
		Name:"西藏阿里高级中学" //足球场中心
		,GCJ02:"80.090769 32.495571"
		,WGS84:"80.088505 32.498005"
		,BD09 :"80.097338 32.501351"
	},
	
	{
		Name:"拉萨市第八中学" //足球场中心
		,GCJ02:"91.159730 29.656359"
		,WGS84:"91.158185 29.659070"
		,BD09 :"91.166290 29.662224"
	},
	
	{
		Name:"海西德令哈体育场" //足球场中心
		,GCJ02:"97.374356 37.370546"
		,WGS84:"97.373517 37.370038"
		,BD09 :"97.380972 37.376270"
	},
	
	{
		Name:"昆明市第三中学" //足球场中心
		,GCJ02:"102.835905 24.885967"
		,WGS84:"102.834472 24.889025"
		,BD09 :"102.842345 24.892272"
	},
	
	{
		Name:"南宁广西体育中心" //旁边网球馆旁边的圆圈中心
		,GCJ02:"108.396318 22.759446"
		,WGS84:"108.392222 22.762133"
		,BD09 :"108.402824 22.765337"
	},
			
	{
		Name:"海口国贸中心" //大厦右下角
		,GCJ02:"110.320328 20.023252"
		,WGS84:"110.315975 20.025323"
		,BD09 :"110.326844 20.029079"
	},
			
	{
		Name:"福州格致中学" //足球场中心
		,GCJ02:"119.306994 26.079410"
		,WGS84:"119.302195 26.082510"
		,BD09 :"119.313499 26.085470"
	},
			
	{
		Name:"杭州站" //火车站站台右下角
		,GCJ02:"120.183175 30.242733"
		,WGS84:"120.178548 30.245124"
		,BD09 :"120.189767 30.248378"
	},
	
	{
		Name:"青岛体育中心" //旁边跳水馆左上角的圆圈中心
		,GCJ02:"120.449043 36.104124"
		,WGS84:"120.443980 36.103870"
		,BD09 :"120.455534 36.110102"
	},
	
	{
		Name:"武汉大学" //正门牌楼中心
		,GCJ02:"114.358281 30.53335"
		,WGS84:"114.352774 30.535679"
		,BD09 :"114.364696 30.539693"
	},
	
	{
		Name:"兰州站" //站台天桥右下第三根交界
		,GCJ02:"103.851217 36.03363"
		,WGS84:"103.848820 36.033975"
		,BD09 :"103.857832 36.039357"
	}
];

/*
高德：https://lbs.amap.com/api/javascript-api/example/other-gaode/othertoamap
显示卫星图：
	layers: [new AMap.TileLayer.Satellite(),new AMap.TileLayer.RoadNet()],
显示点击坐标：
	map.on('click', function(e){console.log(e.lnglat.getLng()+" "+e.lnglat.getLat());map.add(new AMap.Marker({position:e.lnglat}));});
清除：
	map.clearMap()

转换：
	convertFrom(lnglat,type)： type:baidu gps
		map.clearMap()
		map.add(m2);
		map.setZoomAndCenter(30,resLnglat)
*/

/*
百度：http://lbsyun.baidu.com/jsdemo.htm#a5_2
显示卫星图：
	bm.addControl(new BMap.MapTypeControl({mapTypes:[BMAP_NORMAL_MAP,BMAP_HYBRID_MAP]}));
	bm.enableScrollWheelZoom(true);
显示点击坐标：
	bm.addEventListener("click",function(e){top.header.innerHTML=e.point.lng + " " + e.point.lat;bm.addOverlay(new BMap.Marker(e.point));});
清除：
	bm.clearOverlays()
转换：
	convertor.translate(pointArr, 3, 5, translateCallback)
	top.header.innerHTML=data.points[0].lng.toFixed(6) + " " + data.points[0].lat.toFixed(6);
*/





test_translateGeos.randomTest=function(testCount,loop,enc,dec){
	for(var i=0;i<testCount;i++){
		var t1=Date.now();
		var val=rndTest(loop,enc,dec);
		Runtime.Log('随机'+loop+'个坐标加密后再还原，经纬度平均误差[耗时'+(Date.now()-t1)+'ms]：'
			+'<div style="padding-left:70px">'+val.lng.toFixed(6)+" "+val.lat.toFixed(6)
			+' ('+GetDistance(100,30,100+val.lng,30+val.lat).toFixed(2)+'米)'
			+' , 最大误差'+val.lngM.toFixed(6)+" "+val.latM.toFixed(6)
			+' ('+GetDistance(100,30,100+val.lngM,30+val.latM).toFixed(2)+'米)'
			+'</div>');
	}
};
var rndTest=function(loop,enc,dec){
	var lngX=0,latX=0,lngM=0,latM=0;
	for(var i=0;i<loop;i++){
		do{
			var lng=+(73+Math.random()*100).toFixed(6);
			var lat=+(1+Math.random()*100).toFixed(6);
		}while(lng>137 || lat>55);
		var e=enc(lng,lat);
		var d=dec(e.lng,e.lat);
		
		var lng_=+Math.abs(lng-d.lng).toFixed(6);
		var lat_=+Math.abs(lat-d.lat).toFixed(6);
		lngX+=lng_;
		latX+=lat_;
		lngM=Math.max(lngM,lng_);
		latM=Math.max(latM,lat_);
	}
	return {
		lng:+(lngX/loop).toFixed(6), lat:+(latX/loop).toFixed(6)
		,lngM:lngM, latM:latM
	};
};



/*
获取两个坐标的距离，单位米
GetDistance(lng1, lat1, lng2, lat2)
*/
var GetDistance=test_translateGeos.GetDistance=(function(){
	var fD=function(a, b, c) {
		for (; a > c;)
			a -= c - b;
		for (; a < b;)
			a += c - b;
		return a;
	};
	var jD=function(a, b, c) {
		b != null && (a = Math.max(a, b));
		c != null && (a = Math.min(a, c));
		return a;
	};
	var yk=function(a) {
		return Math.PI * a / 180
	};
	var Ce=function(a, b, c, d) {
		var dO = 6370996.81;
		return dO * Math.acos(Math.sin(c) * Math.sin(d) + Math.cos(c) * Math.cos(d) * Math.cos(b - a));
	};
	return function(lng1, lat1, lng2, lat2) {
		lng1 = fD(lng1, -180, 180);
		lng2 = fD(lng2, -180, 180);
		lat1 = jD(lat1, -74, 74);
		lat2 = jD(lat2, -74, 74);
		return Ce(yk(lng1), yk(lng2), yk(lat1), yk(lat2))||0;
	};
})();

})();