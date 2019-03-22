/*
格式并且输出为csv

先加载数据
	先直接运行本代码，根据提示输入data-pinyin.txt到文本框 (内容太大，控制台吃不消，文本框快很多)
	
然后再次运行本代码


导入SQL Server数据库：
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
if(!$(".DataTxt").length){
	$("body").append('<div style="position: fixed;bottom: 80px;left: 100px;padding: 20px;background: #0ca;z-index:9999999">输入data-pinyin.txt<textarea class="DataTxt"></textarea></div>');
};
if(!window.CITY_LIST_PINYIN){
	var val=$(".DataTxt").val();
	if(!val){
		throw new Error("需要输入data-pinyin.txt");
	}else{
		window.CITY_LIST_PINYIN=eval(val+";CITY_LIST_PINYIN");
	};
};

var pinyinList=CITY_LIST_PINYIN;
CITY_LIST_PINYIN=null;

//添加港澳台数据
function add(txt){
	var val=txt.split("|");
	pinyinList.push({
		"id": val[0],
		"pid": val[1],
		"deep": val[2],
		"name": val[3],
		"P2":  val[4],
		
		"ext_id": 0
		,"ext_name": ""
		
		,isExt:true
	});
};
//id|pid|deep|name|pinyin
add("90|0|0|港澳台|~0");
add("91|0|0|海外|~1");

add("9001|90|1|香港|xiang gang");
add("9002|90|1|澳门|ao men");
add("9003|90|1|台湾|tai wan");
add("9101|91|1|海外|hai wai");

add("900101|9001|2|香港|xiang gang");
add("900201|9002|2|澳门|ao men");
add("900301|9003|2|台湾|tai wan");
add("910101|9101|2|海外|hai wai");

add("90010101|900101|3|香港|xiang gang");
add("90020101|900201|3|澳门|ao men");
add("90030101|900301|3|台湾|tai wan");
add("91010101|910101|3|海外|hai wai");



//处理数据
var childsMP={};
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	
	var p=childsMP[o.pid]||[];
	childsMP[o.pid]=p;
	p.push(o);
	
	o.ext_name=o.ext_name||o.name;
	o.name2=o.name;
	if(o.deep==0){
		o.ext_id=o.id;
	};
	if(o.ext_id==0&&!o.isExt){
		throw new Error("ext_id=0",o);
	};
};
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	
	
	var name=o.name.replace(/（上级为乡镇）$/ig,"");
	name=name.replace(/(..)(?:(?:汉|满|回|藏|苗|彝|壮|侗|瑶|白|傣|黎|佤|畲|水|土|羌|怒|京)族|(蒙古|维吾尔|布依|土家|哈尼|哈萨克|傈僳|高山|拉祜|东乡|纳西|景颇|柯尔克孜|达斡尔|仫佬|布朗|撒拉|毛南|仡佬|锡伯|阿昌|普米|朝鲜|塔吉克|乌孜别克|俄罗斯|鄂温克|德昂|保安|裕固|塔塔尔|独龙|鄂伦春|赫哲|门巴|珞巴|基诺)族?)+(自治[区州县旗]|乡)$/g,"$1");
	
	if(o.deep==0){
		name=name.replace(/(省|市|自治区)$/ig,"");
	}else if(o.deep==1){
		if(/行政区划$/ig.test(name)){
			name="直辖市";
			o.P2="zhi xia shi";
		}else if(name.length>2){
			name=name.replace(/(市|地区)$/ig,"");
		};
	}else{
		if(name.length>2
			&& !/^市辖区$|(自治.|地区|矿区|新区|开发区|管理区|示范区|名胜区)$/.test(name)){//直接排除会有同名的
			name=name.replace(/(..)(市|区|县|镇|乡|管委会|社区服务中心|管理办公室|街道办事处|街道办|街道|办事处|管理区)$/ig,"$1");
		};
	};
	
	//简化后是否和兄弟重名
	var pcs=childsMP[o.pid];
	for(var i2=0;i2<pcs.length;i2++){
		var o2=pcs[i2];
		if(o2!=o && o2.name==name){
			console.log("重名",name,o.name2,o2.name2,o,o2);
			
			//两个都恢复原名，本身这种就没有多少，如果保留一个短的会有歧义
			name=o.name2;
			o2.name=o2.name2;
		};
	};
	
	o.name=name;
};


var FixTrim=function(name){
	return name.replace(/^\s+|\s+$/g,"");
};
function CSVName(name){
	return '"'+FixTrim(name).replace(/"/g,'""')+'"';
};

var CITY_CSV=["id,pid,deep,name,pinyin_prefix,pinyin,ext_id,ext_name"];
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	
	//生成拼音
	var p1=FixTrim(o.P||"");
	p1=p1?p1.split("||"):[];
	var p2=FixTrim(o.P2||"");
	p2=p2?p2.split(" "):[];
	if(p1.length){
		//以本地翻译长度为准，对p2进行长度修剪
		var arr=[];
		for(var i2=0;i2<p1.length&&i2<o.name.length;i2++){
			var itm=p1[i2];
			if(itm[0]!="F"){
				arr.push(itm);
			};
		};
		p1=arr;
		
		p2.length=Math.min(p2.length,p1.length);
	}else{
		p2.length=Math.min(p2.length,o.name.length);
	};
	var ps=p2.length?p2:p1;
	var pinyin=ps.join(" ").toLowerCase();
	ps=pinyin.split(" ");
	
	
	var pf="";
	for(var j=0;j<ps.length&&j<3;j++){
		pf+=ps[j].substr(0,j==0?2:1);
	};
	
	CITY_CSV.push(o.id+","+o.pid+","+o.deep+","+CSVName(o.name)
		+","+CSVName(pf)+","+CSVName(pinyin)
		+","+CSVName(o.ext_id+"")+","+CSVName(o.ext_name+""));
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
