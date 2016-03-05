var http = require("http")
var cheerio = require("cheerio")
var fs = require("fs")
var trim = require("trim")
var md5 = require("md5")
var sanitize = require('validator').sanitize
//保存内容
function saveContent(path, content) {
    fs.appendFile(path, content, function(err) {
        if (err) {
            return console.log(err);
        }
    });
}

//读取数据，反序列化
function readData(path) {
    fs.appendFile(path, (err, data) => {
        if (err) console.log(err);
        var data = JSON.parse(data);
        iterate_data(data);
        return data;
    });
};


var filter = function(before)
{
    var after=before;
    after = after.replace(/<br>/g, "\r\n  ");
    after = after.replace(/[&nbsp]+;/g, " ");
    after = after.replace(/&[\w]+;/g, "");
    after = after.replace(/<[^>]+>/g,"");
    return after;
}


//获取新闻内容
var getContent = function(html, filename) {
    var $ = cheerio.load(html,{decodeEntities: false});
    var ps = $("div.article-content");
    content = ""
    //按<p>查找
    var threshold = 40;
    ps.find("p").each(function(index, item) {
        if (ps.text().length>threshold)
        {
          before = $(item).not("[style]").html();
          if (before)
          {
            var after = filter(before);
            content += after + "\r\n  ";
          }
        }
    });
    //按<td>查找
    if (content.length < 10) {
        ps.find("td").each(function(index, item) {
          if (ps.text().length>threshold)
          {
            before = $(item).not("[style]").html();
            if (before)
            {
              var after = filter(before);
              content += after + "\r\n  ";
            }
          }
        });
    }
    //直接输出 $("div.article-content").text()
    if (content.length < 10) {
        content = filter(ps.html());
    }
    //保存新闻内容
    saveContent(filename, content);

};

//获取供稿单位
var getProvider = function(html, news_item) {
    var $ = cheerio.load(html);
    return $("a[title=供稿]").text().trim();
};


//获取图片
var getPics = function(url, news, news_item) {
    http.get(encodeURI(url), function(res) {
        res.setEncoding("utf-8");
        var html = "";
        res.on("data", function(chunk) {
            html += chunk;
        });
        res.on("end", function() {
            var $ = cheerio.load(html);
            var ps = $("div.article-content");
            var pics = []
            news_item.pics = pics;
            news_item.provider = getProvider(html);
            ps.find("img").each(function(index, item) {

                text = []
                //直接获取
                text.push($(item).text().trim());
                //父节点的文字
                text.push($(item).parent().not("ul").text().trim());
                //父节点的下一个节点文字
                text.push($(item).parent().next().not("ul").text().trim());
                //祖父节点的下一个节点文字
                text.push($(item).parent().parent().next().not("ul").text().trim());
                //曾祖父节点的下一个节点文字
                text.push($(item).parent().parent().parent().next().not("ul").text().trim());

                var candidate = "NO TITLE"
                //作为图片title的字数门槛
                var threshold = 40;
                for (var i in text)
                {
                    if (text[i].length < threshold && text[i]!= "")
                    {
                      candidate=text[i];
                      break;
                    }
                }


                //当前图片对象，由link和title描述
                obj = {
                    link: "",
                    title: ""
                };
                obj.title = candidate;
                obj.link = 'http://www.ss.pku.edu.cn' + $(item).attr("src");
                pics.push(obj);
            });
            //md5生成独特的文件名存储新闻内容
            var filename = md5(encodeURI(url));
            news_item.content = "./data/content/" + filename + ".txt";
            news.push(news_item);

            getContent(html, news_item.content);
        });
    }).on("error", function(err) {
        console.log(err);
    });
};
//************单元测试**************
//*********************************
var news = [];
var news_item;
news_item = {
    pics: []
}
getPics("http://www.ss.pku.edu.cn/index.php/newscenter/news/2373", news, news_item);
//*********************************
//************单元测试**************



function iterate_data(data) {
    for (var i in data) {
        //if (i>5) break;
        console.log(data[i].link);
        getContent(data[i].link);
        getPic(data[i].link);
    }
}

module.exports.getProvider = getProvider;
module.exports.getPics = getPics;
module.exports.getContent = getContent;
