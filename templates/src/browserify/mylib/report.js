'use strict';

var $ = window.Zepto || window.$;
var mqq = window.mqq;

var report = {};

module.exports = report;

// 复用群动态
var APPID = {
    badjs: 283,
    mm: 1000215,
    tdw: 'dc00141'
};


var UIN = parseInt((document.cookie.match(/\Wuin=o(\d+)/) || [0, 0])[1]);
var GCODE = (window.location.search.match(/[?&]gc=(\d+)[^?&]?/) || [])[1];
var SRC = (window.location.search.match(/[?&]src=(\d+)[^?&]?/) || [])[1];
var ROLE;
var VERSION = mqq && (function() {
    return ((mqq.android && 'android') || (mqq.iOS && 'ios') || 'unknown') + (mqq.QQVersion || window.navigator.userAgent);
})() || 'unknown';
var RELEASE = 'GRP_GUIDE';

/**
* badjs上报
* @param message
* @param filename
# @param lineno
*/
report.badjs = function(message, filename, lineno) {
    // 去掉query参数，避免泄漏敏感信息
    filename || (filename = '');
    lineno || (lineno = 0);
    
    var i = filename.indexOf('?');

    ~i && (filename = filename.substring(0, i));

    message = encodeURIComponent(message);
    filename = encodeURIComponent(filename);

    // 为了定位zepto报错，上报当前页面路径
    var location = encodeURIComponent(window.location.pathname);

    new Image().src = 'http://badjs.qq.com/cgi-bin/js_report?bid=' + APPID.badjs + '&level=4&msg=' + [message, filename, lineno, VERSION, location].join('|_|');
};

window.onerror = function(message, filename, lineno) {
    // 兼容乱七八糟的情况
    if('[object Event]' === Object.prototype.toString.call(message)) {
        filename = message.filename;
        lineno = message.lineno;
        message = message.message;
    }
    // for debug
    // alert(JSON.stringify({msg: message, file: filename, lineno: lineno}));
    report.badjs(message, filename, lineno);
};

/**
 * 上报Performance timing数据
 *
 * @param f1   flag1简写，测速系统中的业务ID
 * @param f2   flag2简写，测速的站点ID
 * @param f3   flag3简写，测速的页面ID
 */
report.performance = function(f1, f2, f3) {
    var perf = (window.webkitPerformance ? window.webkitPerformance : window.performance),
        reportPoints = ['navigationStart', 'unloadEventStart', 'unloadEventEnd', 'redirectStart', 'redirectEnd', 'fetchStart', 'domainLookupStart', 'domainLookupEnd', 'connectStart', 'connectEnd', 'requestStart', 'responseStart', 'responseEnd', 'domLoading', 'domInteractive', 'domContentLoadedEventStart', 'domContentLoadedEventEnd', 'domComplete', 'loadEventStart', 'loadEventEnd'],
        timing,
        l,
        i;
    if (perf && (timing = perf.timing)) {
        if (!timing.domContentLoadedEventStart) {
            // 早期的performance规范属性
            reportPoints.splice(15, 2, 'domContentLoadedStart', 'domContentLoadedEnd');
        }

        var timingArray = [];

        for (i = 0, l = reportPoints.length; i < l; i++) {
            timingArray[i] = timing[reportPoints[i]];
        }

        this.isd(f1, f2, f3, timingArray);
    }
};

/**
 * ISD 上报
 * @param f1
 * @param f2
 * @param f3
 * @param timing
 */
report.isd = function(f1, f2, f3, timing) {
    // 兼容timing是object的情况
    if('[object Object]' === Object.prototype.toString.call(timing)) {
        var reportData = Object.keys(timing).reduce(function(prev, i) {
            return prev + '&' + i + '=' + timing[i];
        }, '');

        var url = 'http://isdspeed.qq.com/cgi-bin/r.cgi?' + 'flag1=' + f1 + '&flag2=' + f2 + '&flag3=' + f3 + reportData;

        new Image().src = url;

        return;
    }

    var reportData = [],
        point,
        startPoint = timing[0],
        i,
        l;

    i = 1;
    l = timing.length;

    for (; i < l; i++) {
        point = timing[i];
        point = (point ? (point - startPoint) : 0);

        // 如果某个时间点花费时间为0，则此时间点数据不上报
        if (point > 0) {
            // 标记位从1开始 为的是忽略掉 navigationStart的时间点
            reportData.push(i + '=' + point);
        }
    }
    reportData.push('t=' + Date.now());
    var url = 'http://isdspeed.qq.com/cgi-bin/r.cgi?' + 'flag1=' + f1 + '&flag2=' + f2 + '&flag3=' + f3 + '&' + reportData.join('&');

    new Image().src = url;
};

