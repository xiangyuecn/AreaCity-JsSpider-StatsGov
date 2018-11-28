/*
拼音翻译
http://www.qqxiuzi.cn/zh/pinyin/

http://www.qqxiuzi.cn/zh/pinyin/show.php
POST
t=汉字&d=1&s=null&k=1&b=null&h=null&u=null&v=1&y=null&z=null&token=页面token请求一次获取

先加载数据
	控制台输入data.txt
*/
window.PageToken=window.PageToken||"";
var FixTrim=function(name){
	return name.replace(/^\s+|\s+$/g,"");
};
var CITY_LIST2;
var QueryPinYin=function(end){
	if(!window.PageToken){
		console.error("Need PageToken");
		return;
	};
	var ids=[];
	
	var fixCode=function(o){
		if(o.deep==0){
			o.orgCode="0";
		}else{
			o.orgCode=o.code;
			if(o.deep==1){
				o.code=o.code.substr(o,4);
			}else{
				o.code=o.code.replace(/(000000|000)$/g,"");//有少部分区多3位
			};
		};
		return o;
	};
	var fix=function(o,p){
		var name=o.name;
		if(o.deep==0){
			name=name.replace(/(市|省|(维吾尔|壮族|回族)?自治区)$/ig,"");
		}else if(o.deep==1){
			if(name=="市辖区"){
				name=p.o2.name;
			}else if(/行政区划$/ig.test(name)){
				name="直辖市";
			}else if(name.length>2){
				name=name.replace(/市$/ig,"");
			};
		}else{
			if(name.length>2 && name!="市辖区"
				&& !/(自治.|地区|矿区)$/.test(name)){//直接排除会有同名的
				name=name.replace(/(市|区|县|镇|管委会|街道办事处)$/ig,"");
			};
		};
		var o2={
			name:name
			,ext_name:o.name
			,id:+o.code||0
			,ext_id:+o.orgCode
			,pid:p&&+p.code||0
			,deep:o.deep
		};
		o.o2=o2;
		return o2;
	};
	for(var i=0;i<CITY_LIST.length;i++){
		var shen=CITY_LIST[i];
		shen.deep=0;
		for(var i2=0;i2<shen.child.length;i2++){
			var si=shen.child[i2];
			if(!shen.code){
				shen.code=si.code.substr(0,2);
				ids.push(fix(fixCode(shen)));
			};
			si.deep=1;
			ids.push(fix(fixCode(si),shen));
			
			
			for(var i3=0;i3<si.child.length;i3++){
				var qu=si.child[i3];
				qu.deep=2;
				ids.push(fix(fixCode(qu),si));
			};
		};
	};
	CITY_LIST2=ids;
	//console.log(JSON.stringify(ids,null,"\t"))
	//return;
	
	var idx=-1;
	var run=function(stack){
		stack=+stack||0;
		idx++;
		if(idx>=ids.length){
			thread--;
			if(thread==0){
				end();
			};
			return;
		};
		
		var idx_=idx;
		var id=ids[idx];
		if(id.P){
			stack++;
			if(stack%50==0){
				setTimeout(function(){run()});
			}else{
				run(stack);
			};
			return;
		};
		
		var name=id.name;
		var tryCount=0;
		var tryLoad=function(){
			$.ajax({
				url:"/zh/pinyin/show.php"
				,data:"t="+encodeURIComponent(name)+"&d=1&s=null&k=1&b=null&h=null&u=null&v=1&y=null&z=null&token="+PageToken
				,type:"POST"
				,dataType:"text"
				,timeout:1000
				,error:function(e){
					if(tryCount>3){
						console.error("--QueryPinYin error--"+e);
						run();
						return;
					};
					tryCount++;
					tryLoad();
				}
				,success:function(txt){
					txt=FixTrim(txt.replace(/<([^">]+(".*?")?)+>/g,"").replace(/\s+/g," "));
					id.P=txt;
					console.log("--"+idx_+"-QueryPinYin "+name+":"+txt+" --");
					run();
				}
			});
		};
		tryLoad();
	};
	
	var thread=4;
	run();
	run();
	run();
	run();
};


var ViewDown=function(){
	console.log("完成："+(Date.now()-RunPinYin.T1)/1000+"秒");
	window.CITY_LIST_PINYIN=CITY_LIST2;
	var url=URL.createObjectURL(
		new Blob([
			new Uint8Array([0xEF,0xBB,0xBF])
			,"var CITY_LIST_PINYIN="
			,JSON.stringify(CITY_LIST2,null,"\t")
		]
		,{"type":"text/plain"})
	);
	var downA=document.createElement("A");
	downA.innerHTML="下载查询好城市的文件";
	downA.href=url;
	downA.download="data-pinyin.txt";
	document.body.appendChild(downA);
	downA.click();
};

var RunPinYin=function(){
	RunPinYin.T1=Date.now();
	QueryPinYin(ViewDown);
};


//立即执行代码
if(window.CITY_LIST){
	if(!PageToken){
		PageToken=prompt("Token");
	};
	RunPinYin();
}else{
	console.error("data.txt未输入");
};