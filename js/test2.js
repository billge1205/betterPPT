/**
 * Created by billge on 17/7/24.
 */
define(function (module) {
    document.body.innerHTML += '<br />test2 start';
    module.exports.done = false;

    var test = require('test');
    document.body.innerHTML += '<br />in test2, test.done:'+test.done;

    module.exports.done = true;
    document.body.innerHTML += '<br />test2 end';
});