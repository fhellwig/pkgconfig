var path = require('path');
console.log(path.join('config', 'schema'));
return;
var pkgconfig = require('./index.js');

pkgconfig({
    schema:{type:'string'},
    config:'.'
});
