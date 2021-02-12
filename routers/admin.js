var express = require('express');

var User = require('../models/Users');
var Category = require('../models/Category');
var Content = require('../models/Content');

var router = express.Router();

//如果没有登录管理员账号，是不能通过输入url进去后台的
router.use(function(req, res, next) {
    if (!req.userInfo.isAdmin) {
        res.send('只有管理员才能进入后台管理');
    }
    next();
})

//后台首页
router.get('/', function(req, res, next) {
    //第二个参数表示传递参数给admin目录下的index.html模板
    res.render('admin/index', {
        userInfo: req.userInfo
    });
});

//用户管理
router.get('/user', function(req, res, next) {
    //从数据库读取所有已注册的用户的用户信息
    // 分页显示已注册用户的用户信息数据
    // limit(Number):限制获取数据的条数(在这里就是表示每页显示的条数)
    // skip(Number):忽略数据的条数，例如skip(2)表示忽略掉前面2条数据从第3条数据开始获取
    //假设每页显示5条用户信息的数据
    // 第1页：1-5    skip:0   -> (当前页-1)*limit -> (1-1)*5=0
    // 第2页：6-10   skip:5   -> (当前页-1)*limit -> (2-1)*5=5
    // 第3页：11-15  skip:10  -> (当前页-1)*limit -> (3-1)*5=10

    // 默认当前页为第1页，每页限制显示3条数据
    //page：当前页码
    var page = Number(req.query.page || 1);
    //limit：每页显示的数据条数
    var limit = 15;
    //pages：总页数
    var pages = 0

    // User.count()方法：查询User这个数据模型中总共有多少条数据
    User.count().then(function(count) {
        // console.log(count); //输出已注册用户的数目
        //计算总页数(向上取整)
        pages = Math.ceil(count / limit);
        //处理page的取值范围
        //page的值不能超过pages(意思就是当page大于pages时page就取pages的值)
        page = Math.min(page, pages);
        //page的值不能小于1(意思就是当page的值小于1时page就取1)
        page = Math.max(page, 1);
        //skip：跳转到某个页码时数据库需要忽略查询的数据条数
        var skip = (page - 1) * limit;

        User.find().limit(limit).skip(skip).then(function(userInfo) {
            // console.log(userInfo); //输出一个数组，每个数组元素是一个对象，一个用户信息的对象
            res.render('admin/user_index', {
                userInfo: req.userInfo,
                users: userInfo,
                page: page,
                pages: pages,
                count: count,
                limit: limit
            });
        });
    });


});

