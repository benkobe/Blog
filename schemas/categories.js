var mongoose = require('mongoose');

//定义分类的表结构(表规则)
module.exports = new mongoose.Schema({
    //分类名称
    'categoryname': String,
});