/******************
《【拆分】 GeoJSON 按省市区将下级拆分到多个文件》
作者：高坚果
时间：2022-01-07 15:03:31

本代码用于将一个大的 geojson 文件，根据pid、ext_path字段自动拆分成单独的小文件，子级数据默认会放在父级id命名的文件夹内。

``` Ref
全部数据将会拆分出：一个仅包含所有省份的文件；每个省份各一个文件，内容为此省份所有的市；每个市各一个文件，内容为此市所有的区县；每个区县各一个文件，内容为此区县所有的乡镇；[可选]每个省市区单独一个文件，内容为对应的一条边界数据；[可选]每个乡镇单独一个文件，内容为此乡镇一条边界数据。

【拆分规则演示】
	1. 拆分出  全国  所有的省级到一个文件
			得到 0.json      包含了全国所有的省；
	2. 拆分出 湖北省 所有的市级到一个文件
			得到 42.json     包含了湖北所有的市；
	3. 拆分出 武汉市 所有的区县级到一个文件
			得到 4201.json   包含了武汉所有的区县；
	4. 拆分出 武昌区 所有的乡镇级到一个文件
			得到 420106.json 包含了武昌所有的乡镇街道；
	5. [可选]拆分出每个 省市区 到单独一个文件
			得到 42_single.json   只包含湖北省一个边界
			得到 4201_single.json 只包含武汉市一个边界
			得到420106_single.json只包含武昌区一个边界
	6. [可选]拆分出 黄鹤楼街道 到单独一个文件
			得到 420106003_single.json 只含黄鹤楼街道
			一个乡镇边界；
	7. 其他的省市区县乡镇按上面规则拆分得到对应文件；
	
【拆分子目录结构】 
	- /0.json
			此文件包含了全国所有的省。
	- /0/42.json
			某省下所有市：/0/目录内存放每个省的
			json文件，每个json内为此省的所有市。
	- /0/42/4201.json
			某市下所有区：/0/目录内每个省均有一个
			文件夹，每个文件夹里面存放着此省每个市的
			json文件，每个json内为此市所有的区县。
	- /0/42/4201/420106.json
			某区下所有乡镇：/0/42/目录内每个市均有一个
			文件夹，里面存放着此市每个区县的json文件，
			每个json内为此区县的所有乡镇。
			
	- /0/42_single.json
	  /0/42/4201_single.json
	  /0/42/4201/420106_single.json
			可选省市区单独一个文件：每个文件内只含对应
			的省市区一条边界数据。
	- /0/42/4201/420106/420106003_single.json
			可选某乡镇单独一个文件：/0/42/4201目录内每
			个区县均有一个文件夹，里面存放着此区县每个
			乡镇的json文件，每个json内只含此乡镇。
	
	- 当配置项勾选了“不要创建上级目录”时，所有子文件将放一个文件夹里面，不会出现本目录结构。
	- 当配置勾选了“每条数据单独生成一个文件”时，才会将每个乡镇拆分到单独的一个文件，这些文件内只会有这个乡镇一条数据；省市区也会生成单独的一个默认用_single结尾的文件，只包这个城市一条数据；当同时勾选了“不要生成包含所有下一级数据的文件”时，不会生成不带_single结尾的那些上级文件。
	- 上面路径中的 0、42、4201、420106 均为pid，实际为每个省市区的不同id值，当配置项勾选了“文件或目录使用城市名称”时，数将会被城市名称代替。


【注意】本代码只能拆分固定的换行风格的geojson文件（类似本工具导出的json文件内容风格），因为要简化对文本的处理，本代码要求每条数据文本均独占一行，所以如果一行有多条数据、一条数据占了多行，均不支持处理。
```
******************/
(function(){
Runtime.Log('<span style="font-size:24px;color:#fa0">【拆分说明】</span><pre>'
	+/``` Ref([\S\s]+?)```/.exec(Runtime.GetCode())[1].trim().replace(/\t/g,'    ')
	+'</pre>');

//显示控制按钮
Runtime.Ctrls([
	{html:'<div>\
<div>\
	<span style="font-size:18px">【GeoJSON文件拆分操作步骤】</span>\
	<br>1. 点击顶部“通用-选择文件”按钮，选择待拆分的geojson文件（注意此文件必须符合上面代码注释内的要求）；\
	<br>2. 点击下面的“开始拆分”按钮，等待拆分完成；\
	<br>3. 拆分完成后，生成的文件保存在第一步选择的文件同一目录内的新建文件夹中；\
	<br>4. 更多细节请阅读上面代码内的注释。\
</div>\
	</div>'}
	
	,{html:'<div style="padding:10px 0">\
<div style="font-size:18px">【配置项】</div>\
<div style="font-size:13px;">\
<div style="padding:8px 0">\
	<label style="cursor: pointer">\
		<input type="checkbox" class="pathUseName" />文件或目录使用城市名称，不要使用id\
	</label>\
</div>\
<div>\
	<label style="cursor: pointer">\
		<input type="checkbox" class="childFolderDisable" />不要创建上级目录，所有子文件放一个文件夹里\
	</label>\
</div>\
<div style="padding-top:8px">\
	<label style="cursor: pointer">\
		<input type="checkbox" class="splitToSingle" />每条数据单独生成一个文件（每个 省、市、区县、乡镇 均生成仅一条数据的一个文件）\
	</label>\
</div>\
<div class="splitToSingleMore" style="padding-left:50px;display:none">\
	<div style="padding-top:8px;padding-left:5px">\
		<input style="width:60px" value="_single" class="singleFileSuffix">\
		文件名后缀（可空，为空时必须勾选下面这个选项）\
	</div>\
	<div style="padding-top:8px">\
		<label style="cursor: pointer">\
			<input type="checkbox" class="singleFileOnly" />不要生成包含所有下一级数据的文件（指不带_single结尾的那些上级文件）\
		</label>\
	</div>\
</div>\
</div>\
	</div>'}
	
	,{name:"开始拆分",click:"runClick"}
	,{html:'<span style="color:#0b1">本拆分功能免费版、付费版均可无限制使用</span>'}
]);
$(".splitToSingle").click(function(){
	$(".splitToSingleMore")[this.checked?"show":"hide"]();
});
var childFolderDisable,pathUseName,splitToSingle,singleFileSuffix,singleFileOnly;

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
	
	childFolderDisable=$(".childFolderDisable")[0].checked;
	pathUseName=$(".pathUseName")[0].checked;
	splitToSingle=$(".splitToSingle")[0].checked;
	singleFileSuffix=splitToSingle?$(".singleFileSuffix").val():"";
	singleFileOnly=splitToSingle?$(".singleFileOnly")[0].checked:false;
	if(childFolderDisable && pathUseName){
		Runtime.Log("使用名称 和 不创建目录 选项不允许同时选择，否则可能导致同名冲突",1);
		return;
	}
	if(splitToSingle && !singleFileSuffix && !singleFileOnly){
		Runtime.Log("文件名后缀为空时，必须勾选 不要生成包含所有下一级数据的文件，否则会文件名冲突",1);
		return;
	}
	Runtime.Log("拆分配置："+JSON.stringify({
		pathUseName:pathUseName
		,childFolderDisable:childFolderDisable
		,splitToSingle:splitToSingle
		,singleFileSuffix:singleFileSuffix
		,singleFileOnly:singleFileOnly
	}));
	
	//读取用户选择的文件路径
	var config=JSON.parse(AppCmds.config());
	var path=config.Input.input_webview_file;
	if(!path){
		Runtime.Log("请先点击顶部“通用-选择文件”按钮，选择待拆分的geojson文件",1);
		return;
	}
	
	
	AppCmds.transformStart("拆分GeoJSON文件");
	var finalCall=function(){
		AppCmds.transformEnd();
	};
	var catchCall=function(e){
		finalCall();
		var tips="发生异常："+e.message;
		AppCmds.showTips(tips,true);Runtime.Log(tips,1);
	};
	try{
		var tips="【开始】请稍后... 大点的文件会比较慢，正在分析文件："+path;
		AppCmds.showTips(tips);Runtime.Log(tips);
		
		var fm=/^(.+?)\/([^\/]+)\.([^\/]+)$/.exec(path.replace(/\\/g,"/"));
		var fname=fm[2]+"."+fm[3];
		
		if(AppCmds.fileSize(path)>600*1024*1024){
			throw new Error("文件超过600M大小，本代码目前未提供超大文件处理支持");
		}
		analysisFile(path,catchCall,function(meta){
			try{
				var tips="发现"+meta.count+"条数据，将会拆分成"+meta.fileCount+"个文件";
				AppCmds.showTips(tips);Runtime.Log(tips,2);
				
				var t1=Date.now();
				if(!confirm("从文件\""+fname+"\"中发现"+meta.count+"条数据，将会拆分成"+meta.fileCount+"个文件，是否确定要拆分？")){
					finalCall();
					
					var tips="用户取消了拆分";
					AppCmds.showTips(tips,true);Runtime.Log(tips,1);
					return;
				}
				runStartTime+=Date.now()-t1;//等待用户确认，修正开始时间
				
				var now=new Date();
				var savePath=fm[1]+"/"+fm[2]+"-拆分-"
					+now.getFullYear()
					+("0"+(now.getMonth()+1)).substr(-2)
					+("0"+now.getDate()).substr(-2)
					+"-"
					+("0"+now.getHours()).substr(-2)
					+("0"+now.getMinutes()).substr(-2)
					+("0"+now.getSeconds()).substr(-2);
				var tips="正在写入文件到目录："+savePath;
				AppCmds.showTips(tips);Runtime.Log(tips);
				
				saveSpiltFile(meta,savePath,catchCall,function(info){
					finalCall();
					
					var tips="【拆分完成】【耗时："+runTimeTips()+"】已拆分成："+info.fileCount+"个文件（"+info.folderCount+"个目录），总计"+info.count+"条数据，保存在目录："+savePath;
					AppCmds.showTips(tips);Runtime.Log(tips,2);
				});
			}catch(e){
				catchCall(e);
			};
		});
	}catch(e){
		catchCall(e);
	};
};



var analysisFile=function(path,Catch,OK){
	var statusCls="";
	var updateStatus=function(isEnd){
		if(!statusCls){
			statusCls=("t"+Math.random()).replace(/\./g,"");
			Runtime.Log('<span class="'+statusCls+'"></span>');
		}
		var tips=runTimeTips()+" ";
		if(isEnd){
			tips+="文件分析完成：共"+count+"条数据";
		}else{
			tips+="文件分析中：发现"+count+"条数据，大点的文件会比较慢，请耐心等待";
		}
		
		$("."+statusCls).text(tips);
		AppCmds.showTips(tips);
	};
	
	var header=[],pids={},count=0;
	var isStart=false;
	
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
			catchCall(new Error("第"+lineNo+"行分析异常："+e.message));
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
						throw new Error("第"+lineNo+"行风格不对，不支持处理此文件");
					}
					isStart=true;
				}
				header.push(line);//geojson开头的内容
				continue;
			}
			
			line=/^,?(.+?),?$/.exec(line)[1];
			try{
				var item=JSON.parse(line);
			}catch(e){
				throw new Error("第"+lineNo+"行数据不能解析成json");
			}
			var prop=item.properties;
			if(prop.pid==null || prop.ext_path==null){
				throw new Error("第"+lineNo+"行数据中无pid或ext_path属性，不支持拆分此文件");
			}
			var pid=prop.pid+"";
			var extPath=prop.ext_path.split(" ");//上级完整路径 下面会pop
			var deep=extPath.length-1-1;//上级的深度 -1:0级 0:省 1:市 2:区
			var name=extPath.pop();
			var obj=pids[pid]||{childCount:0,lines:[],deep:deep,names:extPath};
			pids[pid]=obj;
			
			var id=prop.id||prop.unique_id;
			if(splitToSingle && id==null){
				throw new Error("第"+lineNo+"行数据中无 id|unique_id 属性，不支持 每条数据单独生成一个文件");
			};
			
			//固定的id格式，省去查找上级id麻烦，直接截取
			if(deep==-1 && pid.length==1){
				obj.ids=[];
			}else if(deep==0 && pid.length==2){
				obj.ids=[pid];
			}else if(deep==1 && pid.length==4){
				obj.ids=[pid.substr(0,2),pid];
			}else if(deep==2 && pid.length==6){
				obj.ids=[pid.substr(0,2),pid.substr(0,4),pid];
			}else{
				if(pid.length==6 && /^\d\d90/.test(pid)){//省直辖县级市是6位
					obj.ids=[pid.substr(0,2),pid];
				}else if(pid.length==9 && /^\d\d90\d\d000/.test(pid)){//省直辖县级市结尾000
					obj.ids=[pid.substr(0,2),pid.substr(0,6),pid];
				}else{
					deep=999;//未知的id
				}
			}
			if(obj.deep!=deep)throw new Error("第"+lineNo+"行数据的层级解析错误");
			
			obj.lines.push({id:id+"", name:name, txt:line});//写入内存，如果是超大文件，内存不够的话处理不了，另外：超大文件循环fileReadLine一遍非常耗时，没有缓存的话，性能非常低
			obj.childCount++;
			count++;
		};
		
		
		if(!isStart){
			catchCall(new Error("未识别到geojson数据，请检查选择的文件是否正确"));
			return;
		}
		if(!count){
			catchCall(new Error("此文件内没有数据，无需拆分"));
			return;
		}
		
		var fileCount=0;
		if(!singleFileOnly) fileCount+=Object.keys(pids).length;
		if(splitToSingle) fileCount+=count;
		
		//分析完成
		finalCall();
		updateStatus(true);
		OK({
			pids:pids
			,fileCount:fileCount
			,count:count
			,header:header
		});
	};
	readNextLine();
};



