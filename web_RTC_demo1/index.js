//WebRTC需要通过长链接查找到通信双方，然后通过 peer to peer 的方式传输音频数据。（即WebRTC需要一个信令服务器，也就是一个socket链接用来发起音视频通信，发送WebRTC中的offer和回复answer，这里使用node.js搭建webSocket信令服务器。）
//WebRTC需要打洞服务器（一个stun，一个turn）来穿透防火墙等，我们需要配置打洞服务器
//WebRTC中最主要的就是一个叫做PeerConnection的对象，这个是WebRTC中已经封装好的对象。每一路的音视频会话都会有唯一的一个PeerConnection对象，WebRTC通过这个PeerConnection对象进行视频的发起、传输、接收和挂断等操作。


/*A向B发起通信请求过程

1.	A链接socket；
2.	A获取音视频数据；
3.	A创建一个Ice Candidate打洞服务；
4.	A通过创建好的Ice Candidate创建一个PeerConnection；
5.	A创建一个offer，offer中包含了视频设置sdp，将创建好的offer设置为PeerConnection的localDescription；
6. 	A同时将创建的offer和Ice Candidate通过socket发送给B；
7.	将A获取到的音频数据存入PeerConnection；
8.	如果B先接收到A发过来的offer，那么先将offer存起来，等到接收到A发过来的Ice Candidate后通过Ice Candidate创建一个PeerConnection，再将保存好的offer设置为PeerConnection的remoteDescription。
9.	如果B先接收到A发过来的Ice Candidate，那么通过A发过来的Ice Candidate创建一个PeerConnection，然后等待接收到A发过来的offer，再将A发过来的offer设置为PeerConnection的remoteDescription；
10.	B接收到A发过来的offer后要创建一个answer，将answer设置为PeerConnection的localDescription。并且将创建的answer通过socket返回给A。
11.	B开始获取音频数据，将音频数据存入PeerConnection中，WebRTC便会自动将音频数据发送给A。
12.	A接收到B返回的answer，将B返回的answer设置为PeerConnection的remoteDescription。
13.	这个时候WebRTC会将音频数据自动发送给B，A和B就创建起了实时音视频通信。
*/

var connection = new WebSocket('ws://192.168.0.16:8888'); //创建连接（本机ip）
var selfConnection; //自己的信息
var connectedUser; //他人的信息
var stream; //媒体流
var mediaStreamTrack; //音轨或视频

//登录模块
var loginPage = document.querySelector('#login-page'); //登录页
var usernameInput = document.querySelector('#username'); //用户名
var loginButton = document.querySelector('#login'); //登录按钮

//呼叫模块
var callPage = document.querySelector('#call-page'); //呼叫页
var theirUsernameInput = document.querySelector('#their-username'); //呼叫的用户
var callButton = document.querySelector('#call'); //呼叫按钮

//等待模块
var waitPage = document.querySelector('#wait-page'); //等待页
var cancelButton = document.querySelector('#cancel'); //取消按钮

//接收模块
var linkPage = document.querySelector('#link-page'); //接收呼叫页
var agreeButton = document.querySelector('#agree'); //同意按钮
var disagreeButton = document.querySelector('#disagree'); //不同意按钮

//显示模块
var showPage = document.querySelector('#show-page'); //视频会话页
var hangUpButton = document.querySelector('#hang-up'); //挂断按钮

var selfVideo = document.querySelector('#yours'); //自己的视频
var theirVideo = document.querySelector('#theirs'); //对方的视频

loginPage.style.display = "block"; //显示登录页
callPage.style.display = "none"; //隐藏呼叫页
waitPage.style.display = "none"; //隐藏等待页
linkPage.style.display = "none"; //隐藏接收呼叫页
showPage.style.display = "none"; //隐藏视频会话页


//以json格式向服务器发消息
function send(message) {
    if (!message.name && connectedUser) {
        message.name = connectedUser;
    }
    connection.send(JSON.stringify(message));
};

