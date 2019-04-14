/*
已废弃，采用高德地图数据

导出省市区（不含扩展区域）三级坐标和行政区域边界为csv格式


对于geo和polygon输出格式，在此可以进行转换成需要的格式，默认采用MSSQL的空间格式的结构：
geo="lng lat" 如"133.333333 37.123333"，百度地图bd09坐标，POINT格式
polygon="POLYGON((lng lat,...),...)" POLYGON格式，只有一个地块，可能存在多个镂空性质的区域，每个区域首尾坐标相同
polygon="MULTIPOLYGON(((lng lat,...),...),...)" MULTIPOLYGON格式，包含多个POLYGON地块，比如廊坊

如果是EMPTY代表没有对应的信息：
geo="EMPTY"
polygon="EMPTY"



在百度地图测试页面，选到iframe上下文中执行
http://lbsyun.baidu.com/jsdemo.htm#c1_10
	导入：http://api.map.baidu.com/library/GeoUtils/1.2/src/GeoUtils_min.js

加载数据
	在上一步页面基础上运行，或者
	先直接运行本代码，根据提示输入data-geo.txt到文本框 (内容太大，控制台吃不消，文本框快很多)

然后再次运行本代码，如果中途因错误停止，根据提示重复运行


导入SQL Server数据库：
	导入平面文件源
		utf-8格式
		文本限定符"
		第一行为列名
		文字字段数字的设置成4/8字节有符号整数
		文本设为DT_TEXT
		表结构映射中把text类型改成ntext类型（如果文件格式是UCS-2 Lettle Endian会轻松很多）
*/

var PolygonMaxPoint=200;//行政区域边界最大坐标点数，如果构成polygon的point数量超过这个值，就进行抽样，相当于把过于曲折的边界稍微拉直点降低点点精度，点数过多的意义也不大
var PolygonPointFixed=6;//构成行政区域边界的坐标小数位数，5位可达到1米精度，6位是bmap的坐标转换精度

if(!top.document.querySelector(".DataTxt")){
	var div=top.document.createElement("div");
	div.innerHTML=('<div style="position: fixed;bottom: 80px;left: 100px;padding: 20px;background: #0ca;z-index:9999999">输入data-geo.txt<textarea class="DataTxt"></textarea></div>');
	top.document.body.appendChild(div);
};

if(!window.DATA_GEO){
	var val=top.document.querySelector(".DataTxt").value;
	if(!val){
		throw new Error("需要输入data-geo.txt");
	}else{
		window.DATA_GEO=eval(val+";DATA_GEO");
	};
};

