//api.js里面的接口都是ajax请求的接口
var express = require('express');
var Content = require('../models/Content');
var User = require('../models/Users');

var router = express.Router();

//设定一个变量，用于接收服务器端在注册用户时返回给前端的信息
var registerData;
router.use(function(req, res, next) {
    registerData = {
        code: 0,
        message: ''
    }
    next();
})

//用户注册
//注册逻辑
// 验证
// 1、用户名不能为空
// 2、密码不能为空
// 3、两次输入的密码要一致
// 数据库方面的验证
// 1、用户名是否被注册
router.post('/user/register', function(req, res, next) {
    // console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;
    var repassword = req.body.repassword;
    //当用户名为空时
    if (username === '') {
        registerData.code = 1;
        registerData.message = '用户名不能为空';
        //res.json()方法会将registerData这个对象转换成json格式并返回给前端(前端可以在ajax请求中的success函数中接收到这个值--register)
        res.json(registerData);
        return;
    }
    //当密码为空时
    if (password === '') {
        registerData.code = 2;
        registerData.message = '密码不能为空';
        res.json(registerData);
        return;
    }
    //当两次输入的密码不一致时
    if (repassword !== password) {
        registerData.code = 3;
        registerData.message = '两次输入的密码不一致';
        res.json(registerData);
        return;
    }
    //当用户名被注册时，如果数据库中存在和我们要注册的用户名同名的数据，表示该用户名已经被注册了
    User.findOne({
        username: username
    }).then(function(userInfo) {
        // console.log(userInfo);//如果输入的用户名没有被注册，则输出 null
        if (userInfo) {
            //如果userInfo不为空，则表明数据库中有该记录，该用户名已经被注册
            registerData.code = 4;
            registerData.message = '该用户名已经被注册';
            res.json(registerData);
            return;
        }
        //如果userInfo为空，即该用户名没被注册，则保存用户注册的信息到数据库中
        var user = new User({
            username: username,
            password: password
        });
        //将用户信息保存到数据库中
        return user.save();
    }).then(function(newUserInfo) {
        // console.log(newUserInfo);//newUserInfo的值就是用户成功注册的信息
        registerData.message = '注册成功';
        // 如果想要注册成功之后直接跳转登录，就保留下面的设置cookie的语句；如果想注册成功之后还需要手动输入用户名和密码才能登录的话，就把下面的设置cookie的语句解除注释，把设置cookie的语句写在登录成功后面
        // req.cookies.set('userInfo', JSON.stringify({
        //     _id: newUserInfo._id,
        //     username: newUserInfo.username
        // }));
        res.json(registerData);
    })

});

//用户登录
router.post('/user/login', function(req, res, next) {
    // console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;
    //当用户名为空时
    if (username === '') {
        registerData.code = 1;
        registerData.message = '用户名不能为空';
        res.json(registerData);
        return;
    }
    //当密码为空时
    if (password === '') {
        registerData.code = 2;
        registerData.message = '密码不能为空';
        res.json(registerData);
        return;
    }
    User.findOne({
        username: username,
        password: password
    }).then(function(userInfo) {
        // console.log(userInfo);//表示用户名的登录信息
        if (!userInfo) {
            registerData.code = 3;
            registerData.message = '用户名或密码错误';
            res.json(registerData);
            return;
        }
        //当用户名和密码都是正确时
        registerData.message = '登录成功';
        registerData.userInfo = {
            _id: userInfo._id,
            username: userInfo.username
        };
        //登录成功之后，服务器端会向客户端(即浏览器)发送一个cookie(其实就是给req.cookies赋一个值)，客户端得到cookie之后会保存到浏览器内存中，之后该客户端再次访问这个url时，请求头中就会携带保存在浏览器内存的cookie
        // 如果想注册成功之后还需要手动输入用户名和密码才能登录的话，就把下面的设置cookie的语句解除注释；如果想要注册成功之后直接跳转登录，就把下面的设置cookie的语句注释掉，把设置cookie的语句写在注册成功后面
        req.cookies.set('userInfo', JSON.stringify({
            _id: userInfo._id,
            username: userInfo.username
        }));
        res.json(registerData);
    })
});

//退出登录
router.get('/user/logout', function(req, res, next) {
    //退出登录只要将cookie设为空即可
    req.cookies.set('userInfo', null);
    res.json(registerData);
});

//进入文章详情页时加载评论
router.get('/comment', function(req, res, next) {
    //contentID的值都是通过ajax的get方式提交过来的
    var contentID = req.query.contentid || '';
    //根据id查询该文章的信息
    Content.findOne({
        _id: contentID
    }).then(function(content) {
        // console.log(content); //content是该文章的所有信息(包括作者、发布时间、正文、评论等)
        registerData.data = content.comments;
        res.json(registerData);
    });
});

//评论的提交
router.post('/comment/post', function(req, res, next) {
    //contentID的值都是通过ajax的post方式提交过来的
    var contentID = req.body.contentid || '';
    var postData = {
        username: req.userInfo.username,
        postTime: new Date(),
        //content的值都是通过ajax的post方式提交过来的
        content: req.body.content
    };
    //查询这篇文章的信息，并将用户的评论相关的信息保存在文章中
    Content.findOne({
        _id: contentID
    }).then(function(content) {
        content.comments.push(postData);
        return content.save();
    }).then(function(newContent) {
        // console.log(newContent);
        //newContent就是这篇文章的最新信息(即包含最新的评论相关的信息)
        registerData.data = newContent;
        registerData.message = '评论成功';
        //res.json()方法的作用就是服务器将数据返回给前端
        res.json(registerData);
    });
});
module.exports = router;