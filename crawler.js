const fs = require('fs');
const url = require('url');
const http = require('http');
const cheerio = require('cheerio');
const DOWNLOAD_DIR = './downloads/';

fs.existsSync(DOWNLOAD_DIR) || fs.mkdirSync(DOWNLOAD_DIR, 0755);

const httpGet = function($url) {
	console.log('\033[33mGET ' + $url + '\033[m\n');
	
	http.get($url, function(res) {
		var html = '';
		// 获取页面数据
		res.on('data', function(data) {
		    html += data;
		});
		// 数据获取结束
		res.on('end', function() {
		    // 通过过滤页面信息获取实际需求的轮播图信息
		    if(res.statusCode == 302) {
		    	httpGet((/^https?:\/\//.test(res.headers.location) ? '' : 'http://') + res.headers.location);
		    } else {
		    	filterSlideList(html);
		    }
		});
	}).on('error', function() {
		console.log('获取数据出错！');
	});
};

httpGet('http://www.ziroom.com/');

function download_file(file_url, complete) {
	if(file_url.indexOf('//') == 0) file_url = 'http:' + file_url;
	
	var file_name = url.parse(file_url).pathname.split('/').pop();
	var file = fs.createWriteStream(DOWNLOAD_DIR + file_name);
	
	http.get(file_url, function(res) {
		res.on('data', function(data) {
		    file.write(data);
		});
		res.on('end', function() {  
		    file.end();
		    console.log(file_name + ' downloaded to ' + DOWNLOAD_DIR);
		    complete(DOWNLOAD_DIR + file_name);
		});
		res.on('res', function() {
			console.log("try download file " + file_name);
		});
	});
};

/* 过滤页面信息 */
function filterSlideList(html) {
    if (html) {
        // 沿用JQuery风格，定义$
        var $ = cheerio.load(html);
        // 根据id获取轮播图列表信息
        var slideList = $('#foucsSlideList').find('li');
        // 轮播图数据
        var slideListData = [];
        var i = 0;

		var eachSlideList = function(pic) {
            // 找到a标签并获取href属性
            var pic_href = pic.find('a').attr('href');
            // 找到a标签的子标签img并获取_src
            var pic_src = pic.find('a').children('img').attr('_src');
            // 找到a标签的子标签img并获取alt
            var pic_message = pic.find('a').children('img').attr('alt');
            
            if(i) console.log('========================================================================\n');
            console.log('\033[32m第 ' + (i+1) + ' 轮播图\033[m');
            console.log(pic_message);
            console.log(pic_href);
            console.log(pic_src);
            console.log('\033[30m------------------------------------------------------------------------\033[m');
            
            download_file(pic_src, function(file_url) {
		        if(++i < slideList.length) {
		        	eachSlideList(slideList.eq(i));
		        }
		    });
        }
        
        /* 轮播图列表信息遍历 */
        if(slideList.length) {
        	eachSlideList(slideList.eq(0));
        } else {
        	console.log('无列表数据');
        }
    } else {
        console.log('无数据传入！');
    }
}

