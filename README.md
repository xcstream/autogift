# 安装

1 安装最新的ndoejs https://nodejs.org/

2 下载代码 git clone https://github.com/xcstream/autogift

3 命令行cd 到代码位置 运行npm install

# 配置

复制一份config.json.example ,命名为config.json

        {
            "headers":{
                "SESSDATA":"**********************************",
                "bili_jct":"*******************************"
            },
            "roomid":428,
            "maxgift":1,
            "pretime":500,
            "sendgift":true
        }

个人cookie信息：

打开浏览器，进入任意直播间

F12，控制台 Application->左边Storage-Cookies-https://live.bilibili.com/  
右边找到 SESSDATA  bili_jct 对应的值填上


roomid 送礼物的直播间号

maxgift 最大送吃瓜数量

pretime 提前量毫秒数量

sendgift  true送礼 false不送礼仅测试

保存后双击 运行.bat 开始 （windows)  
或者命令行进入目录 输入node index回车