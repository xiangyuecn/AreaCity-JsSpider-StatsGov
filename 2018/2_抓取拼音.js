/*
拼音翻译
http://www.qqxiuzi.cn/zh/pinyin/

http://www.qqxiuzi.cn/zh/pinyin/show.php
POST
t=汉字&d=1&s=null&k=1&b=null&h=null&u=null&v=1&y=null&z=null&token=页面token请求一次获取

先加载数据
	控制台输入data.txt
	
拼音接口可能会屏蔽ip，通过切换代理解决，底部有方法
*/
window.PageToken="";
var FixTrim=function(name){
	return name.replace(/^\s+|\s+$/g,"");
};
var CITY_LIST2;
var QueryPinYin=function(end){
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
				&& !/(自治.|地区|矿区|开发区)$/.test(name)){//直接排除会有同名的
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
	var datas=[];
	if(CITY_LIST2){
		datas=CITY_LIST2;
	}else{
		for(var i=0;i<CITY_LIST.length;i++){
			var shen=CITY_LIST[i];
			shen.deep=0;
			for(var i2=0;i2<shen.child.length;i2++){
				var si=shen.child[i2];
				if(!shen.code){
					shen.code=si.code.substr(0,2);
					datas.push(fix(fixCode(shen)));
				};
				si.deep=1;
				datas.push(fix(fixCode(si),shen));
				
				
				for(var i3=0;i3<si.child.length;i3++){
					var qu=si.child[i3];
					qu.deep=2;
					datas.push(fix(fixCode(qu),si));
				};
			};
		};
		CITY_LIST2=datas;
	}
	//console.log(JSON.stringify(datas,null,"\t"))
	//return;
	
	//一次性多查，一个个查被封的快又慢
	var keyMp={};
	for(var i=0;i<datas.length;i++){
		var o=datas[i];
		if(!o.P){
			keyMp[o.name]||(keyMp[o.name]=[]);
			keyMp[o.name].push(o);
		};
	};
	var ids=[],keys=Object.keys(keyMp);
	for(var i=0;i<keys.length;i++){
		var j=Math.max(ids.length-1,0);
		var o=ids[j]||(ids[j]={txt:"",refs:[]});
		if(o.txt.length>=1950){
			j++;
			o={txt:"",refs:[]};
		};
		ids[j]=o;
		o.txt=o.txt+(o.txt?"\n":"")+keys[i];
		o.refs.push(keyMp[keys[i]]);
	};
	console.log("需要查询"+(ids.length+1)+"段数据",ids);
	
	
	
	var idx=-1,sendCount=0;
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
		var name=id.txt;
		var tryLoad=function(){
			sendCount++;
			$.ajax({
				url:"/zh/pinyin/show.php?pid="+proxyID
				,data:"t="+encodeURIComponent(name)+"&d=1&s=null&k=1&b=null&h=null&u=null&v=1&y=null&z=null&token="+PageToken
				,type:"POST"
				,dataType:"text"
				,timeout:40000
				,error:function(e){
					console.error("--QueryPinYin error--",idx_,id,e);
					idx=999999999;
					QueryPinyinErrs++;
					RunPinYin();
				}
				,success:function(html){
					QueryPinyinErrs=0;
					var arr=html.replace(/<\/div>/,"").trim().split("<br>");
					var refs=id.refs;
					if(arr.length!=refs.length){
						console.error("无效查询，返回数量不对，已停止："+refs.length+":"+arr.length,idx_);
						console.log(id);
						console.log(arr);
						return;
					};
					var count=0;
					for(var i=0;i<arr.length;i++){
						var mps=refs[i];
						var txt=FixTrim(arr[i].replace(/<([^">]+(".*?")?)+>/g,"").replace(/\s+/g," "));
						for(var j=0;j<mps.length;j++){
							mps[j].P=txt;
							count++;
						};
					};
					console.log(idx_+"已查询"+count+"个");
					localStorage["CITY_LIST2"]=JSON.stringify(CITY_LIST2);
					run();
				}
			});
		};
		tryLoad();
	};
	
	var thread=1;
	run();
};
var QueryPinyinErrs=0;


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

var proxyID=+localStorage["proxyID"]||0;
var RunPinYin=function(){
	if(!window.CITY_LIST && localStorage["CITY_LIST2"]){
		console.log("已加载进度");
		CITY_LIST2=JSON.parse(localStorage["CITY_LIST2"]);
	};
	
	var errs=0;
	var queryProxy=function(){
		proxyID++;
		localStorage["proxyID"]=proxyID;
		$.ajax({
			url:"https://img.alicdn.com/tfs/TB1_uT8a5ERMeJjSspiXXbZLFXa-143-59.png?pid="+proxyID
			,timeout:5000
			,error:function(){
				errs++;
				if(errs>100){
					console.error("无代理了！");
					return;
				}
				console.error("抓取token失败，代理"+proxyID+"无效，尝试下一个代理");
				queryProxy();
			}
			,success:function(){
				console.error("使用代理"+proxyID);
				RunPinYin();
			}
		});
	};
	if(QueryPinyinErrs>3){
		QueryPinyinErrs=0;
		queryProxy();
		return;
	};
	console.log("抓取token");
	$.ajax({
		url:"/zh/pinyin/?pid="+proxyID
		,timeout:8000
		,error:function(e){
			console.error("抓取token失败，尝试切换SwitchyOmega代理");
			queryProxy();
		}
		,success:function(txt){
			PageToken=/&token=(\w+)/.exec(txt)[1];
			console.log("token:"+PageToken);
			
			RunPinYin.T1=Date.now();
			QueryPinYin(ViewDown);
		}
	});
};


RunPinYin();

































//代理方法
//装上SwitchyOmega 新建PAC情景模式，填入以下代码
var proxyList=[
	//此处填写采集到的代理列表
];
function FindProxyForURL(url, host) {
	if (/qqxiuzi\.cn.+pid=(\d+)/.test(url) || /TB1_uT8a5ERMeJjSspiXXbZLFXa-143-59\.png\?pid=(\d+)/.test(url)){
		var id=+RegExp.$1;
		return "PROXY "+(proxyList[id]||"127.0.0.1:12345");
	};
	return "DIRECT";
};



//代理列表抓取
//http://www.xicidaili.com/nt/ 内执行
var ntdata={};
var ntrun=function(page){
	function ajax(url,True,False){
		var ajax=new XMLHttpRequest();
		ajax.open("GET",url);
		ajax.onreadystatechange=function(){
			if(ajax.readyState==4){
				if(ajax.status==200){
					True(ajax.responseText);
				}else{
					False();
				}
			}
		}
		ajax.send();
	};
	var mx=20;
	if(page>mx){
		var list=Object.keys(ntdata);
		console.log("采集完成"+list.length);
		console.log(JSON.stringify(list));
		return;
	};
	ajax("http://www.xicidaili.com/nt/"+page,function(str){
		console.log("已抓取"+page+"/"+mx);
		str=str.replace(/\s+/g," ");
		
		str=str.substr(str.indexOf("ip_list"));
		str=str.substr(0,str.indexOf("</table>")).replace(/<tr.+?<th.+?<\/tr>/i,"");
		
		var exp=/<tr.+?<\/td>.+?<td>(.+?)<\/td>.+?<td>(.+?)<\/td>/ig,m;
		while(m=exp.exec(str)){
			var k=m[1]+":"+m[2];
			ntdata[k]=(ntdata[k]||0)+1;
		}
		ntrun(++page);
	},function(){
		console.error("抓取失败"+page);
	});
};
//ntrun(1);