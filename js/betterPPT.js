/**
 * Created by billge on 2017/7/3.
 */
(function(module){
    "use strict";
    module.requires('jquery', function (_) {
        function bindCheck(ppt){
            if (ppt.click){
                $(document).bind('click', function () {
                    ppt.step();
                });
            }
            // 键盘事件绑定
            $(document).bind('keydown', function (event) {
                if (event.keyCode >= 37 && event.keyCode <= 40  || event.keyCode === 27) {
                    event.preventDefault(); return false;
                }
            }).bind('keyup', function (event) {
                if (event.keyCode >= 37 && event.keyCode <= 40 || event.keyCode === 27) {
                    switch ( event.keyCode ) {
                        case 27: // ESC
                            ppt.overview();
                            break;
                        case 37: // Left
                            ppt.back();
                            break;
                        case 39: // Right
                            ppt.step();
                            break;
                        case 38: // Up
                            ppt.prev();
                            break;
                        case 40: // Down
                            ppt.next();
                            break;
                    }
                    event.preventDefault();
                    return false;
                }
            });
        }

        function unbindCheck(ppt) {
            $(document).unbind('click').unbind('keyup');
        }

        function bindOverView(ppt) {
            function focusSection(n) {
                var section = ppt.sections.eq(n);
                ppt.sections.removeClass('active');
                section.addClass('active');
                ppt.sections.each(function (i) {
                    ppt.resize(i, false);
                });
            }

            $(ppt.obj).on('mouseenter', 'section', function (event) {
                ppt.current = ppt.sections.index(this);
                focusSection(ppt.current);
            }).on('click', 'section', function (event) {
                ppt.current = ppt.sections.index(this);
                focusSection(ppt.current);
                ppt.review();
            });
            $(document).bind('keyup', function (event) {
                if (event.keyCode >= 37 && event.keyCode <= 40 || event.keyCode === 27 || event.keyCode === 13) {
                    switch ( event.keyCode ) {
                        case 13: // Enter
                        case 27: // ESC
                            ppt.review();
                            break;
                        case 37: // Left
                            var prev = ppt.getPrev();
                            if (prev === false){
                                return;
                            }
                            ppt.current = prev;
                            focusSection(ppt.current);
                            break;
                        case 39: // Right
                            var next = ppt.getNext();
                            if (next === false){
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
            $(ppt.obj).off('mouseenter', 'section').off('click', 'section');
            $(document).unbind('keyup');
        }

        function bindResize(ppt){
            $(window).bind('resize', function(){
                ppt.resize();
            });
        }
        
        function unbindResize() {
            $(window).unbind('resize');
        }

        function transform(obj, data, transition) {
            typeof transition === 'undefined' && (transition = false);
            var d = $(obj).data('transform');
            d = d || {};
            d = Object.assign(d, data);
            $(obj).data('transform', d);
            transition && $(obj).addClass('transition') || $(obj).removeClass('transition');
            var x=d.x||0, y=d.y||0, z=d.z||0,
                scale=typeof d.scale==='undefined'?'1':d.scale,
                rX=d.rotateX||0,rY=d.rotateY||0,rZ=d.rotateZ||0;
            $(obj).css('transform', 'translate3d('+x+'px, '+y+'px, '+z+'px) scale('+scale+') rotateX('+rX+'deg) rotateY('+rY+'deg) rotateZ('+rZ+'deg)');
        }

        var PPT = function(obj){
            this.obj = $(obj);
            this.sections = this.obj.find('section');
            this.click = true;
            this.circle = false;
            this.current = null;
            this.cstep = null;
            this.last = null;
            this.oView = false;
            this.x = 0;
            this.y = 0;
            this.init = function(config){
                config = config || {};
                var n = config.current || 0;
                typeof config.circle === 'undefined' || (this.circle = config.circle);
                typeof config.click === 'undefined' || (this.click = config.click);
                if (n > this.sections.length){
                    this.current = 0;
                } else {
                    this.current = n;
                }
                this.show();
                bindCheck(this);
                bindResize(this);
            };
            this.reload = function(n){
                // TODO
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
                this.sections.each(function (i) {
                    self.resize(i);
                });
                this.obj.addClass('overview');
                //奇怪的逻辑 不用settimeout 过度就有问题
                setTimeout(function () {
                    self.sections.each(function (i,section) {
                        transform($(section), {rotateY: 50}, true);
                    });
                    transform(self.obj, {scale: 0.6}, true);
                },0);
                unbindCheck(this);
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
                this.sections.each(function (i,section) {
                    transform($(section), {rotateY: 0}, true);
                });
                transform(this.obj, {scale: 1}, true);
                unbindOverView(this);
                var self = this;
                setTimeout(function () {
                    bindCheck(self);
                    bindResize(self);
                }, 0);
            };
            this.getPrev = function () {
                var prev;
                if (this.current === 0){
                    if (this.circle){
                        prev = this.sections.length-1;
                    } else {
                        // 已经是首页了
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
                        return false;
                    }
                } else {
                    next = this.current+1;
                }
                return next;
            };
            this.step = function(){
                // TODO
                this.next();
            };
            this.back = function(){
                // TODO
                this.prev();
            };
            this.prev = function(){
                this.last = this.current;
                var prev = this.getPrev();
                if (prev === false){
                    return;
                }
                this.current = prev;
                this.show(false);
            };
            this.next = function(){
                var next = this.getNext();
                if (next === false){
                    return;
                }
                this.current = next;
                this.show();
            };
            this.resize = function(n, css){
                typeof css === "undefined" && (css = true);
                typeof n === "undefined" && (n = this.current);
                var section = this.sections.eq(n);
                var wh = $(window).height();
                var ww = $(window).width();
                var h = wh * 0.95;
                var w = Math.min(ww * 0.95, h*1.5);
                var y = -1*h/2 - this.y;
                var x = -1*w/2 - this.x + (n-this.current)*w/2;
                var size = h/20;
                var pt = h/30;
                var pl = w/30;
                if (css){
                    section.css({width: w, height: h, 'font-size': size+'px', padding: pt+'px '+pl+'px', 'z-index':n});
                    transform(section, {x:x,y:y}, false);
                } else {
                    transform(section, {x:x,y:y}, true);
                }
            };
            this.show = function(next){
                next = typeof next === "undefined" ? true : next;
                this.sections.removeClass('active');
                var section = this.sections.eq(this.current);
                var wh = $(window).height();
                var ww = $(window).width();
                var h = wh * 0.95;
                var w = Math.min(ww * 0.95, h*1.5);
                var size = h/20;
                var pt = h/30;
                var pl = w/30;
                section.css({width: w, height: h, 'font-size': size+'px', padding: pt+'px '+pl+'px'});
                var y = -1*h/2 - this.y;
                var x = -1*w/2 - this.x;
                var left = 0;
                var up = 0;

                var from = section.attr('from');
                // 回退逻辑
                if (!next){
                    from = this.sections.eq(this.last).attr('from');
                    ww = -1*ww;
                    wh = -1*wh;
                }
                switch (from){
                    case 'left':
                        transform(section, {x:x-ww,y:y}, false);
                        left = -ww;
                        break;
                    case 'top':
                        transform(section, {x:x,y:y-wh}, false);
                        up = -wh;
                        break;
                    case 'bottom':
                        transform(section, {x:x,y:y+wh}, false);
                        up = wh;
                        break;
                    case 'right':
                        transform(section, {x:x+ww,y:y}, false);
                        left = ww;
                        break;
                    default:
                        transform(section, {x:x,y:y}, false);
                        break;
                }
                this.x -= left;
                this.y -= up;
                transform(this.obj, {x:this.x,y:this.y}, true);
                section.addClass('active');
            };
        };

        module.exports = PPT;
    });


}(WeJs.exports.betterPPT));