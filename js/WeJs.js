/**
 * Created by billge on 2017/6/14.
 */
;(function (root, d) {
    "use strict";
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

    function inherit(superCtor) {
        if (!isFn(superCtor)){
            return clone(superCtor);
        }
        var ctor = function(){superCtor.apply(this, arguments)};
        ctor.prototype = new superCtor();
        return ctor;
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
                for (var i=0,name; name=this.name[i++];){
                    exports[name] = ret[name];
                }
                return exports;
            }
            return ret[this.name];
        }
    };

    var ExportObj = function(src, ret){
        // var self = this;
        this.name = src;
        this.exports = {};
        // this.defines = 0;
        ret && (this.__tmp = ret);
        // this.requires = function(lists, callback){
        //     self.defines++;
        //     WeJs.requires(lists, function(){
        //         callback.apply(this, arguments);
        //         self.defines--;
        //         if (self.defines === 0){
        //             WeJs.modules[self.name].loaded = true;
        //             WeJs.run(self.name);
        //         }
        //     });
        // };
    };

    var currentScript;
    var getCurrentScript = function () {
        if(document.currentScript){
            return document.currentScript;
        }
        if (currentScript && currentScript.readyState === 'interactive') {
            return currentScript;
        }
        currentScript = null;
        var scripts = document.getElementsByTagName('script');
        for (var i = 0, script; script = scripts[i++];) {
            if (script.tagName === 'SCRIPT' && script.readyState === 'interactive') {
                currentScript = script;
                return currentScript;
            }
        }
        return currentScript;
    };

    var status = {loading: 0, loaded: 4, defined: 7, executing: 8,executed: 9, error: 99};

    if (isNone(root.WeJs)){
        var WeJs = {
            version : '0.10.1',
            jsHost: '', jsRoot: '', modules: {},exports: {},events: {},
            alias: {}, hashs: {},
            init: function(configs){
                this.alias = configs.alias;
                // 分析url
                var a = document.createElement('a');
                a.href = configs.path;
                this.jsHost = a.hostname;
                this.jsRoot = a.pathname;
                // a.parentNode.removeChild(a);
                for (var uri in configs.hashs){
                    isString(uri) && (this.hashs[this.analyse(uri)] = configs.hashs[uri]);
                }
                return this;
            },
            ready: function(callback){
                this.bind('onload', callback);
                this.preload(callback);
                this.run();
            },
            analyse: function (src) {
                var exp = null;
                if (!isNone(this.alias[src])){
                    src = this.alias[src];
                }
                // 参数返回
                if (isArr(src)){
                    exp = src[1];
                    src = src[0];
                }
                if (!/^(http[s]?:)?\/\//.test(src) && src.substring(0, 2) !== './' && src.substring(0, 1) !== '/'){
                    src = '//' + this.jsHost + this.jsRoot + src;
                }
                var a = document.createElement('a');
                a.href = src;
                src = a.href;
                // a.parentNode.removeChild(a);
                isNone(this.exports[src]) && (this.exports[src] = this.setExport(src, exp));
                return src;
            },
            getPath: function(src){
                if (!isNone(this.hashs[src])){
                    src += ('.'+this.hashs[src]);
                }
                if (/\.js(\?|#)?/.test(src)){
                    path = src;
                } else {
                    path = src + '.js';
                }
                return path;
            },
            // getJs: function(url){
            //     if (!this.checkDomain(url)){
            //         console.warn('跨域请求请使用requires方法:'+url);
            //     }
            //     var xmlHttp = new XMLHttpRequest();
            //     try {
            //         xmlHttp.open("GET",url,false);
            //         if (getLocal(url) && getLocal(url).Last && getLocal(url).ETag){
            //             xmlHttp.setRequestHeader('If-Modified-Since', getLocal(url).Last);
            //             xmlHttp.setRequestHeader('If-None-Match', getLocal(url).ETag);
            //             xmlHttp.setRequestHeader('Accept', "*/*");
            //         }
            //         xmlHttp.send();
            //     } catch (e){
            //         if (this.alert && isIE()){
            //             this.alert = false;
            //             alert('请IE用户设置 工具—>internet选项—>安全—>自定义级别—>其他 栏里面—>启用 跨域访问数据源—>启用，否者无法正常使用页面，请谅解');
            //         }
            //         throw new Error(e);
            //     }
            //     if (xmlHttp.status === 200){
            //         if (!isPrivateMode){
            //             localStorage[url] = JSON.stringify({
            //                 ETag: xmlHttp.getResponseHeader('ETag'),
            //                 Last: xmlHttp.getResponseHeader('Last-Modified'),
            //                 text: xmlHttp.responseText
            //             });
            //         }
            //         return xmlHttp.responseText;
            //     } else if (xmlHttp.status === 304){
            //         return getLocal(url).text;
            //     } else {
            //         throw new Error(xmlHttp.status+':'+url);
            //     }
            // },
            bind: function(event, callback){
                if (!this.events[event]){
                    this.events[event] = [];
                }
                this.events[event].push(callback);
            },
            trigger: function(event, avgs){
                if (this.events[event] && this.events[event].length > 0){
                    var callbacks = this.events[event];
                    this.events[event] = [];
                    for (var i in callbacks){
                        callbacks[i].apply(this, avgs);
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
            run: function(){
                var ready = true;
                for (var src in this.modules){
                    var module = this.modules[src];
                    if (module.status < status.loaded){
                        ready = false;
                    }
                }
                if (ready){
                    this.trigger('onload');
                }
                // var runs = [];
                // var news = [];
                // if (this.lists.length === 0){
                //     return;
                // }
                // for (var i=0,require; require = this.lists[i++];){
                //     if (require['waited'].length > 0 && in_array(src, require['waited']) === -1){
                //         news.push(require);
                //         continue;
                //     }
                //     require['waited'].length > 0 && (require['waited'] = array_delete(src, require['waited']));
                //     if (require['waited'].length === 0){
                //         var exports = [];
                //         var end = true;
                //         for (var e=0,list; list = require['lists'][e++];){
                //             if (this.exports[list].defines > 0){
                //                 end = false;
                //                 break;
                //             }
                //             exports.push(this.getExport(list));
                //         }
                //         if (!end){
                //             news.push(require);
                //             continue;
                //         }
                //         runs.push({callback:require['callback'], exports: exports});
                //     } else {
                //         news.push(require);
                //     }
                // }
                // this.lists = news;
                // for (var j in runs){
                //     runs[j].callback.apply(this, runs[j].exports);
                // }
                // if (this.lists.length === 0){
                //     this.trigger('onload', this.preloads);
                // }
            },
            define: function (callback) {
                var module = arguments.length > 1 ? arguments[1] : null;
                var script = getCurrentScript();
                if (!script){throw new Error('no script loading')}
                var src = script.getAttribute('data-src');
                if (!src || isNone(this.modules[src])){throw new Error('script src error')}
                this.preload(callback);
                this.modules[src].status = status.defined;
                this.modules[src].factory = callback;
                this.modules[src].extend = module;
            },
            preload: function (cb) {
                if (isFn(cb)){
                    var text = cb.toString();
                    if(text.indexOf('require') === -1 && text.indexOf('import') === -1) {
                        return;
                    }
                    var i,list;
                    var lists = text.match(/([^\S]|^)require\(\s*['"][\w_./:#?=&]+['"]\s*\)/g);
                    if (lists){
                        for (i = 0; list = lists[i++];){
                            this.load(list.split(/['"]/)[1]);
                        }
                    }
                    lists = text.match(/([^\S]|^)import\([^)]+\)\.from\(\s*['"][\w_./:#?=&]+['"]\s*\)/g);
                    if (lists){
                        for (i = 0; list = lists[i++];){
                            var t = list.match(/\.from\(\s*['"][\w_./:#?=&]+['"]\s*\)/);
                            this.load(t.match(/['"]/)[1]);
                        }
                    }
                }
            },
            imports: function(name){
                return new importObj(name);
            },
            extend : function(src){
                if (isNone(this.modules[src])){
                    this.load(src);
                }
                var self = this;
                var extendObj = function () {
                    this.define = function (callback) {
                        self.define(callback, src);
                    };
                };
                return new extendObj();
            },
            require: function(src){
                src = this.analyse(src);
                var module = this.modules[src];
                if (!module || module.status < status.loaded){
                    return null;
                }
                if (module.status === status.defined && isFn(module.factory)){
                    module.status = status.executing;
                    module.factory.call(module.extend ? inherit(this.require(module.extend)) : this, WeJs.exports[src]);
                    module.status = status.executed;
                }
                return this.getExport(src);
            },
            load: function (src) {
                src = this.analyse(src);
                var self = this;
                var module = this.modules[src];
                if (!module){
                    this.modules[src] = {status: status.loading, factory: null, extend: null};
                    var path = this.getPath(src);
                    var hm = d.createElement("script");
                    hm.type = 'text/javascript';
                    hm.id = 'javascript-'+src;
                    hm.setAttribute('data-src', src);
                    hm.src = path;
                    hm.onload = hm.onreadystatechange = function(){
                        if(!this.readyState || this.readyState === "loaded" || this.readyState === "complete") {
                            this.onload = this.onreadystatechange = null;
                            var src = this.getAttribute('data-src');
                            self.modules[src].status === status.loading && (self.modules[src].status = status.loaded);
                            hm.parentNode.removeChild(hm);
                            self.run();
                        }
                    };
                    hm.onerror=function(){
                        var src = this.getAttribute('data-src');
                        console.log(src+': load error');
                        self.modules[src].status = status.error;
                        hm.parentNode.removeChild(hm);
                        self.run();
                    };
                    var s = d.getElementsByTagName("script")[0];
                    s.parentNode.insertBefore(hm, s);
                }
            }
        };

        root.WeJs = WeJs;
        root.require = function(){
            return WeJs.require.apply(WeJs, arguments);
        };
        root.imports = function(){
            return WeJs.imports.apply(WeJs, arguments);
        };
        root.define = function(){
            return WeJs.define.apply(WeJs, arguments);
        };
        root.extend = function(){
            return WeJs.extend.apply(WeJs, arguments);
        };
    }

    // 预初始化
    var current = document.scripts[document.scripts.length - 1];
    var path = getValue(current.getAttribute('data-path'), '/');
    var alias = getValue(current.getAttribute('data-alias'), {});
    var hashs = getValue(current.getAttribute('data-hashs'), {});
    var main = getValue(current.getAttribute('data-main'));
    root.WeJs.init({path:path, alias: alias, hashs: hashs});
    if (main){
        WeJs.load(main);
        WeJs.ready(function () {
            WeJs.require(main)
        });
    }
})(this, document);


