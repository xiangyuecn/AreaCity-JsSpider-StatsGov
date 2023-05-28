/*
获取高德地图城市辅助验证
只需一次性获得省市区三级即可，乡镇这一级高德没有给出编码，因此放弃全使用高德数据，仅用来验证。

在以下页面执行
https://developer.amap.com

https://lbs.amap.com/api/webservice/guide/api/district
*/
"use strict";

var SaveName="Step1_3_Amap";

$.ajax({
	url:"https://developer.amap.com/service/api/restapi?keywords=中国&subdistrict=3&extensions=base"
	,method:"POST"
	,data:{type:"config/district",version:"v3"}
	,dataType:"json"
	,error:function(){
		console.error("请求数据出错");
	}
	,success:function(data){
		console.log("响应结果",data);
		
		if(data.districts.length!=1){
			console.error("结果不是唯一的");
			return;
		};
		
		var list=data.districts[0].districts;
		
		loadEnd(list);
	}
});

function loadEnd(list){
	var data=[];
	var Level={
		province:1
		,city:2
		,district:3
		,street:4
	};
	var add=function(level,parent,src,dist){
		for(var i=0;i<src.length;i++){
			var o=src[i];
			if(parent && level != Level[o.level]){
				if(i!=0 || level != Level[o.level]-1){
					console.error("发生了不应该的跨级",i,o,arguments);
					throw new Error();
				};
				//和上级之间跨越了一级，3级变成了4级，其实应该丢弃，但还是保留下来了
				console.log(parent.name+"和下级之间发生跨级，简单复制自身补齐，code完全相同，下级数据已变成第"+(level+1)+"级");
				var copy={
					name:parent.name
					,code:parent.code
					,child:[]
				};
				dist.push(copy);
				
				level=level+1;
				parent=copy;
				dist=copy.child;
			};
			
			var child=[];
			var itm={
				name:o.name
				,code:(o.adcode+"000000000000").substr(0,12)
				,child:child
			};
			if(level<4){//丢弃4级数据 嫌弃，不要了
				dist.push(itm);
				add(level+1,itm,o.districts,child);
			}
		};
		dist.sort(function(a,b){
			return a.code.localeCompare(b.code);
		});
	};
	add(1,null,list,data);
	
	var saveData={};
	saveData.cityList=data;
	console.log(saveData);
	
	var url=URL.createObjectURL(
		new Blob([
			new Uint8Array([0xEF,0xBB,0xBF])
			,"var "+SaveName+"="
			,JSON.stringify(saveData,null,"\t")
		]
		,{"type":"text/plain"})
	);
	var downA=document.createElement("A");
	downA.innerHTML="下载合并好的数据文件";
	downA.href=url;
	downA.download=SaveName+".txt";
	downA.click();

	console.log("--完成--");
};