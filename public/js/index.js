$(function() {
    var loginBox = $('#loginBox');
    var registerBox = $('#registerBox');
    var userInfo = $('#userInfo');

    //切换到注册面板
    loginBox.find('a.colMint').on('click', function() {
        registerBox.show();
        loginBox.hide();
    });

    //切换到登录面板
    registerBox.find('a.colMint').on('click', function() {
        loginBox.show();
        registerBox.hide();
    });

    //注册
    registerBox.find('button').on('click', function() {
        $.ajax({
            type: 'post',
            url: '/api/user/register',
            data: {
                username: registerBox.find('[name="username"]').val(),
                password: registerBox.find('[name="password"]').val(),
                repassword: registerBox.find('[name="repassword"]').val()
            },
            dataType: 'json',
            success: function(result) {
                // consonle.log(result);
                registerBox.find('.colWarning').html(result.message);
                if (!result.code) {
                    //注册成功
                    setTimeout(function() {
                            registerBox.hide();
                            loginBox.show();
                        }, 2000)
                        // 如果想要注册成功之后直接跳转登录，需要把上面的定时器注释掉，把下面的页面重载的语句解除注释；还要修改api.js中的登录路由和注册路由的语句
                        // window.location.reload();
                }
            }
        });
    });

    //登录
    loginBox.find('button').on('click', function() {
        $.ajax({
            type: 'post',
            url: '/api/user/login',
            data: {
                username: loginBox.find('[name="username"]').val(),
                password: loginBox.find('[name="password"]').val()
            },
            dataType: 'json',
            success: function(result) {
                loginBox.find('.colWarning').html(result.message);
                if (!result.code) {
                    //登录成功
                    window.location.reload();
                }
            }
        });
    });

    //退出
    $('#logout').on('click', function() {
        $.ajax({
            url: '/api/user/logout',
            success: function(result) {
                if (!result.code) {
                    window.location.reload();
                }
            }
        })
    })
});