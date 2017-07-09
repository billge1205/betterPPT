/**
 * Created by billge on 17/7/9.
 */
(function (module) {
    //图片展示
    document.ondragstart=function() {return false;}; // 阻止<img>在留浏览器中拖动打开新窗口
    var imageArr = [];
    var imageIndex = 0;
    var imageZoom = 1;
    var imageWidth = 0;
    var imageTop = 0;

    var showImages = {zoom:"zoom", scroll:"scroll"};

    module.exports = function(options){
        var defaults ={
            url: [],
            index: 0,
            mousewheel: showImages.zoom,
            scrollValue: 100
        };
        if ($('#showImageBox').length === 0){
            $('body').append('<div class="showImageBox" id="showImageBox">' +
                '<span class="showImage-left"></span>' +
            '<span class="showImage-right"></span>' +
            '<span class="showImage-close">×</span>' +
            '<img src="/node/images/error.gif" class="showImage" id="showImage" draggable="false" onerror="this.onerror=null;this.src=\'/node/images/error.gif\'">' +
            '</div>');
        }
        options = $.extend({}, defaults, options);
        imageArr = options.url;
        imageIndex = options.index;
        $("#showImage").removeClass("scroll");
        $("#showImageBox").show();
        if (options.mousewheel == "scroll"){
            $("#showImage").addClass("scroll");
        }
        if ($("#showImageBox").attr("data-mousewheel") != 1){
            $("#showImageBox").mousewheel(function(e){
                switch (options.mousewheel){
                    case "zoom":
                        if(e.deltaY>0){
                            imageZoom += 0.1;
                        }else if(e.deltaY<0){
                            imageZoom -= 0.1;
                            imageZoom = imageZoom <= 0 ? 0 : imageZoom;
                        }
                        isImageHigh();
                        $("#showImage").css("width", imageZoom.toFixed(1)*imageWidth+"px");
                        var toast = require('toast');
                        toast(parseInt(imageZoom.toFixed(1)*100)+"%");
                        break;
                    case "scroll":
                        imageTop = $("#showImage").position().top;
                        if(e.deltaY>0){
                            imageTop += options.scrollValue;
                        }else if(e.deltaY<0){
                            imageTop -= options.scrollValue;
                        }
                        imageTop = Math.min(imageTop,0);
                        imageTop = Math.max(imageTop, -parseInt($("img#showImage[moveImg=1]").height() - $(window).height()));
                        $("img#showImage[moveImg=1]").css("top", imageTop);
                        break;
                }
                return false;
            });
            $("#showImageBox").attr("data-mousewheel",1);
        }
        changeImage();

        $('#showImageBox').off('click', '.showImage-left,.showImage-right,.showImage-close')
            .on('click', '.showImage-left', function () {
            changeImage('left');
        }).on('click', '.showImage-right', function () {
            changeImage('right');
        }).on('click', '.showImage-close', function () {
            hideImages();
        });
        PPT.unbindCheck();
        $(document).bind('keyup', function (event) {
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
        });

        function hideImages(){
            $("#showImageBox").hide();
            $("#showImageBox").unbind("mousewheel").attr("data-mousewheel", 0);
            $(document).unbind('keyup');
            PPT.bindCheck();
        }

        function changeImage(flag){
            var toast = require('toast');
            if (flag == "left"){
                imageIndex --;
                if(imageIndex < 0){
                    imageIndex = 0;
                    toast("已是首张图片");
                    return;
                }
            } else if(flag == "right") {
                imageIndex ++;
                if (imageIndex > imageArr.length-1){
                    imageIndex = imageArr.length-1;
                    toast("没有更多图片");
                    return;
                }
            }
            var src = imageArr[imageIndex];
            $("#showImage").attr("src", src).removeAttr("moveImg");
            $("#showImage").stop().fadeOut(0, function(){
                imageOnload();
            });
        }

        function isImageHigh(){
            if($("#showImage").height() > $(window).height()){
                $("#showImage").attr("moveImg",1).css({"top":0,"transform": "translate(-50%,0)"});
                bindImageMove();
            }else{
                $("#showImage").attr("moveImg",0).css({"top":"50%","transform": "translate(-50%,-50%)"});
            }
        }

        function imageOnload(){
            isImageHigh();
            $("#showImage").width("auto");
            imageZoom = 1;
            imageWidth = $("#showImage").width();
            $("#showImage").stop().fadeIn(500);
        }

        function bindImageMove(){
            var y;
            var f;
            $("img#showImage[moveImg=1]").mousedown(function(e){
                imageTop = parseInt($(this).css("top"));
                y = e.clientY;
                f = true;
            });
            $("img#showImage[moveImg=1]").mousemove(function(e){
                if (f){
                    var Y = e.clientY;
                    var T = imageTop + (Y-y);
                    T = Math.min(T,0);
                    T = Math.max(T, -parseInt($("img#showImage[moveImg=1]").height() - $(window).height()));
                    $("img#showImage[moveImg=1]").css("top", T);
                }
            });
            $("img#showImage[moveImg=1]").mouseup(function(e){
                f = false;
            });
            $("img#showImage[moveImg=1]").mouseout(function(e){
                f = false;
            });
        }
    }



})(WeJs.exports.showImages);
