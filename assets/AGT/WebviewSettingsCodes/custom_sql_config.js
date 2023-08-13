/******************
《【插件】通用自定义SQL配置（任意数据库适配）》
作者：高坚果
时间：2023-04-02 18:12:06

导出ok_geo.csv且选择的SQL类型为“自定义SQL/Oracle”时，需要用到本插件进行配置后才可以导出sql文件，本插件可以和坐标系转换插件一起使用
******************/
(function(){

window.CustomSQLConfigData=window.CustomSQLConfigData||{};

//显示控制按钮
Runtime.Ctrls([
	{html:'<div>\
<div>\
	<span style="font-size:18px">【通用自定义SQL配置说明】</span>\
	<br>1. 导出ok_geo.csv且选择的SQL类型为“自定义SQL/Oracle”时，需要用到本插件进行配置后才可以导出sql文件，本插件可以和坐标系转换插件一起使用；\
	<br>2. 各配置项修改好后点击下面的“完成配置”按钮；\
	<br>3. 点击左侧面板的“转成sql文件”按钮，会根据你的SQL配置导出新的SQL文件；\
	<br>4. 导出完成后，可将此新的SQL文件导入到你的数据库，不同数据库如何导入请自行查阅相关文档。\
</div>\
	</div>'}
	
	,{html:'<div style="padding:10px 0">\
<div>\
	<span style="font-size:18px">【配置项】</span>\
	填充模板：<span class="csc_templs"></span>\
</div>\
<div style="font-size:13px;">\
\
<div style="padding-top:8px">\
	配置状态：<span class="cscState cscState0"></span>\
</div>\
\
<div style="padding-top:8px">\
	SQL文件编码：<input class="csc_in_charset cscIn" style="width:60px">\
	<span style="color:#aaa">Windows上命令行导入数据库可能需要使用GBK编码</span>\
</div>\
\
<div style="padding-top:8px">\
	SQL文件后缀：<input class="csc_in_fileExt cscIn" style="width:60px">\
	<span style="color:#aaa">可以指定生成的文件的文件名后缀（扩展名）</span>\
</div>\
\
<div style="padding-top:8px">创建表SQL语句+文件注释：</div>\
<div style="border:1px solid #ddd"><textarea class="csc_in_tableSQL cscIn cscInText" style="width:90%"></textarea></div>\
\
<div style="padding-top:8px">插入数据SQL语句：</div>\
<div style="border:1px solid #ddd"><textarea class="csc_in_insertSQL cscIn cscInText" style="width:90%"></textarea></div>\
\
<style>.cscInText{overflow: hidden}</style>\
</div>\
	</div>'}
	
	,{name:"完成配置",click:"runClick"}
	,{html:'<span class="cscState"></span>'}
]);

$(".cscInText").each(function(k,v){
	v.value="//@ 请点击一个模板进行填充\n";
	var edit=v._edit=CodeMirror.fromTextArea(v,{
		mode:"javascript"
		,lineNumbers:true
		,lineWrapping:true
	});
	edit.setSize($(v).width()+"px","auto");
	edit.on("change",function(a){
		inputChange();
	});
});

//配置被修改时，清理
$(".cscIn").bind("input",function(){ inputChange(); });
var inputChange=function(tips){
	Runtime.customSQLConfigDisable();
	$(".cscState").html('<span style="color:red;font-weight:bold">'+(tips||'配置已修改，点击“完成配置”按钮后生效')+'</span>');
	$(".cscState0").html('<span style="color:red;font-weight:bold">'+(tips||'配置已修改，点击底下的“完成配置”按钮后生效')+'</span>');
};

//填充模板内容
var templList=["通用WKT纯文本格式","Oracle数据库格式","ST_GeomFromText兼容格式","通用CSV+WKT纯文本格式(Excel)","自行编写脚本代码处理(生成文件、调用HTTP API)"];
var html=[];
for(var i=0;i<templList.length;i++)html.push('<a onclick="setTempl('+(i+1)+')">'+templList[i]+'</a>');
$(".csc_templs").html(html.join("&nbsp;&nbsp; | &nbsp;&nbsp;"));

window.setTempl=function(type,isInit){
	var charsetV="UTF-8",fileExtV="sql";
	var createV=[],insertV=[];
	var fail=function(){
		var tips="未知模板type="+type+"，无法填充";
		AppCmds.showTips(tips,true);Runtime.Log(tips,1);
	};
	
	createV.push('//@ 模板：'+templList[type-1]);
	createV.push('//@ “//@”后面的内容将会当做注释，在生成SQL文件的时候会删除');
	createV.push('//@ ${key|args}为变量的占位符，在生成SQL文件时会使用key对应的值代替，args为参数');
	createV.push('//@ 【请将以下SQL代码修改成你数据库支持的格式】');
	createV.push('');
	createV.push('/* This File Charset: ${Charset}  ');
	if(type==1){
		createV.push("通用WKT纯文本格式，绝大部分数据库都支持导入此SQL文件，包括SQLite");
	}else if(type==2){
		createV.push("Oracle数据库格式，请在Oracle中导入此SQL文件");
		createV.push("	- 用SQLPlus命令行、或SQL Developer连接上数据库后，执行命令导入：");
		createV.push('		> set autocommit on; --打开自动提交，如果不打开，导入完成后可能需手动commit');
		createV.push("		> @'${FilePath}'; --将sql文件数据导入数据库，文件似乎必须放到文件夹里面，似乎不允许放磁盘根目录");
		createV.push("	- 如果导入乱码，请尝试到转换工具中重新导出SQL文件，导出时配置SQL文件编码为UTF-8或GBK等其他编码");
		createV.push("	- 注意：目前测试发现Oracle的空间查询不大好用，SDO_GEOMETRY似乎不要提供任何SRID（当前采用SRID=NULL），不然会空间计算结果很令人费解；SRID=0时无法创建索引；SRID=4326（WGS84）时不管有无索引计算结果都是错误的；SRID=NULL时且没有建索引时查询结果正确，但建了索引且配置了特定Metadata又可能导致查询出和SRID=4326类似错误的结果；根据文档：https://docs.oracle.com/en/database/oracle/oracle-database/21/spatl/indexing-querying-spatial-data.html，SDO_RELATE（SDO_ANYINTERACT、SDO_CONTAINS）一系列方法必须建索引才能进行查询调用，没建索引时不会报错并且直接返回错误的结果（只要外接矩形MBR匹配就返回，压根不进行精确计算），SRID=NULL时测试并没有此问题");
		createV.push("	- 注意：Oracle不支持任何EMPTY，只能用NULL代替；不支持查询出WKT超长文本，SDO_GEOMETRY.GET_WKT(polygon)大概率抛异常；Oracle支持的SQL语句中，不同终端支持的单个字符串长度混乱，3k-32k不等，因此长字符串采取2k长度分段拼接进行支持，导致SQL文件行数剧增");
		createV.push("	- 本SQL文件尾部会给polygon列创建索引，查询速度快100倍");
		createV.push("	- 查询一个坐标对应的城市SQL语句示例：");
		createV.push("		select ${Field_ID},${Field_ExtPath},polygon from ${TableName} where SDO_ANYINTERACT(polygon,SDO_GEOMETRY('POINT (114.044346 22.691963)'))='TRUE';  -- 通过 select SDO_GEOMETRY.GET_WKT(polygon) as polygon 可以查询WKT文本，但文本过长直接会抛异常");
	}else if(type==3){
		createV.push("ST_GeomFromText兼容格式，适用于支持ST_GeomFromText函数的数据库，比如MySQL8+、PostgreSQL");
	}else if(type==4 || type==5){
		//NOOP
	}else{ return fail(); }
	createV.push('${AppName}(Ver:${AppVer}) 于 ${Time} 使用通用自定义SQL配置生成');
	createV.push('');
	createV.push('${AppUrl}');
	createV.push('*/');
	createV.push('');
	createV.push('-- 创建表结构');
	if(type==1 || type==3){
		createV.push('//@ 如果你的表名有特殊字符，请用"或`或[]包裹起来（如："${TableName}"）');
		createV.push('DROP TABLE IF EXISTS ${TableName}; //@ 不支持的话就删除这句');
	}else if(type==2){
		createV.push('//@ 如果你的表名有特殊字符，请用"包裹起来（如："${TableName}"）');
		createV.push('declare num number; begin');
		createV.push("    select count(1) into num from user_tables where table_name = upper('${TableName}');");
		createV.push("    if num > 0 then execute immediate 'drop table ${TableName}'; end if;");
		createV.push('end;');
		createV.push('/');
	}else if(type==4 || type==5){
		//NOOP
	}else{ return fail(); }
	createV.push('CREATE TABLE ${TableName} (');
	createV.push('    ${Field_ID} int NOT NULL PRIMARY KEY,');
	createV.push('    ${OtherFields|int NOT NULL|varchar(250) NOT NULL}, //@ csv内更多要导出的非预定义字段，数字和字符串两种类型，后面两个参数为对应字段的类型声明');
	createV.push('    ${Field_ExtPath} varchar(255) NOT NULL,');
	if(type==1){
		createV.push('    ${Field_Geo} text NOT NULL, //@ text为长文本类型，应当使用此数据库支持的最长的类型，比如mysql为longtext');
		createV.push('    ${Field_Polygon} text NOT NULL');
	}else if(type==2){
		createV.push('    ${Field_Geo} SDO_GEOMETRY NULL,');
		createV.push('    ${Field_Polygon} SDO_GEOMETRY NULL');
	}else if(type==3){
		createV.push('    ${Field_Geo} geometry NOT NULL,');
		createV.push('    ${Field_Polygon} geometry NOT NULL');
	}else if(type==4 || type==5){
		//NOOP
	}else{ return fail(); }
	createV.push(');');
	createV.push('');
	createV.push('');
	createV.push('-- 数据区');
	
	insertV.push("INSERT INTO ${TableName} VALUES(${Value_ID},");
	insertV.push("${OtherValues|?|'?'},");
	insertV.push("'${Value_ExtPath}',");
	if(type==1){
		insertV.push("'${Value_Geo|POINT EMPTY}',");
		insertV.push("'${Value_Polygon|POLYGON EMPTY}'");
	}else if(type==2){
		//insertV.push("${Value_Geo|SDO_GEOMETRY('?',4326)|NULL},");
		//insertV.push("${Value_Polygon|SDO_GEOMETRY('?',4326)|NULL}");
	}else if(type==3){
		insertV.push("ST_GeomFromText('${Value_Geo|POINT EMPTY}',0),");
		insertV.push("ST_GeomFromText('${Value_Polygon|POLYGON EMPTY}',0)");
	}else if(type==4 || type==5){
		//NOOP
	}else{ return fail(); }
	insertV.push(");");
	insertV.push("\n\n//@ 这些字段值的顺序必须和创建表的字段顺序一致");
	
	//csv格式单独重新弄一份
	if(type==4){
		createV=[];insertV=[];charsetV="GBK";fileExtV="csv";
		
		createV.push('//@ 模板：'+templList[type-1]);
		createV.push('//@ “//@”后面的内容将会当做注释，在生成CSV文件的时候会删除');
		createV.push('//@ ${key|args}为变量的占位符，在生成CSV文件时会使用key对应的值代替，args为参数');
		createV.push('//@ 注意：通过本配置生成的CSV文件和ok_geo.csv格式不同，无法通过本转换工具二次进行转换');
		createV.push('');
		createV.push('${Field_ID},${OtherFields},${Field_ExtPath},${Field_Geo},${Field_Polygon}');
		createV.push('');
		createV.push('//@ 上面这句是表头，会作为CSV文件的第一行，OtherFields变量为：更多要导出的非预定义字段，数字和字符串两种类型');
		
		insertV.push('${Value_ID},${OtherValues|?|"?"},"${Value_ExtPath}","${Value_Geo|POINT EMPTY}","${Value_Polygon|POLYGON EMPTY}"');
		insertV.push("\n\n//@ 这些字段值的顺序必须和表头的字段顺序一致");
	}
	
	insertV.push("\n//@ OtherValues变量为：更多要导出的非预定义字段值，数字和字符串两种类型，后面两个参数为对应字段的值格式，?为值的占位符");
	insertV.push("\n//@ Value_Geo和Value_Polygon后面接一个参数时为图形为空时的WKT字符串，比如mysql只有GEOMETRYCOLLECTION EMPTY；接两个参数时为有值的格式和为空的格式，?为WKT字符串占位符");
	
	
	//自行编写脚本代码处理单独重新弄一份
	if(type==5){
		createV=[];insertV=[];fileExtV="txt";
		
		createV.push('//@ 模板：'+templList[type-1]);
		createV.push('//@ “//@”后面的内容将会当做注释，在解析时候会删除');
		createV.push('//@ 这段代码用于接收创建表的字段和信息，会传递给下面的SQL_CustomProcessOpen方法');
		createV.push('');
		createV.push('fields=${Field_ID},${OtherFields},${Field_ExtPath},${Field_Geo},${Field_Polygon}');
		createV.push('tableName=${TableName}');
		createV.push('geomSRID=${GeomSRID}');
		createV.push('filePath=${FilePath}');
		createV.push('charset=${Charset}');
		createV.push('allArgs=${AllArgs}');
		
		insertV.push('/**********************');
		insertV.push('使用本脚本配置后，程序将不会进行任何文件的保存，全部需要自行编写代码对数据进行处理和保存：');
		insertV.push('	1. 程序会先调用OnInit进行初始化');
		insertV.push('	2. 在第一条数据处理之前会调用customProcessOpen进行表的创建');
		insertV.push('	3. 每条数据分别调用一次insertFormat进行数据的处理');
		insertV.push('	4. 最后调用successAppendCall结束处理');
		insertV.push('自行编写的代码可以将数据保存到文件，内容格式完全自定义；');
		insertV.push('或者把数据发送到http api接口（通过AppCmds.load方法发送请求，不要带callback）。');
		insertV.push('**********************/');
		insertV.push('');
		insertV.push('//绑定处理函数');
		insertV.push('@Set:OnInit=SQL_OnInit@');
		insertV.push('@Set:customProcessOpen=SQL_CustomProcessOpen@');
		insertV.push('@Set:successAppendCall=SQL_SuccessAppendCall@');
		insertV.push('@Set:insertFormat=SQL_InsertFormat@');
		insertV.push('');
		insertV.push('//@Eval Start@');
		insertV.push((function(){
var Data={};//任务全局变量
/***指定一个函数，会在任务开始时进行调用，用于初始化环境变量***/
window.SQL_OnInit=function(){
	Runtime.Log("SQL_OnInit已执行","#aaa");
	Data={insertCount:0};//重置环境变量
};

/***指定一个完全自定义处理函数，会在第一条数据调用insertFormat之前进行调用（没有数据时将不会调用），会传入上面替换处理好的字段和信息字符串；一般是打开文件并写入创建表的SQL语句***/
window.SQL_CustomProcessOpen=function(str){
	Runtime.Log("SQL_CustomProcessOpen已执行，参数："+Runtime.ToPre(str),"#aaa");
	var exp=/^([^=]+)=(.*)$/mg,m;
	while(m=exp.exec(str)){
		Data[m[1]]=m[2];
	}
	Data.fileInfo="文件 "+Data.charset+" 编码"+(Data.geomSRID=="0"?"":"，SRID="+Data.geomSRID);
	Data.writeType="TEXT; charset="+Data.charset;
	
	//打开文件进行写入；如果是要把数据发送到http api接口保存，可以不进行文件操作
	Data.writeRes=AppCmds.openFileWriteRes(Data.filePath);
	
	var txt="File Charset "+Data.charset+"   ";
	txt+="\n这是文件的开头部分，演示把数据写入文件";
	txt+="\n数据有这些字段："+Data.fields;
	txt+="\nallArgs="+Data.allArgs;
	AppCmds.fileWrite(Data.writeRes,txt,Data.writeType);
};

/***成功处理完成时回调，用于进行收尾处理，返回一个文本当做成功处理消息***/
window.SQL_SuccessAppendCall=function(){
	Runtime.Log("SQL_SuccessAppendCall已执行","#aaa");
	if(Data.writeRes){//有数据被处理
		var txt="\n\n写入完成，演示在文件结尾添加内容\n";
		AppCmds.fileWrite(Data.writeRes,txt,Data.writeType);
		return "[自定义处理]已生成一个新文件（"+Data.fileInfo+"）：\r\n"+Data.filePath;
	}
	return "[自定义处理]注意：因为没有数据所以未生成任何文件！";
};

/***插入一条数据处理，args参数为所有数据和变量，处理完后返回一个文本消息；一般是生成插入数据SQL语句并写入文件***/
window.SQL_InsertFormat=function(args){
	if(args.isRunClickTest)return "SQL_InsertFormat 不支持进行测试";
	Data.insertCount++;
	if(args.Value_Polygon.V.length>100){
		args.Value_Polygon.V=args.Value_Polygon.V.substr(0,100)+'...';
	}
	var txt="\n第"+Data.insertCount+"行数据："+JSON.stringify(args);
	AppCmds.fileWrite(Data.writeRes,txt,Data.writeType);
	return "[自定义处理]正在写入到文件（"+Data.fileInfo+"）：\r\n"+Data.filePath;
};
}).toString().replace(/^.+\{\s*|\s*\}$/g,""));
		insertV.push('//@Eval End@');
		insertV=[insertV.join("\n")];
	}
	
	
	//Oracle的insert单独重新弄一份，用函数处理
	if(type==2){
		insertV=[]; charsetV="GBK";
		insertV.push('//绑定处理函数');
		insertV.push('@Set:OnInit=Oracle_OnInit@');
		insertV.push('@Set:successAppendCall=Oracle_SuccessAppendCall@');
		insertV.push('@Set:insertFormat=Oracle_InsertFormat@');
		insertV.push('');
		insertV.push('//@Eval Start@');
		insertV.push((function(){
var Data={};//任务全局变量
/***任务开始时进行调用，用于初始化环境变量***/
window.Oracle_OnInit=function(){
	Runtime.Log("Oracle_OnInit已执行","#aaa");
	Data={};
};
/***程序会将每条数据分别调用一次函数进行数据的格式化处理，返回插入语句***/
window.Oracle_InsertFormat=function(args){
	Data.tableName=args.TableName.V;
	var sql=["declare P clob:='';begin\n"];
		//polygon字符串太长，Oracle不同终端支持的单个字符串长度混乱，3k-32k不等，按2k一个字符串拼接
		var txt=args.Value_Polygon.V,size=2000;
		while(txt.length>0){
			sql.push("P:=P||'"+txt.substr(0,size)+"';\n");
			txt=txt.substr(size);
		}
	sql.push("INSERT INTO "+args.TableName.V+" VALUES("+args.Value_ID.V+",");
		for(var i=0;i<args.OtherValues.length;i++){
			var o=args.OtherValues[i];
			if(o.T=="string"){
				sql.push("'"+o.V+"',");
			}else{
				sql.push(o.V+",");
			}
		}
		sql.push("'"+args.Value_ExtPath.V+"',");
		if(args.Value_Geo.V){
			sql.push("SDO_GEOMETRY('"+args.Value_Geo.V+"'),");
		}else{
			sql.push("NULL,");
		}
		if(args.Value_Polygon.V){
			sql.push("SDO_GEOMETRY(P)");
		}else{
			sql.push("NULL");
		}
	sql.push(");end;\n/\n\n");
	return sql.join("");
};

/***成功处理完成时回调，用于进行收尾处理，返回一个文本会添加到SQL文件末尾***/
window.Oracle_SuccessAppendCall=function(){
	Runtime.Log("Oracle_SuccessAppendCall已执行 tableName="+Data.tableName,"#aaa");
	if(Data.tableName){//有数据被处理
		var sql=[];
		sql.push('');sql.push('');
		sql.push("-- 创建索引（查询速度快100倍）");
		sql.push("delete from user_sdo_geom_metadata where lower(TABLE_NAME)=lower('${TableName}') and lower(COLUMN_NAME)='polygon';");
		sql.push("insert into user_sdo_geom_metadata(TABLE_NAME,COLUMN_NAME,DIMINFO,SRID)VALUES (upper('${TableName}'),upper('polygon'),SDO_DIM_ARRAY(SDO_DIM_ELEMENT('X', -180, 180, 0.0000001),SDO_DIM_ELEMENT('Y', -90, 90, 0.0000001)),NULL);");
		sql.push('');
		sql.push("declare num number; begin");
		sql.push("	select count(1) into num from user_indexes where index_name = upper('${TableName}_polygon');");
		sql.push("	if num > 0 then execute immediate 'drop index ${TableName}_polygon'; end if;");
		sql.push("end;\n/");
		sql.push("create index ${TableName}_polygon ON ${TableName}(polygon) INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2;");
		sql.push('');
		return sql.join("\n").replace(/\$\{TableName\}/g,Data.tableName);
	}
	return "";
};
}).toString().replace(/^.+\{\s*|\s*\}$/g,""));
		insertV.push('//@Eval End@');
		insertV=[insertV.join("\n")];
	};
	
	
	
	var tableEl=$(".csc_in_tableSQL")[0]._edit,insertEl=$(".csc_in_insertSQL")[0]._edit;
	var raw=CustomSQLConfigData.raw||{};
	
	$(".csc_in_charset").val((isInit?raw.charset:"")||charsetV);
	$(".csc_in_fileExt").val((isInit?raw.fileExt:"")||fileExtV);
	tableEl.setValue((isInit?raw.tableSQL:"")||createV.join("\n")); tableEl.refresh();
	insertEl.setValue((isInit?raw.insertSQL:"")||insertV.join("")); insertEl.refresh();
	inputChange();
};
inputChange("请点击一个模板进行填充");
//setTempl(1,1);

//完成配置
window.runClick=function(){
	if(Runtime.VersionLess("1.3.230813")){
		var tips="软件版本过低，请重新下载升级后再操作";
		AppCmds.showTips(tips,true);Runtime.Log(tips,1);
		return;
	};
	
	inputChange();
	var clearNote=function(txt){
		return txt.replace(/[\r\n\s]*\/\/@.+/g,"").trim();
	}
	var charset=$(".csc_in_charset").val().trim();
	var fileExt=$(".csc_in_fileExt").val().trim();
	var tableSQLRaw=$(".csc_in_tableSQL")[0]._edit.getValue().trim();
	var insertSQLRaw=$(".csc_in_insertSQL")[0]._edit.getValue().trim();
	var tableSQL=clearNote(tableSQLRaw), insertSQL=clearNote(insertSQLRaw);
	if(!charset||!fileExt||!tableSQL||!insertSQL){
		var tips="配置项都是必填的，不能为空"
		AppCmds.showTips(tips,true);Runtime.Log(tips,1);
		return;
	}
	
	var oldFn=CustomSQLConfigData.val && CustomSQLConfigData.val.insertFormat;
	if(oldFn){
		window[oldFn]=null;
	}
	
	var sets={},exp=/@Set:(.+?)=(.+?)@/g,m;
	while(m=exp.exec(insertSQLRaw)){
		sets[m[1]]=m[2];
	}
	var exp=/@Eval Start@([\S\s]+)@Eval End@/g,m;
	while(m=exp.exec(insertSQLRaw)){
		try{
			eval('(function(){\n'+m[1]+'\n})()');
		}catch(e){
			var tips="插入数据SQL语句Eval代码执行出错："+e.message;
			AppCmds.showTips(tips,true);Runtime.Log(tips,1);
			return;
		}
	}
	if(sets.insertFormat){
		insertSQL="";
		try{
			var fsql=window[sets.insertFormat]({TableName:{V:"Test"},Value_ID:{V:1},OtherValues:[{V:"cc",T:"string"},{V:123,T:"int"}],Value_ExtPath:{V:"aa bb cc"},Value_Geo:{V:"Point(0 0)"},Value_Polygon:{V:"POLYGON((0 0,0 1,1 1,1 0,0 0))"},isRunClickTest:true});
		}catch(e){
			var tips="插入数据SQL语句"+sets.insertFormat+"调用测试出错："+e.message;
			AppCmds.showTips(tips,true);Runtime.Log(tips,1);
			return;
		}
		Runtime.Log(sets.insertFormat+"测试结果: <textarea style='width:100%;height:100px'>"+fsql+"</textarea>","#aaa");
	}
	
	CustomSQLConfigData.raw={charset:charset,fileExt:fileExt,tableSQL:tableSQLRaw,insertSQL:insertSQLRaw};
	CustomSQLConfigData.val={charset:charset,fileExt:fileExt,tableSQL:tableSQL,insertSQL:insertSQL};
	CustomSQLConfigData.OnInit=sets.OnInit; delete sets.OnInit;
	for(var k in sets){
		CustomSQLConfigData.val[k]=sets[k];
	}
	
	//实现转换接口给软件调用
	Runtime.AppCalls.customSQLConfig=function(ctx){
		var init=CustomSQLConfigData.OnInit;
		if(init) window[init]();
		
		var val=CustomSQLConfigData.val;
		for(var k in val){
			ctx.config[k]=val[k];
		}
	};
	Runtime.UpdateStatus();
	
	$(".cscState").html('<span style="color:#0b1">配置已生效，点击“转成sql文件”按钮时会自动使用本插件（数据库类型需选择“自定义SQL/Oracle”）</span>');
	Runtime.Log("customSQLConfig: "+Runtime.ToPre(CustomSQLConfigData.val));
};

})();