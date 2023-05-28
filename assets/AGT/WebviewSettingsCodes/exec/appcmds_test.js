/******************
《浏览器接口测试用例》
作者：高坚果
时间：2020-05-30 23:39:53
本文件由代码生成器生成，【请勿直接打开文件修改】【请勿直接打开文件修改】【请勿直接打开文件修改】

本测试用例一方面可以用来测试软件接口的稳定性，另一方面可以当做高级自定义脚本的使用范例教程。
******************/
(function(){
	
	var config=JSON.parse(AppCmds.config());
	if(!/\/AreaCity-Geo-Transform\.exe$/i.test(config.AppFilePath)){
		Runtime.Log("本程序exe名称被修改，请改回AreaCity-Geo-Transform.exe才能运行本代码",1);
		return;
	};

	Runtime.Log("echo",AppCmds.echo({v:123}).v==123?2:1);


	/**验证http服务接口**/
	try{
		var port=29527;
		AppCmds.closeHttpServer(port);
		AppCmds.runHttpServer(JSON.stringify({
			callback:"testHttpServer"
			,port:port
		}));
		window.testHttpServer=function(reqInfo){
			AppCmds.httpScriptTimeout(reqInfo.id, 1000);
			
			reqInfo.headers.sort();
			var info=JSON.stringify(reqInfo,null,'\t');

			setTimeout(function(){
				var html='<div style="font-size:80px">服务已运行</div>'
						+'<pre>请求信息：'+info.replace(/&/g,"&amp;").replace(/</g,"&lt;")+'</pre>';
				var val={
	 				status:200
					,contentType:"text/html; charset=utf-8"
					,headers:[ "x-add1: add1"
						, "x-add2: add2","x-add2: add3","x-add2: add4" ]
					,data:btoa(unescape(encodeURIComponent(html)))
				};
				AppCmds.httpResponse(reqInfo.id, JSON.stringify(val));
			},300);
		};
		Runtime.Log("HttpServer 已运行，通过此地址访问： http://127.0.0.1:"+port+"/path?k=1&v=abc",2);
	}catch(e){
		Runtime.Log("HttpServer Error:"+e.message,1);
	}
	
	/**验证load接口**/
	Runtime.Log("load async start...");
	AppCmds.load(JSON.stringify({
			callback:"loadAsync"
			,url:"https://www.baidu.com"
		}));
	window.loadAsync=function(data){
		Runtime.Log("load async",((data.v||{}).value||"").indexOf("百度")!=-1?2:1);

		setTimeout(function(){
			Runtime.Log("load sync start...");
			Runtime.Log("load sync",((JSON.parse(AppCmds.load(JSON.stringify({
					url:"https://www.baidu.com"
				}))).v||{}).value||"").indexOf("百度")!=-1?2:1);
		},1000);
	};

	
	AppCmds.transformStart("测试任务");
	try{
		/**验证文件接口**/
		var file="d:/temp-apptest-file.txt";
		if(confirm("是否允许创建"+file+"测试文件？")){
			try{
				var write=AppCmds.openFileWriteRes(file);
				Runtime.Log("已新建文件："+file,2);
				AppCmds.fileWrite(write,"abcd","text");
				AppCmds.fileWrite(write,btoa("\n123"),"base64");
				AppCmds.fileWrite(write,"\n456");
				AppCmds.closeRes(write);
				
				var write=AppCmds.openFileWriteRes(file,true);
				AppCmds.fileWrite(write,"\n789");
				AppCmds.closeRes(write);
				
				var read=AppCmds.openFileReadRes(file);
				var line1=AppCmds.fileReadLine(read);
				Runtime.Log("文件读取第1行："+line1,line1=="abcd"?2:1);
				var line2=AppCmds.fileReadLine(read);
				Runtime.Log("文件读取第2行："+line2,line2=="123"?2:1);
				AppCmds.fileRead(read,"text",-1,0);//移动读取位置到开头

				var lineAll=AppCmds.fileRead(read);
				Runtime.Log("文件回到开头读取全部："+lineAll,/abcd[\S\s]+789/.test(lineAll)?2:1);
				var lineAll2=atob(AppCmds.fileRead(read,"base64",0,0));
				Runtime.Log("文件base64读取："+lineAll2,lineAll2==lineAll?2:1);

				AppCmds.closeRes(read);
				
				var size=AppCmds.fileSize(file);
				Runtime.Log("文件大小："+size,size==lineAll.length?2:1);
			}catch(e){
				Runtime.Log("File Error:"+e.message,1);
			}
		}else{
			Runtime.Log("不允许创建文件，不能测试File接口",1);
		};

		/**验证数据库接口**/
		try{
			var db=AppCmds.openDatabaseRes();
			Runtime.Log("Database open",2);

			var dbType=config.Input.input_db_type;
			var isMySQL=dbType==1;
			var isMSSQL=dbType==0;
			if(!isMySQL&&!isMSSQL){
				throw new Error("未适配选择的数据库类型");
			};

			var sql=(isMySQL?"create temporary table ":"create table #")+"apptest_temptab(id int not null,name varchar(100) not null)";
			sql+=";insert into "+(isMySQL?"":"#")+"apptest_temptab values(1,'n1'),(2,'n2'),(3,'n3')";
			var affected=AppCmds.dbExec(db,sql);
			Runtime.Log("变更数："+affected);

			var query=AppCmds.dbQuery(db,"select * from "+(isMySQL?"":"#")+"apptest_temptab");
			Runtime.Log("查询结果："+query);

			AppCmds.closeRes(db);

			Runtime.Log("Database OK",2);
		}catch(e){
			Runtime.Log("Database Error:"+e.message,1);
		}
	}finally{
		AppCmds.transformEnd();
	}


	/**验证AppCmds.exec调用**/
	var modeValidate=function(name,val){
		var obj=window[name]||{NotFound:true};
		if((obj.v||"").indexOf(val)+1){
			Runtime.Log(name+" 内核输出: "+obj.v);
			Runtime.Log(name+" 通过验证",2);
		}else{
			Runtime.Log(name+" 内核结果: "+JSON.stringify(obj));
			Runtime.Log(name+" 未通过验证",1);
		};
	};
	setTimeout(function(){
		modeValidate("execMode1","4326");
		modeValidate("execMode2","123 45");
		modeValidate("execMode3","abcde");
	});
window.execMode1=JSON.parse(AppCmds.exec("C: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; S:KvFqV0PS4Y7v/BOPr0l1vHnt9ELAc6KVkU0TnsAOHn8FT9wvHdrWYo9fUAGTfmVVCJas5mOv/RvXOJaIRtdOTmEo9M1QIZ3Us+j/YRyj1nEtGmg8tmaEdC+l9kErhqv6BpbzdtyaRMG2qDwc9RuYjujnd4cPK5/M7BtKKJ0vnMs=; N:23CPPyBkUhJkNkK9Ok8+lXAWfXaSEih8/fAxarZdmNXUvzJ89pCLZc452U8XtBGMaMTVplO74FE//askIMqA/bFooA1HymMBwBU5/GILWCcttNhQsodnQZQt4bbW8a1ZMQvsonmwhheHO7pG8tilpBfqdGw+r+7wev1pQGvRRvE=; NS:rKN46/cDICvgMKcAWPxtdhNAVzMVG6LnvXkvbMZgNYv8zvImWHHHaUMfqhEwIk4BBWfz4MUoKq6WiJa7dss7E2uveOn2EjlrFOY881KwXuLQuRFLNhmpNxTEALSSJFEzuQkHJNtNkrB71j8PJlAtKDh3RokOw9doB67YcYjWruY="));
window.execMode2=JSON.parse(AppCmds.exec("C:ob7deSzMbs6NzDTamSiCNX3gazS4jVjttJ6UBEYypoF8REQqZWHuYhgsui63EextF0o7eemMKcg6luZMzeFvtZ2xi3XRxHImNqQSKNO4JE2VbQ8+UqWNdOw4pw9KkGOWy4fvioSu0qfji+/gzkPVADDeJ8t1iYqp+OoiCK49bqZofprUBVPNMDv65h1j2y1p5tUZnBcDkx8sySEm4Sodv3F447DkdSaiIjYBnm88758UFppZuCB5+l5NGD1Paz3MNCsT1eFsSXH/ZK1AOtioXGCxMmsSZnqiilGHddAU5rndyzqAQo7PQ588vYddyqWBH8XfGCmEi7GU0NxzR17Z9L8BSe1z5fisgOU8hDMlGDZgFbqYDyycWxzuAEWT2+60W3sfrDFPpOkHdwlDwKA+O4oFws/I0sVfc+xvg5Q2eRyF9EQDzJdIxf1isAyyvzkCv24NVt0pch4d6O649PYqSkEC3lnnO1+HxvtN5UHqkaZGZywzaggY5o/9MtxxPIgikf/cbMSBBSLcaQ7CsNqWAXn/Ga+8z7gE0JtTxCnbrRoEUe/njbrIDq3Rw2lByEwbo0ALGmkIeqndhxoyRQeFSu6tuhMzIVeMWVTl66ujmWKxIgeOIThP0dK+VT3ynMOT6K0E++4CzZd4l0MJJgreyJUUQ9DPCzOXRbGNLrNQjhmnPBnvVVAZt/cjLhBL0GiE+wN2E8sTZsL5V0qGCrBzBfR6I0JfuWYPhxjmVq4fBj1HZeTPPsmqq9BZ/c/qMdD524Ksi3LymSSwOgEE/+kZt4q+TECkKnYGNrWr1XGsLfUohdJBNB/dBbXKxiS7kO+tz/X+vZvDZ1B8WLgSk5B1RklAJ81E+0ampDxUU410Wp01FImyWTAJUb71VoSzzyrfdBqA3OCZSHJ30YNM0RrD80cDct1ro/d0NBzuorJRHhmIZa/8SWiMQhSzPTz9qZp7awbXxsZuguLQPHYcCUfZqOVkQa3Q6fhVxpyGPFocXp4vzv96R44cVz3PRFNWe87I5XxCdE4RkUh1CSTuQd6XUkXnXZuUea2+vSI0MqsJfQbUZlNJOVBgbM+/QIrrR+9u5tfu+XP96yXCeeMptKsbwoNaUWoznCh9FVr3FxV0CELhZrjGSjK/Z6iTgno+Y4fGzqzEiOUHHXf6PZ+kAZ37mw==; S:v/ecyHQX2TU+QkBBAZUy3vq5cZpPVzIwl/YF+DWJ7ti/+z5ViFswPpLyNaFo1hyZLWD8X163RGX6Bclv3d8tCnTVKmZ//5VbuM8dXZobfSzJ56P6tXj29Wg+2LZZoItlHHOb9qiZ7dCsiBQRBjk5XMpmt3C36UUQxNIu4htFm08=; N:23CPPyBkUhJkNkK9Ok8+lXAWfXaSEih8/fAxarZdmNXUvzJ89pCLZc452U8XtBGMaMTVplO74FE//askIMqA/bFooA1HymMBwBU5/GILWCcttNhQsodnQZQt4bbW8a1ZMQvsonmwhheHO7pG8tilpBfqdGw+r+7wev1pQGvRRvE=; NS:rKN46/cDICvgMKcAWPxtdhNAVzMVG6LnvXkvbMZgNYv8zvImWHHHaUMfqhEwIk4BBWfz4MUoKq6WiJa7dss7E2uveOn2EjlrFOY881KwXuLQuRFLNhmpNxTEALSSJFEzuQkHJNtNkrB71j8PJlAtKDh3RokOw9doB67YcYjWruY="));
AppCmds.exec("C:HlcRd27rgve2wbl72HCF+1KQE4/6AZPnaprS98x6idlpfLer8cRUtrGwFpNG+TZT4XOpjnLI/0TMqRMnkFIdHvBp9pTXSNOR/AyxGjrYgq1cocu7bri1yd/dpAAkPXSIAVbm1ITGvWQtfdj3j12bgQHC0/xG38lUcVfwrXJBYFlROgCPAEPrtCuV6sq31UWO2L511tUlzAdVgitfLQm/fzLI+/7mP8G0WuSK6RjgqCzum3ICYAFzbUQGCncjYbyCQPEfR9a5PhV2S/12RSUHC6beBFxUQKsduZfOf3dZcdQM1oC2MmGIL3ZDYR5LXEqcfPXKKgQebia0ojYPU2v8JQR2MPVGo5goDyAzhkiz56KPaQg6owcZqJcid0kSJ+kSddqbCz9RF+UQq7QN+ZP2yRQTOFCfLHjCBAm6e/Tze2c=; S:H5hGY6ouCOI9/1DKeDLzj+prauFarPFUqxOxeGJzykAwjY/PQc0jIBZhTrTmIYPUxhRtYYaxC3uYo5UcuDMXyzpYMq7PhEJEtTSPjpCBukswPfnLMDSRLUBJyZgmMkSvBAQYUbfGA0H1VnrFg5tf5XGxrZWnvHTcWQcw2oo3SDg=; N:23CPPyBkUhJkNkK9Ok8+lXAWfXaSEih8/fAxarZdmNXUvzJ89pCLZc452U8XtBGMaMTVplO74FE//askIMqA/bFooA1HymMBwBU5/GILWCcttNhQsodnQZQt4bbW8a1ZMQvsonmwhheHO7pG8tilpBfqdGw+r+7wev1pQGvRRvE=; NS:rKN46/cDICvgMKcAWPxtdhNAVzMVG6LnvXkvbMZgNYv8zvImWHHHaUMfqhEwIk4BBWfz4MUoKq6WiJa7dss7E2uveOn2EjlrFOY881KwXuLQuRFLNhmpNxTEALSSJFEzuQkHJNtNkrB71j8PJlAtKDh3RokOw9doB67YcYjWruY=");
})();
/***文件结束***/