//点击登录
loginButton.addEventListener("click",
    function(event) {
        var name = usernameInput.value;
        if (name.length > 0) {
            send({
                type: "login",
                name: name
            });
        } else {
            alert('请输入要登录的用户名！')
        }
    }
);
//登录结果
function onLogin(success, desc) {
    if (success === false) {
        alert(desc);
    } else {
        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "block"; //显示呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "none"; //隐藏接收呼叫页
        showPage.style.display = "none"; //隐藏视频会话页
    }
};

//点击呼叫
callButton.addEventListener("click",
    function(event) {
        var theirname = theirUsernameInput.value;
        if (theirname.length > 0) {
            loginPage.style.display = "none"; //隐藏登录页
            callPage.style.display = "none"; //隐藏呼叫页
            waitPage.style.display = "block"; //显示等待页
            linkPage.style.display = "none"; //隐藏接收呼叫页
            showPage.style.display = "none"; //隐藏视频会话页
            document.querySelector('#wait-page p').innerHTML = "正在向" + theirname + "发出视频邀请";
            send({
                type: "call",
                name: theirname
            });
            document.getElementById('wait').play();
        } else {
            alert('请输入要呼叫的用户名！')
        }
    }
);

//呼叫结果
function onCall(success, desc, name) {
    if (success === false) {
        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "block"; //显示呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "none"; //隐藏接收呼叫页
        showPage.style.display = "none"; //隐藏视频会话页
        document.getElementById('wait').pause();
        document.getElementById('link').pause();
        alert(desc);
    } else {
        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "none"; //隐藏呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "block"; //显示接收呼叫页
        showPage.style.display = "none"; //隐藏视频会话页

        document.querySelector('#link-page>p').innerHTML = "收到来自" + name + "的视频请求";
        sessionStorage.setItem('theirname', name);
        document.getElementById('link').play();
    }
};

//点击取消
cancelButton.addEventListener("click",
    function(event) {
        document.getElementById('wait').pause();
        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "block"; //显示呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "none"; //隐藏接收呼叫页
        showPage.style.display = "none"; //隐藏视频会话页

        var theirname = theirUsernameInput.value;
        send({
            type: "cancel",
            name: theirname
        });
    }
);
//取消结果
function onCancel(success, desc, name) {
    if (success === false) {
        alert(desc);
    } else {
        document.getElementById('link').pause();
        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "block"; //显示呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "none"; //隐藏接收呼叫页
        showPage.style.display = "none"; //隐藏视频会话页
    }
};

//同意
agreeButton.addEventListener("click",
    function(event) {
        document.getElementById('link').pause();
        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "none"; //隐藏呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "none"; //隐藏接收呼叫页
        showPage.style.display = "block"; //显示视频会话页

        startConnection(); //打开本地音视频，准备进行通话
        var theirname = sessionStorage.getItem('theirname');
        send({
            type: "agree",
            name: theirname
        });
        setTimeout(function() {
            startPeerConnection(theirname); //开始PeerConnection
        }, 2000);
    }
);
//同意结果
function onAgree(success, desc, name) {
    if (success === false) {
        alert(desc);
    } else {
        document.getElementById('wait').pause();
        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "none"; //隐藏呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "none"; //隐藏接收呼叫页
        showPage.style.display = "block"; //显示视频会话页

        startConnection(); //打开本地音视频，准备进行通话
        setTimeout(function() {
            startPeerConnection(name); //开始PeerConnection
        }, 2000);
    }
};

//点击不同意
disagreeButton.addEventListener("click",
    function(event) {
        document.getElementById('link').pause();
        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "block"; //显示呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "none"; //隐藏接收呼叫页
        showPage.style.display = "none"; //隐藏视频会话页

        var theirname = sessionStorage.getItem('theirname');
        send({
            type: "disagree",
            name: theirname
        });
    }
);
//不同意结果
function onDisagree(success, desc, name) {
    if (success === false) {
        alert(desc);
    } else {
        document.getElementById('wait').pause();
        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "block"; //显示呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "none"; //隐藏接收呼叫页
        showPage.style.display = "none"; //隐藏视频会话页
    }
};

