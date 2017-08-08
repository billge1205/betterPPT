/**
 * Created by billge on 17/7/24.
 */
define(function (module) {
    console.log('test start');
    module.exports.done = false;

    var test2 = require('test2');
    console.log('in test, test2.done:'+test2.done);

    module.exports.done = true;
    console.log('test end');
});