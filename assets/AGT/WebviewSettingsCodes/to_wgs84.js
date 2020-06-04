/******************
《【插件】GCJ-02 转成 WGS-84 GPS 谷歌地图坐标【误差约10米内】》
作者：高坚果
时间：2020-05-30 23:39:53

ok_geo.csv中的数据是GCJ-02坐标系坐标，GCJ-02(火星坐标)是在WGS-84(GPS坐标)基础上加偏移量变成的加密坐标；火星坐标如果不纠正偏移量，直接当GPS坐标使用，会有几百米的误差，如果精度要求不高可以不转换坐标系；有精度要求时可使用本插件进行转换，可以将几百米的误差降低到差不多10米以内。

如果需要更高精度，需要自行寻找更高精度的反解算法，如果有的话，参考本代码编写新的插件即可转换。

转换算法来自 https://www.oschina.net/code/snippet_260395_39205

注：上面这个来源是我早年搜索到并采用的一个转换方法，编写本代码时，重新找了一遍看看是否有更准确的算法，但翻阅了多篇博客、GitHub库(coordtransform)，虽然有各种语言，但说不上大同小异，是完全一样，囧。

为什么GCJ-02反解出WGS-84很困难？这就是“SM模组”(“保密插件”)72行代码设计精巧之处，参考下方的transformLat、transformLon加偏算法这两个很长的多项式，就算已知加偏算法公式，求它的反函数是非常困难的，目前只能通过二分法来逼近求解，参考：https://www.zhihu.com/question/29806566
******************/
(function(){

/*********实现转换接口给软件调用*********/
Runtime.AppCalls.translateGeoEnable=function(){
	return "【插件】GCJ-02 转成 WGS-84 GPS 谷歌地图坐标【误差约10米内】";
};
Runtime.AppCalls.translateGeos=function(geosStr){
	var points=geosStr.split(",");
	var results=[];
	for(var i=0;i<points.length;i++){
		var p=points[i].split(" ");
		
		//var val=gcj_decrypt_exact(+p[0],+p[1]); //无限迭代逼近反解GCJ-02，计算量颇大
		var val=gcj_decrypt(+p[0],+p[1]); //一次计算，比gcj_decrypt_exact结果只差一点点
		
		results.push( (+val.lon.toFixed(6)) +" "+ (+val.lat.toFixed(6)) );
	};
	return results.join(",");
};



/*********坐标转换逻辑*********/
//https://www.oschina.net/code/snippet_260395_39205
var PI = 3.14159265358979324;

//转换方法一
var gcj_decrypt = function (gcjLon, gcjLat) {
	var d = delta(gcjLat, gcjLon);
	return {'lat': gcjLat - d.lat, 'lon': gcjLon - d.lon};
};
//转换方法二
var gcj_decrypt_exact=function(gcjLon, gcjLat) {
	var initDelta = 0.01;
	var threshold = 0.000000001;
	var dLat = initDelta, dLon = initDelta;
	var mLat = gcjLat - dLat, mLon = gcjLon - dLon;
	var pLat = gcjLat + dLat, pLon = gcjLon + dLon;
	var wgsLat, wgsLon, i = 0;
	while (1) {
		wgsLat = (mLat + pLat) / 2;
		wgsLon = (mLon + pLon) / 2;
		var tmp = gcj_encrypt(wgsLat, wgsLon)
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
};



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





/*****加载测试框架，测试转换精度*****/
Runtime.Import([
	{url:RootFolder+"/AGT/WebviewSettingsCodes/test_translateGeos.js",check:function(){return !window.test_translateGeos}}
]);
//显示控制按钮
Runtime.Ctrls([
	{name:"测试转换精度",click:"wgs84Test"}
	,{html:'<span style="font-size:12px">本插件无需手动操作，在处理ok_geo.csv数据时会自动调用本坐标系转换；转换前你可以点击“测试转换精度”来查看当前代码的转换精度是否符合你的要求。</span>'}
]);

window.wgs84Test=function(){
	test_translateGeos("WGS84");
};

})();