//点击挂断
hangUpButton.addEventListener("click",
    function(event) {
        selfVideo.pause();
        mediaStreamTrack.getTracks().forEach(track => {
            track.stop();
        });

        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "block"; //显示呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "none"; //隐藏接收呼叫页
        showPage.style.display = "none"; //隐藏视频会话页

        var theirname = sessionStorage.getItem('theirname');
        send({
            type: "leave",
            name: theirname
        });
    }
);
//挂断结果
function onLeave(success, desc, name) {
    if (success === false) {
        alert(desc);
    } else {
        selfVideo.pause();
        mediaStreamTrack.getTracks().forEach(track => {
            track.stop();
        });

        loginPage.style.display = "none"; //隐藏登录页
        callPage.style.display = "block"; //显示呼叫页
        waitPage.style.display = "none"; //隐藏等待页
        linkPage.style.display = "none"; //隐藏接收呼叫页
        showPage.style.display = "none"; //隐藏视频会话页
    }

    connectedUser = name;
    theirVideo.src = null;
    selfConnection.close();
    selfConnection.onicecandidate = null;
    selfConnection.onaddstream = null;
    setupPeerConnection(stream); //创建PeerConnection
};


//是否支持RTCPeerConnection（判断浏览器是否支持WebRTC）
function hasRTCPeerConnection() {
    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
    window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
    window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
    return !!window.RTCPeerConnection;
}

function show(stream) {
    stream = stream;
    mediaStreamTrack = stream;
    try {
        selfVideo.src = (window.URL || window.webkitURL).createObjectURL(stream);
    } catch (e) {
        selfVideo.srcObject = stream;
    }
    selfVideo.play();
    if (hasRTCPeerConnection()) {
        setupPeerConnection(stream); //创建PeerConnection
    } else {
        alert("Sorry,你的浏览器不支持 WebRTC.");
    }
}

//打开本地音视频，准备进行通话
function startConnection() {
    navigator.getMediaNew = navigator.mediaDevices && navigator.mediaDevices.getUserMedia; //获取媒体方法（新方法）
    navigator.getMediaOld = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMeddia || navigator.msGetUserMedia; //获取媒体方法（旧方法）

    //使用新方法打开摄像头
    if (navigator.getMediaNew) {
        console.log('使用新方法打开摄像头');
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(function(stream) {
            show(stream);
        }).catch(function(err) {
            alert("err1:" + err);
        });
    }
    //使用旧方法打开摄像头
    else if (navigator.getMediaOld) {
        console.log('使用旧方法打开摄像头');
        navigator.getUserMedia({
            video: true,
            audio: true
        }, function(stream) {
            show(stream);
        }, function(err) {
            alert("err2:" + err);
        });
    } else {
        alert("Sorry, 你的浏览器不支持 WebRTC.");
    }
}

