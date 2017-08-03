/**
 * Created by billge on 2017/7/3.
 */
;(function(root, factory) {
    if (typeof module !== 'undefined' && module.exports) {// CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {// AMD / RequireJS
        define(factory);
    } else if (typeof define === 'function' && WeJs !== 'undefined') {// WeJs
        define(function (module) {
            module.exports = factory();
        });
    } else {
        root.betterPPT = factory.call(root);
    }
}(this, function() {
    'use strict';

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

    function type(obj) {
        var o = {};
        return o.toString.call(obj).replace(/\[object (\w+)\]/, '$1').toLowerCase();
    }

    var memoryDatas = [];

    var pfx = ( function() {
        var style = document.createElement( "dummy" ).style,
            prefixes = "Webkit Moz O ms Khtml".split( " " ),
            memory = {};
        return function( prop ) {
            if ( typeof memory[ prop ] === "undefined" ) {
                var ucProp  = prop.charAt( 0 ).toUpperCase() + prop.substr( 1 ),
                    props   = ( prop + " " + prefixes.join( ucProp + " " ) + ucProp ).split( " " );
                memory[ prop ] = null;
                for ( var i in props ) {
                    if ( style[ props[ i ] ] !== undefined ) {
                        memory[ prop ] = props[ i ];
                        break;
                    }
                }
            }
            return memory[ prop ];
        };
    } )();
    NodeList.prototype.toArray = function () {
        return [].slice.call(this);
    };
    NodeList.prototype.filter = function (filter) {
        switch (filter){
            case 'visible':
                var nodes = [];
                this.forEach(function (node) {
                    var style = window.getComputedStyle(node);
                    if (style.visibility === 'visible'){
                        nodes.push(node);
                    }
                });
                return nodes;
        }
        return this;
    };

    Element.prototype.setData = function (datas) {
        var k = this.getAttribute('__keyData__');
        var data = memoryDatas[k];
        if (k === null || !data){
            var key = memoryDatas.length;
            this.setAttribute('__keyData__', key);
            memoryDatas.push(datas);
        } else {
            for (var i in datas){
                data[i] = datas[i];
            }
            memoryDatas[k] = data;
        }
        return this;
    };
    Element.prototype.getData = function (key) {
        var k = this.getAttribute('__keyData__');
        var data = memoryDatas[k];
        return data ? data[key] : undefined;
    };

    Node.prototype.addClass = function (c) {
        this.classList.add(c);
        return this;
    };
    Node.prototype.removeClass = function (c) {
        this.classList.remove(c);
        return this;
    };
    Node.prototype.remove = function () {
        this.parentNode.removeChild(this);
        return this;
    };
    Node.prototype.is = function (context) {
        return query(context).index(this) >= 0;
    };
    Node.prototype.parent = function (context) {
        var dom = this;
        while (!dom.is(context)){
            dom = dom.parentNode;
            if (dom === null){
                return null;
            }
        }
        return dom;
    };
    Node.prototype.css = function( props ) {
        var key, pkey;
        for ( key in props ) {
            if ( props.hasOwnProperty( key ) ) {
                pkey = pfx( key );
                if ( pkey !== null ) {
                    this.style[ pkey ] = props[ key ];
                }
            }
        }
        return this;
    };
    Node.prototype.on = function (event, fn) {
        if (event === 'mousewheel' && window.navigator.userAgent.indexOf('Firefox')!==-1){
            event = 'DOMMouseScroll';
        }
        var events = this.getData(event);
        if (!events){
            events = [];
        }
        events.push(fn);
        var data = {};
        data[event] = events;
        this.setData(data);
        this.addEventListener(event, fn, false);
        return this;
    };
    Node.prototype.off = function (event) {
        if (event === 'mousewheel' && window.navigator.userAgent.indexOf('Firefox')!==-1){
            event = 'DOMMouseScroll';
        }
        var events = this.getData(event);
        if (!events){
            return this;
        }
        for (var i=0,fn; fn = events[i++];){
            this.removeEventListener(event, fn);
        }
        var data = {};
        data[event] = [];
        this.setData(data);
        return this;
    };
    var winEvent = [];
    window.resize = function (fn) {
        winEvent.push(fn);
        window.addEventListener('resize', fn, false);
    };
    window.unResize = function () {
        for (var i = 0, fn; fn = winEvent[i++];){
            window.removeEventListener('resize', fn);
        }
        winEvent = [];
    };
    ['on', 'off', 'addClass', 'removeClass', 'css', 'remove'].forEach(function (value,index,array) {
        NodeList.prototype[value] = function () {
            var args = arguments;
            this.forEach(function (node) {
                node[value].apply(node, args);
            });
            return this;
        }
    });

    NodeList.prototype.index = function (elem) {
        return this.toArray().indexOf(elem);
    };

    var filter = function( selector, context ) {
        context = context || document;
        return context.querySelector( selector );
    };

    var query = function( selector, context, filter) {
        isNone(filter) && (filter = false);
        context = context || document;
        var nodes = context.querySelectorAll( selector );
        if (nodes && filter){
            return nodes.filter(filter);
        }
        return nodes;
    };

    var DoToastTimer;
    function toast(txt){
        clearTimeout(DoToastTimer);
        if (!filter("#showToasts")){
            var div = document.createElement('div');
            div.classList = "showToasts";
            div.id = "showToasts";
            document.body.appendChild(div);
        }
        var obj = filter("#showToasts");
        obj.innerText = txt;
        obj.style.display = 'inline-block';
        DoToastTimer = setTimeout(function(){
            obj.innerText = "";
            obj.style.display = 'none';
        },2000);
    }

    function bindOverView(ppt) {
        function focusSection(n) {
            var section = ppt.sections[n];
            ppt.sections.removeClass('active');
            section.addClass('active');
            ppt.sections.forEach(function (value, i) {
                ppt.resize(i, false);
            });
        }

        query('section', ppt.obj).on('mouseenter', function (event) {
            ppt.current = ppt.sections.index(this);
            focusSection(ppt.current);
        }).on('click', function (event) {
            ppt.current = ppt.sections.index(this);
            focusSection(ppt.current);
            ppt.review();
        });
        document.body.on('keyup', function (event) {
            if (event.keyCode >= 37 && event.keyCode <= 40 || event.keyCode === 27 || event.keyCode === 13) {
                switch (event.keyCode) {
                    case 13: // Enter
                    case 27: // ESC
                        ppt.review();
                        break;
                    case 37: // Left
                        var prev = ppt.getPrev();
                        if (prev === false) {
                            return;
                        }
                        ppt.current = prev;
                        focusSection(ppt.current);
                        break;
                    case 39: // Right
                        var next = ppt.getNext();
                        if (next === false) {
                            return;
                        }
                        ppt.current = next;
                        focusSection(ppt.current);
                        break;
                    case 38: // Up
                    case 40: // Down
                        break;
                }
                event.preventDefault();
                return false;
            }
        });
    }

    function unbindOverView(ppt) {
        query('section', ppt.obj).off('mouseenter').off('click');
        document.body.off('keyup');
    }

    function bindResize(ppt){
        window.resize(function(){
            ppt.resize();
        });
    }

    function unbindResize() {
        window.unResize();
    }

    function transform(obj, data, transition) {
        typeof transition === 'undefined' && (transition = false);
        var d = obj.getData('transform');
        d = d || {};
        d = Object.assign(d, data);
        obj.setData({transform: d});
        transition && obj.addClass('transition') || obj.removeClass('transition');
        var x=d.x||0, y=d.y||0, z=d.z||0,
            scale=typeof d.scale==='undefined'?'1':d.scale,
            rX=d.rotateX||0,rY=d.rotateY||0,rZ=d.rotateZ||0;
        obj.css({'transform': 'translate3d('+x+'px, '+y+'px, '+z+'px) scale('+scale+') rotateX('+rX+'deg) rotateY('+rY+'deg) rotateZ('+rZ+'deg)'});
    }

    var betterPPT = function(obj){
        if(!(this instanceof betterPPT)) return new betterPPT(obj);

        this.obj = filter(obj);
        this.sections = query('section', this.obj);
        this.click = true;
        this.circle = false;
        this.anchor = true;
        this.showImg = true;
        this.current = 0;
        this.steps = [];
        this.last = null;
        this.oView = false;
        this.x = 0;
        this.y = 0;
        this.config = function (config) {
            config = config || {};
            var n = config.current || this.gethash();
            typeof config.circle === 'undefined' || (this.circle = config.circle);
            typeof config.click === 'undefined' || (this.click = config.click);
            typeof config.anchor === 'undefined' || (this.anchor = config.anchor);
            typeof config.showImg === 'undefined' || (this.showImg = config.showImg);
            if (n > this.sections.length){
                this.current = 0;
            } else {
                this.current = n;
            }
            return this;
        };
        this.init = function(){
            // check support
            var body = document.body;
            var supported = ( pfx( "perspective" ) !== null ) &&
                // Browser should support `classList` and `dataset` APIs
                ( body.classList ) && ( body.dataset );
            if (!supported){
                filter('.betterPPT-unsupported').style.display = 'block';
                this.obj.remove();
                return;
            }
            var self = this;
            this.sections.forEach(function (section, i) {
                var steps = {indexs:[0], steps:{}, init: [], current:0} ;
                query('[step]', section).forEach(function (step) {
                    var index = parseInt(step.getAttribute('step'));
                    if (index === 0){
                        steps.init.push(step);
                    } else {
                        if (in_array(index, steps.indexs) === -1){
                            steps.indexs.push(index);
                            steps['steps'][index] = [];
                        }
                        steps['steps'][index].push(step);
                    }
                });
                steps.indexs.sort();
                self.steps.push(steps);
            });
            this.show('first');
            this.bindCheck();
            bindResize(this);
            if (this.showImg){
                query('section img[src]').on('click', function () {
                    if (!self.oView){
                        var images = [], index= query('img', this.parent('section'), 'visible').indexOf(this);
                        query('img', this.parent('section'), 'visible').forEach(function (img) {
                            images.push(img.getAttribute('src'));
                        });
                        showImages({url:images,index:index});
                    }
                });
            }
            return this;
        };
        this.reload = function(n){
            // TODO
        };
        this.sethash = function (n) {
            if (this.anchor){
                n = n || this.current;
                history.replaceState(null,'','#'+n);
            }
        };
        this.gethash = function () {
            return location.hash ? parseInt(location.hash.substring(1)) : 0;
        };
        this.overview = function(){
            if (this.oView){
                return;
            } else {
                this.oView = true;
            }
            var self = this;
            this.x = this.y = 0;
            transform(this.obj, {x:0,y:0}, false);
            this.sections.forEach(function (section, i) {
                self.resize(i);
            });
            this.obj.addClass('overview');
            //奇怪的逻辑 不用settimeout 过度就有问题
            setTimeout(function () {
                self.sections.forEach(function (section, i) {
                    transform(section, {rotateY: 50}, true);
                });
                transform(self.obj, {scale: 0.6}, true);
            },10);
            this.unbindCheck();
            unbindResize(this);
            bindOverView(this);
        };
        this.review = function () {
            if (!this.oView){
                return;
            } else {
                this.oView = false;
            }
            this.obj.removeClass('overview');
            this.sections.forEach(function (section, i) {
                transform(section, {rotateY: 0}, true);
            });
            transform(this.obj, {scale: 1}, true);
            this.sections[this.current].css('z-index', this.sections.length+100);
            unbindOverView(this);
            var self = this;
            setTimeout(function () {
                self.bindCheck();
                bindResize(self);
            }, 10);
            this.sethash();
        };
        this.getPrev = function () {
            var prev;
            if (this.current === 0){
                if (this.circle){
                    prev = this.sections.length-1;
                } else {
                    // 已经是首页了
                    if (!this.oView){
                        toast('已经是第一页了');
                    }
                    return false;
                }
            } else {
                prev = this.current-1;
            }
            return prev;
        };
        this.getNext = function () {
            var next;
            if (this.current === this.sections.length-1){
                if (this.circle){
                    next = 0;
                } else {
                    // 播放完毕
                    if (!this.oView) {
                        toast('已经是最后一页了');
                    }
                    return false;
                }
            } else {
                next = this.current+1;
            }
            return next;
        };
        this.step = function(){
            var step = this.steps[this.current];
            if (step.current >= step.indexs.length-1){
                this.next();
            } else {
                step.current++;
                this.showStep();
            }
            return this;
        };
        this.back = function(){
            this.hideStep();
            var step = this.steps[this.current];
            if (step.current === 0){
                this.prev();
            } else {
                step.current--;
            }
            return this;
        };
        this.prev = function(){
            this.last = this.current;
            var prev = this.getPrev();
            if (prev === false){
                return;
            }
            this.current = prev;
            this.show(false);
            return this;
        };
        this.next = function(){
            var next = this.getNext();
            if (next === false){
                return;
            }
            this.current = next;
            this.show();
            return this;
        };
        this.resize = function(n, css){
            typeof css === "undefined" && (css = true);
            typeof n === "undefined" && (n = this.current);
            var section = this.sections[n];
            var wh = window.innerHeight;
            var ww = window.innerWidth;
            var h = wh * 0.95;
            var w = ww * 0.95;
            w/h > 1.5 && (w = h * 1.5) || (h = w / 1.5);
            var y = -1*h/2 - this.y;
            var x = -1*w/2 - this.x + (n-this.current)*w/2;
            var size = h/20;
            var pt = h/30;
            var pl = w/30;
            if (css){
                section.css({width: w+'px', height: h+'px', 'font-size': size+'px', padding: pt+'px '+pl+'px', 'z-index':n});
                transform(section, {x:x,y:y}, false);
            } else {
                transform(section, {x:x,y:y}, true);
            }
        };
        this.show = function(next){
            next = typeof next === "undefined" ? true : next;
            this.sections.removeClass('active');
            var section = this.sections[this.current];
            var wh = window.innerHeight;
            var ww = window.innerWidth;
            var h = wh * 0.95;
            var w = ww * 0.95;
            w/h > 1.5 && (w = h * 1.5) || (h = w / 1.5);
            var size = h/20;
            var pt = h/30;
            var pl = w/30;
            section.css({width: w+'px', height: h+'px', 'font-size': size+'px', padding: pt+'px '+pl+'px'});
            var y = -1*h/2 - this.y;
            var x = -1*w/2 - this.x;
            var left = 0;
            var up = 0;

            var from = next !== 'first' ? section.getAttribute('from') : '';
            // 回退逻辑
            if (!next){
                from = this.sections[this.last].getAttribute('from');
                ww = -1*ww;
                wh = -1*wh;
                if (from === 'zoomin'){from='zoomout'}
                else if (from === 'zoomout'){from='zoomin'}
            }
            switch (from){
                case 'left':
                    transform(section, {x:x-ww,y:y}, false);
                    left = -ww;
                    break;
                case 'right':
                    transform(section, {x:x+ww,y:y}, false);
                    left = ww;
                    break;
                case 'top':
                    transform(section, {x:x,y:y-wh}, false);
                    up = -wh;
                    break;
                case 'bottom':
                    transform(section, {x:x,y:y+wh}, false);
                    up = wh;
                    break;
                case 'zoomin':
                    transform(section, {x:x,y:y,scale:0.2}, false);
                    setTimeout(function () {
                        transform(section, {scale:1}, true);
                    },10);
                    break;
                case 'zoomout':
                    transform(section, {x:x,y:y,scale:3}, false);
                    setTimeout(function () {
                        transform(section, {scale:1}, true);
                    },10);
                    break;
                default:
                    transform(section, {x:x,y:y}, false);
                    break;
            }
            if (in_array(from, ['left', 'right', 'top', 'bottom']) !== -1){
                this.x -= left;
                this.y -= up;
                transform(this.obj, {x:this.x,y:this.y}, true);
            }
            this.sections.css({'z-index': 0});
            section.addClass('active').css({'z-index': 9999});
            this.sethash();
            // init step
            var step = this.steps[this.current];
            if (step.current === 0){
                this.showStep(true);
            }
            return this;
        };
        this.showStep = function (init) {
            typeof init === "undefined" && (init = false);
            var step = this.steps[this.current];
            var steps;
            if (init){
                steps = step.init;
            } else {
                steps = step['steps'][step['indexs'][step.current]];
            }
            for (var i in steps){
                var obj = steps[i];
                obj.addClass('active');
                var action = obj.getAttribute('action');
                if (action){
                    action = eval(action);
                    action.call(obj, true);
                }
            }
            return this;
        };
        this.hideStep = function () {
            var step = this.steps[this.current];
            var steps = step.steps[step.indexs[step.current]];
            for (var i in steps){
                var obj = steps[i];
                obj.removeClass('active');
                var action = obj.getAttribute('action');
                if (action){
                    action = eval(action);
                    action.call(obj, false);
                }
            }
            return this;
        };
        this.bindCheck = function(){
            var self = this;
            if (this.click){
                document.body.on('click', function () {
                    self.step();
                });
            }
            // 键盘事件绑定
            document.body.on('keydown', function (event) {
                if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT'){
                    return true;
                }
                if (event.keyCode >= 37 && event.keyCode <= 40  || event.keyCode === 27) {
                    event.preventDefault(); return false;
                }
            }).on('keyup', function (event) {
                if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT'){
                    return true;
                }
                if (event.keyCode >= 37 && event.keyCode <= 40 || event.keyCode === 27) {
                    switch ( event.keyCode ) {
                        case 27: // ESC
                            self.overview();
                            break;
                        case 37: // Left
                            self.back();
                            break;
                        case 39: // Right
                            self.step();
                            break;
                        case 38: // Up
                            self.prev();
                            break;
                        case 40: // Down
                            self.next();
                            break;
                    }
                    event.preventDefault();
                    return false;
                }
            });
            return this;
        };
        this.unbindCheck = function() {
            document.body.off('click').off('keyup');
            return this;
        };

        var ppt = this;

        //图片展示
        document.ondragstart=function() {return false;}; // 阻止<img>在留浏览器中拖动打开新窗口
        var imageArr = [];
        var imageIndex = 0;
        var imageTop = 0;

        function showImages(options){
            filter("#showImageBox") && filter("#showImageBox").remove();
            var model = document.createElement('div');
            model.classList = "showImageBox";
            model.id = "showImageBox";
            model.innerHTML = '<span class="showImage-left" id="showImage-left"></span>'+
                '<span class="showImage-right" id="showImage-right"></span>'+
                '<span class="showImage-close" id="showImage-close">×</span>'+
                '<img src="" class="showImage" id="showImage" draggable="false">';
            document.body.appendChild(model);
            filter("#showImage-left").on('click', function(){
                changeImage('left');
            });
            filter("#showImage-right").on('click', function(){
                changeImage('right')
            });
            filter("#showImage-close").on('click', function(){
                hideImages();
            });
            document.getElementById("showImage").onerror = function (){
                this.src = "data:image/jpeg;base64,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";
            };
            options.scrollValue = 100;
            imageArr = options.url;
            imageIndex = options.index;
            filter("#showImageBox").style.display = 'block';
            changeImage();
            ppt.unbindCheck();
            document.body.on('keyup', function (event) {
                if (event.keyCode >= 37 && event.keyCode <= 40 || event.keyCode === 27) {
                    switch ( event.keyCode ) {
                        case 27: // ESC
                            hideImages();
                            break;
                        case 37: // Left
                            changeImage('left');
                            break;
                        case 39: // Right
                            changeImage('right');
                            break;
                        case 38: // Up
                        case 40: // Down
                            break;
                    }
                    event.preventDefault();
                    return false;
                }
            })
        }

        function hideImages(){
            document.body.off('keyup').off('mousewheel');
            filter("#showImageBox").style.display='none';
            setTimeout(function () {
                ppt.bindCheck();
            },10);
        }

        function changeImage(flag){
            if (flag === "left"){
                imageIndex --;
                if(imageIndex < 0){
                    imageIndex = 0;
                    toast("已是首张图片");
                    return;
                }
            } else if(flag === "right") {
                imageIndex ++;
                if (imageIndex > imageArr.length-1){
                    imageIndex = imageArr.length-1;
                    toast("没有更多图片");
                    return;
                }
            }
            var src = imageArr[imageIndex];
            filter("#showImage").setAttribute("src", src);
            filter("#showImage").removeAttribute("moveImg");
            filter("#showImage").onload = imageOnload;
        }

        function imageHeight() {
            if(filter("#showImage").offsetHeight > window.innerHeight){
                filter("#showImage").css({top: 0, "transform": "translate(-50%,0)"}).classList.add("moveImg");
                bindImageMove();
            }else{
                filter("#showImage").css({top: "50%", "transform": "translate(-50%,-50%)"}).classList.remove("moveImg");
                filter("img#showImage").off('mousedown').off('mousemove').off('mouseup').off('mouseleave');
            }
        }

        function imageOnload(){
            imageHeight();
            filter("#showImage").style.width = "auto";
            filter("#showImage").style.display = 'block';
            var imageZoom = 1;
            var imageWidth = filter("#showImage").offsetWidth;
            // 缩放
            document.body.off('mousewheel').on('mousewheel', function (event) {
                var orgEvent = event || window.event, delta, deltaX = 0, deltaY = 0;
                if ( 'detail'      in orgEvent ) { deltaY = orgEvent.detail * -1;      }
                if ( 'wheelDelta'  in orgEvent ) { deltaY = orgEvent.wheelDelta;       }
                if ( 'wheelDeltaY' in orgEvent ) { deltaY = orgEvent.wheelDeltaY;      }
                if ( 'wheelDeltaX' in orgEvent ) { deltaX = orgEvent.wheelDeltaX * -1; }
                // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
                if ( 'axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS ) {
                    deltaX = deltaY * -1;
                    deltaY = 0;
                }
                // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
                delta = deltaY === 0 ? deltaX : deltaY;
                // New school wheel delta (wheel event)
                if ( 'deltaY' in orgEvent ) {
                    deltaY = orgEvent.deltaY * -1;
                    delta  = deltaY;
                }
                if ( 'deltaX' in orgEvent ) {
                    deltaX = orgEvent.deltaX;
                    if ( deltaY === 0 ) { delta  = deltaX * -1; }
                }
                if(delta>0 && filter("#showImage").offsetWidth < window.innerWidth && imageZoom < 4){
                    imageZoom += 0.1;
                }else if(delta<0 && imageZoom > 0.2){
                    imageZoom -= 0.1;
                    imageZoom = imageZoom <= 0 ? 0 : imageZoom;
                }
                imageHeight();
                filter("#showImage").css({"width": imageZoom.toFixed(1)*imageWidth+"px"});
                toast(parseInt(imageZoom.toFixed(1)*100)+"%");
            });
        }

        function bindImageMove(){
            var y;
            var f;
            filter("img#showImage.moveImg").off('mousedown').off('mousemove').off('mouseup').off('mouseleave');
            filter("img#showImage.moveImg").on('mousedown', function(e){
                imageTop = parseInt(this.style.top);
                y = e.clientY;
                f = true;
            });
            filter("img#showImage.moveImg").on('mousemove', function(e){
                if (f){
                    var Y = e.clientY;
                    var T = imageTop + (Y-y);
                    T = Math.min(T,0);
                    T = Math.max(T, -parseInt(filter("img#showImage.moveImg").offsetHeight - window.innerHeight));
                    filter("img#showImage.moveImg").css({"top": T+'px'});
                }
            });
            filter("img#showImage.moveImg").on('mouseup', function(e){
                f = false;
            });
            filter("img#showImage.moveImg").on('mouseleave', function(e){
                f = false;
            });
        }

        return this;
    };
    return betterPPT;

}));