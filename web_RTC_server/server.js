var WebSocketServer = require('ws').Server;//添加依赖
var wss = new WebSocketServer({port: 8888});//端口配置
users = {};//在线用户

wss.on('connection',
	function(connection) {
	    console.log("有用户连接到了服务器！");
	    
	    //发送消息给客户端
	    function sendTo(conn, message) {
	        conn.send(JSON.stringify(message));
	    }
	    
	    //处理接收消息
	    connection.on('message',
		    function(message) {
		        var data;
		        try {
		            data = JSON.parse(message);
		        } catch(e) {
		            console.log("解析JSON字符串出错");
		            data = {};
		        }
		        
		        switch (data.type) {
		        case "login":
		            console.log("用户：",data.name," 发起了登录请求");
		            if (users[data.name]) {
		            	console.log("用户：",data.name," 已登录");
		                sendTo(connection, {
		                    type: "login",
		                    success: false,
		                    desc:"用户"+data.name+"已登录！"
		                });
		            } else {
		            	console.log("用户：",data.name," 登录成功");
		                users[data.name] = connection;
		                connection.name = data.name;
		                sendTo(connection, {
		                    type: "login",
		                    success: true,
		                    desc:"登录成功！"
		                });
		            }
		            break;
		            
		 		case "call":
		            console.log("用户：",connection.name,"正在呼叫：",data.name);
		            if(connection.name==data.name){
		            	console.log("用户：",connection.name,"呼叫的：",data.name,"是自己");
		            	sendTo(connection, {
		                    type: "call",
		                    success: false,
		                    desc:"不可以呼叫自己！"
		                });
		            }else{
		            	var conn = users[data.name];
			            if (conn != null) {
			            	console.log("用户：",connection.name,"呼叫：",data.name,"成功");
			                connection.otherName = data.name;
			                sendTo(conn, {
			                    type: "call",
			                    success: true,
			                    desc: "收到来自"+data.name+"的视频呼叫！",
			                    name:connection.name
			                });
			            }else{
			            	console.log("用户：",connection.name,"呼叫的：",data.name,"不在线");
			            	sendTo(connection, {
			                    type: "call",
			                    success: false,
			                    desc:"呼叫用户不在线！"
			                });
			            }
		            }
		            break;
		        
		        case "cancel":
		            console.log("用户：",connection.name,"取消了视频请求");
		            var conn = users[data.name];
		            if (conn != null) {
		            	connection.otherName = data.name;
		            	sendTo(conn, {
		                    type: "cancel",
		                    success: true,
		                    desc:"对方取消了视频请求！",
		                    name:connection.name
		               	});
		            }
		            break;
		            
		        case "agree":
		        	console.log("用户：",connection.name,"同意了",data.name,"的视频请求");
		            var conn = users[data.name];
		            if (conn != null) {
		                connection.otherName = data.name;
		                sendTo(conn, {
		                    type: "agree",
		                    success: true,
		                    desc:"对方同意了你的视频请求！",
		                    name:connection.name
		                });
		            }
		        	break;
		        	
		        case "disagree":
		        	console.log("用户：",connection.name,"拒绝了",data.name,"的视频请求");
		            var conn = users[data.name];
		            if (conn != null) {
		                connection.otherName = data.name;
		                sendTo(conn, {
		                    type: "disagree",
		                    success: true,
		                    desc:"对方拒绝了你的视频请求！",
		                    name:connection.name
		                });
		            }
		        	break;
		        	
		        case "offer":
		            console.log("用户：",connection.name,"连接用户：",data.name);
		            var conn = users[data.name];
		            if (conn != null) {
		                connection.otherName = data.name;
		                sendTo(conn, {
		                    type: "offer",
		                    offer: data.offer,
		                    name: connection.name
		                });
		            }
		            break;
		 
		        case "answer":
		            console.log("用户：",connection.name,"发送应答给：", data.name);
		            var conn = users[data.name];
		            if (conn != null) {
		                connection.otherName = data.name;
		                sendTo(conn, {
		                    type: "answer",
		                    answer: data.answer,
		                    name:connection.name
		                });
		            }
		            break;
		 
		        case "candidate":
		            console.log("用户：",connection.name,"发送申请给：", data.name);
		            var conn = users[data.name];
		            if (conn != null) {
		            	connection.otherName = data.name;
		                sendTo(conn, {
		                    type: "candidate",
		                    candidate: data.candidate,
		                    name:connection.name
		                });
		            }
		            break;
		 
		        case "leave":
		            console.log("用户：",connection.name,"结束了视频通话");
		            var conn = users[data.name];
		            conn.otherName = null;
		            if (conn != null) {
		            	connection.otherName = data.name;
		                sendTo(conn, {
		                    type: "leave",
		                    success: true,
		                    desc:"对方中断了视频通话！",
		                    name:connection.name
		                });
		            }
		            break;
		 
		        default:
		            sendTo(connection, {
		                type: "error",
		                message: "无法识别的指令:" + data.type
		            });
		            break;
		        }
		    }
		);
	 
	 	//关闭连接
	    connection.on('close',
		    function() {
		        if (connection.name) {
		        	console.log(connection.name,"下线了");
		            delete users[connection.name];
		            if (connection.otherName) {
		                var conn = users[connection.otherName];
		                if (conn != null) {
		                    sendTo(conn, {
		                        type: "leave"
		                    });
		                }
		            }
		        }
		    }
	    );
	 
	 	//发送消息
	    connection.send('{"Hello":"欢迎光临！"}');
	}
);
 
wss.on('listening',
	function() {
	    console.log("Server服务启动中...");
	}
);