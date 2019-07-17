/*
拼音先进行本地翻译一遍，准确度不高


代码运行先前启动拼音服务assets\pinyin-python-server

加载数据
	找个干净、小的页面，直接执行本代码
	先直接运行本代码，根据提示输入data1_2.txt到文本框 (内容太大，控制台吃不消，文本框快很多)
	或者使用本地网址更快：
	var s=document.createElement("script");s.src="https://地址/data1_2.txt";document.documentElement.appendChild(s)

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
	$("body").append('<div style="position: fixed;bottom: 80px;left: 100px;padding: 20px;background: #0ca;z-index:9999999">输入data1_2.txt<textarea class="DataTxt"></textarea></div>');
};

var QueryPinYin=function(end){
	var fixCode=function(o,p){
		o.orgCode=o.code;
		var exp=0;
		if(o.deep==0){//至少留2位
			exp=/(0000000000|00000000|000000|000)$/g
		}else if(o.deep==1){//至少留4位
			exp=/(00000000|000000|000)$/g
		}else if(o.deep==2){//至少留6位
			exp=/(000000|000)$/g
		}else{//至少留9位
			exp=/(000)$/g
		};
		o.code=o.code.replace(exp,"");//每一级都有固定位数，但上提的市只会更长，精简后也会更长
		
		//填充的子集编号精简后可能和上级一样，追加000
		if(p&&p.code==o.code){
			if(o.deep<2){
				console.error("编号精简失败，未匹配的层级",o);
				throw new Error();
			};
			o.code+="000";
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
			if(name=="市辖区"){//北京、天津等，"市"级直接用"省"级名称
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
		for(var i=0;i<CITY_LIST2.length;i++){
			var shen=CITY_LIST2[i];
			shen.deep=0;
			datas.push(fix(fixCode(shen,null),null));
			
			for(var i2=0;i2<shen.child.length;i2++){
				var si=shen.child[i2];
				si.deep=1;
				datas.push(fix(fixCode(si,shen),shen));
				
				for(var i3=0;i3<si.child.length;i3++){
					var qu=si.child[i3];
					qu.deep=2;
					datas.push(fix(fixCode(qu,si),si));
					
					for(var i4=0;i4<qu.child.length;i4++){
						var zhen=qu.child[i4];
						zhen.deep=3;
						datas.push(fix(fixCode(zhen,qu),qu));
					};
				};
			};
		};
		console.log(CITY_LIST2);
		CITY_LIST2=null;
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
	if(!window.CITY_LIST2){
		var val=$(".DataTxt").val();
		if(!val){
			console.error("需要输入data1_2.txt");
			return;
		}else{
			window.CITY_LIST2=eval(val+";CITY_LIST2");
		};
	};
	
	RunPinYin.T1=Date.now();
	QueryPinYin(ViewDown);
};


RunPinYin();