/**
 * @param {string} cgi cgi路径, 不携带参数, 例如: https://openmobile.qq.com/oauth2.0/m_sdkauthorize
 * @param {string} retcode 返回码, 透传cgi的retcode
 * @param {string} tmcost cgi耗时, 在请求cgi前打"请求时间戳"t1, 执行callback时马上打"响应时间戳"t2
 *                          此处传入t2-t1的值, 单位为ms
 * @param {object} extra 扩展参数对象
 */
report.mm = function(cgi, retcode, tmcost, extra) {
    var paramObj = {
        appid : APPID.mm,
        touin : UIN,
        releaseversion : RELEASE,
        frequency : 1
    };

    // 处理上报项
    paramObj.commandid = cgi;
    paramObj.resultcode = retcode;
    paramObj.tmcost = tmcost;
    if(extra) {
        for(var i in extra) {
            if(extra.hasOwnProperty(i)) {
                paramObj[i] = extra[i];
            }
        }
    }

    if(retcode == 0) {
        // 成功的上报采样为1/20
        // frequency为采样分母
        paramObj.frequency = 20;
        var ranNum = Math.floor(Math.random() * 100 + 1);
        if(ranNum > 5) return;
    } else {
        paramObj.frequency = 1;
    }

    var paramArr = [];
    for(var j in paramObj) {
        if(paramObj.hasOwnProperty(j)) {
            paramArr.push( j + '=' + encodeURIComponent( paramObj[j] ) );
        }
    }
    paramArr.push('t=' + Date.now());
    var url = 'http://wspeed.qq.com/w.cgi?' + paramArr.join('&');
    new Image().src = url;
};

report.monitor = function(id) {
    (new Image()).src = 'http://cgi.connect.qq.com/report/report_vm?monitors=[' + id + ']';
};

report.tdw = function(fields, data) {
    if(Object.prototype.toString.call(data) !== '[object Array]') throw Error('The param "data" required and must be an array.');

    // 保证data是二维数组
    (Object.prototype.toString.call(data[0]) === '[object Array]') || (data = [data]);

    if(typeof ROLE !== 'undefined' && !~fields.indexOf('ver2')) {
        fields.unshift('ver2');
        data.forEach(function(item) {
            item.unshift(ROLE);
        });
    }

    if(typeof SRC !== 'undefined' && !~fields.indexOf('ver1')) {
        fields.unshift('ver1');
        data.forEach(function(item) {
            item.unshift(SRC);
        });
    }

    // 此处统一填版本号，举例ios4.7或android4.7或PC5.3
    if(!~fields.indexOf('obj2')) {
        fields.unshift('obj2');
        data.forEach(function(item) {
            item.unshift(VERSION);
        });
    }
    // 此处统一填群号
    if(GCODE && !~fields.indexOf('obj1')) {
        fields.unshift('obj1');
        data.forEach(function(item) {
            item.unshift(GCODE);
        });
    }
    // 此处统一添加module
    if(!~fields.indexOf('module')) {
        fields.unshift('module');
        data.forEach(function(item) {
            item.unshift('owner');
        });
    }
    // 此处统一添加opername
    if(!~fields.indexOf('opername')) {
        fields.unshift('opername');
        data.forEach(function(item) {
            item.unshift('pushmsg');
        });
    }
    // 此处统一添加ts
    if(!~fields.indexOf('ts')) {
        fields.unshift('ts');
        data.forEach(function(item) {
            item.unshift(Date.now());
        });
    }
    // 此处统一添加uin
    if(UIN && !~fields.indexOf('uin')) {
        fields.unshift('uin');
        data.forEach(function(item) {
            item.unshift(UIN);
        });
    }
    // 加时间戳，确保不会被缓存
    // 实践发现fields不能encodeURIComponent
    var url = 'http://cgi.connect.qq.com/report/tdw/report?table=' + APPID.tdw + '&fields=' + JSON.stringify(fields) + '&datas=' + encodeURIComponent(JSON.stringify(data)) + '&t=' + Date.now();

    new Image().src = url;
};

/*
从dom触发tdw上报
 */
report.triggerTdw = function() {
    var str = this && (this.dataset && this.dataset.tdw || $(this).data('tdw'));
    if(!str) return;
    str = str.split('|');
    report.tdw(str[0].split(','), str[1].split(','));
};

report.tdwAction = function(action) {
    report.tdw(['action'], [action]);
};

report.setSrc = function(src) {
    SRC = src;
};
report.setRole = function(role) {
    ROLE = role;
};

// 执行一些上报
(function init() {
    // H5上报
    // var f3 = Number(document.body.dataset.flag);
    // f3 && (window.onload = function() {
    //     setTimeout(function() {
    //         report.performance(7832, 43, f3);
    //     }, 500);
    // });
    
    // 上报PV
    // var pv = document.body.dataset && document.body.dataset.pv || $(document.body).data('pv');
    // pv && report.tdw(['action'], [pv]);
    // 处理点击类的tdw上报
    // data-tdw="action,obj1|Clk_head,<%=item.gc%>"
    // $('#main').on('tap', '[data-tdw]', report.triggerTdw);
})();