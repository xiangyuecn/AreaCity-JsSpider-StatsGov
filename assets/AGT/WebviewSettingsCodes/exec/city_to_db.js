/******************
《【导入】 ok_data_level*.csv 省市区镇导入数据库》
作者：高坚果
时间：2020-10-06 11:39:53 本文件由代码生成器生成，【请勿直接打开文件修改】

本代码用于将 ok_data_level*.csv 省市区镇3级或4级数据导入到数据库中。
******************/
(function(){

var Steps=
'【操作步骤】：\
	1. 点击上方的“通用-选择文件”选择你下载好的 ok_data_level*.csv 文件；\
	2. 左侧数据库设置中设置数据库类型、表前缀、和数据库连接（城市级别等不用设置）；\
	3. 本代码点击应用后，会显示导入数据库按钮和更多配置选项，可按需配置（部分配置需要付费版才可用）；\
	4. 点击“省市区镇导入数据库”按钮即可导入。';
Runtime.Log(Steps.replace(/\t/g,'<br>'));

Runtime.translateGeoDisable();//停用坐标转换

//显示控制按钮
Runtime.Ctrls([
	{name:"ok_data_level*.csv 省市区镇导入数据库",click:"CityToDBClick"}
	,{html:'<span style="font-size:12px">免费版、付费版均可导出所有数据；如果你想生成多级联动js或json数据，请使用本库的<a href="https://xiangyuecn.gitee.io/areacity-jsspider-statsgov/" target="_blank">在线转换工具</a></span>'}
	,{html:
'<div style="font-size:14px">\
	<style>\
	.input_set_field,.input_set_import_geo{width:120px;margin-top:10px;margin-left:8px}\
	.ib,.ib2{display:inline-block;min-width:90px;text-align:right;font-weight: normal;color:#666}\
	.ib2{min-width:300px;}\
	</style>\
	<div style="font-weight:bold;padding-top:20px;">\
		【设置】自定义字段名（设为空的字段不导出）\
		<span style="color:#0b1;font-size:12px">除设为空外改名需付费版才可设置</span>\
	</div>\
	<div class="FlexBox">\
		<div class="FlexItem">\
			<div><b class="ib">id:</b><input value="id" key="id" class="input_set_field"/></div>\
			<div><b class="ib">上级ID:</b><input value="pid" key="pid" class="input_set_field"/></div>\
			<div><b class="ib">层级深度:</b><input value="deep" key="deep" class="input_set_field"/></div>\
			<div><b class="ib">名称:</b><input value="name" key="name" class="input_set_field"/></div>\
		</div>\
		<div class="FlexItem">\
			<div><b class="ib">拼音前缀:</b><input value="pinyin_prefix" key="pinyin_prefix" class="input_set_field"/></div>\
			<div><b class="ib">全拼:</b><input value="pinyin" key="pinyin" class="input_set_field"/></div>\
			<div><b class="ib">ext_id:</b><input value="ext_id" key="ext_id" class="input_set_field"/></div>\
			<div><b class="ib">ext_name:</b><input value="ext_name" key="ext_name" class="input_set_field"/></div>\
		</div>\
	</div>\
	\
	<div style="font-weight:bold;padding-top:20px;">\
		【设置】附加坐标、边界字段\
		<span style="color:#0b1;font-size:12px">付费版可设置</span>\
	</div>\
	<div style="font-size:12px;color:#999">你可以将 ok_geo.csv 中的数据先导入数据库，然后在导入 ok_data_level*.csv 时将需要的geo、polygon字段数据通过本设置自动添加到新导入的省市区表中；因此需先通过左侧界面中将坐标边界导入数据库，得到坐标边界表，再来填写此表名到下面输入框中</div>\
	<div>\
		<div><b class="ib2">已导入的坐标边界表名（为空不开启附加）:</b><input value="" key="tableName" class="input_set_import_geo"/></div>\
		<div><b class="ib2">自定义中心点字段名(geo，为空不加):</b><input value="geo" key="geo" class="input_set_import_geo"/></div>\
		<div><b class="ib2">自定义边界范围字段名(polygon，为空不加):</b><input value="polygon" key="polygon" class="input_set_import_geo"/></div>\
	</div>\
</div>'}
]);

//导入处理内核代码
window.CityToDBClick=function(){
	AppCmds.config();//保存一下用户输入
	if(Runtime.VersionLess("1.2.201006")){
		AppCmds.showTips("软件版本过低，请重新下载升级后再操作",true);
		return;
	};
	var config=CityToDBClick.config={};
	var read=function(prefix,arr){
		for(var i=0;i<arr.length;i++){
			var elem=$(arr[i]);
			config[prefix+elem.attr("key")]=elem.val();
		};
	};
	read("importGeo_",$(".input_set_import_geo"));
	read("setField_",$(".input_set_field"));

	AppCmds.exec("C:HlcRd27rgve2wbl72HCF+x9KmYKWio8he+hSgdGEgKGtscpamytGxygtyFnQD/L5g2ryZ/NebTa77QORrYtjbeHiFZavNw8NmbhEzYWDSw1K1t7b3ncN7bF9dNz2vI8+drs7eodpJ35CDtXLrwj+sWxVlp/FWDV9t4EVLIL+CTkBacQPWR7D5GJJv8RBFcE0h3YE1uDyoj3q8eayXfqQ4VsmunkCPirRj6iyZUECrRvD4dQ0Q6aCfAxwBImrCILEIrxCObLqJk4P+UB7oscXX0Pxl1RAJWwSHh/1YlnJE5urBStPRwPRYQLm4hKyy88fkTZ9X5arq8mAfufST4DorkCgL0HydzisNMbGevuAhrVAyutoQl/6t+Ovg0LK+e1pgC7O/yKmLAGBozEUxmBQ6aNCkMKYXlpf1kH3hFuX5UgtqRLjCOKyFsjp/bBw3BhQqEUWt42f8spl8nZN8FoKXsGjr/k5Y7jMA8UrJntNWLBk2z8J+7BiZ8L1VCCPDVyGPMR/gZOw2y3OUw95T033TgKLdIJM9HGKKdFSQGS3YcGOvwl+yfeATc0Hc9a/Ro9SwJUtnEu+EGlTWF2qobM7ROLxaTolSOpmX+zmTCQlpBALGgar0CdFp8vsIpOgmBlPLfL+ZanGayT0w+MMudohTYe2MBjZABcCvhg8tzLhBdXMFeixwm/BlnWDjh4p8/kqs3eV8Wej0MixcCyW84o29Csgo+xidT94SF2ct/5BxrNMt5py9OOl0i159ET4TPwxKugcM2Qemqlnq0VqxXtPhR2PHChqrh7nHOdbZsjtp0bdb9n1qrmzB5D09d5jy4LdCqbSArxCedpyD2rDXCzIaUtcuTqYOvTim0z2xJ7P19IlJQiRAyKu88PAkqKv5DWfiJqZZuE1ovAgs5UO1ZVB2iMiYsIwKPpBQrmZX24YxYvEX085yvJUEnQwx0WHCZmUsavasdQe0ELguV5JtjwRjnwghTr6LyjzINd5Jfrms4OyOlTc52bIdQkpcppBgEePthvH7+jXsAQb2Fc/BbSypBmkxNemQ+NFc1CltNs3NneHGUmePVaZzGdjX8FJ0t//NvNirJttAwqfoB1UOIex7goBEpLmapMkpZvADjnGo8yFsjZSIO1t38p+vhielKyPG5D8lf5KRchcVPzK9hQJwSluVo1pnBDsftDaZp09XO4V+07dF5047OJR+vnBmrOZYMBEm2V0e9TQHgqMpABUzqT2ZfNSnpeBPUpcM51IZlGEeI30A9h/HeW3fY+QqIiPGnZbpxRhZ6sEM3tWxgYIk4cViLzBH/wTgy6fbqK5S4UWIw0FAFZgclqEWEJKfSdPlKMELu8bpf0U/wsWv8Ghrf9Llfh6BmxKh+YkJeVGdFQd+6V9RrA6HVu4Fk03zdGHWzB0YmrUeWHvMC5kNdoB/OazScQouSJCefwcAwpKLAxPIedTtfpWw8Ekt36m2RaySWfq/XNd5/B7RvnnpguuyPLT5YwHVJRQo4Jopa0HoHU3Zbs6txwlHvpWH/q0YMraOu1Yi2fE1HIBrEQncO7U7bCRsYSNAMixT7qaWwkoMI/YMVqIAyQ/6v7gAUgVSmGP1m++Swc2lqm3OK36IXzG+5J9ehjAL90YVhC/T8fekDhT65UW0zQTPc2ixZeajqrakpoT/TvOBn2zrvXRGvG29hOrV5maCqzDZXPPo1f5gwZgiOrF6y83J5CdTFy6GFr2hHChbq9GdI8E2yUEIsWhxxlalijRMyEMT35qA63mW/zYSLQSZgifmx7qPx/rOkDBv0IhA4g6zx5pciq1DV5nawuF8EgV0WfbtIDEBrL0VJnn7kexWmDsq5yu+39B7bzlfG4NIDJbeZNMEkvVR0xQRyDGUK64QkvUj8FWnYyGCH4BhsGBtmYU0KTxGtamHHpOTyQrPc7O6i1wRevRVxmS8h75N2DqE9GuSGvOZgDi8Wmo37JocDRBN0bjEBeC62bDD59bKdxn7Qn/8enONxqh3dS9UFD4ACIi+ywmt8vnm4zK194J3VqBsqFxjj5aPYnu4/hCxrYFSYYS8+Evdjs4AhzOZSptitXDz4ODPRKEVXBxdogV80H9dj6JhlyXmQOljIN9Q1AJcWdh4oeffLZINHa1eyUAhhUglDw5KCM30tRYp/jqo8AVVc4RFLyAE6fuaIvpiHcHIcNngeTDPLclMBMWHXcItSOga/5Q/N566VplfTGY/9CGFH3pM/hAXvwi5IZ5E1f1bQcpfLydyjaS+JGKHBCyuZqxJfEA464vV+OuPJ8YtN3uGS5qf1KXyKAcBeExO65fw4gUhms2niRBE/KEssRlBSplKm4eUtcrVEf5UkNcdR78B1Z697DUZveFO3y+PE4p52KBOZ9o9BlefIOQQ/wX7J9IBSpLc/vVoC3bm90Xpt6vndKPWBNOjm6ofDbQ/JPz059HMq2sabcC+c7fPUE22EX5gL/QLA9GpUno2sK7Kzi7a3D6y4joWujQONhT9+1cBIFJI1Ifb9T0w37yyjbsQsfg4j5HgA0TuwVVxSvPqe4NQHEoTjY2HhXrw4YIzPBjyQW52l9KhC9VoXEaDHyfouumklW8cJ0UlcIepMGZ8JzTkWaWRuf8wpqFCYQkYsrMH8hs+rJloo6PIApWyh7ULmEpNMK8wDoHxbKnrMavO0xVtdCl8vwsiiYc8QNBdgiRVGSxZNrpJR8t0X3yZNrmrp6GZaj2swT8X8XwI9eIbbj+pXBMKsR0qb3CsvQBSoxbT90pAv1//3BrNNeMQPpn8dQhVFUH2HMvCkmN7vtR/E7j/0L3J8FL2f0pEzm8JG8uiz26rK+R92PcGqDfn+G3WcpEuvB3l/7GqF5k3nqGDx9ic1XkeLSCTqfABNJqMWPOM4YojwCQL8vc1BrxAQpQ/XlOxzTs/A5rN7VXg2mCOR03MrePNw8gcbQkXo4bjaJNgrsRY8c+U+JHxOd45QSHv59mLo0hBrxH8sh5hfWdbMFkKEBEUX/xBIokAKOQUAU7PYnBiOab2fesTaDeaZV1YdKcZI1PZCry5USiFjIE+zAaPF12Xy2v987HdmSxZtWSmk/0XvhzSuhRKTcLz43/+BJI85m66ElZpFixQkAuEPHBb8pIKAtYguD7Nrrs0+ItLGG7RBN3suvBLIojeMtzOcaJedS5J1HbS2cuqAZ9g3YZBxnejQdvuObzB16BO6hMulY03VSYkrmNvA6wyyqwEidCAsA48UT8svOQgHs8GQmVrwpPFQccSrOpPI6e9QI8fxrL83CCmx2JixwGAUX1MqcL00yRSsjtHdFXeTVhvcAV87QbqJ5VafdiL37qakc04jYQzMnEGpvWYwVLvzbp838H8rDwhTpeIxnzI8FFNhLI62MAFGf++GzMxayIxOHsU/QiG8y3A8XJrzIndxYV3dBcAJNhaN2sz2IgB/6jttJPkxERBKZY8BzkvJCOBcmWT319ejP1cP9LAIZyJTiBX+Xt0/lYG0iD/x+iWV9VgNu7N0PjDPzEYvUMO0sNm2++OhfcRqSCNMJiUb6FrGto7XpiDSUyYJpO8Sk+8XTUl2XzvAYpAUL+tOYB5hB259EzAc0qQemr9ZNkWOWr9WUDMO28Wyuwls5JKrV8hBdCynhF81IFl47r1C1YqCVNvR4RBO4P3Dmc2iWttbAeRYrY+Bcg7npsXo1g0K0FVqDbvPhXRxU2NCiRH+q4k4uYEtHEK/xSb0s1PW7tbDnucWmzHKm0YpBuISpZT1y7cpx4+IQ2R4ftkKEWpeW1aZbHmxdg8Dgux7cm5IE7WAzHFoEEsrLpAV2id+xQNwNDeqa2IEkjn3aa4on5ZoUxYtTSbA+fHUHjCEgttAhXbbdgSFbResqfut7zAVMMoMaWZSqKDrX1+t4vTyrO1Wa84XO67hQuPiRG04a6AFQnvAbhGe8DakU0TCi0NqDeJBszRitAkd54zRVVpuFNxkZZ/J6sc+eTEWvHmoB74cZpb7QpuVOX0JOnYBSzFNZxSLNbjkWe9ew2wa2aLpw10BozMAYfCac51MWo6pRCWVC+c6ylukZQbVpNgx/aC7jjqR2kWjtGUyXCfMuTj8nw5/RsrZSLZXxG8HTInZpjqwdmcc42QW0iLiN2OAHHlPniM6+Y6n4u+3omt4WqpmVPaRrun3uSo7UZGRB4ptbyBPeyDiEixb3rJA8KjCEqWw9Qt1Oy4kLl+6ttJcXrGAWHu1erhtqbZbReJMAdM0rsE4U/qkKV6ps5gZTZMFaWNDHI2JzcDEIiuO4AC4g486gmFt462V4PcepJQNXkl8g5MnBOs816vSGGLmIWk/e3cGrWg/MFnJYY9G4hnk8R8x3g2nL7aKs2f2XdcFy3qnuKN0O4SEgeCSpkvthyaEyDn52Zv+EeLfE/RkbSSCplJWbIoba3b1tnkBhjUZqTwWitKpbwhrBM0bBA8uNCLn+jlmS0GnqTJz61rYTUrp/dooP+7jIrWMEJO1zy84hthXw2Tny38+y+FXlL7GrYG573vhnzzth7Lq/+/hfuwtaXIClZAD6+OkuGp5z2/bluNjUCKErU8nJ8Gw026lnW49eEAkygVZi0HpUJg8Xc+I6CkWxFt6lPQmLy8qlb88zPIk5Ke7AqUEbP2KHuJqf9xZr/fWrGN5kcqG3R4i3rRnGNC8/3KXczRGncFGBwTk3bo7ZlUwIjKxL2NGwLyj0y0YFEQXDDartTFOYQERqu3G5EFYzQILwhWiaPpaeegNmh6i+AaHvUu0l4yV5XTsW8POHj1NRJDI5GUAG/WHQgrPtAdaLNa9/JThx4U0G2aGqEBJZlC9kPI1pLd8Na1ApWFa1ifs3fx9lYgNj3DCvBt3Ryfn8mAIMqdnpHVxy1GCL/be472A3B+VyfwZ+QIJcT6a5TOECIM/0C4EeARkID5zqbhQGRHLBzFgxQxHcrTX9XkzMXEsQ3xxcY5R64IsRKxL9q/dpw55mBEKFCT37sj0ZEUUUM5tb3m5tcYUtSHWmp2sZ4UVpl9RYYiRnXq8JjvDt8ibAEO0WD9BS3rXXVp54QVzay+NXim1q0RQgORinN+b3I80M7KAZb9Cp5LY5QRveqvzHMQvzrrJK5B8ig2SBKWv66ZGBl4PgJEmzLWgCIzJJ77vY9BWcTXi08Z806IqslcYFytAvxkw7E7B4lzF4EG1nEyNMvfACpAfpspqtEPfzdBFNpQBPTpzOuMSZKsEVZyYn2g39RXcVQ52eA9cqgUYgnbIaoJ4//JTy1uh50eMRcOMqEsEJ2Uob+ki/QBzctUiQpZx+Iy4MZdR8X9shzRMv/5O1N2A85AkOyUJj6KIkcR/+iQuP/cCDXblbN8OeuhgBIQmtoe3Tr4KOd8i3GwCaOPIw7h6AcXo8sZrO0M7kxWudMHGEDHzGHU4JVMhDeBySHk16OLC7Ux43GUP5kwLM9Qm7vHiHcCcUARwE1RrUaQrnwKslR1SQV27w/xG1hMB0jiLFQuI8L23+/xLSNRvwVJSWPPrMY+zM9kB2getb4MpmbOngLkjEXS978nU4vHocq1nPUFDGSGSE7+ULXoK1ALG7oA1ZB83bPTXmXFNwF8EqZDyiXmb4CnBNdgJzD1NnHjn6WBoKhRpuo7ScO7IZFZ1kpxD1by3pD8skYYYJisg5zsyKkX4uFkr+6TeVL3p3/P6BBxY0YxcJVi1hYfCRwzBdBQX1ZCbp83lWAf1mJpXORr5zkkmWzWyNYhNsOxm0NAmc6DTiVTiMu+OLphw8yRD4mERjjM+R3NOoXGY6tjbuT/SXwSlvBXgZWHf9CcP/LyBg2y+WCcoKpZEClqJKPX950sVRHOGhmIBqXJHaMPA6CCiSJf+EyNRbbqbPjL6tvAnaEVb+UGhdtuCK0USKu3s8Q23gsx4pZVqfIw3BJy8nHX5ZmiICviF3IZrLbT8XfNrOuBmg3XVW3aGOPgrhiYrbu9iWxueFqMGvmTew4X3yaly+4VAEdtDeIYfhhOX00dBJYLkKNIMnZyhrzixCQjU2umm7fSl75ah+wvUnKraGgRX1+qEcQmq9dz3OnH3X/vya1GANMKQiP5G/9GFOBWaUUVjcHuc7rzXhSIbIb9Ux5Hjs7tf4S+YoB1wpwgQPcXUwtzm487bScQt6Z/I6i6KpDVLsef22Dn1BNyo16+7+y2tP1pXP6WmDct+M6Z7lK2COUXa4qsnQoNBq5fRxp4QibjSo36tymkM7g+9xBzLZlH/u/paFX/hw+vrV/bvBoX8NDs4mFAQNMXjEcfOr0Ym81yWIeYupKUHgHYiNHt0ZYxkcQ2Mu2OGTjsg4eMwdOqAXkNz4ruiv6PaICh48yfsksSr4GjWxvjOXApinQEj+ucaDXk94ku9xBcNwJg6V/X15n4avXdqbaNpWrVUI2ljVbf9Aza+zr1UMYLIwtKHh6DGbk4yQy5E+uClfWOHTGl5gigTIZ35u/UIE+CYItk3NINzLcE30xFdwzO6vF8Pgnl0vYImznoNKkc+CsmMvWNJZgJmxuWK7UoqLnskrXcD4Tte59M0W7a9CxFFftzNorF/676O58X8FE5hDu+4LG3qxGVsOo4IoLZVocV5vsWrHSeYfqv/1g04CJKZ2B2vN6jAug14Pa0va05pS73r96ZgRJq1z13djnlFEw81AsxojB10ipLcT1MJZroG/kUgiizhXIVj7/IjcKpe1oAmkYEshf0y6p2YUzSNlafQey7p5p98MvVQU32lOhKq7kenN80TNd1IReLDfOrF2RhWjkse16FutJDPypO7OqcPwZFjq/TdC4qRUF4BXLYECA7Nqc4PftZP8KDjD9BEsDkPZXbk9AuWJwhDaGYO08QMMhkW8aUpjxDblfMIUA0DuoAC5aQf+k+gI+LlZQxLJr+DiC3t+YKU6mbLh0vl0IOEMRZra4L5zJsNdGcvv6d+ohq63LXegYb1L5aT/DENLPrRBk8QQ5ze7Bo3CUxp6XFd3ryfvjyOZ58XMpirzBArBQ0KOaOepyC8tq4Wb4XBZyGTEyf3f2tFsxXeKW/+gUDwjrzrWaGB8h5OKzWTEqejJOwcpU3/4Jo55ss0thSfThGfLY2urAp0Yr63YtTGcd3N6Gt7tF7eVt370V/6SgQp5KdbsfPlWuUykMrddIYQByD0b+rko3d16PwfaQze8D0+TW8DZZkyS11iWL2ncWavauafJ85KgxEdqmVTuljDic33/9PUWqFiYAV23tku4FPUakQ3ESy7nnXAv8u26SBBnXg0NeSmzzhCFmm9lWVCp/1h9ouQz69th4eap9cF1tRQMr2yH6Frboiv8DICCLyFEZdpXhbTCZ3pBG9tSRHD1ldKLhRKjID3zVlrLnC5h8rahzUNWTZpRDL3nF/o0ax8YAv2Q/ROtin+wYuVAQQ+hRvnPuhRm+24Cd1tc74PxJZqYKU9EyvMSBxTW+txYVRtpW5Ij+gdpR8ZG7rs/6LiKcJgFMKF5EaWufAvF0aJgvHNbsgdlgU19UFPV+3Gg6JitKrOXY1H3+9q+crpW/5IYy0efMby94i79L+QvUPfn2TSkA/0tDhgueYLR+HUfZITWkmWmwk5r9PDW73BF0qd01b+RlDV0TUG1B90IpLjje2A5myqfOtlaJuqENeXWLSVKzSFFPhXYP41JHLt9s6Ib4PBwZ5mL1lMP3unwuo2VNBkNXR7X7cQBoCjy2kjh8a3epijr9UkyQLpqzfX6JdupTO4oWxqxTebmb2XXL0q+ZG4t9mY82W7+LQDkUw3ypqqjD9NZs8M64e6ga9942o1A6ClDX0LMVutLsk27A1TW2fJo2CWehuLQLcJFLyO1t6DEh7849MTg8M1h+xQ9n3WOqgKZ7+DstcB1K0qeKoMBJD1yPsUhj3rmNLorNmcRJG2zlaBluEb2qdUfcoxcPfkYOqVpxuf5IHYuhM3SRBFqIGKjE7hqbrVhwFpIEZqyJ6r3RnJ764OdD5Q5aaochxa70arQbqHIt2SFL2Is2f8o3uGJ2co4UqCQ6BY9s53thto9HzpuaOQ32NpogJz8qb2MnrO27ObOVRcnNVUVKJ/Ze0aCE97ALBFrNd4D5XqKvlAS6oFdYVVvz6UF5Rpe1atCIvuaNlqwcKNj6rvYrfQulP4Mw/g5vqWjwzrhKVzl8WdkI6fuaaWZ7SgYRs/xM2/4g8rn5ZxHcIN1M1Ife1TONToCFkKx1BaxCI/r2RYguqbBZKMxfdtiFjDMWt4Z7/+6QBBJq6JCMTNnS9VTpl0MMDbZfEy9wOQyXWKG3wO1tUoHzei4eH1xBMoJY4EEMvCTPtQu3UWepABtdWq8UjDUXolKnj0k+5hpVW0fha7gmW80+TTl+XIDrMfJb67V8Qm6len2fuDIAh+KfgK8N+7QSwyYZZ/agIn2invps/2Nnx0dSzXg7skSHqlGCHRff7Ft7PTOz/zS1AJEDdkZhwkqgolUyzn2OCw0palrZnpVR7/1Mn7OiE6UfeT0GBRM+E57b8Yv8nyyEWkv5WEnHdvnjWfM3DMwyybf3pk6VloPyFWECyrs089rMQxXt8JFOJd2qEenKUKJW5zEkpOMvd7zQw0veJnN9lYu/y43nBVJGzne92eq4kQ205FXYny4ZvdztzCJ0OrUnazSNzjJcQ4hQPfq9mZS7qCRDwpFWmBYo/VwYus8k4m18dISpqItShyQmL+Njr4QWW+MMuLaLgTGE1CXMswLLeg4cYfb/1npTR/rIOp9GBRlPbWnXFtJYJhJeGdoL8oP+nYS+QN6Ie2iXKR70BjmbSQlxledDNm37kBb96JtwbNTBAvlkH16c/2f5VLI7FTZM0A9akNCXX92MMOESxVw419dqspdOcNlZ8PtAJJs+pxLab48a3wjerhfkXLX7aXmAZZs1sHnUnZFFYG7XQhi2Wy7YJfQvUivj8Jn0+0czCDn/2F6lDl5WC10mr3EVCADPla5CLW7Lwm7k9EajlfsUHBGb94L3x7SsQejRO96+gnHD9h5uwzZt6uKuDB2ye8KKWEb+7lo8eBDWauK2vnci4f7Cnom5T7tiPdm5p4JWz/qojjoNuKo8fcfojOQD5BTx5Nj5u/x58/j7uQxi7AuZvdNYNwQ829QSuOyYI757MXZz34aRCsrWzu7NvJbq2jZSfklkowDJ3XfNztuoXT+w/Xz/FZ9XoijTtcuIjRVBDJa+IQ72ZCU8cyfngV47U5n/dUeCu2TaqR9G0FF62FCzA88xC8gnZ9xrbkYmNft7z7WEVEq+cjV0UHPqe8f2H2EzbqnNbAABITULmt9JcI/WGY9Z2+BAjApZClKhqWl2fNtJYx/d0BNF6YU5aLL0am5UhtN1oO01/dOYdIYHgAO5B0+ISRTdqanTQ5E/dk9/CrErO+TltA7P2QEc2ZkOjJIpJ/9ymKVU6YtThgeddRP0bSHJBBOPhU4VOkqh9ZH8eIGjhj14CdQm2RZ1HWV5kuFESd/HhWwM+r+2OCea6jEsaJoLfmIe7CtpqqYr2jVoFrpXeLhSuBoeOH+H5PSUERn+4/7/68j4O3HkIl5GEbO+nW8EnnpxgVwaU7dOK0ge6H0fF6Bvw9g5vMEZZtIL73AjoumfFy0p0IQUwV+zw22Ol4jDp5QnHoD1iuiCu9IjRLLYPLIG2mWjmoFAQh+giihDeM2rBaPu+pZqu8TCqU+ov9x3vB2r9iVDoq2LzkSNyaCMwlRTfV0BIcFidBT6X12fdjE1wVsc2KfJY00AE4x8aS4SK/3B0qD6y/tNl19Slp6zTICSiY157OeUxZk6t6O0KkkUPwHqm5mVkt2fFZCH7DPaRW22eMQ72iLO3skzJUyxqChdqarvL7HaR+8BsgjfbKZEktEQanO/wm9d6hERl/GHQzbRcvVA5agOldA+eK+XccFFU5La1Xsv/ATqfITlkaz1UmgkZSvuTGZZP5kyg2ESOM1Exswv2fuAPMTY/hj83MC9rJkDoUBlLdTS4ewxzwqWKvxJ7WhdWhpiHM7yJ9bpGaJSXW+B3pCYYDf5SIegs0OauumbcPgl92L/1OR8kPA1iUWgJH34ri3PtZ5AeDOpe4jWPcww4/O3jUFelIha9nMbWvXZbcesp/SluUh0h7e9jvQ+7VLuC6RpwXHZdDPF7hH2c5EH9K4rrs8JQN3v7Raa37JhEAi2xtXK+9uN3DL+EIiPpukYoUqzRxMoNJwSJNzPyWnu3/ByXNaJTkkrsOFPrKpMulCCeRZnFi+6w3itutFI0tGEIa69eFEG1oaYiut+Z2lFhXAYsxC4fm/6Y7zi8kbgYW88P4hrbD+TK2I4mLA3v31a1SVZu9K5dZhELkXLOMu5BUPrQqF3nRo/vpp2/TNHFOY1Ocz7V6izF3durp7xRQJezyo2SCIvZVSmU/zkX9D1C5uNCY2o1SYU7Oe6gX+mrwG0+C7OYktltyf6/+KxDHpRGUSotmUu0zG36Gi+9yic/hFP8teGY6Cd8nB+fulUu4IcphRd/Mdf2jH6JKp0a7Ud1Pw2WXueT62fRe5WHZNzLOkFJrJxGUeLy7AQPNpTIAPKZ+0sCFwNHT7UPitlTjdqbeYb1SiU940KKB1oSof0nrsP/YBG6nc04uWaxVdHcjuOCAkEsplww38oKPZoJ18fCA3IvAKZi6SvGTOMfXEzmLkanSzVC7zpyGI7OyXiE2TUM6hSRSergAvY7w6TBUfItDi/Hprwjq4adudBSUB4iC7j36wp8Rfzf/Laknkx+Ry3vE+pHyqY4+Z5Y5+fdgmr6BWI3pTFsHVeWVkZKluVTu/Fh5U3/hkWq26Jcd+F3L5kXNnhCW0/RLTaH/ZXceXozPtQkhtwZQkuftI4d0xHtJSDfieW0YTKKz96R0Fxi/zE3YA9RxjtIHdK9cQdcfZLMfnowiLkoOeM64gOpu4TfQeMPlEx7S5lu78LNGvy95L80vQ/JEePVezpZ+5R0jzmNUg0/sFnKl7AFavzII2hhg+AS7HlY51Y0nzekuB219EU2pbbOLCeC/Jk2q31gl3hXG1tM1ejgkORDwx0378GRAT7m/Ak6MWA8QyHL0Mn1OW+gl9S9q+wbQ+xPAaw2hh4oZoygC111QSqWL89p1L9WWjfI2joDlE8GE5+fYE+JqmVp177KfYPB7LilriSRGuKlrns+gSAwQ6hIW4+QtLAEBXuUxNZWhAetoYP1yJXDHROyweF0kxLAptQwOfnZKXL6vWLtrnBboAnHHpUieZdGUmwPoidfcHvjaLmAYIEDnVE74trP2E88Z9y/w8o0dvxikHF9c0TwZo0BPq3EPdBgLHNjuNTknR4GwrEUJ7AdekaoRqfR398wMqzA3jEWgKwM8FWRDV/9q+qHvEqqAPJwHXmXFD3cgi6UXkkEd45nd4R06vJl67luM4qCX4ERLy62LoBqsbc0xp5znZ2zplTu07Emr05XV5EfvaGdaCnwII14MZMkFIGx03WTdKaefomjTbMk3VdRYnkaORiV/Szvpn8EqcZQSvgPOU3827BxzWW2IJUnKa8sgyCHDjp5LMP4OmPGKMSpXAqUhekTZLkEzpHzNxZim8ZoexwQnKVVijE7pFJ01its4oGbiCpGl1WOQsKQOFNW6phMq0OoXUtMORkzxGATYMMGrVxoBokUijs+SUGIHHT6IwSqtbQITCxc/dLmQ4Y4e3PwW+2o8Z5QMn7dy/mYwPZmXBZ13aUKiy8zeZA9+ttFtSCqtHZjAzTBaYbEbvIyfm22Z2z9egXwdR0q5nhSnPPILPCb84pW1d0db6DdGc1+E3R8jy836EYkE+YLgWiDyk6VdCJwgO1eipVfQ4T1JrdScw/cV0zG6G9hR7cLhRN513eU+YirwgBtzQlZtMajH5fKfdaofbzamVsNdRJVefT8WSx07liW79m49rpPO1C6LqyfRBQ1zgj7jntTgtL/5MhcLMLenZYkr+hM5xEO7kmHpVHpMzAnHRCeLbQZWbTOLaxa0ClVKLldz6Ny/PUSH8iXS0vwkhojQQ4MthmbVQDZS3pCfzuOISd7q1TWBV9MkIlsCbhDWw58rhLFDEutqPK2Xk3/operNffEPKK1GjA6LtHYZFtAgZWxLpRTD3EbDdqQWYmWtF8cd1CGsjhsem0fRKP5DRLekXWWnX+BGR2B6Cy4CvhwoNK9/v49x65NJ3WAmvwTx+0geE1unUqM+Arj0kvIkUtShMrbfkSApm2GvoiD//HlTodklUKM2OhOYgD4ZhSmgzrnGpWLxtcMOF6q+t32CuGj02AdsmNRjoARuj9BMzMlGlPbPDZBlTYvkv1OcZeXdL/d6hSlhwRzObw5ImIzQ2yAJH01kujRFTPBr80sS9BaikEYUR6g0CWvl34huA6cgRIsaVGS7M/2fESTFFD9BVXvegOhKx2gR8lA6xaxYQC2Et+xfIHFligERCQqUG68MLwVUOBPRwLuyvoj0W4AQ+BRRsESqo/DGQ4j2hZcSI3Y3Br/r/ZB4ArME1vs5sdNYany3QJ7SxKHsqzHWZ0lYE0dCpbjaDG9/AUeVqXtcSfNQJIbTaDrMcMUlB1CT6EM1ldjJ2pSgoYxb3npaf6q+FGXTMHeWsbLs6RPSTxMnSu7WBvn/Q1qguFa4c+umyNmH3QksK4bMJ5V/yCVlZwjsveLmj4UwunATkBuvYwGljLul4CLPpdVUZUMenr6yw+47uFYnqBThAtcKjnqoISfxaYwIrCbCBBFnyHYTXvU7FuGyTzqospqxnS30au9Mu+3L4ASOoxzlHBNM1Wv1+dY8xFuKHgFVIXZ1TpYflQy4KzInHx6poFeQNS/qQ925BuNa+IM+JfDQsqFxmfxTvVYRJIR7mBrrGAEk36FXdWJyKOGh/8wRdyQbtzWHKr8aBz0kYKc0QSWPcW7XtpJOSXO3W34shfN+r1GTMtoed3362f0aQyY5I8RI8u6qfL+veqONnleJ1UQEtRNGtPeZZgwmzLZsTHTfpXD7LMWf/xo8AipbvcD8nPYThmYXKhmYXjy3KVrs/3RM/ijej184K4j/UXny46+qQ+Y6oBpleBqHXe/EPt2Nj+KTBxY0Wqo7Ad/RMjwFpF6PrmEe2xK7P0H66XTe9udmbmn9n2cwmpoaSjIAt+rLyQr3Wha50UR3ujDsP98aCoFsbiTQyStjXb1x7cW/OK0uvxpY7Tn+0dp+On1VjNy61Ch4sj/0gHB1rXjHOolOqpjYpnvxy8sOB9UjsIASBh3o+SyFp/x8A6XzTL6wAwRrOudRadubLqB78Hg2SrJ9I2uPtaoH1EcdjcQM+JdxkLhMe63mW3Z5ww5w+p7hYOvy2581gykv4qFK9eIAHdkQLqjvqbBGdqOVK8Mi+JrfUFOJzmdWvDQjN0RycW7KYu553ceu3a/feewtGsID+1Ao4cC4aya2lCE3wC75nux0aembnYKT3jqSC5jBpICI7ozbpXKQ15gdnYs4HBb9xyAxmyvBiS8V5HAnEe3Fb0zUTJ4PbOSF6K2YzNitdiksAeJD+pY1n6sYtV21Ga5zIe9yjUtxK4ASvHYRMQPZnQ0O8So5NESytTBgurOJakpWcyIrQkWMGHj9bNd5/AhHJqHx4upbcMX5/MwiO/PhLguelfOOU/wYQ3kGYYGFl9Iz4jZA8xm8PGrqHsvSfZvBUuUQAAY/tFIzRg1ePf2VOVlhM6eilnL7ZAZ5p8kSaum3utJOa+5815qrbbjGjBUliwld9R3f0rHx/EH4+medFZp/amvLh2+qDL7j1XAMEuop9nGkJ1dAKVvo7x5uSpyleEwVAM8aTsJeIovCWFOaKbDpyablieq5Q1n+cthlGHTuwoiEGm9VMR9jnHcVmkg6H9Fx7Zq+2przJCqL+p1+Fqn0naK4Lm0aURTyNdYYpQ7Xq0lNyb3Xacph9nfs4wNCxSHbey6zm0; S:IK/oEn5xeCdzBaEGGSmk+GSr/PLcqYSb1MN6SFqzel50PRHpFk3lTV8N7Pp648iy+c5Mc1gnW6DJNmbtzh9h/+hyFe6YL6HUu9jAsh7FrDxtZz5tX1C3YBhPIai1kxcExw/jxlgf/HkBJKykw6A8kgD1EyqSp/P8uPrXHdjb798=; N:23CPPyBkUhJkNkK9Ok8+lXAWfXaSEih8/fAxarZdmNXUvzJ89pCLZc452U8XtBGMaMTVplO74FE//askIMqA/bFooA1HymMBwBU5/GILWCcttNhQsodnQZQt4bbW8a1ZMQvsonmwhheHO7pG8tilpBfqdGw+r+7wev1pQGvRRvE=; NS:rKN46/cDICvgMKcAWPxtdhNAVzMVG6LnvXkvbMZgNYv8zvImWHHHaUMfqhEwIk4BBWfz4MUoKq6WiJa7dss7E2uveOn2EjlrFOY881KwXuLQuRFLNhmpNxTEALSSJFEzuQkHJNtNkrB71j8PJlAtKDh3RokOw9doB67YcYjWruY=");
};


})();
