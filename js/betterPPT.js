/**
 * Created by billge on 2017/7/3.
 */
(function(module){
    "use strict";
    module.requires('jquery', function (_) {
        function bindKey(ppt){
            if (ppt.click){
                $(document).bind('click', function () {
                    ppt.step();
                });
            }
            // 键盘事件绑定
            $(document).bind('keydown', function (event) {
                if (event.keyCode >= 37 && event.keyCode <= 40  || event.keyCode <= 27) {
                    event.preventDefault(); return false;
                }
            });
            $(document).bind('keyup', function (event) {
                if (event.keyCode >= 37 && event.keyCode <= 40 || event.keyCode <= 27) {
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

        function bindResize(ppt){
            $(window).resize(function(){
                ppt.resize();
            });
        }
        var PPT = function(obj){
            this.obj = $(obj);
            this.sections = this.obj.find('section');
            this.click = true;
            this.circle = false;
            this.current = null;
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
                bindKey(this);
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
                this.sections.each(function (i) {
                    self.resize(i);
                });
                this.obj.addClass('overview');
                this.sections.each(function (i,section) {
                    $(section).css({transform: $(section).css('transform')+' rotateY(75deg)'});
                });
                this.sections.bind('click', function () {
                    console.log(this);
                });
                this.obj.css({transform: 'scaleX(0.7) scaleY(0.7) scaleZ(1) '+this.obj.css('transform')});
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
                if (this.current === 0){
                    if (this.circle){
                        this.current = this.sections.length-1;
                    } else {
                        // 已经是首页了
                        return;
                    }
                } else {
                    this.current--;
                }
                this.show(false);
            };
            this.next = function(){
                if (this.current === this.sections.length-1){
                    if (this.circle){
                        this.current = 0;
                    } else {
                        // 播放完毕
                        return;
                    }
                } else {
                    this.current++;
                }
                this.show();
            };
            this.resize = function(n){
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
                section.css({width: w, height: h, 'font-size': size+'px', padding: pt+'px '+pl+'px', 'z-index':n});
                section.css('transform', 'translate3d('+x+'px, '+y+'px, 0px)');
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
                        section.css('transform', 'translate3d('+(x-ww)+'px, '+y+'px, 0px)');
                        left = -ww;
                        break;
                    case 'top':
                        section.css('transform', 'translate3d('+x+'px, '+(y-wh)+'px, 0px)');
                        up = -wh;
                        break;
                    case 'bottom':
                        section.css('transform', 'translate3d('+x+'px, '+(y+wh)+'px, 0px)');
                        up = wh;
                        break;
                    case 'right':
                        section.css('transform', 'translate3d('+(x+ww)+'px, '+y+'px, 0px)');
                        left = ww;
                        break;
                    default:
                        section.css('transform', 'translate3d('+x+'px, '+y+'px, 0px)');
                        break;
                }
                this.x -= left;
                this.y -= up;
                this.obj.css('transform', 'translate3d('+this.x+'px, '+this.y+'px, 0px)');
                section.addClass('active');
            };
        };

        module.exports = PPT;
    });


}(WeJs.exports.betterPPT));