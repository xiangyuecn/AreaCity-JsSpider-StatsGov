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
	配置状态：<span class="cscState"></span>\
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
	var edit=v._edit=CodeMirror.fromTextArea(v,{
		mode:"javascript"
		,lineNumbers:true
		,lineWrapping:true
	});
	edit.setSize($(v).width()+"px","auto");
});

//配置被修改时，清理
$(".cscIn").bind("input",function(){ inputChange(); });
var inputChange=function(){
	Runtime.customSQLConfigDisable();
	$(".cscState").html('<span style="color:red;font-weight:bold">配置已修改，点击“完成配置”后生效</span>');
};

//填充模板内容
var templList=["通用WKT纯文本格式(默认)","Oracle数据库格式","ST_GeomFromText兼容格式","通用CSV+WKT纯文本格式(Excel)"];
var html=[];
for(var i=0;i<templList.length;i++)html.push('<a onclick="setTempl('+(i+1)+')">'+templList[i]+'</a>');
$(".csc_templs").html(html.join(" | "));

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
	}else if(type==3){
		createV.push("ST_GeomFromText兼容格式，适用于支持ST_GeomFromText函数的数据库，比如MySQL8+、PostgreSQL");
	}else if(type==4){
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
	}else if(type==4){
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
		createV.push('    ${Field_Geo} SDO_GEOMETRY NOT NULL,');
		createV.push('    ${Field_Polygon} SDO_GEOMETRY NOT NULL');
	}else if(type==3){
		createV.push('    ${Field_Geo} geometry NOT NULL,');
		createV.push('    ${Field_Polygon} geometry NOT NULL');
	}else if(type==4){
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
		insertV.push("SDO_GEOMETRY('${Value_Geo|POINT EMPTY}',0),");
		insertV.push("SDO_GEOMETRY('${Value_Polygon|POLYGON EMPTY}',0)");
	}else if(type==3){
		insertV.push("ST_GeomFromText('${Value_Geo|POINT EMPTY}',0),");
		insertV.push("ST_GeomFromText('${Value_Polygon|POLYGON EMPTY}',0)");
	}else if(type==4){
		//NOOP
	}else{ return fail(); }
	insertV.push(");");
	insertV.push("\n\n//@ 这些字段值的顺序必须和创建表的字段顺序一致");
	insertV.push("\n//@ OtherValues变量为：csv内更多要导出的非预定义字段值，数字和字符串两种类型，后面两个参数为对应字段的值格式，?为值的占位符");
	insertV.push("\n//@ Value_Geo和Value_Polygon后面的参数为图形为空时的WKT字符串，比如mysql只有GEOMETRYCOLLECTION EMPTY");
	
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
		insertV.push("\n//@ OtherValues变量为：更多要导出的非预定义字段值，数字和字符串两种类型，后面两个参数为对应字段的值格式，?为值的占位符");
		insertV.push("\n//@ Value_Geo和Value_Polygon后面的参数为图形为空时的WKT字符串");
	}
	
	
	
	var tableEl=$(".csc_in_tableSQL")[0]._edit,insertEl=$(".csc_in_insertSQL")[0]._edit;
	var raw=CustomSQLConfigData.raw||{};
	
	$(".csc_in_charset").val((isInit?raw.charset:"")||charsetV);
	$(".csc_in_fileExt").val((isInit?raw.fileExt:"")||fileExtV);
	tableEl.setValue((isInit?raw.tableSQL:"")||createV.join("\n")); tableEl.refresh();
	insertEl.setValue((isInit?raw.insertSQL:"")||insertV.join("")); insertEl.refresh();
	inputChange();
};
setTempl(1,1);

//完成配置
window.runClick=function(){
	if(Runtime.VersionLess("1.3.230403")){
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
	CustomSQLConfigData.raw={charset:charset,fileExt:fileExt,tableSQL:tableSQLRaw,insertSQL:insertSQLRaw};
	CustomSQLConfigData.val={charset:charset,fileExt:fileExt,tableSQL:tableSQL,insertSQL:insertSQL};
	
	//实现转换接口给软件调用
	Runtime.AppCalls.customSQLConfig=function(ctx){
		var val=CustomSQLConfigData.val;
		ctx.config.charset=val.charset;
		ctx.config.fileExt=val.fileExt;
		ctx.config.tableSQL=val.tableSQL;
		ctx.config.insertSQL=val.insertSQL;
	};
	Runtime.UpdateStatus();
	
	$(".cscState").html('<span style="color:#0b1">配置已生效</span>');
	Runtime.Log("customSQLConfig: "+Runtime.ToPre(CustomSQLConfigData.val));
};

})();