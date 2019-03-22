/*
拼音先进行本地翻译一遍，准确度不高


代码运行先前启动拼音服务.pinyin-python-server

加载数据
	上一步页面不要关也不要刷新，直接执行本代码，或者
	先直接运行本代码，根据提示输入data.txt到文本框 (内容太大，控制台吃不消，文本框快很多)

然后再次运行本代码
*/
var PinyinStop=false;

var logX=$('<div class="LogX" style="position: fixed;bottom: 80px;right: 100px;padding: 50px;background: #0ca;color: #fff;font-size: 16px;width: 600px;z-index:9999999"></div>');
var logXn=0;
function LogX(txt){
	logXn++;
	if(logXn%100==0){
		logX.text(txt);
	}
}
$("body").append(logX);
if(!$(".DataTxt").length){
	$("body").append('<div style="position: fixed;bottom: 80px;left: 100px;padding: 20px;background: #0ca;z-index:9999999">输入data.txt<textarea class="DataTxt"></textarea></div>');
};

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
		var o2={
			name:name
			,id:+o.code||0
			,ext_id:+o.orgCode
			,pid:p&&+p.code||0
			,deep:o.deep
		};
		
		if(o.deep==1){
			if(name=="市辖区"){
				o2.name=p.name;
				o2.ext_name=name;
			};
		};
		return o2;
	};
	var datas=[];
	if(window.CITY_LIST_Locals){
		datas=CITY_LIST_Locals;
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
					
					for(var i4=0;i4<qu.child.length;i4++){
						var zhen=qu.child[i4];
						zhen.deep=3;
						datas.push(fix(fixCode(zhen),qu));
					};
				};
			};
		};
		CITY_LIST=null;
		window.CITY_LIST_Locals=datas;
	}
	//console.log(JSON.stringify(datas,null,"\t"))
	//return;
	
	var idx=-1;
	var run=function(stack){
		if(PinyinStop){
			return;
		};
		stack=+stack||0;
		idx++;
		if(idx>=datas.length){
			thread--;
			if(thread==0){
				end();
			};
			return;
		};
		
		var idx_=idx;
		var id=datas[idx];
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
			var errFn=function(e){
				if(tryCount>3){
					console.error("--QueryPinYin error--"+e);
					run();
					return;
				};
				tryCount++;
				tryLoad();
			};
			
			$.ajax({
				url:"http://127.0.0.1:9527/pinyin"
				,data:{txt:name}
				,type:"POST"
				,timeout:1000
				,error:errFn
				,success:function(data){
					if(data.c!==0){
						errFn(data.m);
						return;
					};
					
					id.P=data.v.join("||");
					LogX("--"+idx_+"-QueryPinYin "+name+":"+id.P+" --");
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
	window.CITY_LIST_PINYIN_Local=CITY_LIST_Locals;
	var url=URL.createObjectURL(
		new Blob([
			new Uint8Array([0xEF,0xBB,0xBF])
			,"var CITY_LIST_PINYIN_Local="
			,JSON.stringify(CITY_LIST_Locals,null,"\t")
		]
		,{"type":"text/plain"})
	);
	var downA=document.createElement("A");
	downA.innerHTML="下载查询好城市的文件";
	downA.href=url;
	downA.download="data-pinyin-local.txt";
	logX.append(downA);
	downA.click();
};

var RunPinYin=function(){
	if(!window.CITY_LIST){
		var val=$(".DataTxt").val();
		if(!val){
			console.error("需要输入data.txt");
			return;
		}else{
			window.CITY_LIST=eval(val+";CITY_LIST");
		};
	};
	
	RunPinYin.T1=Date.now();
	QueryPinYin(ViewDown);
};


RunPinYin();