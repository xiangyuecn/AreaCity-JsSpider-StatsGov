/*
格式并且输出为csv

先加载数据
	控制台输入data-pinyin.txt

导入数据库：
	文件格式Unicode，文字为字符流
	检查id重复项，修正id
	转入area_city
	增加港澳台、海外两个省级
	检查名称重复项，修正名称
		select * from area_city where len(name)=1
		select pid,name,count(*) from area_city group by pid,name having COUNT(*)>1
*/

var FixTrim=function(name){
	return name.replace(/^\s+|\s+$/g,"");
};
function CSVName(name){
	return '"'+FixTrim(name).replace(/"/g,'""')+'"';
};

var CITY_CSV=["id,pid,deep,name,pinyin_prefix,pinyin,ext_id,ext_name"];
for(var i=0;i<CITY_LIST_PINYIN.length;i++){
	var o=CITY_LIST_PINYIN[i];
	var pf="";
	var pinyin=FixTrim(o.P).toLowerCase();
	var ps=pinyin.split(" ");
	for(var j=0;j<ps.length&&j<3;j++){
		pf+=ps[j].substr(0,j==0?2:1);
	};
	
	CITY_CSV.push(o.id+","+o.pid+","+o.deep+","+CSVName(o.name)
		+","+CSVName(pf)+","+CSVName(o.P)
		+","+CSVName(o.ext_id+"")+","+CSVName(o.ext_name));
};

var url=URL.createObjectURL(
	new Blob([
		new Uint8Array([0xEF,0xBB,0xBF])
		,CITY_CSV.join("\n")
	]
	,{"type":"text/plain"})
);
var downA=document.createElement("A");
downA.innerHTML="下载查询好城市的文件";
downA.href=url;
downA.download="ok_data.csv";
document.body.appendChild(downA);
downA.click();
