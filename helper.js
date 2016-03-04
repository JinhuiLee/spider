var http = require("http")
var cheerio = require("cheerio")
var fs = require("fs")
var trim = require("trim")
var md5 = require("md5")


function saveContent(path, content) {
    fs.appendFile(path, content, function(err) {
        if (err) {
            return console.log(err);
        }
    });
}


function readData(path) {
    fs.appendFile(path, (err, data) => {
        if (err) console.log(err);
        var data = JSON.parse(data);
        //console.log(data);
        iterate_data(data);
        return data;
    });
};




var getContent = function(html, filename) {
    var $ = cheerio.load(html);
    var ps = $("div.article-content");
    content = ""
    ps.find("p").each(function(index, item) {
        content += $(item).not("[style]").text();
        content += "\r\n";
    });
    //console.log(content);
    if (content.length < 10) {
        ps.find("td").each(function(index, item) {
            content += $(item).not("[style]").text();
            content += "\r\n";
        });
    }

    if (content.length < 10) {

        content = ps.text();

    }
    saveContent(filename, content);

};


var getProvider = function(html, news_item) {
    var $ = cheerio.load(html);
    return $("a[title=供稿]").text().trim();
};



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
                //console.log("Image");
                //console.log("http://www.ss.pku.edu.cn"+$(item).attr("src"));
                var candidate1, candidate2;
                text0 = $(item).text().trim();
                text1 = $(item).parent().parent().next().not("ul").text().trim();
                text2 = $(item).parent().next().not("ul").text().trim();
                var candidate = ""

                if (text0.length < 35 && text0 != "") {
                    candidate = text1;
                } else if (text1.length < 35 && text1 != "") {
                    candidate = text1;
                } else if (text2.length < 35 && text2 != "") {
                    candidate = text2;
                } else {
                    candidate = "No title"
                }



                obj = {
                    link: "",
                    title: ""
                };
                obj.title = candidate;
                obj.link = 'http://www.ss.pku.edu.cn' + $(item).attr("src");
                pics.push(obj);
            });

            var filename = md5(encodeURI(url));
            news_item.content = "./content/" + filename + ".txt";
            news.push(news_item);
            //console.log(news);
            getContent(html, news_item.content);
        });
    }).on("error", function(err) {
        console.log(err);
    });
};

var news = [];
var news_item;
news_item = {
    pics: []
}
getPics("http://www.ss.pku.edu.cn/index.php/newscenter/news/2373-%E5%BC%95%E9%A2%86%E5%8F%98%E9%9D%A9%E6%97%B6%E4%BB%A3-%E8%81%9A%E7%84%A6%E5%8C%97%E4%BA%AC%E5%A4%A7%E5%AD%A62016%E8%BD%AF%E5%BE%AE%E5%88%9B%E6%96%B0%E5%88%9B%E4%B8%9A%E6%96%B0%E5%B9%B4%E8%AE%BA%E5%9D%9B", news, news_item);



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