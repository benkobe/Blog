var express = require('express');
var Category = require('../models/Category');
var Content = require('../models/Content');

var router = express.Router();

var data;
//处理通用数据(导航栏的分类数据)；因为在前台展示页面中，无论哪个路由都需要获取到所有的分类信息
router.use(function(req, res, next) {
    data = {
        userInfo: req.userInfo,
        categories: []
    };
    Category.find().then(function(categories) {
        data.categories = categories;
        next();
    })
});

// 首页
router.get('/', function(req, res, next) {
    //点击导航栏中某个分类传递过来的分类id
    data.cate = req.query.cate || '';
    data.contents = [];
    data.count = 0;
    data.page = Number(req.query.page || 1);
    data.limit = 2;
    data.pages = 0;
    //查询文章时的条件；如果点击首页，其请求路径是没有携带cate查询参数的，如果点击其他分类，其请求路径时携带cate参数的
    var where = {};
    if (data.cate) {
        //where对象的属性不能随便命名，这个属性的名称一定要和Content模型中的categoryname一致
        where.categoryname = data.cate;
    };

    Content.where(where).count().then(function(count) {
        // console.log(count);
        data.count = count;
        data.pages = Math.ceil(data.count / data.limit);
        data.page = Math.min(data.page, data.pages);
        data.page = Math.max(data.page, 1);
        var skip = (data.page - 1) * data.limit;
        //.where(查询条件对象)方法: 根据查询条件来查询文章
        return Content.where(where).find().sort({ _id: -1 }).limit(data.limit).skip(skip).populate(['categoryname', 'user']);
    }).then(function(contents) {
        // console.log(contents.length);
        // console.log(contents);
        data.contents = contents;
        // console.log(data);
        //render()方法的第二个参数就是传递给当前需要被渲染的模板的数据
        res.render('main/index', data); //之所以不用写../views，是因为在app.js中已经设置了模板存放的路径(路径就是../views)
    });
});
//文章详情页
router.get('/view', function(req, res, next) {
    var contentID = req.query.contentid || '';
    Content.findOne({
        _id: contentID
    }).populate('user').then(function(content) {
        data.content = content;
        // console.log(content);
        //阅读量的增加
        content.views++;
        content.save();
        res.render('main/view', data);
    });
});
module.exports = router;