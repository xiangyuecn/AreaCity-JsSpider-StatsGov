/*
拼音翻译
http://www.qqxiuzi.cn/zh/pinyin/

拼音接口可能会屏蔽ip，通过切换代理解决，底部有方法，先准备好代理和采集好ip


打开上面这个页面

加载数据
	先直接运行本代码，根据提示输入PinyinLocalSaveName对应文件到文本框 (内容太大，控制台吃不消，文本框快很多)
	或者使用本地网址更快：
	var url="https://地址/";
	var s=document.createElement("script");s.src=url+"Step2_1_Pinyin_Local.txt?t="+Date.now();document.body.appendChild(s)

然后再次运行本代码
*/
var SaveName="Step2_2_Pinyin_WebApi";
var PinyinLocalSaveName="Step2_1_Pinyin_Local";

if(!$(".DataTxt").length){
	$("body").append('<div style="position: fixed;bottom: 80px;left: 100px;padding: 20px;background: #0ca;z-index:9999999">输入'+PinyinLocalSaveName+'.txt<textarea class="DataTxt"></textarea></div>');
};

window.PageToken="";
var FixTrim=function(name){
	return name.replace(/^\s+|\s+$/g,"");
};
var checkqqPY=function(itm){
	var q=itm.qqPY,p=itm.P2;
	if(q&&p){
		var a=q.length>p.length?q:p;
		var b=a!=q?q:p;
		if(a.indexOf(b)!=0){
			console.log("和qq的拼音不一致qq:"+q+" <=> "+p,itm);
		};
	};
};
var QueryPinYin=function(end){
	var datas=CityData.cityList;
	
	//一次性多查，一个个查被封的快又慢
	var keyMp={};
	for(var i=0;i<datas.length;i++){
		var o=datas[i];
		if(!o.P2&&o.deep<3){
			if(CacheDic[o.name]){
				o.P2=CacheDic[o.name];
				checkqqPY(o);
			}else{
				keyMp[o.name]||(keyMp[o.name]=[]);
				keyMp[o.name].push(o);
			};
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
	console.log("需要查询"+(ids.length)+"段数据",ids);
	
	
	
	var idx=-1,sendCount=0;
	var run=function(){
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
				,data:"t="+encodeURIComponent(name)+"&d=1&s=null&k=1&b=1&h=null&u=null&v=1&y=null&z=null&token="+PageToken
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
					var arr=html.replace(/<\/div>$/g,"").replace(/<\/div>/g,"\n").trim().split("\n");
					var refs=id.refs;
					if(arr.length!=refs.length){
						console.error("无效查询，返回数量不对，已停止："+refs.length+":"+arr.length,idx_);
						console.log(id);
						console.log(arr);
						return;
					};
					var count=0;
					var adds={};
					for(var i=0;i<arr.length;i++){
						var mps=refs[i];
						var txt=FixTrim(arr[i].replace(/<([^">]+(".*?")?)+>/g,"").replace(/\s+/g," "));
						adds[mps[0].name]=txt;
						for(var j=0;j<mps.length;j++){
							mps[j].P2=txt;
							checkqqPY(mps[j]);
							count++;
						};
					};
					console.log(idx_+"已查询"+count+"个");
					
					saveCache(adds);
					
					console.log("等待20s 进行下个查询");
					setTimeout(run,20000);
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
	
	var saveData=CityData;
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
	downA.innerHTML="下载WebApi拼音处理好的城市文件";
	downA.href=url;
	downA.download=SaveName+".txt";
	document.body.appendChild(downA);
	downA.click();
};

var CacheDic;
function saveCache(add){
	$.extend(CacheDic,add);
	localStorage["CacheDic"]=JSON.stringify(CacheDic);
};

var proxyID=+localStorage["proxyID"]||0;
var RunPinYin=function(){
	if(!window[PinyinLocalSaveName]){
		var val=$(".DataTxt").val();
		if(!val){
			console.error("需要输入"+PinyinLocalSaveName+".txt");
			return;
		}else{
			window[PinyinLocalSaveName]=eval(val+";"+PinyinLocalSaveName);
		};
	};
	
	window.CityData=window[PinyinLocalSaveName];
	window[PinyinLocalSaveName]=null;
	
	if(!CacheDic){
		CacheDic={};
		var cache=localStorage["CacheDic"];
		if(cache){
			console.warn("已加载拼音字符映射缓存，如果长时间未清理过，应该清除localStorage['CacheDic']后请求新的数据");
			CacheDic=JSON.parse(cache);
		};
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
	ajax("/nt/"+page,function(str){
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