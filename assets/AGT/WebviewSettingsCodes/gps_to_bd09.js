/******************
《【插件】WGS-84 GPS/CGCS2000 转成 BD-09》
作者：高坚果
时间：2021-2-9 15:17:30

转换算法来自 https://www.oschina.net/code/snippet_260395_39205 《GPS坐标互转：WGS-84(GPS)、GCJ-02(Google地图)、BD-09(百度地图) 》已无法访问，镜像搬运： https://www.cnblogs.com/yzycoder/p/6531890.html

注：CGCS2000坐标系和GPS坐标之间的误差小到可以忽略，因此GPS坐标直接当成CGCS2000坐标来使用也是可行的，参考：https://www.zhihu.com/question/35775670。

注：上面这个来源是我早年搜索到并采用的一个转换方法，编写本代码时，重新找了一遍看看是否有更准确的算法，但翻阅了多篇博客、GitHub库(coordtransform)，虽然有各种语言，但说不上大同小异，是完全一样，囧。
******************/
(function(){

/*********实现转换接口给软件调用*********/
Runtime.AppCalls.translateGeoEnable=function(){
	return "【插件】WGS-84 GPS/CGCS2000 转成 BD-09";
};
Runtime.AppCalls.translateGeos=function(geosStr){
	var points=geosStr.split(",");
	var results=[];
	for(var i=0;i<points.length;i++){
		var p=points[i].split(" ");
		
		var val=gcj_encrypt(+p[1],+p[0]);
		val=bd_encrypt(val.lon, val.lat);
		
		results.push( (+val.lon.toFixed(6)) +" "+ (+val.lat.toFixed(6)) );
	};
	return results.join(",");
};



/*********坐标转换逻辑*********/
//https://www.oschina.net/code/snippet_260395_39205
var PI = 3.14159265358979324;
var x_pi = 3.14159265358979324 * 3000.0 / 180.0;

var bd_encrypt = function (gcjLon, gcjLat) {
	var x = gcjLon, y = gcjLat;  
	var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);  
	var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);  
	bdLon = z * Math.cos(theta) + 0.0065;  
	bdLat = z * Math.sin(theta) + 0.006; 
	return {'lat' : bdLat,'lon' : bdLon};
}
var bd_decrypt = function (bdLon, bdLat) {
	var x = bdLon - 0.0065, y = bdLat - 0.006;  
	var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);  
	var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);  
	var gcjLon = z * Math.cos(theta);  
	var gcjLat = z * Math.sin(theta);
	return {'lat' : gcjLat, 'lon' : gcjLon};
}


var delta=function (lat, lon) {
	var a = 6378245.0; //  a: 卫星椭球坐标投影到平面地图坐标系的投影因子。
	var ee = 0.00669342162296594323; //  ee: 椭球的偏心率。
	var dLat = transformLat(lon - 105.0, lat - 35.0);
	var dLon = transformLon(lon - 105.0, lat - 35.0);
	var radLat = lat / 180.0 * PI;
	var magic = Math.sin(radLat);
	magic = 1 - ee * magic * magic;
	var sqrtMagic = Math.sqrt(magic);
	dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI);
	dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI);
	return {'lat': dLat, 'lon': dLon};
};
var gcj_encrypt=function(wgsLat, wgsLon){
	var d = delta(wgsLat, wgsLon);
    return {'lat' : wgsLat + d.lat,'lon' : wgsLon + d.lon};
};


var transformLat = function (x, y) {
	var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
	ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
	ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
	ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
	return ret;
};
var transformLon = function (x, y) {
	var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
	ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
	ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
	ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
	return ret;
};




//显示控制按钮
Runtime.Ctrls([
	{html:'<span style="font-size:12px">本插件无需手动操作，在处理ok_geo.csv数据时会自动调用本坐标系转换。</span>'}
]);

})();