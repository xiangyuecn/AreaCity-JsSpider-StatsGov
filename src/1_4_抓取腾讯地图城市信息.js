/*
获取腾讯地图城市数据

在以下页面执行
https://lbs.qq.com/webservice_v1/guide-region.html
*/
"use strict";
(function(){
var SaveName="Step1_4_QQmap";

var LoadMaxLevel=4;//采集几层
var Level={
	1:{n:"省",k:"shen"},
	2:{n:"市",k:"si"},
	3:{n:"区",k:"qu"},
	4:{n:"镇",k:"zhen"}
};

window.StopLoad=false;//true手动停止运行，"End"假装采集完成
var DATA=window.DATA||window[SaveName]||{ver:"",cityList:[]};
window.DATA=DATA;

var Load_Thread_Count=1;//模拟线程数
var Load_Thread_Speed=5;//apikey被限制每秒5个查询
var Load_Max_Try=3;//错误重试次数

var Load_Wait_Child=91;//此城市下级列表已抓取完毕，等待子级完成抓取
var Load_Full_End=92;//此城市包括下级全部抓取完毕



var fixFill={//缺失了下一级的复制自身当做下级，都是直辖，就缺了一级。直筒子市和港澳不在这里处理
	//【直辖市】
	110000:"北京市"
	,120000:"天津市"
	,310000:"上海市"
	,500000:"重庆市"
	
	//【省直辖县级市】以下一坨可以从数据库中排序出来
	,419001:"济源市"
	
	,429004:"仙桃市"
	,429005:"潜江市"
	,429006:"天门市"
	,429021:"神农架林区"
	
	,469001:"五指山市"
	,469002:"琼海市"
	,469005:"文昌市"
	,469006:"万宁市"
	,469007:"东方市"
	,469021:"定安县"
	,469022:"屯昌县"
	,469023:"澄迈县"
	,469024:"临高县"
	,469025:"白沙黎族自治县"
	,469026:"昌江黎族自治县"
	,469027:"乐东黎族自治县"
	,469028:"陵水黎族自治县"
	,469029:"保亭黎族苗族自治县"
	,469030:"琼中黎族苗族自治县"
	
	,659001:"石河子市"
	,659002:"阿拉尔市"
	,659003:"图木舒克市"
	,659004:"五家渠市"
	,659005:"北屯市"
	,659006:"铁门关市"
	,659007:"双河市"
	,659008:"可克达拉市"
	,659009:"昆玉市"
	,659010:"胡杨河市"
};





var threadTimes=[];
var threadSleep=function(run){
	var t=Math.floor(Date.now()/1000)*1000;
	var n=0;
	for(var i=0;i<threadTimes.length;i++){
		if(threadTimes[i]>=t){
			n++;
		};
	};
	
	var sleep=t+1000-Date.now();
	if(n<Load_Thread_Speed){
		sleep=Math.floor(sleep/(Load_Thread_Speed-n)*(3/4));
	};
	
	threadTimes.splice(0,0,Date.now());
	threadTimes.length=Math.min(Load_Thread_Speed*2,threadTimes.length);
	setTimeout(run,sleep);
};
window.FixFillFn=function(parent){//出错时，手动调用一下fixFill
	var fixItm={
		name:parent.name
		,code:parent.code
		,pinyin:parent.pinyin
		,child:[]
		,parent:parent
		,load:0
	};
	
	parent.load=Load_Wait_Child;
	parent.child=[fixItm];
	
	console.log(parent.code+":"+parent.name+" 自动补充唯一完全相同的下级");
};
function addCity(parent,arr,o){
	var itm={
		name:o.fullname
		,code:o.id
		,pinyin:(o.pinyin||[]).join(" ")
		,child:[]
		,parent:parent
		,load:0
	};
	arr.push(itm);
	
	var fix=fixFill[itm.code];
	if(itm.name==fix){
		FixFillFn(itm);
	};
};

var load_shen_all=function(next){
	DATA.cityList=[];
	$.ajax({
		url:"https://apis.map.qq.com/ws/district/v1/list?key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77"
		,error:function(){
			console.error("加载省份列表失败");
		}
		,success:function(data){
			console.log("省份结果",data);
			DATA.ver=data.data_version;
			
			var list=data.result[0];
			if(list.length!=34){
				console.error("省份结果0的个数不对");
				return;
			};
			
			for(var i=0;i<list.length;i++){
				addCity(null,DATA.cityList,list[i]);
			};
			console.log("省份采集完成",DATA);
			
			next();
		}
	});
};



var logX=$('<div class="LogX" style="position: fixed;bottom: 80px;right: 100px;padding: 50px;background: #0ca;color: #fff;font-size: 16px;width: 600px;z-index:9999999"></div>');
$("body").append(logX);
var logXn=0;
function LogX(txt){
	logXn++;
	if(true || LoadMaxLevel<4 || logXn%100==0){
		logX.text(txt);
	}
};

var loadReqCount=0,blockReqCount=0;
function load_x_childs(itm, next){
	var city=itm.obj,levelObj=Level[itm.level],levelNextObj=Level[itm.level+1];
	city.load++;
	if(city.load>Load_Max_Try){
		console.error("读取"+levelObj.n+"["+city.name+"]超过"+Load_Max_Try+"次");
		next();
		return;
	};
	
	var times=Math.round((Date.now()-RunLoad.T1)/1000);
	LogX(Math.floor(times/60)+"′"+(times%60)+"″ "+(loadReqCount/times).toFixed(1)+"/s 读取"+loadReqCount+"次 BL:"+blockReqCount+" "+getJD()+" ["+city.name+"]"+levelObj.n);
	
	loadReqCount++;
	$.ajax({
		url:"https://apis.map.qq.com/ws/district/v1/getchildren?id="+city.code+"&key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77"
		,timeout:20000
		,error:function(){
			threadSleep(function(){
				load_x_childs(itm, next);
			});
		}
		,success:function(data){
			if(data.status!=0){
				if(data.status==120){
					blockReqCount++;
					city.load--;//此key每秒请求量已达到上限
					setTimeout(function(){
						load_x_childs(itm, next);
					},200);
					return;
				};
				if(data.status==363&&data.message=="错误的id"){
					console.error("下级列表没有，需要在fixFill中加入填充数据，然后调用FixFillFn重新修正上下级后继续采集",itm);
					return;
				};
				
				threadSleep(function(){
					load_x_childs(itm, next);
				});
				return;
			};
			var list=data.result[0];
			for(var i=0;i<list.length;i++){
				addCity(city,city.child,list[i]);
			};
			
			city.load=Load_Wait_Child;
			JD[levelNextObj.k+"_count"]+=city.child.length;
			
			threadSleep(next);
		}
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
	
	var getValue=function(src){
		var dist=[];
		for(var i=0;i<src.length;i++){
			var o=src[i];
			var itm={
				name:o.name
				,code:(o.code+"000000000000").substr(0,12)
				,child:getValue(o.child)
			};
			if(o.pinyin)itm.qqPY=o.pinyin;
			dist.push(itm);
		};
		dist.sort(function(a,b){
			return a.code.localeCompare(b.code);
		});
		return dist;
	};
	var data=getValue(DATA.cityList);
	
	var saveData={
		ver:DATA.ver
		,cityList:data
	};
	window[SaveName]=saveData;
	
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
	var itm=findNext(DATA.cityList,1);
	if(!itm||!itm.obj){
		//最后循环full计数
		findNext(DATA.cityList,1);
		findNext(DATA.cityList,1);
		findNext(DATA.cityList,1);
		findNext(DATA.cityList,1);
		
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
		itm.load=itm.load>50?itm.load:0;
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
		JD.shen_count=DATA.cityList.length;
		
		for(var i=0;i<Load_Thread_Count;i++){
			thread();
		};
	};
	
	
	if(DATA.cityList.length){
		console.log("恢复采集...");
		clearLoadErr(DATA.cityList);
		
		start();
	}else{
		load_shen_all(start);
	}
}
})();//@ sourceURL=console.js


//立即执行代码
RunLoad()