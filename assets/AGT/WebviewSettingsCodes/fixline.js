/******************
《【工具】 FixLine 修复CSV文件内错误边界数据》
作者：高坚果
时间：2022-01-10 20:16:32

本工具用来辅助人工修复CSV文件内部分简单的边界错误。用于在出现转换错误时，比如边界线条之间由于转换精度问题发生轻微交叉，可尝试使用本工具进行修复，然后就可以正常转换了。

工具通过 AppCmds.setConfig("User_ToExec_SHP_Test","true") 参数来开启在转换shp时对csv边界数据进行校验，错误的边界全部会显示出来，然后用本工具修复。

核心函数：
FixLine(`polygon`,     set)
	set={target:``,id:""} || "target" || null
		当提供target时解析分析polygon但应用修复到这个数据并返回这个数据
******************/
(function(){


//显示控制按钮
Runtime.Ctrls([
	{html:'<div>\
<div style="border-bottom: 1px solid #eee;padding-bottom:10px;margin-bottom:20px">\
	<span style="width:80px;font-size:18px;font-weight:bold">User_ToExec_SHP_Test:</span>\
	<span class="shpTestBox"></span>\
</div>\
<div>\
	<div style="width:80px;font-size:18px;font-weight:bold">polygon:</div>\
	<textarea class="fixLine_polygon" placeholder="csv里面的错误的polygon字段数据" style="width:400px;height:80px"></textarea>\
</div>\
<div>\
	<div style="width:80px;font-size:18px;font-weight:bold">target:</div>\
	<textarea class="fixLine_target" placeholder="如果提供，分析完polygon错误后，对错误部位的修复应用到这个target值，不提供时只修复polygon值" style="width:400px;height:80px"></textarea>\
</div>\
	</div>'}
	,{name:"FixLine",click:"fixLineClick"}
	,{html:'<div class="fixLine_div"></div>'}
]);



window.OutputSQL=0;//如果结果要输出成sql格式改成 1:sql构造 2:sql更新（需提供set）
window.UpdateTabName="TabName"; //sql需要的表名

var FixLine=function(polygon,set     ,fixLoop){
	if(typeof(set)=="string"){
		set={target:set};
	};
	set=set||{};
	var target=set.target||"";
	if(target && getLen(target)!=getLen(polygon)){
		throw new Error("target长度和polygon不一致");
	}
	var rtvOrgTxt=set.orgTxt||target||polygon;
	set.orgTxt=rtvOrgTxt;
	
	var rtv="";
	var rtv2="";
	var blocks=polygon.split(";");
	var blocks2=(target||polygon).split(";");
	var idx=1;
	var hasFix=0;
	for(var i2=0;i2<blocks.length;i2++){
		if(i2>0){
			rtv+=";";
			rtv2+=";";
			idx++;
		};
		var block=blocks[i2];
		var block2=blocks2[i2];
		var diffs=block.split("~");
		var diffs2=block2.split("~");
		for(var i3=0;i3<diffs.length;i3++){
			if(i3>0){
				rtv+="~";
				rtv2+="~";
				idx++;
			};
			
			var ps=diffs[i3].split(",");
			var ps2=diffs2[i3].split(",");
			var arr=[],arr2=[];
			for(var i4=0;i4<ps.length;i4++){
				var point=ps[i4].split(" ");
				arr.push([
					+(+point[0]).toFixed(6)
					,+(+point[1]).toFixed(6)
				]);
				point=ps2[i4].split(" ");
				arr2.push([
					+(+point[0]).toFixed(6)
					,+(+point[1]).toFixed(6)
				]);
			};
			if(arr.length<3){
				throw new Error(idx+"处的polygon坐标数量不足");
			};
			while(arr[0].join(" ")==arr[arr.length-1].join(" ")){
				console.warn(idx+"处的polygon丢弃结尾一个环坐标");
				arr.pop();
				arr2.pop();
			};
			
			//删掉5个内相同的点，成段删除
			for(var i4=-5;i4<arr.length;i4++){
				var i5=i4>=0?i4:arr.length+i4;
				for(var j=1,n=1;j<5;j++,n++){
					var i6=i5+n;
					if(i6>=arr.length){
						break;
					};
					//整段删除
					if(equals(arr[i5],arr[i6])){
						for(var ix=1;ix<=n;ix++){
							console.warn(idx+"处的polygon删除相同段",arr[i5+1]);
							arr.splice(i5+1,1);
							arr2.splice(i5+1,1);
						};
						n=0;
					};
				};
			};
			
			if(!validateLines(arr)){
				var fixOk=0,fixPos=0;
				if((!fixLoop||fixLoop<10) && bads){
					hasFix=1;
					fixOk=1;
					
					//合并重叠的
					for(var d2=1;d2<bads.length;d2++){
						var p0=bads[d2-1],p1=bads[d2];
						if(p0[0]>p0[1] || p1[0]>p1[1] || p1[1]<p0[1]){
							throw new Error("未支持反方向处理");
						}
						if(p1[0]<=p0[1]){
							bads.splice(d2,1);
							p0[1]=p1[1];
							console.log("区间合并: "+p0[0]+" - "+p0[1]);
							d2--;
						}
					}
					
					for(var d2=0;d2<bads.length;d2++){
						var bad=bads[d2];
						console.log("处理区间: "+bad[0]+" - "+bad[1]+" 将删除"+(bad[1]-bad[0])+"个点(共"+arr.length+"点)");
						if(bad[0]==0 && arr.length-bad[1]<3){
							bad[0]=bad[1]-1;
							bad[1]=arr.length-1;
							console.warn("转成环形fix: "+bad[0]+" - "+bad[1]+" 将删除"+(bad[1]-bad[0])+"个点(共"+arr.length+"点)");
						}
						if(bad[1]-bad[0]<10){//间隔几个的相交，简单删掉后两个坐标即可
							for(var d3=bad[0]+1;d3<=bad[1];d3++){
								var s=arr.splice(d3-fixPos,1);
								arr2.splice(d3-fixPos,1);
								console.warn("fix移除："+d3,s[0]);
								fixPos++;
							};
						}else{
							console.error("间隔点数过多，未进行删除操作");
							fixOk=0;
							break;
						};
					};
				};
				if(!fixOk){
					throw new Error("边界无效");
				}
			};
			
			
			
			for(var i4=0;i4<arr.length;i4++){
				if(i4>0){
					rtv+=",";
					rtv2+=",";
				};
				rtv+=arr[i4].join(" ");
				rtv2+=arr2[i4].join(" ");
			};
			
			idx+=diffs[i3].length;
		};
	};
	if(hasFix){
		console.log("再次校验...");
		set.target=target?rtv2:"";
		return FixLine(rtv,set,(fixLoop||0)+1);
	};
	
	var rtv1=rtv;
	rtv=target?rtv2:rtv1;
	if(OutputSQL){
		if(rtv.indexOf("~")+1){
			throw new Error("导出sql暂不支持~模式");
		}
		var getGeom=function(val){
			var ms=val.split(";");
			var ps=[];
			for(var i=0;i<ms.length;i++){
				var s=ms[i];
				var ss=s.split(",");
				ps.push("(("+s+","+ss[0]+"))");
			}
			
			var geom="";
			if(ms.length>1){
				geom="MULTIPOLYGON("+ps.join(",")+")";
			}else{
				geom="POLYGON"+ps[0];
			};
			return "geometry::STGeomFromText('"+geom+"',0)";
		};
		var wkt=getGeom(rtv);
		if(OutputSQL==1){
			return wkt;
		}else if(OutputSQL==2){
			var idTxt=set.id||"【填写id】";
			var sqls=[];
			sqls.push("select polygon.STAsText() from "+UpdateTabName+" where id="+idTxt);
			sqls.push("-- 问题数据");
			sqls.push("select "+getGeom(rtvOrgTxt));
			sqls.push(".STIsValid()");
			sqls.push("-- 修复后");
			sqls.push("select "+wkt);
			sqls.push(".STIsValid()");
			sqls.push("\n");
			sqls.push("-- update "+UpdateTabName+" set polygon="+wkt+" where id="+idTxt);
			return sqls.join("\n")+"\n\n";
		}else{
			throw new Error("未知OutputSQL："+OutputSQL);
		}
	}
	return rtv;
};
var getLen=function(p){
	return p.split(/[,;~]/g).length;
};

function equals(a,b){
	return a&&b&&a[0]==b[0]&&a[1]==b[1];
};
//检测构成区域的所有线条是否合法，没有相交的
var bads=[];
function validateLines(pos){
	bads=[];
	if(pos.length<3){
		return false;
	};
	if(equals(pos[0],pos[pos.length-1])){
		return false;
	};
	var ok=true;
	for(var i=1;i<pos.length;i++){
		var a=pos[i-1];
		var b=pos[i];
		if(equals(a,b)||equals(a,pos[i+1])){
			console.log(i+"和后面两点相同");
			bads=0;
			ok=false;
		};
		for(var j=i+1;j<pos.length;j++){
			var c=pos[j+1];
			if(!c){
				if(i!=1){
					c=pos[0];
				}else if(j==pos.length-1){
					break;
				};
			};
			var d=pos[j];
			
			var a_lng=a[0],a_lat=a[1];
			var b_lng=b[0],b_lat=b[1];
			var c_lng=c[0],c_lat=c[1];
			var d_lng=d[0],d_lat=d[1];
			//https://blog.csdn.net/qq826309057/article/details/70942061
			//快速排斥实验
			if ((a_lng > b_lng ? a_lng : b_lng) < (c_lng < d_lng ? c_lng : d_lng) ||
				(a_lat > b_lat ? a_lat : b_lat) < (c_lat < d_lat ? c_lat : d_lat) ||
				(c_lng > d_lng ? c_lng : d_lng) < (a_lng < b_lng ? a_lng : b_lng) ||
				(c_lat > d_lat ? c_lat : d_lat) < (a_lat < b_lat ? a_lat : b_lat))
			{
				continue;
			}
			//跨立实验
			if((((a_lng - c_lng)*(d_lat - c_lat) - (a_lat - c_lat)*(d_lng - c_lng))*
				((b_lng - c_lng)*(d_lat - c_lat) - (b_lat - c_lat)*(d_lng - c_lng))) > 0 ||
			   (((c_lng - a_lng)*(b_lat - a_lat) - (c_lat - a_lat)*(b_lng - a_lng))*
				((d_lng - a_lng)*(b_lat - a_lat) - (d_lat - a_lat)*(b_lng - a_lng))) > 0)
			{
				continue;
			}
			
			console.log(i-1+"和"+j+"相交",a,d);
			bads&&bads.push([i-1,j]);
			ok=false;
		};
	};
	return ok;
};





//*****shpTest状态显示****
var updateShpTestBox=function(){
	var config=JSON.parse(AppCmds.config());
	var val=config.Input.User_ToExec_SHP_Test;
	if(!val || val=="0" || val=="false"){
		val=false;
	}else{
		val=true;
	};
	
	var elem=$(".shpTestBox");
	if(Runtime.VersionLess("1.3")){
		elem.html('软件版本过低，不支持此设置');
		return;
	};
	elem.html(' '
		+'<span style="color:'+(val?'#fb0':'#bbb')+'">'+(val?'已开启测试，':'未开启测试；开启后')+'将会在转shp文件时测试所有数据，但不会生成shp文件</span>'
		+' '+(val?'<button onclick="shpTestChange(0)">关闭</button>'
			:'<button onclick="shpTestChange(1)">开启</button>')
	);
};
updateShpTestBox();
window.shpTestChange=function(open){
	AppCmds.setConfig("User_ToExec_SHP_Test",open?'true':'false');
	updateShpTestBox();
};


//******点击时对函数进行调用***********
var console=null;
var fixLog=function(logDiv,msg,color){
	var now=new Date();
	var t=("0"+now.getHours()).substr(-2)
		+":"+("0"+now.getMinutes()).substr(-2)
		+":"+("0"+now.getSeconds()).substr(-2);
	logDiv.prepend('<div style="padding-left:25px;border-bottom: 1px solid #eee;color:'+(!color?"":color==1?"red":color==2?"#0b1":color)+'">['+t+']'+msg+'</div>');
};
var fixExec=function(title,polygon,target,logDiv){
	console={
		log:function(){_log(arguments)}
		,warn:function(){_log(arguments,"#fb0")}
		,error:function(){_log(arguments,1)}
	};
	var _log=function(args,color){
		var msgs="";
		for(var i=0;i<args.length;i++){
			var msg=args[i];
			if(msg instanceof Error){
				msg=msg.stack;
			}else if(typeof(msg)=="object"){
				msg=JSON.stringify(msg);
			}
			msg=(msg+"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/ /g,"&nbsp").replace(/\n/g,"<br>");
			msgs+="<span style='margin-right:"+(i==args.length-1?'0':'30')+"px'>"+msg+"</span>";
		};
		fixLog(logDiv,msgs,color);
	};
	
	console.log("开始Fix...",title);
	try{
		var val=FixLine(polygon,{target:target});
		fixLog(logDiv,'Fix结果：请复制下面的数据替换掉csv内对应的polygon值（如果csv内没有值时需要在开头加上"Fix:"前缀强制生效）；'+title+'<div><textarea style="width:420px;height:80px">'+val+'</textarea></div>',2);
	}catch(e){
		console.error(e);
	}
};


//转换shp时出现错误数据将会打出日志，日志里面有按钮调用本方法
window.appFixLineClick=function(cls){
	var txt=$(cls).val();
	var logDiv=$(cls+"_div").html("").css("color","#000");
	
	var m=/^([\S\s]+?)```(FixLine[\S\s]+?)```/g.exec(txt);
	if(!m){
		fixLog(logDiv,"文本框内的数据不是FixLine调用",1);
		return;
	};
	var title=m[1].replace(/无效】/g,"】");
	var code=m[2];
	
	var m=/^FixLine\('(.+?)',\{target:'(.+?)'[^}]+\}\)$/.exec(code);
	if(!m){
		fixLog(logDiv,"FixLine参数格式未匹配，请升级本代码",1);
		return;
	};
	fixExec(title,m[1],m[2],logDiv);
};

//点击按钮处理
window.fixLineClick=function(){
	fixExec(""
		,$(".fixLine_polygon").val()
		,$(".fixLine_target").val()
		,$(".fixLine_div").html(""));
};

})();