//创建PeerConnection的对象
function setupPeerConnection(stream) {
    var configuration = {
        //配置打洞服务器
        "iceServers": [{
            "urls": ["stun:stun.1.google.com:19302", "stun:stun.services.mozilla.com"]
        }, {
            "urls": ["turn:numb.viagenie.ca"],
            "username": "webrtc@live.com",
            "credential": "muazkh"
        }],
        sdpSemantics: 'plan-b'
    };

    selfConnection = new RTCPeerConnection(configuration); //创建PeerConnection的对象（创建时需要传入打洞服务器的配置信息，如果不传入打洞服务器的配置信息，则只可以在内网中使用实时音视频通讯。）
    //创建视频流
    selfConnection.addStream(stream); //向PeerConnection中加入需要发送的数据流，参数类型：MediaStream
    selfConnection.onaddstream = function(event) { //传入一个回调方法，该回调方法有一个返回参数，返回参数类型为：``，如果检测到有远程媒体流传输到本地之后便会调用该方法。
        console.log("检测到有远程媒体流传输到本地");
        try {
            theirVideo.src = (window.URL || window.webkitURL).createObjectURL(event.stream);
        } catch (e) {
            theirVideo.srcObject = event.stream;
        }
        theirVideo.play();
    };
    selfConnection.onicecandidate = function(event) { //发送打洞服务器配置信息 传入一个回调方法，该回调方法有一个返回参数，返回参数类型为：RTCIceCandidateEvent
        if (event.candidate) {
            send({
                type: "candidate",
                candidate: event.candidate
            });
        }
    }
}

//开始PeerConnection 发起通话请求
function startPeerConnection(user) {
    connectedUser = user;
    //开始会话
    selfConnection.createOffer(function(offer) { //创建一个offer，需要传入两个参数，第一个参数是创建offer成功的回调方法，会返回创建好的offer，可以在这里将这个offer发送出去。第二个参数是创建失败的回调方法，会返回错误信息。
            send({
                type: "offer",
                offer: offer
            });
            selfConnection.setLocalDescription(offer); //设置本地offer，将自己的描述信息加入到PeerConnection中，参数类型：RTCSessionDescription
        },
        function(error) {
            alert("发生了一个错误：" + error);
        });
};
//呼叫
function onOffer(offer, name) {
    connectedUser = name;
    selfConnection.setRemoteDescription(new RTCSessionDescription(offer)); //设置远端的answer，将对方的描述信息加入到PeerConnection中，参数类型：RTCSessionDescription
    selfConnection.createAnswer(function(answer) { //创建一个应答answer，需要传入两个参数，第一个参数是创建answer成功的回调方法，会返回创建好的answer，可以在这里将这个answer发送出去。第二个参数是创建失败的回调方法，会返回错误信息。
            selfConnection.setLocalDescription(answer); //设置本地描述信息offer，将自己的描述信息加入到PeerConnection中，参数类型：RTCSessionDescription
            send({
                type: "answer",
                answer: answer
            });
        },
        function(error) {
            alert("发生一个错误：" + error);
        });
}

//应答
function onAnswer(answer) {
    selfConnection.setRemoteDescription(new RTCSessionDescription(answer)); //设置远端的answer，将对方的描述信息加入到PeerConnection中，参数类型：RTCSessionDescription
}

//申请
function onCandidate(candidate) {
    selfConnection.addIceCandidate(new RTCIceCandidate(candidate)); //将打洞服务器加入到配置信息中，参数类型：RTCIceCandidate
}



//发起连接
connection.onopen = function() {
    console.log("成功连接到服务器！");
};

//接收服务器消息
connection.onmessage = function(message) {
    console.log("收到消息：", message.data);
    var data = JSON.parse(message.data);
    switch (data.type) {
        case "login":
            onLogin(data.success, data.desc);
            break;
        case "call":
            onCall(data.success, data.desc, data.name);
            break;
        case "cancel":
            onCancel(data.success, data.desc, data.name);
            break;
        case "agree":
            onAgree(data.success, data.desc, data.name);
            break;
        case "disagree":
            onDisagree(data.success, data.desc, data.name);
            break;
        case "offer":
            onOffer(data.offer, data.name);
            break;
        case "answer":
            onAnswer(data.answer, data.name);
            break;
        case "candidate":
            onCandidate(data.candidate, data.name);
            break;
        case "leave":
            onLeave(data.success, data.desc, data.name);
            break;
        default:
            break;
    }
};
connection.onclose = (err) => {
    alert('与服务器连接中断');
    console.log("与服务器连接中断：", err);
};
connection.onerror = function(err) {
    console.log("错误信息：", err);
};