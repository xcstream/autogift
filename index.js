var bc = require('bilibili-danmu-channel')
var config = require('./config.json')
var fetch = require('node-fetch')
const nav = 'https://api.bilibili.com/x/web-interface/nav'
const danmuchannel = require('bilibili-danmu-channel')(config.roomid);
var diff = 0;
var debug = false;
var pretime = config.pretime ;
Date.prototype.Format = function(format){
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(), //day
        "h+" : this.getHours(), //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
        "q+" : Math.floor((this.getMonth()+3)/3), //quarter
        "S" : this.getMilliseconds() //millisecond
    }

    if(/(y+)/i.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    }

    for(var k in o) {
        if(new RegExp("("+ k +")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length));
        }
    }
    return format;
}

async function roominfo2(id) {
    return new Promise(function (resolve) {
        fetch(`https://api.live.bilibili.com/room/v1/Room/room_init?id=${id}`).then(function (rx) {
            rx.json().then(
                function (r) {
                    resolve(r)
                }
            )
        })
    })
}

function puts(x){
    var d = new Date().Format('yyyy-MM-dd hh:mm:ss.S')
    console.log(`[${d}] ${x}`)
}
async function sendg(diff){
    puts('打算送吃瓜数:'+diff)
    if(!config.sendgift){
        puts('设置中赠送吃瓜转态关闭')
        return
    }

    if(diff > config.maxgift){
        puts(`超过赠送最大值${config.maxgift}`)
        return
    }

    puts('开始赠送！！')
    
    var rnd = new Date().getTime()
    
    var body = `uid=${global.uid}&gift_id=20004&ruid=${global.upid}&send_ruid=0&gift_num=${diff}&coin_type=gold&bag_id=0&platform=pc&biz_code=live&biz_id=${global.roomid}&rnd=${rnd}&storm_beat_id=0&metadata=&price=0&csrf_token=${config.headers.bili_jct}&csrf=${config.headers.bili_jct}&visit_id=`
    var r = await (await fetch("https://api.live.bilibili.com/gift/v2/Live/send", {
    "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "content-type": "application/x-www-form-urlencoded",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        "cookie":`SESSDATA=${config.headers.SESSDATA}; bili_jct=${config.headers.bili_jct};`
    },
    "referrer": `https://live.bilibili.com/${global.roomid}`,
    "referrerPolicy": "no-referrer-when-downgrade",
    "body":body,
    "method": "POST",
    "mode": "cors"
    })).json();
}

console.log('===============================');
(async ()=>{
    let userinfo = await (await fetch(nav, 
    {
        method:'get',
        "headers":{
            "accept":"application/json, text/javascript, */*; q=0.01",
            "accept-language":"zh-CN,zh;q=0.9",
            "content-type":"application/x-www-form-urlencoded; charset=UTF-8",
            "sec-fetch-dest":"empty",
            "sec-fetch-mode":"cors",
            "sec-fetch-site":"same-site",
            "cookie":`SESSDATA=${config.headers.SESSDATA}; bili_jct=${config.headers.bili_jct};`
        },

    })).json()

    let result = await roominfo2(config.roomid)

    if(result.code != 0){
        console.log('信息获取失败')
    }

    global.roomid = result.data.room_id
    global.upid = result.data.uid
    global.uid = userinfo.data.mid

    console.log('bilibili直播自动pk送礼物（开始pk之前运行才有效）')
    console.log('登录用户:',userinfo.data.uname,userinfo.data.mid)
    console.log('当前设置：')
    console.log(`直播间: ${ global.roomid} (${ config.roomid}) 主播uid:${global.upid}`)
    console.log('送礼物:', config.sendgift?'是':'否')
    console.log('送礼最大数量:', config.maxgift)
    console.log('提前量(ms):',pretime)
    console.log('======================')

    while(1){
        let msg = await danmuchannel.output()
        if( msg.cmd.indexOf('PK_')==0){
            if(debug){
                console.log(msg)
            }
        }
        if (msg.cmd=='PK_BATTLE_SETTLE_USER'){
            puts('pk结束')
            if(msg.data.winner){
                puts('胜利者：'+msg.data.winner.uname)
                puts('得分：'+msg.data.result_info.pk_votes)
            }
            puts('==========================')
        }
        if( msg.cmd == 'PK_BATTLE_PRE_NEW'){
            puts('准备pk 对方:'+msg.data.uname)
            diff = 0
        }

        if( msg.cmd == 'PK_BATTLE_START_NEW'){
            var ts  = (msg.data.pk_end_time - msg.data.pk_start_time)*1000 - 10000
            var tout = ts-pretime
            puts(`开始pk ${tout}ms后送礼物`)
            setTimeout(function(){
                puts('自动礼物时间')
                if(diff>=0){
                    sendg(diff+1)
                }else{
                    puts(`当时已经领先(${-diff})，无需送`)
                }
            },tout)
        }

        if( msg.cmd == 'PK_BATTLE_PROCESS_NEW'){
            var my =  0 
            var target = 0
            if(msg.data.match_info.room_id == global.roomid){
                my =  msg.data.match_info.votes 
                target =  msg.data.init_info.votes 
            }else
            if(msg.data.init_info.room_id == global.roomid){
                my =  msg.data.init_info.votes 
                target = msg.data.match_info.votes  
            }else{
                console.log('err')
            }


            diff = target - my 
            var text = ''
            if(diff>0){
                text = ' 落后 '+diff
            } 
            if(diff<0){
                text = ' 领先 '+ (-diff)
            }
            if(diff==0){
                text = ' 平局 '
            }
            puts('分数更新 '+my+':'+target+text )
        }
    }
})()