var FixTrim=function(name){
	return name.replace(/^\s+|\s+$/g,"");
};
function CSVName(name){
	return '"'+FixTrim(name).replace(/"/g,'""')+'"';
};

var csv=["id,name,geo,polygon"];
for(var k=0;k<DATA_GEO.length;k++){
	var o=DATA_GEO[k];
	
	/**此处对polygon格式进行解析、有效性验证**/
	var polygon=o.polygon;
	loop:
	while(polygon!="EMPTY"){
		var polygon=o.polygon.split(";");
		for(var j=0;j<polygon.length;j++){
			var arr=[];
			var list=polygon[j].split(",");
			var count = list.length;
			var c=Math.floor(count/PolygonMaxPoint)||1;//采样
			for(var i = 0; i < count; i++){
				var point=list[i].split(" ");
				if(count<PolygonMaxPoint || i%c==0){
					arr.push(new BMap.Point(+point[0],+point[1]));
				}
			};
			while(arr[0].equals(arr[arr.length-1])){
				arr.pop();
			};
			polygon[j]=new BMap.Polygon(arr);
		};
		
		polygon=checkAndBuildPolygon(polygon,o);
		break;
	};
	
	csv.push(o.id+","+CSVName(o.name)
		+","+CSVName(o.geo)+","+CSVName(polygon));
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










function checkAndBuildPolygon(polygon,itm){
	var tag=itm.id+":"+itm.name+" "+itm.polygon+"\n   "
	var polygonList=[];
	var maxSize=0,failTotalSize=0;
	for(var i=0;i<polygon.length;i++){
		var size=BMapLib.GeoUtils.getPolygonArea(polygon[i])||0;
		maxSize=Math.max(maxSize,size);
		
		if(!validateLines(polygon[i])){
			failTotalSize+=size;
			console.warn(tag+"第"+(i+1)+"块无效，已移除");
		}else{
			polygonList.push(polygon[i]);
		};
	};
	if(failTotalSize&&failTotalSize>maxSize/2){
		console.error("已移除地块超过最大值一半，已清除所有边界");
		polygonList=[];
	};
	
	var polygonGroups=[];
	loop:
	for(var i=0;i<polygonList.length;i++){
		var itm=polygonList[i];
		for(var j=0;j<polygonGroups.length;j++){
			var arr=polygonGroups[j];
			var pos=polygonPostion(arr[0],itm);
			if(pos==1){//包含
				arr.push(itm);
				continue loop;
			}else if(pos==-1){
				console.error(tag+"存在交叉或反向包含，已清除所有边界");
				polygonGroups=[];
				break loop;
			};
		};
		polygonGroups.push([itm]);
	};
	
	//导出sql格式
	var res=[];
	if(polygonGroups.length==0){
		return "EMPTY";
	}if(polygonGroups.length>1){
		res.push("MULTIPOLYGON(");
	}else{
		res.push("POLYGON");
	};
	for(var i=0;i<polygonGroups.length;i++){
		var arr=polygonGroups[i];
		if(i!=0){
			res.push(",");
		};
		res.push("(");
		for(var j=0;j<arr.length;j++){
			var pos=arr[j].getPath();
			pos.push(pos[pos.length-1]);//闭环
			
			if(j!=0){
				res.push(",");
			};
			res.push("(");
			for(var n=0;n<pos.length;n++){
				var point=pos[n];
				res.push(
					(+(+point.lng).toFixed(PolygonPointFixed))
					+" "+
					(+(+point.lat).toFixed(PolygonPointFixed))
				);
			};
			res.push(")");
		};
		res.push(")");
	};
	if(polygonGroups.length>1){
		res.push(")");
	};
	return res.join("");
};
//检测构成区域的所有线条是否合法，没有相交的
function validateLines(polygon){
	var pos=polygon.getPath();
	if(pos.length<3){
		return false;
	};
	if(pos[0].equals(pos[pos.length-1])){
		return false;
	};
	for(var i=1;i<pos.length;i++){
		var a=pos[i-1];
		var b=pos[i];
		if(a.equals(b)||pos[i+1]&&a.equals(pos[i+1])){
			return false;
		};
		for(var j=i+1;j<pos.length;j++){
			var c=pos[j+1];
			if(!c){
				if(i!=1){
					c=pos[0];
				}else if(j==pos.length-1){
					break;
				};
			};
			var d=pos[j];
			
			//https://blog.csdn.net/qq826309057/article/details/70942061
			//快速排斥实验
			if ((a.lng > b.lng ? a.lng : b.lng) < (c.lng < d.lng ? c.lng : d.lng) ||
				(a.lat > b.lat ? a.lat : b.lat) < (c.lat < d.lat ? c.lat : d.lat) ||
				(c.lng > d.lng ? c.lng : d.lng) < (a.lng < b.lng ? a.lng : b.lng) ||
				(c.lat > d.lat ? c.lat : d.lat) < (a.lat < b.lat ? a.lat : b.lat))
			{
				continue;
			}
			//跨立实验
			if((((a.lng - c.lng)*(d.lat - c.lat) - (a.lat - c.lat)*(d.lng - c.lng))*
				((b.lng - c.lng)*(d.lat - c.lat) - (b.lat - c.lat)*(d.lng - c.lng))) > 0 ||
			   (((c.lng - a.lng)*(b.lat - a.lat) - (c.lat - a.lat)*(b.lng - a.lng))*
				((d.lng - a.lng)*(b.lat - a.lat) - (d.lat - a.lat)*(b.lng - a.lng))) > 0)
			{
				continue;
			}
			return false;
		};
	};
	return true;
};
function polygonPostion(polygonBig,polygonMin){
	
};