//分类管理
//分类列表
router.get('/category', function(req, res, next) {
    // 默认当前页为第1页，每页限制显示3条数据
    //page：当前页码
    var page = Number(req.query.page || 1);
    //limit：每页显示的数据条数
    var limit = 15;
    //pages：总页数
    var pages = 0

    // Category.count()方法：查询Category这个数据模型中总共有多少条数据
    Category.count().then(function(count) {
        // console.log(count); //输出已添加的分类的数目
        //计算总页数(向上取整)
        pages = Math.ceil(count / limit);
        //处理page的取值范围
        //page的值不能超过pages(意思就是当page大于pages时page就取pages的值)
        page = Math.min(page, pages);
        //page的值不能小于1(意思就是当page的值小于1时page就取1)
        page = Math.max(page, 1);
        //skip：跳转到某个页码时数据库需要忽略查询的数据条数
        var skip = (page - 1) * limit;

        //Category.sort():排序方法；Category.sort({_id:-1}):通过_id进行排序，通过_id排序可以取两个值 1和-1，1表示升序，-1表示降序；为什么可以通过_id进行排序呢？因为数据库生成的_id中都含有一个时间戳，越新生成的_id的时间戳越大
        Category.find().sort({ _id: -1 }).limit(limit).skip(skip).then(function(categoryInfo) {
            // console.log(categoryInfo); //输出一个数组，每个数组元素是一个对象，一个分类信息的对象
            res.render('admin/category_index', {
                userInfo: req.userInfo,
                categories: categoryInfo,
                page: page,
                pages: pages,
                count: count,
                limit: limit
            });
        });
    });
});
//添加分类
router.get('/category/add', function(req, res, next) {
    res.render('admin/category_add', {
        userInfo: req.userInfo
    });
});
//提交添加的分类至数据库中保存
router.post('/category/add', function(req, res, next) {
    //req.body.name中的name是category_add.html中的form表单中的input中的name属性的属性值
    // console.log(req.body.name);
    var categoryname = req.body.name;
    //如果输入的分类名称为空，就跳转到错误提示的页面
    if (categoryname === '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '分类名称不能为空'
        });
        return;
    } else {
        //如果输入的分类名称不为空，还要判断输入的分类的名称在数据库中是否已经存在
        Category.findOne({
            categoryname: categoryname
        }).then(function(result) {
            if (result) {
                //如果result为真，则表明数据库已经存在改分类了
                res.render('admin/error', {
                    userInfo: req.userInfo,
                    message: '你输入的分类名称已存在'
                });
                //不需要继续执行下去(不需要执行下面的then()方法)
                return Promise.reject();
            } else {
                return new Category({
                    categoryname: categoryname
                }).save();
            }
        }).then(function(newCategory) {
            res.render('admin/success', {
                userInfo: req.userInfo,
                message: '添加分类成功',
                url: '/admin/category'
            });
        })
    }
});
//分类的修改
router.get('/category/edit', function(req, res, next) {
    //获取要修改那个分类的id
    var id = req.query.id || '';
    //获取要修改那个分类的信息，并通过表单的形式展示出来
    Category.findOne({
        _id: id
    }).then(function(category) {
        //如果要修改那个分类不存在
        if (!category) {
            res.render('admin/error', {
                userInfo: req.userInfo,
                message: '该分类不存在'
            });
        } else {
            //如果要修改那个分类存在的话，跳转到另一个页面中，需要传递该分类的信息
            res.render('admin/category_edit', {
                userInfo: req.userInfo,
                category: category
            });
        }
    });
})

//提交修改后的分类至数据库中
router.post('/category/edit', function(req, res, next) {
    //获取要被修改那个分类的id
    var id = req.query.id || '';
    //获取修改之后的新的分类名称(req.body.name中的name是category_edit.html中的form表单中的input中的name属性的属性值)
    var newCategoryname = req.body.name || '';
    //在数据库中通过id查询该分类是否存在
    Category.findOne({
        _id: id
    }).then(function(category) {
        //如果要修改的分类不存在
        if (!category) {
            res.render('admin/error', {
                userInfo: req.userInfo,
                message: '分类信息不存在'
            });
            return Promise.reject();
        }
        //如果要修改的分类存在
        else {
            //当用户没有修改分类的名称就提交的话
            if (newCategoryname === category.categoryname) {
                res.render('admin/success', {
                    userInfo: req.userInfo,
                    message: '修改成功',
                    url: '/admin/category'
                });
                return Promise.reject();
            }
            //当用户修改了分类的名称时，还要判断修改了之后的分类名称在数据库是否有同名
            else {
                return Category.findOne({
                    _id: { $ne: id },
                    categoryname: newCategoryname
                });
            }
        }
    }).then(function(sameCategory) {
        //如果用户修改了分类之后在数据库中有同名分类
        if (sameCategory) {
            res.render('admin/error', {
                userInfo: req.userInfo,
                message: '该分类已存在'
            });
            return Promise.reject();
        } else {
            return Category.updateOne({
                _id: id
            }, {
                categoryname: newCategoryname
            });
        }
    }).then(function() {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '修改分类成功',
            url: '/admin/category'
        });
    })
})

//分类的删除
router.get('/category/delete', function(req, res, next) {
    //获取要被删除那个分类的id
    var id = req.query.id || '';
    Category.remove({
        _id: id
    }).then(function() {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '删除分类成功',
            url: '/admin/category'
        });
    });
});

