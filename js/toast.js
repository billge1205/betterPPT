/**
 * Created by billge on 17/7/9.
 */
(function (module) {
    // 悬浮提示
    var DoToastTimer;
    module.exports = function(txt){
        clearTimeout(DoToastTimer);
        if ($("#showToasts").length === 0){
            $('body').append('<div class="showToasts" id="showToasts"></div>');
        }
        $("#showToasts").text(txt).show();
        DoToastTimer = setTimeout(function(){
            $("#showToasts").text("").stop().hide(200);
        },2000);
    }


})(WeJs.exports.toast);