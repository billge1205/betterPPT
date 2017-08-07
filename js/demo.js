/**
 * Created by billge on 17/8/4.
 */
define(function (module) {
    module.exports.version = '1.0.1';
    module.exports.clickImg = function (obj) {
        var theme = obj.getAttribute('theme');
        obj.parentNode.classList = 'theme-'+theme+' active';
        window.event.stopPropagation();
        return false;
    }
});
