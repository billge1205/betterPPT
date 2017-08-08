/**
 * Created by billge on 17/7/24.
 */
define(function (module) {
    console.log('test2 start');
    module.exports.done = false;

    var test = require('test');
    console.log('in test2, test.done:'+test.done);

    module.exports.done = true;
    console.log('test2 end');
});