/******************
《【合并】 GeoJSON 多个文件合并成一个文件》
作者：高坚果
时间：2022-01-07 19:16:58

本代码用于将多个小的geojson 文件合并成一个大的，比如将多个城市零散的小geojson文件合并成一个大的文件。

【注意】本代码只能合并固定的换行风格的geojson文件（类似本工具导出的json文件内容风格），因为要简化对文本的处理，本代码要求所有文件内每条数据文本均独占一行，所以如果一行有多条数据、一条数据占了多行，均不支持合并到一个文件。
******************/
(function(){

//显示控制按钮
Runtime.Ctrls([
	{html:'<div>\
<div>\
	<span style="font-size:18px">【GeoJSON多个文件合并成一个文件操作步骤】</span>\
	<br>1. 将待合并的多个GeoJSON文件放到一个文件夹内，允许有子目录；\
	<br>2. 点击顶部“通用-选择文件夹”按钮，选择上一步这个文件夹；\
	<br>3. 点击下面的“开始合并”按钮，等待合并完成；\
	<br>4. 合并完成后，生成的文件和选择的文件夹在同一目录。\
</div>\
	</div>'}
	
	,{html:'<div style="padding:10px 0">\
<div style="font-size:18px">【配置项】</div>\
<div style="font-size:13px;">\
<div style="padding:8px 0">\
	GeoJSON文件筛选正则表达式：\
	<input class="fileNameExp" style="width:240px;color:blue" value="\\.(geo)?json$">\
	（不区分大小写，只有文件名称匹配的文件会被合并，留空将匹配所有文件，\
	<a onclick="$(\'.fileNameExp\').val(\'^(.(?!_single))+\\\\.(geo)?json$\')"\
		>排除_single文件</a>）\
</div>\
</div>\
	</div>'}
	
	,{name:"开始合并",click:"runClick"}
	,{html:'<span style="color:#0b1">本合并功能免费版、付费版均可无限制使用</span>'}
]);

var runStartTime=0;
var runTimeTips=function(){
	var ms=Date.now()-runStartTime;
	ms=~~(ms/1000);
	var txt=("0"+ms%60).substr(-2)+"秒";
	txt=~~(ms/60)+"分"+txt;
	return txt
};

//执行拆分代码
window.runClick=function(){
	if(Runtime.VersionLess("1.3")){
		var tips="软件版本过低，请重新下载升级后再操作";
		AppCmds.showTips(tips,true);Runtime.Log(tips,1);
		return;
	};
	runStartTime=Date.now();
	
	var fileNameExp=$(".fileNameExp").val();
	if(fileNameExp){
		try{
			new RegExp(fileNameExp);
		}catch(e){
			var tips="文件筛选正则表达式无效！";
			AppCmds.showTips(tips,true);Runtime.Log(tips,1);
			return;
		}
	}
	
	//读取用户选择的文件夹路径
	var config=JSON.parse(AppCmds.config());
	var path=config.Input.input_webview_folder;
	if(!path){
		Runtime.Log("请先点击顶部“通用-选择文件夹”按钮，选择包含了多个GeoJSON文件的文件夹",1);
		return;
	}
	if(/:.$/.test(path)){
		Runtime.Log("必须选择一个文件夹，请将待合并的文件放到一个文件夹里面",1);
		return;
	}
	
	
	AppCmds.transformStart("合并GeoJSON文件");
	var finalCall=function(){
		AppCmds.transformEnd();
	};
	var catchCall=function(e){
		finalCall();
		var tips="发生异常："+e.message;
		AppCmds.showTips(tips,true);Runtime.Log(tips,1);
	};
	try{
		var tips="【开始】请稍后... 正在分析目录内的文件："+path;
		AppCmds.showTips(tips);Runtime.Log(tips);
		
		var fm=/^(.+)\/([^\/]+?)\/?$/.exec(path.replace(/\\/g,"/"));
		var fname=fm[2];
		
		var files=AppCmds.fileList(path, true, JSON.stringify({fileExp:fileNameExp, returnFolder:false}));
		files=JSON.parse(files);
		if(files.length<2){
			finalCall();
			
			var tips="文件夹\""+path+"\"中GeoJSON文件数量为"+files.length+"个，无需合并";
			AppCmds.showTips(tips,true);Runtime.Log(tips,1);
			return;
		}
		
		var tips="发现"+files.length+"个GeoJSON文件";
		AppCmds.showTips(tips);Runtime.Log(tips,2);
		
		var t1=Date.now();
		if(!confirm("从文件夹\""+fname+"\"中发现"+files.length+"个GeoJSON文件，是否确定要合并成一个新文件？")){
			finalCall();
			
			var tips="用户取消了合并";
			AppCmds.showTips(tips,true);Runtime.Log(tips,1);
			return;
		}
		runStartTime+=Date.now()-t1;//等待用户确认，修正开始时间
		
		//创建新文件
		var now=new Date();
		var savePath=fm[1]+"/"+fm[2]+"-合并-"
			+now.getFullYear()
			+("0"+(now.getMonth()+1)).substr(-2)
			+("0"+now.getDate()).substr(-2)
			+"-"
			+("0"+now.getHours()).substr(-2)
			+("0"+now.getMinutes()).substr(-2)
			+("0"+now.getSeconds()).substr(-2)
			+"."+((/\.([^.]+)$/.exec(files[0].name)||[])[1]||"json");
		var tips="正在将"+files.length+"个文件合并到："+savePath;
		AppCmds.showTips(tips);Runtime.Log(tips);
		
		
		var write=AppCmds.openFileWriteRes(savePath);
		var idx=-1,scope={
			write:write,files:files
			,path:path.replace(/\\/g,"/").replace(/\/$/g,"")
			,savePath:savePath
			,count:0,needHead:true
		};
		var writeNext=function(){
			try{
				__writeNext();
			}catch(e){
				catchCall(e);
			}
		}
		var __writeNext=function(){
			idx++;
			scope.idx=idx;
			if(idx>=files.length){
				//已全部处理完成，写入结尾字符串
				AppCmds.fileWrite(write,"\n]\n}\n");
				AppCmds.closeRes(write);
				
				//结束
				finalCall();
				
				var tips="【合并完成】【耗时："+runTimeTips()+"】已合并"+files.length+"个文件到一个文件："+savePath+"，共"+scope.count+"条数据";
				AppCmds.showTips(tips);Runtime.Log(tips,2);
				return;
			}
			
			writeFile(scope,catchCall,function(){
				setTimeout(writeNext);
			});
		};
		writeNext();
	}catch(e){
		catchCall(e);
	};
};


var writeFile=function(scope,Catch,OK){
	var file=scope.files[scope.idx];
	var path=file.folder+file.name;
	var pathTips=path.replace(scope.path,"");
	
	var statusCls="";
	var updateStatus=function(isEnd){
		if(!statusCls){
			statusCls=("t"+Math.random()).replace(/\./g,"");
			Runtime.Log('<span class="'+statusCls+'"></span>');
		}
		var tips=runTimeTips()+" 进度："+(scope.idx+1)+"/"+scope.files.length;
		if(isEnd){
			tips+="，[OK 共"+count+"条]";
		}else{
			tips+="，[发现"+count+"条]";
		}
		tips+=pathTips;
		
		$("."+statusCls).text(tips);
		AppCmds.showTips(tips+"；写入到文件："+scope.savePath);
	};
	
	var isStart=false,count=0;
	var read=AppCmds.openFileReadRes(path);
	var line=null,lineNo=0;
	var finalCall=function(){
		AppCmds.closeRes(read);
	};
	var catchCall=function(e){
		finalCall();
		Catch(e);
	};
	var readNextLine=function(){
		updateStatus();
		__readNextTime=Date.now();
		try{
			__readNextLine();
		}catch(e){
			catchCall(new Error(pathTips+"：第"+lineNo+"行合并异常："+e.message));
		}
	};
	var __readNextTime=0;
	var __readNextLine=function(){
		while(true){
			//异步处理，避免大点的文件处理慢、卡界面
			if(Date.now()-__readNextTime>300){
				setTimeout(readNextLine);
				return;
			};
			
			line=AppCmds.fileReadLine(read);
			lineNo++;
			if(line==null){
				//没有数据了
				if(isStart){
					throw new Error("未发现结束位置，可能文件已损坏");
				}
				break;
			};
			
			line=line.trim();
			if(!line)continue;
			
			if(isStart && line.indexOf("]")==0){
				//处理完成所有数据
				break;
			}
			if(!isStart){
				//等待开始标志
				if(line.indexOf('"features"')==0){
					if(!/\[$/.test(line)){
						throw new Error("第"+lineNo+"行风格不对，不支持合并此文件");
					}
					isStart=true;
				}
				
				if(scope.needHead){//geojson开头的内容
					scope.headCount=(scope.headCount||0)+1;
					AppCmds.fileWrite(scope.write,(scope.headCount>1?"\n":"")+line);
					
					if(isStart){
						scope.needHead=false;
					}
				}
				continue;
			}
			
			line=/^,?(.+?),?$/.exec(line)[1];
			try{
				var item=JSON.parse(line);
			}catch(e){
				throw new Error("第"+lineNo+"行数据不能解析成json");
			}
			
			AppCmds.fileWrite(scope.write,(scope.count>0?",":"")+"\n"+line);
			scope.count++;
			count++;
		};
		
		
		if(!isStart){
			catchCall(new Error(pathTips+"：未识别到geojson数据，请检查选择的文件是否正确"));
			return;
		}
		
		//读取写入完成
		finalCall();
		updateStatus(true);
		OK();
	};
	readNextLine();
};


})();