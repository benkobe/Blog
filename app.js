//应用(启动)入口文件

//加载express模块
var express = require('express');
//加载处理模板的模块
var swig = require('swig');
//加载数据库模块
var mongoose = require('mongoose');
//加载body-parser模块，用来处理post方式提交过来的数据
var bodyParser = require('body-parser');
//加载cookies模块
var cookies = require('cookies');
const Cookies = require('cookies');
var User = require('./models/Users');

//通过express创建app应用；相当于Nodejs中的http.createServer();
var app = express();

//设置静态文件托管
//当用户访问以'/public'开头的ur时，那么就直接返回对应的__dirname+'/public'目录下的文件
app.use('/public', express.static(__dirname + '/public'));


//配置模板(定义当前应用所使用的模板引擎)
//第一个参数：模板引擎的名称，同时也是模板文件的后缀名
//第二个参数：解析处理模板内容的方法
app.engine('html', swig.renderFile);
//设置模板文件存放的目录
//第一个参数必须是views
//第二个参数：目录
app.set('views', './views');
//注册所使用的模板引擎
//第一个参数必须是view engine
//第二个参数：和app.engine()方法的定义的模板引擎名称(第一个参数)是一致的
app.set('view engine', 'html');
//在开发过程中，需要取消模板缓存
//因为模板引擎在第一次读取模板文件时，解析出来之后会把模板文件的内容保存在内存当中；当客户端再次访问同一个模板文件时，模板引擎就不再读取这个模板文件了，而是直接在内存中把之前保存的模板文件返回给客户端，所以如果模板文件修改了，客户端是不能直接获取到最新的模板文件，必须要重启服务器才能使客户端获取到最新的模板文件；如果取消了模板引擎的缓存机制，不用重启服务器也可以使客户端获取到最新的模板文件
swig.setDefaults({ cache: false });


//首页的路由(测试)
//req：request对象
//res：response对象
//next：函数
// app.get('/', function(req, res, next) {
//     // res.send('<h1>欢迎来到我的博客</h1>');
//     //读取views目录下指定的文件，解析并返回给客户端
//     //第一个参数：表示模板文件，相对于views目录，即views.index.html
//     //第二个参数：传递给模板使用的数据
//     res.render('index');
// })

//配置body-parser
//通过调用bodyParser.urlencoded()方法之后，会在request对象中添加一个属性--body属性，这个body属性的值就是post方式提交过来的数据(其实就是方便后端获取到前端提交过来的请求数据)
app.use(bodyParser.urlencoded({ extended: true }));

//设置cookies
//无论请求路径是什么，只要进入了这个博客网站，就会在request(请求对象)中添加一个cookies对象
app.use(function(req, res, next) {
    req.cookies = new Cookies(req, res);
    //解析登录用户的cookie
    //给请求对象(req)添加一个userInfo属性，便于获取到登录用户的用户信息(比如在进入后台管理时需要获取登录用户上的用户信息)
    req.userInfo = {};
    if (req.cookies.get('userInfo')) {
        try {
            //如果请求对象中有cookie(有cookie其实就是已经登录的意思)，那么就给请求对象中的userInfo属性赋值(赋的值是登录用户的用户信息，刚好服务器端返回的cookie的值正好是登录用户的用户信息，所以直接就赋cookie的值就好了)
            //请求对象中userInfo的值的类型是对象比较好，这样便于后续的调用
            req.userInfo = JSON.parse(req.cookies.get('userInfo'));
            //获取当前登录用户的类型(是否是管理员)，并把这个类型赋值给请求对象的userInfo属性(因为登录用户的类型最好不要写在cookie当中)
            User.findById(req.userInfo._id).then(function(userInfo) {
                req.userInfo.isAdmin = Boolean(userInfo.isAdmin);
                next();
            });
        } catch (e) {
            next();
        }
    } else {
        next();
    }

})

//根据不同的功能通过app.use()方法划分不同的模块(相当于加载路由)
app.use('/', require('./routers/main'));
app.use('/admin', require('./routers/admin'));
app.use('/api', require('./routers/api'));


//连接数据库(连接数据库之前需要开启mongodb的服务器)
mongoose.connect('mongodb://localhost:27017/blog', function(err) {
    if (err) {
        console.log('数据库连接失败');
    } else {
        console.log('数据库连接成功');
        //监听http请求
        app.listen(8080);
    }
});

//整个应用的过程：
//用户发送http请求 → url → 解析路由 → 找到匹配的路由规则 → 执行指定的绑定函数，返回对应的内容给客户端

//动态请求的处理 → 处理业务逻辑，加载模板，解析模板 → 返回对应的内容给客户端
//静态文件的处理 → /public → 直接读取指定目录(/public)下的文件 → 返回对应的内容给客户端