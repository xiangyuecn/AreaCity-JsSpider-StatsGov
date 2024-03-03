/*
人工修复处理数据，将此代码粘贴到《AreaCity Geo格式转换工具》中执行，进行人工数据修复
1. 工具顶上选择临时数据保存目录
2. 复制上一步csv中的一个问题polygon文本，粘贴到输入框
3. 点击“保存成json”按钮
4. 用gis软件人工修复此json
5. 点击“修复完成转回csv”，将输入框内的这个polgyon文本粘贴回去

移除天津在涉县的一小块飞地
12 天津市
1201 天津市 天津市
120102 天津市 天津市 河东区

13 河北省
1304 河北省 邯郸市
130426 河北省 邯郸市 涉县
*/
(function(){


//显示控制按钮
Runtime.Ctrls([
	{html:'<div>\
<div style="padding-bottom:10px">\
	<div>待修复polygon文本:</div>\
	<textarea class="in_polygon" placeholder="csv里面要修复的一个polygon文本" style="width:400px;height:80px"></textarea>\
</div>\
<div style="padding-bottom:10px">\
	id：<input class="in_id" style="width:100px">\
</div>\
	</div>'}
	,{name:"保存成json",click:"save2JsonClick"}
	,{name:"修复完成转回csv",click:"save2CsvClick"}
	,{html:'<span style="margin:0 30px 0 20px">|</span>'}
	,{name:"json转csv",click:"json2CsvClick"}
	,{html:'<div>\
<div style="padding-top:10px">\
	<div>已修复polygon文本:</div>\
	<textarea class="in_polygonOK" placeholder="" style="width:400px;height:80px"></textarea>\
</div>\
	</div>'}
]);

var jsonPath="";
window.save2JsonClick=function(){
	jsonPath="";
	//读取用户选择的文件夹路径
	var config=JSON.parse(AppCmds.config());
	var folder=config.Input.input_webview_folder;
	if(!folder){
		Runtime.Log("请先点击顶部“通用-选择文件夹”按钮，选择一个文件夹来保存待处理json数据",1);
		return;
	}
	
	$(".in_polygonOK").val("");
	var text=$(".in_polygon").val();
	var id=+$(".in_id").val()||0;
	if(!text || !id){
		Runtime.Log("请填写一行csv数据 或 id",1);
		return;
	}
	if(text.indexOf("~")!=-1){
		Runtime.Log("不支持带孔洞的polygon",1);
		return;
	}
	var wkt="POLYGON(("+text+","+/([^,]+),/.exec(text)[1]+"))";
	if(text.indexOf(";")!=-1){
		wkt="MULTIPOLYGON(";
		var arr=text.split(";");
		for(var i=0;i<arr.length;i++)
			wkt+=(i?",":"")+"(("+arr[i]+","+/([^,]+),/.exec(arr[i])[1]+"))";
		wkt+=")";
	}
	
	var json=lib.WKTList2GeoJSON([{id:id,name:"编辑",polygon:wkt}]);
	
	jsonPath=folder+"\\"+id+".json";
	AppCmds.transformStart("文件读写");
	try{
		var write=AppCmds.openFileWriteRes(jsonPath);
		AppCmds.fileWrite(write,JSON.stringify(json),"TEXT");
		var write=AppCmds.openFileWriteRes(jsonPath.replace(/\.json$/g,"-src.json"));
		AppCmds.fileWrite(write,JSON.stringify(json),"TEXT");
		var write=AppCmds.openFileWriteRes(jsonPath.replace(/\.json$/g,"-src.txt"));
		AppCmds.fileWrite(write,text,"TEXT");
	}finally{
		AppCmds.transformEnd();
	}
	
	Runtime.Log("json文件已保存到："+jsonPath+"，请用gis软件编辑此文件",2);
};
window.save2CsvClick=function(){
	if(!jsonPath){
		Runtime.Log("请先保存成json",1);
		return;
	}
	$(".in_polygonOK").val("");
	
	AppCmds.transformStart("文件读写");
	try{
		var read=AppCmds.openFileReadRes(jsonPath);
		var json=AppCmds.fileRead(read);
	}finally{
		AppCmds.transformEnd();
	}
	
	var csv=json2Csv(json);
	if(!csv)return;
	$(".in_polygonOK").val(csv);
	Runtime.Log("已转回csv，请粘贴回csv文件内",2);
};
window.json2CsvClick=function(){
	$(".in_polygonOK").val("");
	var text=$(".in_polygon").val();
	if(!text || text.indexOf("{")!=0){
		Runtime.Log("请在polygon文本中填写json",1);
		return;
	}
	
	var csv=json2Csv(text);
	if(!csv)return;
	$(".in_polygonOK").val(csv);
	Runtime.Log("已转成csv",2);
};
var json2Csv=function(jsonTxt){
	try{
		var json=JSON.parse(jsonTxt);
	}catch(e){
		Runtime.Log("解析成json失败",1);
		return;
	}
	
	var geom=json.features[0].geometry;
	var pols=geom.coordinates;
	if(geom.type=="Polygon"){
		pols=[pols];
	}
	pols.sort(function(a,b){ return b[0].length-a[0].length });
	var res=[];
	for(var i0=0;i0<pols.length;i0++){
		var pos=pols[i0]; if(pos.length!=1) throw new Error("不支持孔洞");
		pos=pos[0];
		
		//删除重复的点，包括首尾闭合的点
		for(var i=0;i<pos.length;i++){
			var p=pos[i],p2=pos[i+1]||pos[0];
			if(p[0]==p2[0] && p[1]==p2[1]){
				pos.splice(i,1); i--;
			}
		}
		while(pos[0].join(" ")==pos[pos.length-1].join(" ")){
			pos.pop();
		};
		
		//找到最小的一个坐标，环从这个坐标开始，免得每次采集起点不一样导致差异
		var minX=999.999999,minY=minX,idx=0;
		for(var i=0;i<pos.length;i++){
			var x=pos[i][0],y=pos[i][1];
			if(x<minX || (x==minX && y<minY)){
				minX=x;minY=y;
				idx=i;
			}
		};
		var arr2=[];
		for(var i=idx;i<pos.length;i++){
			arr2.push(pos[i]);
		}
		for(var i=0;i<idx;i++){//起点接到尾部后面
			arr2.push(pos[i]);
		}
		pos=arr2;
		
		var arr=[];
		for(var j=0;j<pos.length;j++){
			var point=pos[j];
			arr.push(point[0]+" "+point[1]);
		};
		res.push(arr.join(","));
	};
	return res.join(";");
};


	//复制自 https://xiangyuecn.gitee.io/areacity-jsspider-statsgov/assets/geo-echarts.html
	var lib={};
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
			var pol=item.polygon; delete item.polygon;
			features.push(lib.WKT2Feature(item,pol));
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

})();

