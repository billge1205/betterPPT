/**
 * Created by billge on 2017/7/3.
 */
(function(module){
    "use strict";
    var loadPPT = function () {
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

        var betterPPT = function(obj){
            this.obj = $(obj);
            this.sections = this.obj.find('section');
            this.click = true;
            this.circle = false;
            this.anchor = true;
            this.current = null;
            this.steps = [];
            this.last = null;
            this.oView = false;
            this.x = 0;
            this.y = 0;
            this.init = function(config){
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
                // check support
                var ua = navigator.userAgent.toLowerCase();
                var body = document.body;
                var supported = ( pfx( "perspective" ) !== null ) &&
                    // Browser should support `classList` and `dataset` APIs
                    ( body.classList ) &&
                    ( body.dataset ) && ( ua.search( /(iphone)|(ipod)|(android)/ ) === -1 );
                if (!supported){
                    $('.betterPPT-unsupported').show();
                    this.obj.remove();
                    return;
                }
                config = config || {};
                var n = config.current || this.gethash();
                typeof config.circle === 'undefined' || (this.circle = config.circle);
                typeof config.click === 'undefined' || (this.click = config.click);
                typeof config.anchor === 'undefined' || (this.anchor = config.anchor);
                if (n > this.sections.length){
                    this.current = 0;
                } else {
                    this.current = n;
                }
                var self = this;
                this.sections.each(function (i, section) {
                    var steps = {indexs:[0], steps:{}, init: [], current:0} ;
                    $(section).find('[step]').each(function () {
                        var index = parseInt($(this).attr('step'));
                        if (index === 0){
                            steps.init.push(this);
                        } else {
                            if ($.inArray(index, steps.indexs) === -1){
                                steps.indexs.push(index);
                                steps['steps'][index] = [];
                            }
                            steps['steps'][index].push(this);
                        }
                    });
                    steps.indexs.sort();
                    self.steps.push(steps);
                });
                this.show('first');
                bindCheck(this);
                bindResize(this);
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
                this.sethash();
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
                var step = this.steps[this.current];
                if (step.current >= step.indexs.length-1){
                    this.next();
                } else {
                    step.current++;
                    this.showStep();
                }
            };
            this.back = function(){
                this.hideStep();
                var step = this.steps[this.current];
                if (step.current === 0){
                    this.prev();
                } else {
                    step.current--;
                }
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

                var from = next !== 'first' ? section.attr('from') : '';
                // 回退逻辑
                if (!next){
                    from = this.sections.eq(this.last).attr('from');
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
                if ($.inArray(from, ['left', 'right', 'top', 'bottom']) !== -1){
                    this.x -= left;
                    this.y -= up;
                    transform(this.obj, {x:this.x,y:this.y}, true);
                }
                section.addClass('active');
                this.sethash();
                // init step
                var step = this.steps[this.current];
                if (step.current === 0){
                    this.showStep(true);
                }
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
                    $(obj).addClass('active');
                    var action = $(obj).attr('action');
                    if (action){
                        action = eval(action);
                        action.call(obj, true);
                    }
                }
            };
            this.hideStep = function () {
                var step = this.steps[this.current];
                var steps = step.steps[step.indexs[step.current]];
                for (var i in steps){
                    var obj = steps[i];
                    $(obj).removeClass('active');
                    var action = $(obj).attr('action');
                    if (action){
                        action = eval(action);
                        action.call(obj, false);
                    }
                }
            };
        };
        return betterPPT;
    };

    if (typeof WeJs === "undefined"){
        module.betterPPT = loadPPT();
    } else {
        require('jquery');
        module.exports = loadPPT();
    }

}(typeof WeJs === "undefined" ? window : WeJs.exports.betterPPT));