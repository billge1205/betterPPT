/**
 * Created by billge on 17/7/24.
 */
define(function (module) {
    document.body.innerHTML += '<br />test start';
    module.exports.done = false;

    var test2 = require('test2');
    document.body.innerHTML += '<br />in test, test2.done:'+test2.done;

    module.exports.done = true;
    document.body.innerHTML += '<br />test end';
});