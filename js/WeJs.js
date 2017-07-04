/**
 * Created by billge on 2017/6/14.
 */
//JS 模拟$(document).ready()
;(function (root, d) {
    "use strict";
    //兼容无痕模式
    var isPrivateMode;
    try {
        localStorage.setItem('isPrivateMode', '1');
        localStorage.removeItem('isPrivateMode');
        isPrivateMode = false;
    } catch(e) {
        isPrivateMode = true;
    }

    function in_array(needle, haystack) {
        if(typeof needle === 'string' || typeof needle === 'number') {
            for(var i in haystack) {
                if(haystack[i] === needle) {
                    return i;
                }
            }
        }
        return -1;
    }

    function array_delete(needle, haystack){
        haystack.splice(in_array(needle, haystack), 1);
        return haystack;
    }

    function isNone(o){
        return 'undefined' === type(o);
    }

    function isFn(fn) {
        return 'function' === type(fn);
    }

    function isObj(o) {
        return 'object' === type(o);
    }

    function isArr(a) {
        return 'array' === type(a);
    }

    function isString(s) {
        return 'string' === type(s);
    }

    function type(obj) {
        var o = {};
        return o.toString.call(obj).replace(/\[object (\w+)\]/, '$1').toLowerCase();
    }

    function isIE(){
        return (window.ActiveXObject || "ActiveXObject" in window);
    }

    function clone(obj){
        var copy;
        if (null === obj || "object" != typeof obj) return obj;
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }
        if (obj instanceof Array) {
            copy = [];
            for (var i=0, len = obj.length; i < len; ++i) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
            }
            return copy;
        }
        return obj;
    }

    function getLocal(src) {
        return isPrivateMode ? null : (localStorage[src] ? JSON.parse(localStorage[src]) : null);
    }

    function getValue(value, defaults) {
        defaults = isNone(defaults) ? value : defaults;
        if (!value || !isString(value)){
            return defaults;
        } else if (value.indexOf('$') === 0){
            return eval('root.' + value.substring(1));
        } else {
            return value;
        }
    }

    var importObj = function(name){
        this.name = name;
        this.from = function(js){
            var ret = WeJs.require(js);
            if (this.name === '*' || this.name === js){
                return ret;
            }
            if (!isObj(ret)){
                throw new Error(js+'['+type(ret)+'] has no element named '+this.name);
            }
            if (isArr(this.name) && isObj(ret)){
                var exports = {};
                for (var i in this.name){
                    exports[this.name[i]] = ret[this.name[i]];
                }
                return exports;
            }
            return ret[this.name];
        }
    };

    var ExportObj = function(src, ret){
        var self = this;
        this.name = src;
        this.exports = {};
        this.defines = 0;
        ret && (this.__tmp = ret);
        this.requires = function(lists, callback){
            self.defines++;
            WeJs.requires(lists, function(){
                callback.apply(this, arguments);
                self.defines--;
                if (self.defines === 0){
                    WeJs.modules[self.name].loaded = true;
                    WeJs.run(self.name);
                }
            });
        };
    };

    if (isNone(root.WeJs)){
        var WeJs = {
            version : '0.9.3',
            jsRoot: '',domains: [],runList: [],modules: {},exports: {},events: {},
            lists: [],files: {},hashs: {},alert: true,
            init: function(configs){
                this.files = configs.files;
                var domains = configs.path;
                this.domains = isArr(domains) ? domains : [domains];
                this.jsRoot = isArr(domains) ? domains[0] : domains;
                this.hashs = configs.hashs ? configs.hashs : {};
            },
            ready: function(callback){
                if (this.lists.length === 0){
                    callback.call(this);
                } else {
                    this.bind('onload', callback);
                }
            },
            checkDomain: function(url){
                for (var i in this.domains){
                    var domain = this.domains[i];
                    if (url.indexOf(domain) === 0){
                        return true;
                    }
                }
                return false;
            },
            getPath: function(src){
                var path = this.files[src];
                if (!path || isNone(path[0])){
                    path = this.jsRoot + src;
                    if (!isNone(this.hashs[src])){
                        path += ('.'+this.hashs[src]);
                    }
                    path += '.js';
                }
                if (isArr(path)){
                    this.exports[src] = this.setExport(src, path[1]);
                    return path[0];
                } else {
                    return path;
                }
            },
            getJs: function(url){
                if (!this.checkDomain(url)){
                    console.warn('跨域请求请使用requires方法:'+url);
                    return false;
                }
                var xmlHttp = new XMLHttpRequest();
                try {
                    xmlHttp.open("GET",url,false);
                    if (getLocal(url)){
                        xmlHttp.setRequestHeader('If-Modified-Since', getLocal(url).Last);
                        xmlHttp.setRequestHeader('If-None-Match', getLocal(url).ETag);
                        xmlHttp.setRequestHeader('Accept', "*/*");
                    }
                    xmlHttp.send();
                } catch (e){
                    if (this.alert && isIE()){
                        this.alert = false;
                        alert('请IE用户设置 工具—>internet选项—>安全—>自定义级别—>其他 栏里面—>启用 跨域访问数据源—>启用，否者无法正常使用页面，请谅解');
                    }
                    throw new Error(e);
                }
                if (xmlHttp.status === 200){
                    if (!isPrivateMode){
                        localStorage[url] = JSON.stringify({
                            ETag: xmlHttp.getResponseHeader('ETag'),
                            Last: xmlHttp.getResponseHeader('Last-Modified'),
                            text: xmlHttp.responseText
                        });
                    }
                    return xmlHttp.responseText;
                } else if (xmlHttp.status === 304){
                    return getLocal(url).text;
                } else {
                    throw new Error(xmlHttp.status+':'+url);
                }
            },
            bind: function(event, callback){
                if (!this.events[event]){
                    this.events[event] = [];
                }
                this.events[event].push(callback);
            },
            trigger: function(event){
                if (this.events[event] && this.events[event].length > 0){
                    var callbacks = this.events[event];
                    this.events[event] = [];
                    for (var i in callbacks){
                        callbacks[i].apply(this, arguments);
                    }
                }
            },
            setExport: function(src, ret){
                return new ExportObj(src, ret);
            },
            getExport: function(src){
                if (!this.exports[src]){
                    return null;
                }
                var exports = this.exports[src];
                if (exports.__tmp){
                    eval("exports.exports = " + exports.__tmp);
                    exports.__tmp = undefined;
                }
                return clone(exports.exports);
            },
            run: function(src){
                var runs = [];
                var news = [];
                for (var i in this.lists){
                    var require = this.lists[i];
                    if (require['waited'].length > 0 && in_array(src, require['waited']) === -1){
                        news.push(require);
                        continue;
                    }
                    require['waited'].length > 0 && (require['waited'] = array_delete(src, require['waited']));
                    if (require['waited'].length === 0){
                        var exports = [];
                        var end = true;
                        for (var e in require['lists']){
                            var list = require['lists'][e];
                            if (this.exports[list].defines > 0){
                                end = false;
                                break;
                            }
                            exports.push(this.getExport(list));
                        }
                        if (!end){
                            news.push(require);
                            continue;
                        }
                        runs.push({callback:require['callback'], exports: exports});
                    } else {
                        news.push(require);
                    }
                }
                this.lists = news;
                for (var j in runs){
                    runs[j].callback.apply(this, runs[j].exports);
                }
                if (this.lists.length === 0){
                    this.trigger('onload');
                }
            },
            imports: function(name){
                return new importObj(name);
            },
            require: function(src){
                var module = this.modules[src];
                var path = this.getPath(src);
                if (!path){
                    return;
                }
                if (!module){
                    this.modules[src] = {loaded: false};
                    if (!this.exports[src]){
                        this.exports[src] = this.setExport(src);
                    }
                    var hm = d.createElement("script");
                    var text = this.getJs(path);
                    if (!text){
                        throw new Error(src + ' get no script text');
                    }
                    hm.id = 'javascript-'+src;
                    hm.setAttribute('data-src', src);
                    hm.text = text;
                    var s = d.getElementsByTagName("script")[0];
                    s.parentNode.insertBefore(hm, s);

                    this.modules[src].loaded = true;
                    this.exports[src].defines === 0 && this.run(src);

                } else if (module.loaded === false){
                    console.warn(src, ' has been loading, cannot require again');
                }
                return this.getExport(src);
            },
            extend : function(superCtor, ctor){
                if (!isFn(superCtor)){
                    return clone(superCtor);
                }
                if (!isFn(ctor)){
                    ctor = function(){superCtor.apply(this, arguments)};
                }
                ctor.prototype = new superCtor();
                return ctor;
            },
            requires: function (lists, callback) {
                callback = isFn(callback) ? callback : function(){};
                lists = isArr(lists) ? lists : [lists];
                var self = this;
                var waited = [];
                for (var i in lists){
                    var src = lists[i];
                    var module = this.modules[src];
                    var path = this.getPath(src);
                    if (!path){
                        return;
                    }
                    if (!module) {
                        this.modules[src] = {loaded: false};
                        if (!this.exports[src]){
                            this.exports[src] = this.setExport(src);
                        }
                        var hm = d.createElement("script");
                        hm.type = 'text/javascript';
                        hm.id = 'javascript-'+src;
                        hm.setAttribute('data-src', src);
                        hm.src = path;
                        hm.onload = hm.onreadystatechange = function(){
                            if(!this.readyState || this.readyState === "loaded" || this.readyState === "complete") {
                                this.onload = this.onreadystatechange = null;
                                var src = this.getAttribute('data-src');
                                self.modules[src].loaded = true;
                                self.run(src);
                            }
                        };
                        hm.onerror=function(){
                            var src = this.getAttribute('data-src');
                            console.log(src+': load error');
                            self.modules[src].loaded = true;
                            self.run(src);
                        };
                        var s = d.getElementsByTagName("script")[0];
                        s.parentNode.insertBefore(hm, s);
                        waited.push(src);
                    } else if (module.loaded === false){
                        waited.push(src);
                    }
                }
                if (waited.length > 0){
                    this.lists.push({lists:lists, waited:waited, callback:callback});
                } else {
                    var exports = [];
                    for (var e in lists){
                        exports.push(this.getExport(lists[e]));
                    }
                    callback.apply(this, exports);
                }
            }
        };

        root.WeJs = WeJs;
        root.require = function(){
            return WeJs.require.apply(WeJs, arguments);
        };
        root.requires = function(){
            return WeJs.requires.apply(WeJs, arguments);
        };
        root.imports = function(){
            return WeJs.imports.apply(WeJs, arguments);
        };
    }

    // 预初始化
    var current = document.scripts[document.scripts.length - 1];
    var path = getValue(current.getAttribute('path'), '/');
    var files = getValue(current.getAttribute('files'), {});
    var hashs = getValue(current.getAttribute('hashs'), {});
    var preload = getValue(current.getAttribute('preload'));
    root.WeJs.init({path:path, files: files, hashs: hashs});
    if (preload){
        preload = preload.split(',');
        root.requires(preload);
    }
})(this, document);


