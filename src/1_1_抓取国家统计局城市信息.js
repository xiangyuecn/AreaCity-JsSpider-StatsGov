/*
获取统计局所有城市名称原始数据

在以下页面执行
http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/

可能需要低版本chrome，不然他们网页gbk格式的请求会乱码，chrome 41没有乱码，Chrome 46这版本win10能用。或者篡改Content-Type响应头为Content-Type: text/html; charset=gb2312也可解决新版Chrome乱码问题，比如：FildderScript OnBeforeResponse中添加：
```
if (oSession.HostnameIs("www.stats.gov.cn")){
	if(/tjyqhdmhcxhfdm\/\d+/.test(oSession.fullUrl)){
		oSession.oResponse.headers["Content-Type"]="text/html; charset=gb2312";
	}
}
```
*/
(function(){
var Year=2019;
var LoadMaxLevel=4;//采集几层
var SaveName="Step1_1_StatsGov";
var Level={
	1:{n:"省",k:"shen"},
	2:{n:"市",k:"si"},
	3:{n:"区",k:"qu"},
	4:{n:"镇",k:"zhen"}
};

window.StopLoad=false;//true手动停止运行，"End"假装采集完成
var DATA=window.DATA||[];

var LogAll=true;
var Load_Thread_Count=4;//模拟线程数
var Load_Max_Try=10;//错误重试次数

var Load_Wait_Child=91;//此城市下级列表已抓取完毕，等待子级完成抓取
var Load_Full_End=92;//此城市包括下级全部抓取完毕

if(!window.URL){
	throw new Error("浏览器版本太低");
};
var loadReqCount=0;
function ajax(url,True,False){
	loadReqCount++;
	var ajax=new XMLHttpRequest();
	ajax.timeout=20000;
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
}

function cityClass(name,url,code){
	this.name=name;
	this.url=url;
	this.code=code;
	this.child=[];
	this.load=0;
}
cityClass.prototype={
	getValue:function(){
		var obj={
			name:this.name
			,code:(this.code+"000000000000").substr(0,12)
			,child:[]
		};
		for(var i=0;i<this.child.length;i++){
			obj.child.push(this.child[i].getValue());
		}
		obj.child.sort(function(a,b){
			return a.code.localeCompare(b.code);
		});
		return obj;
	}
}



function load_shen_all(True){
	DATA=[];
	var path="http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/"+Year;
	ajax(path+"/index.html",function(text){
		var reg=/href='(.+?)'>(.+?)<br/ig,match;
		var idx;
		if((idx=text.indexOf("<tr class='provincetr'>"))+1){
			reg.lastIndex=idx;
			while(match=reg.exec(text)){
				var url=match[1];
				if(url.indexOf("//")==-1 && url.indexOf("/")!=0){
					url=path+"/"+url;
				}
				var name=match[2];
				DATA.push(new cityClass(name,url,/(\d+).html/.exec(url)[1]));
			}
			
			True();
		}else{
			console.error("未发现省份数据");
		}
	},function(){
		console.error("读取省份列表出错","程序终止");
	});
}



var logX=$('<div class="LogX" style="position: fixed;bottom: 80px;right: 100px;padding: 50px;background: #0ca;color: #fff;font-size: 16px;width: 600px;z-index:9999999"></div>');
$("body").append(logX);
var logXn=0;
function LogX(txt){
	logXn++;
	if(LogAll || LoadMaxLevel<4 || logXn%100==0){
		logX.text(txt);
	}
};

function load_x_childs(itm, next){
	var city=itm.obj,levelObj=Level[itm.level],levelNextObj=Level[itm.level+1];
	city.load++;
	if(city.load>Load_Max_Try){
		console.error("读取"+levelObj.n+"["+city.name+"]超过"+Load_Max_Try+"次");
		next();
		return;
	};
	
	LogX("读取"+loadReqCount+"次"+getJD()+" ["+city.name+"]"+levelObj.n);
	
	if(!city.url){
		console.warn("无url",city);
		next();
		return;
	};
	ajax(city.url,function(text){
		if(!/统计用区划代码<\/td>/.test(text)){//保证中文和没有要输入验证码
			city.load=Load_Max_Try;
			next();
			return;
		};
		var reg=/class='(citytr|countytr|towntr|villagetr)'.+?<\/tr>/ig;
		var match;
		var mode="";
		var swapItem=null;
		while(match=reg.exec(text)){
			var err=function(msg){
				console.error(msg,city,match[0]);
				city.load=Load_Max_Try;
				
				next();
			};
			!mode&&(mode=match[1]);
			if(mode!=match[1]){
				err("前后类型不匹配");
				return;
			};
			
			//villagetr直接非法
			var reg2=/class='(citytr|countytr|towntr)'.+?<td>(?:<a href='(.+?)'>)?(.+?)<.+?>([^<>]+)(?:<\/a>)?<\/td><\/tr>/ig;
			var match2;
			if(match2=reg2.exec(match[0])){
				var url=match2[2]||"";
				if(url && url.indexOf("//")==-1 && url.indexOf("/")!=0){
					url=city.url.substring(0,city.url.lastIndexOf("/"))+"/"+url;
				}
				var code=match2[3]||match2[5];
				var name=match2[4]||match2[6];
				
				//如果是镇，上级为市，越过了区，追加一个区，code为上级code+00，保持兼容，如：东莞
				if(itm.level==2 && match2[1]=="towntr"){
					if(!swapItem){
						console.log("没有区级，追加一个同名的："+city.name,city);
						var o=new cityClass(city.name,city.url,city.code);
						o.load=Load_Wait_Child;
						city.child.push(o);
						swapItem=o;
					};
				};
				
				if(!url&&name=="市辖区"){
					//NOOP 没有链接的市辖区直接去除
				}else{
					(swapItem||city).child.push(new cityClass(name,url,code));
				};
			}else{
				err("未知模式");
				return;
			};
		};
		
		delete city.url;
		city.load=Load_Wait_Child;
		
		JD[levelNextObj.k+"_count"]+=city.child.length;
		
		next();
	},function(){
		setTimeout(function(){
			load_x_childs(itm, next);
		},1000);
	});
};









var load_end=function(isErr){
	StopLoad="End";
		
	if(isErr){
		console.error("出错终止", getJD());
		return;
	}
	
	var logTxt="完成："+(Date.now()-RunLoad.T1)/1000+"秒"+getJD();
	console.log(logTxt);
	LogX(logTxt);
	
	var data=[];
	for(var i=0;i<DATA.length;i++){
		data.push(DATA[i].getValue());
	}
	var saveData={};
	window[SaveName]=saveData;
	saveData.year=Year;
	saveData.cityList=data;
	
	var url=URL.createObjectURL(
		new Blob([
			new Uint8Array([0xEF,0xBB,0xBF])
			,"var "+SaveName+"="
			,JSON.stringify(saveData,null,"\t")
		]
		,{"type":"text/plain"})
	);
	var downA=document.createElement("A");
	downA.innerHTML="下载查询好城市的文件";
	downA.href=url;
	downA.download=SaveName+".txt";
	logX.append(downA);
	downA.click();
	
	console.log("--完成--");
};




var threadCount=0;
function thread(){
	threadCount++;
	var itm=findNext(DATA,1);
	if(!itm||!itm.obj){
		//最后循环full计数
		findNext(DATA,1);
		findNext(DATA,1);
		findNext(DATA,1);
		findNext(DATA,1);
		
		threadCount--;
		if(threadCount==0){
			load_end(!!itm);
		};
		return;
	};
	
	var next=function(){
		threadCount--;
		thread();
	};
	
	load_x_childs(itm, next);
};
function findNext(childs,level,parent){
	if(level>=LoadMaxLevel){//超过了需要加载的层次
		setFullLoad(parent,level-1);
		return;
	};
	if(StopLoad){
		//已停止
		if(StopLoad=="End"){
			return;
		};
		
		//手动中断运行
		return {};
	};
	
	var isFull=true;
	for(var i=0;i<childs.length;i++){
		var itm=childs[i];
		//处理完成了的
		if(itm.load==Load_Full_End){
			continue;
		};
		isFull=false;
		
		if(itm.load==Load_Wait_Child){
			//看看下级有没有没处理的
			var rtv=findNext(itm.child,level+1,itm);
			if(rtv){
				return rtv;
			};
		}else if(itm.load>Load_Max_Try){
			//存在加载失败的，中断运行
			return {};
		};
		
		//加载这个
		if(!itm.load){
			return {obj:itm,level:level};
		};
	};
	
	if(isFull&&parent){
		setFullLoad(parent,level-1);
	};
};
function setFullLoad(itm,level){
	if(itm.load==Load_Wait_Child){
		JD[Level[level].k+"_ok"]++;
	};
	itm.load=Load_Full_End;
};
function clearLoadErr(childs){
	for(var i=0;i<childs.length;i++){
		var itm=childs[i];
		itm.load=itm.load>50?itm.load:!itm.url?1:0;
		clearLoadErr(itm.child);
	};
};




function getJD(){
	var str="省:"+JD.shen_ok+"/"+JD.shen_count;
	str+=" 市:"+JD.si_ok+"/"+JD.si_count;
	str+=" 区:"+JD.qu_ok+"/"+JD.qu_count;
	str+=" 镇:"+JD.zhen_count;
	return " >>进度："+str;
};
var JD={
	shen_ok:0
	,shen_count:0
	,si_ok:0
	,si_count:0
	,qu_ok:0
	,qu_count:0
	,zhen_count:0
};
window.RunLoad=function(){
	RunLoad.T1=Date.now();
	
	function start(){
		JD.shen_count=DATA.length;
		
		for(var i=0;i<Load_Thread_Count;i++){
			thread();
		};
	};
	
	
	if(DATA.length){
		console.log("恢复采集...");
		clearLoadErr(DATA);
		start();
	}else{
		load_shen_all(start);
	}
	window.DATA=DATA;
}
})();//@ sourceURL=console.js


//立即执行代码
RunLoad()