# -*- coding:utf-8 -*-
"""
GitHub: https://github.com/xiangyuecn/AreaCity-JsSpider-StatsGov/assets/pinyin-python-server

使用的HanLP (https://github.com/hankcs/HanLP) 语言处理库

【1】安装Miniconda
conda版本随意

【2】安装pyhanlp
https://github.com/hankcs/pyhanlp/wiki/Windows
测试发现python3.7.1 windows下ssl有问题无法安装，conda切换成python 3.6.4测试安装正常
安装好后运行一下hanlp命令，会提示下载，看第3步

【3】下载字典和jar
参考半自动配置： https://github.com/hankcs/pyhanlp/wiki/%E6%89%8B%E5%8A%A8%E9%85%8D%E7%BD%AE
字典和jar存放目录一般在Miniconda3[\envs\py36]\Lib\site-packages\pyhanlp\static

jar直接下载最新releases
字典最好直接clone仓库/data目录最新版本（用svn下载速度快很多，无需model数据），一样的在存储目录内放一个data文件夹，releases对bug处理稍微滞后一点。
另外需要修改hanlp.properties，给root赋值为当前目录完整路径。
svn: https://github.com/hankcs/HanLP/trunk/data

【4】运行
python server.py

【5】浏览器访问
http://127.0.0.1:9527/pinyin?txt=要拼的文字
"拼音。m" 返回结果 {c:0,m:"",v:["pin","yin","F。","Fm"]}，c=0时代表正常，其他代表出错，m为错误原因，拼音如果是字母符号会用F打头

"""
import sys
if sys.version_info.major < 3:
    print("Require python3 environment!")
    exit(1)
    

from pyhanlp import *

import traceback
import time
import json
import urllib
from http.server import HTTPServer, BaseHTTPRequestHandler


class HttpHandler(BaseHTTPRequestHandler):
    def _response(self, path, args):
        startTime=time.time()
        code=200
        rtv={'c':0,'m':'','v':''}
        
        try:
            if args:
                args=urllib.parse.parse_qs(args).items()
                args=dict([(k,v[0]) for k,v in args])
            else:
                args={}
            # ****************************************
            # ***************页面开始*****************
            # ****************************************
            
            # ==>
            if path=="/":
                rtv["v"]="服务器已准备好"
                
            # ==>
            elif path=="/pinyin":
                txt=args.get("txt","")
                pinyin_list = HanLP.convertToPinyinList(txt)
                list=[]
                Pinyin=JClass("com.hankcs.hanlp.dictionary.py.Pinyin")
                for i in range(pinyin_list.size()):
                    pinyin=pinyin_list[i]
                    if pinyin==Pinyin.none5:
                        list.append('F'+txt[i])
                    else:
                        list.append(pinyin.getPinyinWithoutTone())
                        
                rtv["v"]=list
                
                
            # ****************************************
            # ****************页面结束****************
            # ****************************************
            else:
                code=404
                rtv["c"]=404
                rtv["m"]="路径"+path+"不存在"
        except Exception as e:
            rtv["c"]=1
            rtv["m"]='服务器错误：'+str(e)+"\n"+traceback.format_exc()
        
        rtv["T"]=int(startTime*1000)
        rtv["D"]=int((time.time()-startTime)*1000)
        try:
            rtv=json.dumps(rtv,ensure_ascii=False)
        except Exception as e:
            rtv={'c':2,'m':'服务器返回数据错误：'+str(e)+"\n"+traceback.format_exc(),'v':''}
            rtv=json.dumps(rtv,ensure_ascii=False)
        
        self.send_response(code)
        self.send_header('Content-type', 'text/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', '*')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
        self.wfile.write(rtv.encode())
    
    def do_OPTIONS(self):
        self._response("/", {})
    
    def do_GET(self):
        path,args=urllib.parse.splitquery(self.path)
        self._response(path, args)

    def do_POST(self):
        args = self.rfile.read(int(self.headers['content-length'])).decode("utf-8")
        self._response(self.path, args)


httpd = HTTPServer(('127.0.0.1', 9527), HttpHandler)
httpd.serve_forever()

