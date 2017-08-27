/**
 * Created by billge on 2017/6/14.
 */
;(function (root, document) {
    "use strict";
    //JS 模拟$(document).ready()
    (function () {
        if (document.onReady){
            return;
        }
        var ie = !!(window.attachEvent && !window.opera);
        var wk = /webkit\/(\d+)/i.test(navigator.userAgent) && (RegExp.$1 < 525);
        var fn = [];
        var run = function () { for (var i = 0; i < fn.length; i++) fn[i](); };
        document.onReady = function (f) {
            if (!ie && !wk && document.addEventListener)
                return document.addEventListener('DOMContentLoaded', f, false);
            if (fn.push(f) > 1) return;
            if (ie)
                (function () {
                    try { document.documentElement.doScroll('left'); run(); }
                    catch (err) { //noinspection JSAnnotator
                        setTimeout(arguments.callee, 0); }
                })();
            else if (wk)
                var t = setInterval(function () {
                    if (/^(loaded|complete)$/.test(document.readyState))
                        clearInterval(t), run();
                }, 0);
        };
    })();

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
        this.name = src;
        this.exports = {};
        ret && (this.__tmp = ret);
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
            alias: {}, hashs: {},runList: [],lists:[],
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
                if (isArr(configs.async)){
                    for (var i=0,url; url = configs.async[i++];){
                        this.load(url, false);
                    }
                }
                return this;
            },
            ready: function(callback){
                var script = getCurrentScript();
                this.bind('onload', callback);
                this.preload(script.text ? script.text : callback);
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
            exec: function (src) {
                var module = this.modules[src];
                if (module.status === status.defined && isFn(module.factory)){
                    module.status = status.executing;
                    module.factory.call(module.extend ? inherit(this.require(module.extend)) : this, WeJs.exports[src]);
                    module.status = status.executed;
                }
            },
            loaded: function(){
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
            },
            run: function(src){
                var runs = [];
                var news = [];
                if (this.lists.length === 0){
                    return;
                }
                for (var i=0,require; require = this.lists[i++];){
                    if (require['waited'].length > 0 && in_array(src, require['waited']) === -1){
                        news.push(require);
                        continue;
                    }
                    require['waited'].length > 0 && (require['waited'] = array_delete(src, require['waited']));
                    if (require['waited'].length === 0){
                        var exports = [];
                        var end = true;
                        for (var e=0,list; list = require['lists'][e++];){
                            var deps = this.modules[list].deps;
                            for (var j=0, d; d= deps[j++];){
                                if (isNone(this.modules[d]) || this.modules[d].status < status.loaded){
                                    end = false;
                                    break;
                                }
                            }
                            if (!end){
                                news.push(require);
                                break;
                            }
                            this.exec(list);
                            exports.push(this.getExport(list));
                        }
                        if (!end){
                            continue;
                        }
                        runs.push({callback:require['callback'], exports: exports});
                    } else {
                        news.push(require);
                    }
                }
                this.lists = news;
                for (i in runs){
                    runs[i].callback.apply(this, runs[i].exports);
                }
            },
            define: function (callback) {
                var module = arguments.length > 1 ? arguments[1] : null;
                var script = getCurrentScript();
                if (!script){throw new Error('no script loading')}
                var src = script.getAttribute('data-src');
                if (!src || isNone(this.modules[src])){throw new Error('script src error')}
                this.preload(callback, src);
                this.modules[src].status = status.defined;
                this.modules[src].factory = callback;
                if (module){
                    this.modules[src].extend = module;
                    this.modules[src].deps.push(this.analyse(module));
                }
            },
            preload: function (cb, src) {
                var text = cb;
                if (isFn(cb)){
                    text = cb.toString();
                }
                if(text.indexOf('require') === -1 && text.indexOf('import') === -1) {
                    return;
                }
                var i,list,deps=[],p;
                var lists = text.match(/([\s=;(){}:+\-*/,]|^)require\(\s*['"][\w_./:#?=&]+['"]\s*\)/g);
                if (lists){
                    for (i = 0; list = lists[i++];){
                        p = list.split(/['"]/)[1];
                        this.load(p);
                        deps.push(this.analyse(p));
                    }
                }
                lists = text.match(/([\s=;(){}:+\-*/,]|^)import\([^)]+\)\.from\(\s*['"][\w_./:#?=&]+['"]\s*\)/g);
                if (lists){
                    for (i = 0; list = lists[i++];){
                        var t = list.match(/\.from\(\s*['"][\w_./:#?=&]+['"]\s*\)/);
                        p = t.match(/['"]/)[1];
                        this.load(p);
                        deps.push(this.analyse(p));
                    }
                }
                if (src && !isNone(this.modules[src])){
                    for (i=0,d; d= deps[i++];){
                        if (in_array(d, this.modules[src].deps) === -1){
                            this.modules[src].deps.push(d);
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
                this.exec(src);
                return this.getExport(src);
            },
            requires: function (lists, callback) {
                callback = isFn(callback) ? callback : function(){};
                lists = isArr(lists) ? lists : [lists];
                var waited = [];
                var newList = [];
                for (var i=0,src; src = lists[i++];){
                    src = this.analyse(src);
                    newList.push(src);
                    isNone(this.modules[src]) && this.load(src);
                    var module = this.modules[src];
                    if (module.status < status.loaded){
                        waited.push(src);
                    } else {
                        var deps = module.deps, end=true;
                        for (var j=0,d; d=deps[j++];){
                            if (this.modules[d].status < status.loaded){
                                end=false;
                                waited.push(src);
                                break;
                            }
                        }
                        end && this.exec(src);
                    }
                }
                lists = newList;
                if (waited.length > 0){
                    this.lists.push({lists:lists, waited:waited, callback:callback});
                } else {
                    var exports = [];
                    for (var e=0,list; list = newList[e++];){
                        exports.push(this.getExport(list));
                    }
                    callback.apply(this, exports);
                }
            },
            load: function (src, async) {
                isNone(async) && (async = true);
                src = this.analyse(src);
                var self = this;
                var module = this.modules[src];
                if (!module){
                    async && (this.modules[src] = {status: status.loading, factory: null, extend: null, deps: []});
                    var path = async  ? this.getPath(src) : src;
                    var hm = document.createElement("script");
                    hm.type = 'text/javascript';
                    hm.id = 'javascript-'+src;
                    hm.setAttribute('data-src', src);
                    hm.setAttribute('data-async', (async ? "true" : ""));
                    hm.src = path;
                    hm.onload = hm.onreadystatechange = function(){
                        if(!this.readyState || this.readyState === "loaded" || this.readyState === "complete") {
                            this.onload = this.onreadystatechange = null;
                            var src = this.getAttribute('data-src');
                            var async = this.getAttribute('data-async');
                            hm.parentNode && hm.parentNode.removeChild(hm);
                            if (async){
                                self.modules[src].status === status.loading && (self.modules[src].status = status.loaded);
                                self.loaded();
                                self.run(src);
                            }
                        }
                    };
                    hm.onerror=function(){
                        var src = this.getAttribute('data-src');
                        console.error(src+': load error');
                        var async = this.getAttribute('data-async');
                        hm.parentNode && hm.parentNode.removeChild(hm);
                        if (async) {
                            self.modules[src].status = status.error;
                            self.loaded();
                            self.run(src);
                        }
                    };
                    var s = document.getElementsByTagName("script")[0];
                    s.parentNode.insertBefore(hm, s);
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
    var async = getValue(current.getAttribute('data-async'), []);
    var preload = getValue(current.getAttribute('data-preload'));
    var main = getValue(current.getAttribute('data-main'));
    root.WeJs.init({path:path, alias: alias, hashs: hashs, async: async});
    if (preload){
        isString(preload) && (preload = preload.split(','));
        for (var i=0,p;p=preload[i++];){
            WeJs.load(p)
        }
    }
    main && WeJs.requires(main);
    document.onReady(function () {
        for (var i=0, script; script = document.scripts[i++];){
            script.text && WeJs.preload(script.text);
        }
    });
})(this, document);


