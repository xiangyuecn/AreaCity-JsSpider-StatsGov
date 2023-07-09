/******************
《【转换】 文件格式批量互转 SHP|JSON|KML|GML|…… 支持多种矢量格式文件》
作者：高坚果
时间：2023-06-26 18:51

本代码用于将一种矢量格式文件批量转换成另外一种格式的矢量文件，比如：geojson文件批量转换成shp文件。
******************/
(function(){
var appHasVFC=("vectorFileFormatConvert" in AppCmds);

//加载需要的data.js
Runtime.Import([
	{url:"WebviewSettingsCodes/vector_file_format_convert__data.js",check:function(){ return !window.VectorFileFormatConvertData }}
]);
//显示控制按钮
Runtime.Ctrls([
	{html:(appHasVFC?'<div>请完成以下配置，然后点击“开始转换”按钮进行文件格式转换：</div>'
		:'<div style="font-size:24px;color:red">软件版本过低，请重新下载升级后再操作</div>')}
	,{html:'<div style="border:3px dashed #a2a1a1;background:#fafafa;padding:8px;margin-top:8px">\
<div style="font-size:18px">【选择要转换的矢量格式文件】</div>\
<div style="font-size:13px;">\
\
<div style="padding-top:8px">\
	<button onclick="choiceSrcFileClick()">选一个源文件</button>\
	<button onclick="choiceSrcFolderClick()">选文件夹</button>\
	<input class="vfcIn in_choiceSrc" style="width:320px">\
	<div style="color:#aaa"><span style="color:#f60">请选择一个源文件、或者一个文件夹（批量处理）</span>，选的文件、或文件夹内所有匹配的源文件都会转换成新的格式，新文件会放到一个自动新建的文件夹内</div>\
</div>\
\
<div style="padding-top:8px">\
	源文件驱动：<input class="vfcIn in_srcDriverName" style="width:120px">\
	<span class="slc_srcDriver"></span>\
	<div style="color:#aaa">源文件对应的GDAL矢量驱动程序名称；支持的名称请参考（Short name）：https://gdal.org/drivers/vector/index.html，其中部分驱动可能不支持转换</div>\
</div>\
\
<div style="padding-top:8px">\
	源文件筛选正则表达式：\
	<input class="vfcIn in_srcFileNameExp" style="width:240px">\
	<div style="color:#aaa">仅选择文件夹时生效，不区分大小写，只有文件名称匹配的源文件会被转换</div>\
</div>\
\
</div>\
	</div>'}
	
	,{html:'<div style="border:3px dashed #a2a1a1;background:#fafafa;padding:8px;margin-top:8px">\
<div style="font-size:18px">【转换成】 <span class="slc_destDriver"></span></div>\
<div style="font-size:13px;">\
\
<div style="padding-top:8px">\
	新文件格式：<input class="vfcIn in_destFileExt" style="width:120px">\
	<div style="color:#aaa">请填写文件后缀名，比如：.shp .kml，匹配的源文件将会转换成一个此后缀的同名文件</div>\
</div>\
\
<div style="padding-top:8px">\
	新文件驱动：<input class="vfcIn in_destDriverName" style="width:120px">\
	<div style="color:#aaa">要转换成的新文件对应的GDAL矢量驱动程序名称（参考上面的源文件驱动），此驱动必须支持创建文件，否则将无法转换成此类型的格式</div>\
</div>\
\
<div style="padding-top:8px">\
	Creation options：<input class="vfcIn in_destOptions" style="width:408px">\
	<div style="color:#aaa">可选，新文件驱动的配置参数，格式：-K1=V1 -K2=V2，请参考其驱动文档进行填写</div>\
</div>\
\
<div style="padding-top:8px">\
	Configuration options：<input class="vfcIn in_configOptions" style="width:380px">\
	<div style="color:#aaa">可选，GDAL配置参数，格式：-K1=V1 -K2=V2，源文件和新文件的驱动配置都填到这里</div>\
</div>\
\
</div>\
	</div>'}
	
	,{html:'<div style="padding-top:8px"></div>'}
	,{name:"开始转换",click:"runClick"}
	,{html:'<span style="color:#0b1">本转换功能免费版、付费版均可无限制使用</span>'}
]);

//部分已测试可用驱动
var DriverList=[
{name:"GeoJSON",ext:".json",exp:"\\.(geo)?json$",configOptions:"",destOptions:"-ID_FIELD=NO"}
,{name:"ESRI Shapefile",ext:".shp",exp:"",configOptions:"-SHAPE_ENCODING=UTF-8",destOptions:"-ENCODING=UTF-8"}
,{name:"LIBKML @kml",ext:".kml",exp:"",configOptions:"-LIBKML_NAME_FIELD=NO",destOptions:""}
,{name:"LIBKML @kmz",ext:".kmz",exp:"",configOptions:"-LIBKML_NAME_FIELD=NO",destOptions:""}
,{name:"GML",ext:".gml",exp:"",configOptions:"",destOptions:"-FORMAT=GML2"}
,{name:"GPKG",ext:".gpkg",exp:"",configOptions:"",destOptions:"-VERSION=1.2"}
,{name:"DXF @AutoCAD",ext:".dxf",exp:"",configOptions:"",destOptions:"-HEADER=${header.dxf} -TRAILER=${trailer.dxf}",destOnly:true}
,{name:"PDF",ext:".pdf",exp:"",configOptions:"",destOptions:"",destOnly:true}
//,{name:"",ext:"",exp:"",configOptions:"",destOptions:"",destOnly:false}
];
var DriverNameMP={},DriverExtMP={};
for(var i=0;i<DriverList.length;i++){
	var o=DriverList[i]; DriverNameMP[o.name]=o; DriverExtMP[o.ext]=o;
	if(!o.exp)o.exp="\\"+o.ext+"$";
	o.exp_=new RegExp(o.exp,"i");
}
var resetConfigOptions=function(data){
	var src=DriverNameMP[data.srcDriverName];
	var dest=DriverNameMP[data.destDriverName];
	if(src||dest){
		var val=src?src.configOptions:"";
		if(dest && val.indexOf(dest.configOptions)==-1){
			val+=(val?" ":"")+dest.configOptions;
		}
		data.configOptions=val;
	}
};

//下拉选择格式，选择后自动进行填充
var fillDriverSlc=function(cls,isDest){
	var html=['<select style="height:22px;color:#999">'];
	html.push('<option>----- 可选一个预定义格式进行自动填充 -----</option>');
	for(var i=0;i<DriverList.length;i++){
		var o=DriverList[i]; if(!isDest && o.destOnly) continue;
		var name=o.ext+(o.ext.length==4?' ':'')+"　|　"+o.name;
		html.push('<option value="'+(i+1)+'">'+name+'</option>');
	}
	html.push('</select>');
	var el=$("."+cls).html(html.join(" ")).find("select")[0];
	el.onchange=function(){
		var val=+el.value; if(!val)return;
		var item=DriverList[val-1];
		fillDriverSlc(cls,isDest);
		changeDriver(item,isDest);
	};
};
var changeDriver=function(item,isDest,keeps){
	var vals=readInVal();
	if(isDest){
		if(!keeps||!keeps.destFileExt)vals.destFileExt=item.ext||"";
		vals.destDriverName=item.name||"";
		vals.destOptions=item.destOptions||"";
	}else{
		vals.srcDriverName=item.name||"";
		vals.srcFileNameExp=item.exp||"";
	}
	resetConfigOptions(vals);
	fillInVal(vals);
};

//选择源文件处理
var changeSrcFile=function(val){
	val=val.trim();
	for(var i=0;i<DriverList.length;i++){
		var o=DriverList[i];
		if(!o.destOnly && o.exp_.test(val)){
			changeDriver(o,false); return;
		}
	}
	//changeDriver({},false);
};
var choiceSrcFile=function(folder){
	var vals=readInVal();
	var val=AppCmds[folder?"folderChoice":"fileChoice"](vals.choiceSrc+"");
	if(!val)return;
	val=val.replace(/\\/g,"/");
	vals.choiceSrc=val;
	fillInVal(vals);
	changeSrcFile(val);
};
window.choiceSrcFolderClick=function(){ choiceSrcFile(true) };
window.choiceSrcFileClick=function(){ choiceSrcFile(false) };
$(".in_choiceSrc").bind("input",function(e){
	changeSrcFile(e.target.value);
});
$(".in_destFileExt").bind("input",function(e){
	var val="name"+e.target.value;
	for(var i=0;i<DriverList.length;i++){
		var o=DriverList[i];
		if(o.exp_.test(val)){
			changeDriver(o,true,{destFileExt:"keep"}); return;
		}
	}
});

//输入框数据读写
var fillInVal=function(data){
	$(".vfcIn").each(function(k,v){
		var key=(/\bin_(\w+)/.exec(v.className)||[])[1];
		if(data[key]!=null)v.value=data[key];
	});
};
var readInVal=function(){
	var vals={};
	$(".vfcIn").each(function(k,v){
		var key=(/\bin_(\w+)/.exec(v.className)||[])[1];
		vals[key]=v.value.trim();
	});
	return vals;
};
fillDriverSlc("slc_srcDriver",false);
fillDriverSlc("slc_destDriver",true);

//初始化界面
var storeKey="Store_vectorFileFormatConvertSet";
var oldSet=ParseObject(ParseObject(AppCmds.config()).Input[storeKey]);
if(oldSet.srcDriverName){ //恢复之前的配置
	fillInVal(oldSet);
}else{ //新初始化
	changeDriver(DriverExtMP[".json"],false);
	changeDriver(DriverExtMP[".shp"],true);
};



var runStartTime=0;
var runTimeTips=function(){
	var ms=Date.now()-runStartTime;
	ms=~~(ms/1000);
	var txt=("0"+ms%60).substr(-2)+"秒";
	txt=~~(ms/60)+"分"+txt;
	return txt
};

//执行
window.runClick=function(){
	if(!appHasVFC){
		var tips="软件版本过低，请重新下载升级后再操作";
		AppCmds.showTips(tips,true);Runtime.Log(tips,1);
		return;
	};
	runStartTime=Date.now();
	
	
	AppCmds.transformStart("文件格式批量互转");
	var finalCall=function(){
		AppCmds.transformEnd();
	};
	var catchCall=function(e){
		finalCall();
		var tips="发生异常："+e.message;
		AppCmds.showTips(tips,true);Runtime.Log(tips,1);
	};
	try{
		var inArgs=readInVal(),inArgsRaw=JSON.stringify(inArgs),err="";
		var isFolder=false,baseFolder="",saveFolder="",srcFiles=[];
		var choiceSrc=inArgs.choiceSrc.replace(/\\/g,"/");
		if(!err&&choiceSrc){
			var fm=/^(.+)\/([^\/]+?)\/?$/.exec(choiceSrc)||[];
			var fpath=fm[1]||"",fname=fm[2]||"";
			
			if(AppCmds.fileExists(choiceSrc,false)){
				baseFolder=fpath;
				srcFiles.push(choiceSrc);
			}else if(AppCmds.fileExists(choiceSrc,true)){
				baseFolder=fpath+"/"+fname;
				isFolder=true;
			}else{
				err="选择的源文件、或文件夹不存在";
			}
			
			saveFolder=fpath;
			if(!err&&!saveFolder)err="不支持直接使用根目录";
			saveFolder+="/"+fname+"-格式转换"+inArgs.destFileExt+"-"
				+FormatDate(null,"YMDHMS").replace(/[-:]/g,"").replace(/ /g,"-");
		}
		
		if(!err&&!inArgs.choiceSrc)err="请选择一个源文件、或者一个文件夹";
		if(!err&&!inArgs.srcDriverName)err="请填写源文件驱动";
		if(!err&&isFolder){
			if(!inArgs.srcFileNameExp)err="请填写源文件筛选正则表达式";
			else{
				try{ new RegExp(inArgs.srcFileNameExp); }
				catch(e){ err="源文件筛选正则表达式无效"; }
			}
		}
		
		if(!err&&!inArgs.destFileExt)err="请填写新文件格式";
		if(!err&&!inArgs.destDriverName)err="请填写新文件驱动";
		
		var parse=function(key,tag){
			var str=inArgs[key],opts=[];
			inArgs[key]=opts;
			if(!str)return;
			if(/\$\{.+?\}/.test(str)){//变量替换
				if(!window.VectorFileFormatConvertData){
					err="data.js还未完成加载";
					return;
				}
				str=str.replace(/\$\{(.+?)\}/g,function(a,b){
					var v=VectorFileFormatConvertData[b];
					if(typeof(v)=="function")return v();
					return v;
				});
			};
			var arr=(" "+str).split(/\s+-/);
			for(var i=0;i<arr.length;i++){
				var v=arr[i];
				if(i==0 && !v){//去掉开头
				}else if(/^[^=\s]+=.+/.test(v) && !/^[-\s]/.test(v)){
					opts.push(v);
				}else if(!err){
					err=tag+"存在无效配置："+v;
				}
			}
		};
		if(!err)parse("destOptions","Creation options");
		if(!err)parse("configOptions","Configuration options");
		
		if(err){
			finalCall();
			AppCmds.showTips(err,true);Runtime.Log(err,1);
			return;
		}
		Runtime.Log("转换配置："+JSON.stringify(inArgs));
		//存起来
		AppCmds.setConfig(storeKey,inArgsRaw);
		
		
		//读取文件列表
		if(isFolder){
			var list=AppCmds.fileList(baseFolder,true,JSON.stringify({
				fileExp:inArgs.srcFileNameExp,returnFolder:false
			}));
			list=JSON.parse(list);
			for(var i=0;i<list.length;i++){
				var o=list[i];
				srcFiles.push(o.folder+o.name);
			}
		}
		if(!srcFiles.length){
			finalCall();
			var tips="文件夹\""+baseFolder+"\"中未找到匹配文件，正则表达式："+inArgs.srcFileNameExp;
			AppCmds.showTips(tips,true);Runtime.Log(tips,1);
			return;
		}
		
		var tips1="将要把"+srcFiles.length+"个"+inArgs.srcDriverName+"文件转换成"+inArgs.destDriverName+"("+inArgs.destFileExt+")格式";
		var tips="【开始】"+tips1+"，新文件将保存到目录："+saveFolder;
		AppCmds.showTips(tips);Runtime.Log(tips,2);
		
		var t1=Date.now();
		if(!confirm(tips1+"，是否确定要进行转换？")){
			finalCall();
			
			var tips="用户取消了转换";
			AppCmds.showTips(tips,true);Runtime.Log(tips,1);
			return;
		}
		runStartTime+=Date.now()-t1;//等待用户确认，修正开始时间
		
		//循环处理
		var idx=-1,okCount=0,errCount=0,callback=RandomKey(16);
		var runNext=function(){
			try{
				__runNext();
			}catch(e){
				catchCall(e);
			}
		}
		var __runNext=function(){
			idx++;
			if(idx>=srcFiles.length){
				//结束
				finalCall();
				
				var tips="【完成】【耗时："+runTimeTips()+"】已转换"+okCount+"个文件"+(errCount?"，失败"+errCount+"个文件":"")+"，新文件保存在目录："+saveFolder;
				AppCmds.showTips(tips);Runtime.Log(tips,errCount?1:2);
				return;
			}
			var srcFile=srcFiles[idx];
			var srcFile2=srcFile.substr(baseFolder.length);
			var destFile=saveFolder+srcFile2.replace(/\.[^\.]+/,"")+inArgs.destFileExt;
			var tips="("+(idx+1)+"/"+srcFiles.length+")："+srcFile2+" -> "+destFile;
			AppCmds.showTips("正在转换"+tips);
			Runtime.Log('<span class="vfc_run_'+idx+'">正在转换</span>'+tips+'<span class="vfc_run_tips_'+idx+'"></span>');
			
			window[callback]=function(data){
				window[callback]=null;
				if(data.c===0){
					okCount++;
					$(".vfc_run_"+idx).html('<span style="color:#0b1">转换成功</span>');
				}else{
					errCount++;
					$(".vfc_run_"+idx).html('<span style="color:red">转换失败</span>');
					$(".vfc_run_tips_"+idx).html('<pre style="color:red">'+data.m+'</pre>');
				}
				runNext();
			};
			AppCmds.vectorFileFormatConvert(JSON.stringify({
				callback:callback
				,srcFile:srcFile
				,destFile:destFile
				,srcDriverName:inArgs.srcDriverName.replace(/ @.+/,"")
				,destDriverName:inArgs.destDriverName.replace(/ @.+/,"")
				,configOptions:inArgs.configOptions
				,destOptions:inArgs.destOptions
			}));
		};
		runNext();
	}catch(e){
		catchCall(e);
	};
};


})();