//文章管理
//文章列表
router.get('/content', function(req, res, next) {
    // 默认当前页为第1页，每页限制显示3条数据
    //page：当前页码
    var page = Number(req.query.page || 1);
    //limit：每页显示的数据条数
    var limit = 15;
    //pages：总页数
    var pages = 0;

    // Content.count()方法：查询Content这个数据模型中总共有多少条数据
    Content.count().then(function(count) {
        // console.log(count); //输出已添加的文章的数目
        //计算总页数(向上取整)
        pages = Math.ceil(count / limit);
        //处理page的取值范围
        //page的值不能超过pages(意思就是当page大于pages时page就取pages的值)
        page = Math.min(page, pages);
        //page的值不能小于1(意思就是当page的值小于1时page就取1)
        page = Math.max(page, 1);
        //skip：跳转到某个页码时数据库需要忽略查询的数据条数
        var skip = (page - 1) * limit;

        //Content.sort():排序方法；Content.sort({_id:-1}):通过_id进行排序，通过_id排序可以取两个值 1和-1，1表示升序，-1表示降序；为什么可以通过_id进行排序呢？因为数据库生成的_id中都含有一个时间戳，越新生成的_id的时间戳越大
        //populate('categoryname')：categoryname的来源是schemas/contents.js中的categoryname字段(user同理)；调用populate()这个方法的意思就是将categoryname这个字段关联的Category模型对应的id的所有信息查询扩展出来，可以通过下面的console.log(contents)查看
        Content.find().sort({ _id: -1 }).limit(limit).skip(skip).populate(['categoryname', 'user']).then(function(contents) {
            // console.log(contents);
            res.render('admin/content_index', {
                userInfo: req.userInfo,
                contents: contents,
                page: page,
                pages: pages,
                count: count,
                limit: limit
            });
        });
    });

});
//添加文章
router.get('/content/add', function(req, res, next) {
    //获取所有的分类
    Category.find().sort({ _id: -1 }).then(function(categories) {
        // console.log(categories);
        res.render('admin/content_add', {
            userInfo: req.userInfo,
            categories: categories
        });
    });
});
//提交添加的文章至数据库中保存
router.post('/content/add', function(req, res, next) {
    // console.log(req.body); //输出：post请求方式提交过来的所有数据，是一个对象，对象中的所有属性都是表单框的name属性的属性值
    //验证文章的所属分类不能为空
    if (req.body.category === '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '文章所属分类不能为空'
        });
        return;
    }
    //验证文章的标题不能为空
    if (req.body.title === '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '文章的标题不能为空'
        });
        return;
    }
    //将添加文章相关的所有内容保存至数据库中
    new Content({
        categoryname: req.body.category,
        title: req.body.title,
        user: req.userInfo._id.toString(),
        addTime: new Date(),
        description: req.body.description,
        content: req.body.content
    }).save().then(function(result) {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '发表文章成功',
            url: '/admin/content'
        })
    });
});
//修改文章
router.get('/content/edit', function(req, res, next) {
    var id = req.query.id || '';
    var categories = [];
    //获取所有的分类
    Category.find().sort({ _id: 1 }).then(function(result) {
        categories = result;
        // console.log(categories);
        return Content.findOne({
            _id: id
        }).populate('categoryname');
    }).then(function(content) {
        // console.log(content);
        if (!content) {
            res.render('admin/error', {
                userInfo: req.userInfo,
                message: '文章不存在'
            });
        } else {
            res.render('admin/content_edit', {
                userInfo: req.userInfo,
                categories: categories,
                content: content
            });
        }
    })
});
//提交修改文章至数据库中保存
router.post('/content/edit', function(req, res, next) {
    var id = req.query.id || '';
    //验证文章的所属分类不能为空
    if (req.body.category === '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '文章所属分类不能为空'
        });
        return;
    }
    //验证文章的标题不能为空
    if (req.body.title === '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            message: '文章的标题不能为空'
        });
        return;
    }
    //update()方法的第一个参数表示查询条件，第二个参数表示需要保存的内容
    Content.update({
        _id: id
    }, {
        categoryname: req.body.category,
        title: req.body.title,
        description: req.body.description,
        content: req.body.content
    }).then(function() {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '修改文章成功',
            // url: '/admin/content'
            //回到修改文章的页面
            url: '/admin/content/edit?id=' + id
        });
    });
});
//删除文章
router.get('/content/delete', function(req, res, next) {
    var id = req.query.id || '';
    Content.remove({
        _id: id
    }).then(function() {
        res.render('admin/success', {
            userInfo: req.userInfo,
            message: '删除文章成功',
            url: '/admin/content'
        });
    });
});
module.exports = router;