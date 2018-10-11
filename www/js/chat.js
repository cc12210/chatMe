// 初始化函数
window.onload = function () {
    var chatMe = new chatMain();
    chatMe.init();
};
// 定义一个socket为空
var chatMain = function () {
    this.socket = null;
};
// 将函数添加进原型中,使用构造函数模式
chatMain.prototype = {
    init: function () {
        // 定义_this为全局指向
        var _this = this;
        // 定义socket接收io连接的状态
        this.socket = io.connect();
        this.info = document.getElementById('info');
        // 输入昵称的input
        this.loginInput = document.getElementById('loginInput');
        // 发送消息的按钮
        this.sendText = document.querySelector('.sendText');
        // 登陆的按钮
        this.loginBtn = document.getElementById('loginBtn');
        // 表情的框
        this.emojiDiv = document.querySelector('.emojiDiv');
        // 表情框里面所有表情
        this.imgAll = this.emojiDiv.querySelectorAll('img');
        // 消息输入框
        this.textCon = document.querySelector('.textCon');
        // 颜色选择的input
        this.colorStyle = document.getElementById('colorStyle');
        // 当服务器已经连接了,可以让昵称输入框显示,并且提示用户输入
        this.socket.on('connect', function () {
            _this.info.innerHTML = "服务器已连接...";
            _this.info.style.color = 'skyblue';
            document.getElementById('loginDiv').style.display = 'block';
            document.getElementById('loginInput').focus();
        });
        // 给确定按钮添加点击事件
        _this.loginBtn.addEventListener('click', function () {
            // 获取到输入框的值并且去空
            var userName = _this.loginInput.value;
            // 如果去空之后的长度不为0,则代表用户有输入
            if (userName.trim().length != 0) {
                // 不能让用户的昵称长度无限制
                if (userName.trim().length <= 10) {
                    // 发送一个login事件,并且将输入框的值发送到服务器中
                    _this.socket.emit('login', userName);
                } else {
                    alert('狂拽霸气侧漏的昵称不需要那么长哟');
                }
            } else {
                // 没有昵称则对用户进行提示
                alert('输入一个昵称才能进入聊天室呢');
            }
        }, false);
        // 添加一个键盘事件,用户回车即可提交昵称,方便用户操作
        _this.loginInput.onkeydown = function (ev) {
            ev = ev || window.event;
            var keyCode = ev.keyCode || ec.which;
            if (keyCode == 13) {
                _this.loginBtn.click();
            }
        }
        // 对于用户名称重复的返回事件
        this.socket.on('userExit', function () {
            _this.info.innerHTML = '该名字已经被占用了,换个更好听的名字吧';
        });
        // 用户成功的事件
        this.socket.on('userIn', function () {
            // 让title标题显示用户昵称
            document.title = '你好' + _this.loginInput.value;
            document.querySelector('.login').style.display = 'none';
            _this.textCon.focus();;
        });
        this.socket.on('system', function (username, userIndex, type) {
            // 如果传过来的类型为登陆则消息为加入,否则为离开
            var msg = username + (type == 'login' ? '加入' : '离开');
            // 创建一个p元素,且将登陆/退出的用户名称和状态拼接到msg中，然后放在p元素中返回给页面
            var p = document.createElement('p');
            // 判断用户是退出还是登陆,给与不同的颜色属性
            if (type == 'login') {
                // 该css样式为绿色
                p.setAttribute('class', 'userLoginIn');
            } else {
                // 这个为红色
                p.setAttribute('class', 'userLoginOut');
            }
            p.innerHTML = msg;
            document.querySelector('.main-con').appendChild(p);
            document.getElementById('status').innerHTML = userIndex + '位用户在线';
        });
        // 给发送按钮添加点击事件
        _this.sendText.addEventListener('click', function () {
            var msg = _this.textCon.value,
                color = _this.colorStyle.value;
            // 获取完毕之后将原文本域清空
            _this.textCon.value = '';
            // 并且重新自动获取焦点
            _this.textCon.focus();
            // 如果文本值去空长度不为0,则向服务器发送sendMsg事件,携带输入的值一起发送
            if (msg.trim().length != 0) {
                _this.socket.emit('sendMsg', msg, color);
                _this._userNewMsg('我', msg, color);
            }
        }, false);
        this.colorStyle.oninput = function () {
            _this.textCon.style.color = _this.colorStyle.value;
        }
        // 事件委托,ctrl加回车可以发送消息
        this.textCon.onkeydown = function (ev) {
            ev = ev || window.event;
            var keyCode = ev.keyCode || ev.which;
            if (ev.ctrlKey) {
                if (keyCode == 13) {
                    _this.sendText.click();
                }
            }
        }
        this.socket.on('newMsg', function (username, msg, color) {
            _this._userNewMsg(username, msg, color);
        });
        // 清屏按钮,清空目前的消息记录
        document.getElementById('clearBtn').onclick = function () {
            document.querySelector('.main-con').innerHTML = "";
        }
        //图片功能有点问题,还没解决,发送图片之后有些时候不会自动置底=========================================
        document.getElementById('sendImage').addEventListener('change', function () {
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader();
                if (!reader) {
                    _this._userNewMsg('system', '你的浏览器不支持文件读取', 'red');
                    return;
                };
                reader.onload = function (ev) {
                    ev = ev || window.event;
                    var target = ev.target || ev.srcElement;
                    var color = document.getElementById('colorStyle').value;
                    this.value = "";
                    _this.socket.emit('img', target.result, color);
                    _this._userNewImg('我', target.result, color);
                    target.value = "";
                };
                reader.readAsDataURL(file);
                this.value = "";
            };

        }, false);
        // 触发图片事件,执行_userNewImg函数
        this.socket.on('newImg', function (user, img, color) {
            _this._userNewImg(user, img, color);
        });
        document.getElementById('emoji').addEventListener('click', function (ev) {
            _this.emojiDiv.style.display = 'block';
        }, false);
        this.emojiDiv.addEventListener('click', function (ev) {
            ev = ev || window.event;
            var target = ev.target || ev.srcElement;
            if (target.nodeName == "IMG") {
                _this.emojiDiv.style.display = 'none';
                var color = document.getElementById('colorStyle').value;
                // 这里发送表情就是将图片的src发送出去,然后那边进行处理就行
                _this.socket.emit('img', target.src, color);
                _this._userNewImg('我', target.src, color);
            }
        });
        document.body.addEventListener('click', function (ev) {
            ev = ev || window.event;
            var target = ev.target || ev.srcElement;
            if (target.nodeName != "INPUT") {
                _this.emojiDiv.style.display = 'none';
            }
        }, false);

    },
    // 用户发送消息用的函数,除了用户名还要获取颜色
    _userNewMsg: function (user, msg, color) {
        var myMsg = document.querySelector('.main-con'),
            newP = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        // 获取颜色值,默认为黑色
        newP.style.color = color;
        newP.className = 'textP';
        newP.innerHTML = '<span class="pSpan">' + user + '<span class="timeSpan">(' + date + '):</span>' + '</span>' + '<span class="conSpan">' + msg + '</span>';
        myMsg.appendChild(newP);
        // 使输入框始终居于底部
        myMsg.scrollTop = myMsg.scrollHeight;
    },
    // 这个发送图片函数跟上面的发送消息差不多,就是最后的时候变了一下
    _userNewImg: function (user, imgData, color) {
        var myMsg = document.querySelector('.main-con'),
            newP = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        // 获取颜色值,默认为黑色
        newP.style.color = color;
        // 这里就是跟上面的差异=============
        newP.innerHTML = '<span class="pSpan">' + user + '<span class="timeSpan">(' + date + '):</span><br/>' + '<img src=' + imgData + '>' + '</span>';
        myMsg.appendChild(newP);
        // 使输入框始终居于底部,图片的有点问题,暂时不知道为什么？？？？？？？？？？？
        myMsg.scrollTop = myMsg.scrollHeight;
    }
}