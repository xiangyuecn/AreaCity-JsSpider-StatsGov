/*
格式并且输出为csv

先加载数据
	控制台输入data-pinyin.txt


导入数据库：
	文件打开剪切转换成UCS-2 Lettle Endian粘贴保存
	导入文件Unicode格式，文字字段数字的设置成4位整数，文本设为Unicode文本

----【检查数据源】----
--【检查id重复项，手动修正id】
select id,COUNT(id) from [ok_data - 副本] group by id having COUNT(id)>1
--【检查名称重复项，手动修正名称】
select * from [ok_data - 副本] where len(name)=1
select * from [ok_data - 副本] where name in(select name from [ok_data - 副本] group by pid,name having COUNT(*)>1) order by pid,name

----【对比新旧数据】----
--【改名】
select * from [ok_data - 副本] where exists(select * from area_city where id=[ok_data - 副本].id and ext_name<>[ok_data - 副本].ext_name) order by id
select * from area_city where exists(select * from [ok_data - 副本] where id=area_city.id and ext_name<>[area_city].ext_name) order by id
--【新增项】
select * from [ok_data - 副本] where not exists(select * from area_city where id=[ok_data - 副本].id) order by id
--【减少项】
select * from area_city where not exists(select * from [ok_data - 副本] where id=area_city.id) order by id
	
*/
var pinyinList=CITY_LIST_PINYIN;
CITY_LIST_PINYIN=null;

//处理数据
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	if(o.deep==0){
		o.ext_id=o.id;
	};
	if(o.ext_id==0){
		throw new Error("ext_id=0",o);
	};
};

//添加港澳台数据
function add(txt){
	var val=txt.split("|");
	pinyinList.push({
		"id": val[0],
		"pid": val[1],
		"deep": val[2],
		"name": val[3],
		"P":  val[4],
		
		"ext_id": 0,"ext_name": ""
	});
};
//id|pid|deep|name|pinyin
add("90|0|0|港澳台|~0");
add("91|0|0|海外|~1");
add("9001|90|1|香港|xiang gang");
add("9002|90|1|澳门|ao men");
add("9003|90|1|台湾|tai wan");
add("9101|91|1|海外|hai wai");
add("900100|9001|2|香港|xiang gang");
add("900200|9002|2|澳门|ao men");
add("900300|9003|2|台湾|tai wan");
add("910100|9101|2|海外|hai wai");


var FixTrim=function(name){
	return name.replace(/^\s+|\s+$/g,"");
};
function CSVName(name){
	return '"'+FixTrim(name).replace(/"/g,'""')+'"';
};

var CITY_CSV=["id,pid,deep,name,pinyin_prefix,pinyin,ext_id,ext_name"];
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
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
CITY_CSV.push("");

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
