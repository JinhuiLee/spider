var http = require("http")
var cheerio = require("cheerio")
var fs = require("fs")
var helper = require("./helper.js");

//保存最终的数据
function saveData(path, news) {
    fs.writeFile(path, JSON.stringify(news, null, 4), function(err) {
        if (err) {
            return console.log(err);
        }
        console.log('Data saved');
    });
}

news = []
//获取数据
var getData = function(res) {
    var html = "";
    res.setEncoding("utf-8");
    res.on("data", (chunk) => {
        html += chunk;
    });
    res.on("end", function() {
        var $ = cheerio.load(html);
        $('#info-list-ul li').each(function(index, item) {

            var news_item = {}
            news_item = {
                title: $('.info-title', item).text(),                         // 获取新闻标题
                provider: "",                                                 // 获取供稿单位
                time: $('.time', item).text(),                                // 获取新闻时间
                link: 'http://www.ss.pku.edu.cn' + $('a', this).attr('href'), // 获取新闻详情页链接i
                pics: '',                                                     // 获取图片
                content: ''                                                   // 获取内容
            };
            helper.getPics('http://www.ss.pku.edu.cn' + $('a', this).attr('href'), news, news_item);
        });
        //有下一页时继续搜索
        if ($("a[title=下页]").attr("href")) {
            var url = $("a[title=下页]").attr("href");
            url = "http://www.ss.pku.edu.cn" + url;
            console.log(url);
            http.get(url, getData);
        } else {
            saveData("data/data.txt", news);
        }

    });
};


http.get("http://www.ss.pku.edu.cn/index.php/newscenter/news", getData).on("error", function(err) {
    console.log(err);
});