var saveSpiltFile=function(meta,savePath,Catch,OK){
	var count=0,fileCount=0,folders={};
	
	//优化路径，如果都是一个城市下的数据，就忽略掉上级路径
	var all0=true,all1=true;
	var p0="",p1="",hasDeep={};
	for(var pid in meta.pids){
		var pidObj=meta.pids[pid];
		hasDeep[pidObj.deep]=1;
		if(pidObj.ids[0] && (!p0 || p0==pidObj.ids[0])){
			p0=pidObj.ids[0];
		}else{
			all0=false;
			all1=false;
			break;
		}
		
		if(pidObj.deep>0){
			if(pidObj.ids[1] && (!p1 || p1==pidObj.ids[1])){
				p1=pidObj.ids[1];
			}else{
				all1=false;
			}
		}
	}
	if(hasDeep[0] && hasDeep[1]) all0=false;
	if(hasDeep[1] && hasDeep[2]) all1=false;
	if(meta.pids["0"]){
		all0=false;
		all1=false;
	}
	
	//简单粗暴，每个pid都遍历一遍文件，取出子级数据写入新文件
	var pidList=Object.keys(meta.pids);
	var idx=-1;
	var nextPid=function(){
		try{
			__nextPid();
		}catch(e){
			Catch(new Error("写入发生异常："+e.message));
		}
	};
	var __nextPid=function(){
		idx++;
		if(idx>=pidList.length){
			//处理完成
			OK({
				fileCount:fileCount
				,folderCount:Object.keys(folders).length
				,count:count
			});
			return;
		};
		
		var pid=pidList[idx];
		var pidObj=meta.pids[pid];
		
		//生成pid文件路径
		var folder="";
		while(!childFolderDisable){
			if(pid=="0"){
				break;
			}
			if(meta.pids["0"]){
				folder+=pathUseName?"/全国":"/0";
			}
			if(!all0 && pidObj.deep>0){
				if(pathUseName){
					folder+="/"+pidObj.names[0];
				}else{
					folder+="/"+pidObj.ids[0];
				}
			}
			if(!all1 && pidObj.deep>1){
				if(pathUseName){
					folder+="/"+pidObj.names[1];
				}else{
					folder+="/"+pidObj.ids[1];
				}
			}
			break;
		}
		//每条数据需单独拆分成一个文件，先生成文件夹
		var singleFolder=folder;
		
		var newFile=folder;
		if(pathUseName){
			if(pid=="0"){
				newFile+="/全国.json";
				!childFolderDisable&&(singleFolder+="/全国");
			}else{
				newFile+="/"+pidObj.names[pidObj.deep]+".json";
				!childFolderDisable&&(singleFolder+="/"+pidObj.names[pidObj.deep]);
			}
		}else{
			newFile+="/"+pid+".json";
			!childFolderDisable&&(singleFolder+="/"+pid);
		}
		
		var tips=runTimeTips()+" 进度："+(idx+1)+"/"+pidList.length+" 正在写入 ";
		var tips2=singleFileOnly?(folder+"/"):newFile;
		if(splitToSingle){
			tips2+=(singleFileOnly?" 共":"，和")+pidObj.lines.length+"个单独文件";
		}
		Runtime.Log(tips+tips2);
		AppCmds.showTips(tips+savePath+tips2);
		
		
		/***将数据内容写入新文件***/
		var lineIdx=-1;
		var finalCall=function(){
			AppCmds.closeRes(write);
		};
		var catchCall=function(e){
			finalCall();
			Catch(e);
		};
		var writeNextLine=function(){
			__writeNextTime=Date.now();
			try{
				__writeNextLine();
			}catch(e){
				catchCall(new Error("第"+(lineIdx+1)+"行数据写入异常："+e.message));
			}
		};
		var __writeNextTime=0;
		var __writeNextLine=function(){
			while(true){
				//异步处理，避免大文件处理慢、卡界面
				if(Date.now()-__writeNextTime>300){
					setTimeout(writeNextLine);
					return;
				};
				
				lineIdx++;
				if(lineIdx>=pidObj.lines.length){
					//没有数据了
					break;
				};
				var lineObj=pidObj.lines[lineIdx];
				var line=lineObj.txt;
				
				
				//直接写入这行数据
				write&&AppCmds.fileWrite(write,(writeCount>0?",":"")+"\n"+line);
				writeCount++;
				count++;
				
				//将这行数据写入单独一个文件
				var writeS="";
				if(splitToSingle){try{
					fileCount++;
					singleFolder && (folders[singleFolder]=1);
					var newFileS=singleFolder;
					if(pathUseName){
						newFileS+="/"+lineObj.name+singleFileSuffix+".json";
					}else{
						newFileS+="/"+lineObj.id+singleFileSuffix+".json";
					};
					writeS=AppCmds.openFileWriteRes("AutoDir:"+savePath+newFileS);
					AppCmds.fileWrite(writeS, meta.header.join("\n"));
					AppCmds.fileWrite(writeS, "\n"+line);
					AppCmds.fileWrite(writeS,"\n]\n}\n");
				}finally{
					AppCmds.closeRes(writeS);
				}};
			};
			
			write&&AppCmds.fileWrite(write,"\n]\n}\n");
			
			//这个pid处理完成，开始下一个
			finalCall();
			setTimeout(nextPid);
		};
		
		var write="";
		if(!singleFileOnly){
			fileCount++;
			if(folder) folders[folder]=1;
			try{
				//打开文件，写入开头的部分
				write=AppCmds.openFileWriteRes("AutoDir:"+savePath+newFile);
				var writeCount=0;
				AppCmds.fileWrite(write, meta.header.join("\n"));
			}catch(e){
				finalCall();
				throw e;
			}
		};
		writeNextLine();
	};
	nextPid();
};


})();