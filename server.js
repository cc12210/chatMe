// 引用express模块
var express = require('express'),
    // 声明一个对象去接收
    app = express(),
    // 引用http模块,并新建一个服务器存入server变量中
    server = require('http').createServer(app),
    // 引用socket.io模块
    io = require('socket.io').listen(server),
    // 创建一个数组,用来存储用户的昵称,实现展示用户数量的功能
    user = [];
// 告诉服务器项目路径位置,设置静态文件目录
app.use('/', express.static(__dirname + '/www'));
// 服务器监听80端口
server.listen(80);
// io接收消息,通过回调函数获取到值
io.on('connection', function (socket) {
    // 设置昵称
    socket.on('login', function (username) {
        // 服务器接收到用户登陆,判断用户名称是否存在,存在即返回userExit事件
        if (user.indexOf(username) > -1) {
            socket.emit('userExit');
        } else {
            // 如果不存在即将用户名称存储到user数组中
            socket.username = username;
            user.push(username);
            // 可以使用,则返回userIn事件
            socket.emit('userIn');
            // 提醒所有用户,有新用户加入,且返回用户的昵称给js
            io.sockets.emit('system', username, user.length, 'login');
        }
    });
    // socket自带的disconnect函数,当用户断开连接自动执行该函数
    socket.on('disconnect', function () {
        // 用户退出必须是已经登录成功的用户才进行提示
        if (socket.username != null) {
            // 将用户从user数组中删除
            user.splice(user.indexOf(socket.username), 1);
            // 广播除退出用户的全体消息,并且更新在线用户数量
            socket.broadcast.emit('system', socket.username, user.length, 'logout');
        }
    });
    // 接收到sendMsg事件,且将获取的msg以newMsg的事件返回回去,且带上用户名
    socket.on('sendMsg', function (msg, color) {
        socket.broadcast.emit('newMsg', socket.username, msg, color);
    });
    socket.on('img', function (imgData, color) {
        socket.broadcast.emit('newImg', socket.username, imgData, color);
    });
});