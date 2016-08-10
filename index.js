"use strict";

const Weixinbot = require('weixinbot');
const qrcode = require('qrcode-terminal');
const xml2json = require('xml2json');
const fs = require('fs');
const spawn = require('child_process').spawn;

const bot = new Weixinbot({ receiver: 'waynejwliang@gmail.com' });

var articles = __dirname + '/../redis-articles/README.md';
global.prevMsg = '';

bot.on('qrcode', (qrcodeUrl) => {
  console.log(qrcodeUrl);
  qrcode.generate(qrcodeUrl.replace('/qrcode/','/l/'),console.log);

});

bot.on('group', function(msg) {
  if((msg.Group.OwnerUin == 133734160) || (msg.Group.OwnerUin ==822035620)){
    if(msg.MsgType == 49 && msg.AppMsgType == 5 &&  global.prevMsg == '每日分享'){
      var content = formatMsgContent(msg.Content);
      if(content.msg && content.msg.appmsg && content.msg.appmsg.title && content.msg.appmsg.url){
        var line = "\n\n* "+getDay()+"  ["+content.msg.appmsg.title+"]("+content.msg.appmsg.url+")";
        console.log(line);
        fs.readFile(articles,'utf-8', function (err, data) {
          if (err) throw err;
          var urlRegExp = new RegExp(content.msg.appmsg.url);
          var titleRegExp = new RegExp(content.msg.appmsg.title);
          if(!(urlRegExp.test(data) || titleRegExp.test(data))){
            fs.appendFile(articles, line, function (err) {
              if (err) throw err;
              require('simple-git')(__dirname + '/../redis-articles')
                  .add('./*')
                  .commit(content.msg.appmsg.title)
                  .push('origin', 'master',function (err) {
                    if (err) throw err;
                    bot.sendText(msg.FromUserName, 'repo已同步~ https://github.com/tao12345666333/redis-articles ');
                    console.log('--------push-----------')
                  });
            });

          }
        });
      }
    }else if(msg.MsgType == 1){
      global.prevMsg = msg.Content;
    }else{
      global.prevMsg = '';
    }
  }

});

bot.run();

function formatMsgContent(content){
  return JSON.parse(xml2json.toJson((content.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/<br\/>/g,''))));
};
function getDay() {
  var d=new Date();
  var day=d.getDate() < 10 ? ('0'+ d.getDate()) : d.getDate();
  var month=(d.getMonth() + 1) < 10 ? ('0'+ (d.getMonth() + 1)) : (d.getMonth() + 1);
  var year=d.getFullYear();
  return year + '-' +  month + '-' + day;
}

