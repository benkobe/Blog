var comments = [];
//每页显示多少条评论
var perpage = 10;
var page = 1;
var pages = 0;

//提交评论
$('#messageBtn').on('click', function() {
    $.ajax({
        type: 'POST',
        url: '/api/comment/post',
        data: {
            contentid: $('#contentID').val(),
            content: $('#messageContent').val()
        },
        success: function(reponseData) {
            // console.log(responseData);
            //评论成功后，清空评论输入框
            $('#messageContent').val('');
            comments = reponseData.data.comments.reverse();
            //reverse()方法用于反转数组，意义在于将评论数组反转，将最新的评论放在评论数组的最前面
            renderComment();
        }
    });
});

//发布评论时无刷新渲染评论
function renderComment() {
    //评论数
    $('#messageCount').html(comments.length);
    var start = (page - 1) * perpage;
    // var start = Math.max(0, (page - 1) * perpage); //start的第二种写法
    // var end = Math.min(start + perpage, comments.length); //end的第二种写法
    var end;
    //当page >= pages时，end的值就不应该时start + perpage了，而是comments.length % perpage
    //之所以加上&&pages!==0，是因为page的初始值为1，pages的初始值为0
    if (page >= pages && pages !== 0) {
        end = start + (comments.length % perpage);
    } else {
        end = start + perpage;
    }
    console.log(end);
    //评论分页
    var lis = $('.pager li');
    pages = Math.max(Math.ceil(comments.length / perpage), 1);
    lis.eq(1).html(page + '/' + pages);
    if (page <= 1) {
        page = 1;
        lis.eq(0).html('<span>没有上一页了</span>');
    } else {
        lis.eq(0).html('<a href="javascript:;">上一页</a>');
    }
    if (page >= pages) {
        page = pages;
        lis.eq(2).html('<span>没有下一页了</span>');
    } else {
        lis.eq(2).html('<a href="javascript:;">下一页</a>');
    }
    if (comments.length === 0) {
        $('.messageList').html('<div class="messageBox"><p>还没有评论</p></div>');
    } else {
        var html = '';
        for (var i = start; i < end; i++) {
            html +=
                '<div class="messageBox"><p class="name clear"><span class="fl"><strong>' + comments[i].username + '</strong></span><span class="fr">' + formatData(comments[i].postTime) + '</span></p><p>' + comments[i].content + '</p></div>';
        }
        $('.messageList').html(html);
    }

};

//格式化评论时间的方法
function formatData(d) {
    var date1 = new Date(d);
    return date1.getFullYear() + '-' + (date1.getMonth() + 1) + '-' + date1.getDate() + '  ' + date1.getHours() + ':' + date1.getMinutes() + ':' + date1.getSeconds();
}

//进入文章详情页时，加载评论
$.ajax({
    url: '/api/comment',
    data: {
        contentid: $('#contentID').val()
    },
    success: function(responseData) {
        // console.log(responseData);
        comments = responseData.data.reverse();
        renderComment();
    }
});

//点击上一页下一页的评论
//时间委托
$('.pager').delegate('a', 'click', function() {
    if ($(this).parent().hasClass('previous')) {
        page--;
    } else {
        page++;
    }
    //重新加载上一页或者下一页的评论
    renderComment();
})