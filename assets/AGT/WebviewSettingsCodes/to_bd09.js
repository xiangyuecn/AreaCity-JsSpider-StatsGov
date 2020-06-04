/******************
《【插件】GCJ-02 转成 BD-09 百度地图坐标【误差约1米内】》
作者：高坚果
时间：2020-05-30 23:39:53

ok_geo.csv中的数据是GCJ-02坐标系坐标，BD-09(百度坐标)是百度在GCJ-02(火星坐标)基础上加偏移量变成的二次加密坐标；火星坐标如果不加上偏移量，直接当百度坐标使用，会有几百米的误差，如果精度要求不高可以不转换坐标系；有精度要求时可使用本插件进行转换，可以将几百米的误差降低到差不多1米以内。

转换算法来自 https://www.oschina.net/code/snippet_260395_39205

本算法目测就是就是百度的偏移算法，因为它的转换结果和百度地图提供的接口的转换结果完全一致。但为什么还是会存在1米内的偏差呢？虽然转换结果和官方一致，但官方的转换结果在卫星地图上观察是存在1米内的误差，比如：高德在地平面上的圆里面（比如足球场）的圆心，百度地图官方接口转换显示到百度卫星地图后发现偏离圆心，是什么原因导致的就不清楚了。
******************/
(function(){

/*********实现转换接口给软件调用*********/
Runtime.AppCalls.translateGeoEnable=function(){
	return "【插件】GCJ-02 转成 BD-09 百度地图坐标【误差约1米内】";
};
Runtime.AppCalls.translateGeos=function(geosStr){
	var points=geosStr.split(",");
	var results=[];
	for(var i=0;i<points.length;i++){
		var p=points[i].split(" ");
		
		var val=bd_encrypt(+p[0],+p[1]);
		
		results.push( (+val.lon.toFixed(6)) +" "+ (+val.lat.toFixed(6)) );
	};
	return results.join(",");
};



/*********坐标转换逻辑*********/
//https://www.oschina.net/code/snippet_260395_39205
var x_pi = 3.14159265358979324 * 3000.0 / 180.0;

var bd_encrypt = function (gcjLon, gcjLat) {
	var x = gcjLon, y = gcjLat;  
	var z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi);  
	var theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi);  
	bdLon = z * Math.cos(theta) + 0.0065;  
	bdLat = z * Math.sin(theta) + 0.006; 
	return {'lat' : bdLat,'lon' : bdLon};
}




/*****加载测试框架，测试转换精度*****/
Runtime.Import([
	{url:RootFolder+"/AGT/WebviewSettingsCodes/test_translateGeos.js",check:function(){return !window.test_translateGeos}}
]);
//显示控制按钮
Runtime.Ctrls([
	{name:"测试转换精度",click:"bd09Test"}
	,{html:'<span style="font-size:12px">本插件无需手动操作，在处理ok_geo.csv数据时会自动调用本坐标系转换；转换前你可以点击“测试转换精度”来查看当前代码的转换精度是否符合你的要求。</span>'}
]);

window.bd09Test=function(){
	test_translateGeos("BD09");
};

})();