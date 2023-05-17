<template>
	<div>	
		<mt-header fixed :title="title">
			<mt-button slot="left" icon="back" @click="back"></mt-button>
		</mt-header>
		<div class="content">
			
			<div class="block" v-if="loginStatus"> 
			   	<p>登录</p> 
			   	<input type="text" autocomplete="off" placeholder="请输入用户名" v-model="selfsName"/> 
			   	<div class="btn-group">
			   		<mt-button @click.native="login">登录</mt-button>
			   	</div> 	
		  	</div>
		  	
		  	<div class="block" v-if="callStatus"> 
			   	<p>呼叫</p> 
			   	<input type="text" placeholder="请输入对方用户名" v-model="othersName"/> 
			   	<div class="btn-group">
			   		<mt-button size="small" @click.native="call">呼叫</mt-button>
			   	</div> 
		  	</div>
		  	
		  	<div class="block" v-if="waitStatus"> 
		  		<audio id="wait" :src="waitMp3" loop></audio>
			   	<p>{{waitTips}}</p>
			   	<div class="btn-group">
			   		<mt-button size="small" @click.native="cancel">取消</mt-button>
			   	</div> 
		  	</div> 
		  	
		  	<div class="block" v-if="linkStatus"> 
		  		<audio id="link" :src="linkMp3" loop></audio>
			   	<p>{{linkTips}}</p> 
			   	<div class="btn-group">
			   		<mt-button size="small" @click.native="agree">同意</mt-button>
			   		<mt-button size="small" @click.native="disagree">不同意</mt-button>
			   	</div> 	
		  	</div> 
		  	
		  	<div class="show" v-if="showStatus"> 
		  		<div class="video">
		  			<video class="others" id="others" @click="change"></video> 
			   		<video class="selfs" id="selfs" muted @click="change"></video> 
		  		</div>
			   	<div class="btn-group">
			   		<mt-button size="small" @click.native="leave">挂断</mt-button>
			   	</div> 
		  	</div>
		  	
		</div>
	</div>
</template>
<script>
	import { Toast } from 'mint-ui'
	import Wait from '../../static/wait.mp3'
	import Link from '../../static/link.mp3'
	export default{
	  name: 'VideoVerification',
	  data () {
	    return {
	      title: '视频验证', // 标题
	
	      connection: new WebSocket('ws://192.168.0.16:8888'), // 创建连接(本机ip+server端口)
	      selfConnection: '', // 自己的信息
	      connectedUser: '', // 他人的信息
	      stream: '', // 媒体流
	      mediaStreamTrack: '', // 音轨或视频
	
	      loginStatus: true, // 登录模块显示状态
	      callStatus: false, // 呼叫模块显示状态
	      waitStatus: false, // 正在呼叫模块显示状态
	      linkStatus: false, // 收到呼叫模块显示状态
	      showStatus: false, // 显示模块状态
	
	      selfsName: '', // 自己
	      othersName: '', // 他人
	      waitTips: '正在呼叫', // 正在呼叫提示
	      linkTips: '收到呼叫', // 收到呼叫提示
	
	      waitMp3: '',
	      linkMp3: '',
	
	      selfVideo: '', // 自己视频
	      othersVideo: '', // 他人的视频
	      config: {
	        video: true,
	        audio: false
	}
	}
	},
	  mounted () {
	    this.waitMp3 = Wait
	    this.linkMp3 = Link
	    this.showModle('login')
	
		// 发起连接
	    this.connection.onopen = () => {
	      console.log('成功连接到服务器')
	}
			// 接收服务器消息
	    this.connection.onmessage = (message) => {
			    console.log('收到消息：', message.data)
		    var data = JSON.parse(message.data)
		    switch (data.type) {
				    case 'login':
				        this.onLogin(data.success, data.desc)
			        break
			    case 'call':
				        this.onCall(data.success, data.desc, data.name)
			        break
			    case 'cancel':
				        this.onCancel(data.success, data.desc, data.name)
			        break
			    case 'agree':
				        this.onAgree(data.success, data.desc, data.name)
			        break
			    case 'disagree':
				        this.onDisagree(data.success, data.desc, data.name)
			        break
			    case 'offer':
				        this.onOffer(data.offer, data.name)
			        break
			    case 'answer':
				        this.onAnswer(data.answer, data.name)
			        break
			    case 'candidate':
				        this.onCandidate(data.candidate, data.name)
			        break
			    case 'leave':
				        this.onLeave(data.success, data.desc, data.name)
			        break
			    default:
				        break
		    }
	}
	
	    this.connection.onclose = (err) => {
	      this.toast('与服务器连接中断')
		    console.log('与服务器连接中断：', err)
	}

    this.connection.onerror = (err) => {
			    console.log('错误信息：', err)
	    }
  },
	  methods: {
			// 返回上一页
	    back () {
	      this.$router.go(-1)
	    },
	
			// 点击小窗改变视角
	    change (e) {
	      let selfClass = $(e.currentTarget).attr('class')
	      let brothersClass = $(e.currentTarget).siblings().attr('class')
	      if (selfClass == 'selfs') {
	        $(e.currentTarget).removeClass('selfs').addClass('others')
	        $(e.currentTarget).siblings().removeClass('others').addClass('selfs')
	}
	},
	
			// 显示模块
	    showModle (type) {
	      this.loginStatus = false
	      this.callStatus = false
	      this.waitStatus = false
	      this.linkStatus = false
	      this.showStatus = false
	      switch (type) {
	        case 'login':
	          this.loginStatus = true
	          break
        case 'call':
	          this.callStatus = true
	          break
        case 'wait':
	          this.waitStatus = true
	          break
        case 'link':
	          this.linkStatus = true
	          break
        case 'show':
	          this.showStatus = true
	          break
        default:
	          break
	}
	},
			// 1.5秒的toast提示
	    toast (text) {
	      Toast({
	              	message: text,
	              	duration: 1500
	})
	},
	
	    checkAudio () {
	      let _this = this;
	      (navigator.webkitGetUserMedia || navigator.getUserMedia || navigator.mozGetUserMeddia || navigator.msGetUserMedia || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)).call(navigator,
				{audio: true}
				, function () {
	  _this.toast('支持录音')
	  _this.config.audio = true
	  _this.startConnection()
	}, function (e) {
	  _this.toast('不支持录音')
	  _this.config.audio = false
	  _this.startConnection()
	})
	    },
	
			// 以json格式向服务器发消息
	    send (message) {
	      if (!message.name && this.connectedUser) {
			        message.name = this.connectedUser
		    }
	
	      this.connection.send(JSON.stringify(message))
	    },
	
			// 点击登录
	    login () {
	      if (this.selfsName) {
	        this.send({
			            type: 'login',
			            name: this.selfsName
			        })
	      } else {
	        this.toast('请输入要登录的用户名!')
	      }
	},
			// 登录结果
	    onLogin (success, desc) {
	      this.toast(desc)
		    if (success) {
			    	this.showModle('call')
		    }
	},
	
			// 点击呼叫
	    call () {
	      if (this.othersName) {
	        console.log(this.othersName)
	        this.showModle('wait')
	        this.waitTips = '正在向' + this.othersName + '发出视频邀请'
	        this.send({
			            type: 'call',
			            name: this.othersName
			        })
		        setTimeout(() => {
	          document.getElementById('wait').play()
	        }, 0)
	      } else {
	        this.toast('请输入要呼叫的用户名!')
	      }
	},
			// 呼叫结果
	    onCall (success, desc, name) {
	      this.toast(desc)
		    if (success === false) {
			    	this.showModle('call')
		    	setTimeout(() => {
	      document.getElementById('wait').pause()
		    		document.getElementById('link').pause()
	    }, 0)
		    } else {
			        this.showModle('link')
	      this.linkTips = '收到来自' + name + '的视频请求'
	      this.connectedUser = name
	      setTimeout(() => {
	        document.getElementById('link').play()
	}, 0)
		    }
	},
	
			// 点击取消
	    cancel () {
	      document.getElementById('wait').pause()
	      this.showModle('call')
	      this.send({
		            type: 'cancel',
		            name: this.othersName
		       	})
	    },
			// 取消结果
	    onCancel (success, desc, name) {
	      this.toast(desc)
		    if (success) {
			    	document.getElementById('link').pause()
		        this.showModle('call')
		    }
	},
	
			// 点击同意
	    agree () {
	      document.getElementById('link').pause()
	      this.showModle('show')
	      this.checkAudio()// 打开本地音视频，准备进行通话
	      this.send({
		            type: 'agree',
		            name: this.connectedUser
		       	})
	       	setTimeout(() => {
	         this.startPeerConnection(this.connectedUser)// 开始PeerConnection
	       }, 3500)
	    },
			// 同意结果
	    onAgree (success, desc, name) {
	      this.toast(desc)
	      if (success) {
			   		document.getElementById('wait').pause()
		        this.showModle('show')
	        this.checkAudio()// 打开本地音视频，准备进行通话
	        setTimeout(() => {
	          this.startPeerConnection(name)// 开始PeerConnection
	}, 3500)
		    }
	},
	
			// 点击不同意
	    disagree () {
	      document.getElementById('link').pause()
	      this.showModle('call')
	      this.send({
		            type: 'disagree',
		            name: this.connectedUser
		       	})
	    },
			// 不同意结果
	    onDisagree (success, desc, name) {
	      this.toast(desc)
	      if (success) {
			   		document.getElementById('wait').pause()
		        this.showModle('call')
		    }
	},
	
			// 点击挂断
	    leave () {
	      this.showModle('call')
	      this.send({
		            type: 'leave',
		            name: this.connectedUser
		       	})
	       	this.selfVideo.pause()
	       	this.mediaStreamTrack.getTracks().forEach(track => {
				    track.stop()
	       })
	    },
			// 挂断结果
	    onLeave (success, desc, name) {
	      this.toast(desc)
	      if (success) {
	        this.showModle('call')
	        this.selfVideo.pause()
	        this.connectedUser = name
		       	this.mediaStreamTrack.getTracks().forEach(track => {
					    track.stop()
	       })
			    this.selfConnection.close()
			    this.selfConnection.onicecandidate = null
			    this.selfConnection.onaddstream = null
			    this.setupPeerConnection(this.stream)// 创建PeerConnection
		   	}
	},
	
			// 是否支持RTCPeerConnection（判断浏览器是否支持WebRTC）
	    hasRTCPeerConnection () {
			    window.RTCPeerConnection = window.RTCPeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection
		    window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription
		    window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate
		    return !!window.RTCPeerConnection
	    },
	
	    show (stream) {
	      this.stream = this.mediaStreamTrack = stream
	      this.selfVideo = document.getElementById('selfs')
		    try {
			      	this.selfVideo.src = (window.URL || window.webkitURL).createObjectURL(stream)
		    } catch (e) {
			      	this.selfVideo.srcObject = stream
		    }
			    this.selfVideo.play()
		    if (this.hasRTCPeerConnection()) {
			        this.setupPeerConnection(stream)// 创建PeerConnection
		    } else {
			        this.toast('不支持 WebRTC!')
		    }
	},
	
			// 打开本地音视频，准备进行通话
	    startConnection () {
	      let _this = this
		  	navigator.getMediaNew = navigator.mediaDevices && navigator.mediaDevices.getUserMedia// 获取媒体方法（新方法）
	      navigator.getMediaOld = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMeddia || navigator.msGetUserMedia// 获取媒体方法（旧方法）
	
			// 使用旧方法打开摄像头
	      if (navigator.getMediaOld) {
	        console.log('使用旧方法打开摄像头')
			    navigator.getUserMedia(_this.config, function (stream) {
				      	_this.show(stream)
			    }, function (err) {
				      	_this.toast('err2:' + err)
			    })
	}
				// 使用新方法打开摄像头
	      else if (navigator.getMediaNew) {
	        console.log('使用新方法打开摄像头')
			    navigator.mediaDevices.getUserMedia(_this.config).then(function (stream) {
			            _this.show(stream)
			    }).catch(function (err) {
				      	_this.toast('err1:' + err)
			    })
	      }		    else {
			        _this.toast('不支持 WebRTC!')
		    }
	},
	
			// 创建PeerConnection的对象
	    setupPeerConnection (stream) {
	      let _this = this
		    let configuration = {
			    	// 配置打洞服务器
			        'iceServers': [{
			            'urls': ['stun:stun.1.google.com:19302', 'stun:stun.services.mozilla.com']
			        }, {
			        	'urls': ['turn:numb.viagenie.ca'],
				        'username': 'webrtc@live.com',
				        'credential': 'muazkh'
			        }],
			        sdpSemantics: 'plan-b'
			    }
	
		    _this.selfConnection = new RTCPeerConnection(configuration)// 创建PeerConnection的对象（创建时需要传入打洞服务器的配置信息，如果不传入打洞服务器的配置信息，则只可以在内网中使用实时音视频通讯。）
		    // 创建视频流
		    _this.selfConnection.addStream(stream)// 向PeerConnection中加入需要发送的数据流，参数类型：MediaStream
		    _this.selfConnection.onaddstream = function (event) { // 传入一个回调方法，该回调方法有一个返回参数，返回参数类型为：``，如果检测到有远程媒体流传输到本地之后便会调用该方法。
			    	console.log('检测到有远程媒体流传输到本地')
		    	this.othersVideo = document.getElementById('others')
		        try {
				      	this.othersVideo.src = (window.URL || window.webkitURL).createObjectURL(event.stream)
			    } catch (e) {
				      	this.othersVideo.srcObject = event.stream
			    }
				    this.othersVideo.play()
		    }
		    _this.selfConnection.onicecandidate = function (event) { // 发送打洞服务器配置信息 传入一个回调方法，该回调方法有一个返回参数，返回参数类型为：RTCIceCandidateEvent
			        if (event.candidate) {
			            _this.send({
			                type: 'candidate',
			                candidate: event.candidate
			            })
		        }
			    }
	},
	
			// 开始PeerConnection 发起通话请求
	    startPeerConnection (user) {
	      let _this = this
		    _this.connectedUser = user
		    // 开始会话
		    _this.selfConnection.createOffer(function (offer) { // 创建一个offer，需要传入两个参数，第一个参数是创建offer成功的回调方法，会返回创建好的offer，可以在这里将这个offer发送出去。第二个参数是创建失败的回调方法，会返回错误信息。
			        _this.send({
			            type: 'offer',
			            offer: offer
			        })
		        _this.selfConnection.setLocalDescription(offer)// 设置本地offer，将自己的描述信息加入到PeerConnection中，参数类型：RTCSessionDescription
		    },
			    function (error) {
			        _this.toast('发生了一个错误：' + error)
		    })
	    },
	
			// 呼叫
	    onOffer (offer, name) {
	      let _this = this
		    _this.connectedUser = name
		    _this.selfConnection.setRemoteDescription(new RTCSessionDescription(offer))// 设置远端的answer，将对方的描述信息加入到PeerConnection中，参数类型：RTCSessionDescription
		    _this.selfConnection.createAnswer(function (answer) { // 创建一个应答answer，需要传入两个参数，第一个参数是创建answer成功的回调方法，会返回创建好的answer，可以在这里将这个answer发送出去。第二个参数是创建失败的回调方法，会返回错误信息。
			        _this.selfConnection.setLocalDescription(answer)// 设置本地描述信息offer，将自己的描述信息加入到PeerConnection中，参数类型：RTCSessionDescription
		        _this.send({
			            type: 'answer',
			            answer: answer
			        })
		    },
			    function (error) {
			        _this.toast('发生一个错误：' + error)
		    })
	    },

			// 应答
	    onAnswer (answer) {
			    this.selfConnection.setRemoteDescription(new RTCSessionDescription(answer))// 设置远端的answer，将对方的描述信息加入到PeerConnection中，参数类型：RTCSessionDescription
	    },

			// 申请
	    onCandidate (candidate) {
			    this.selfConnection.addIceCandidate(new RTCIceCandidate(candidate))// 将打洞服务器加入到配置信息中，参数类型：RTCIceCandidate
	    }
	
	}
	}
</script>

<style scoped="scoped" lang="stylus" rel="stylesheet/stylus">
	@import "~common/style/base"
	.content
		position(absolute,0,0,0,0)
		padding:1.5rem 0.5rem 0.3rem
		color:$color_3
		background:$color_f2
		overflow:scroll	
		.block
			margin-top:0.3rem
			w_h()
			padding:0.8rem
			background:$color_f
			border-radius:0.2rem
			p
				font-size:0.6rem
				font-weight:700
				text-align:center
			input
				margin-top:0.5rem
				display: block
				w_h()
				padding:0.3rem
				font-size:0.45rem
				border:1px solid $color_d
				border-radius:0.2rem
		.btn-group
			margin-top:0.5rem
			flex(space-around)
			.mint-button
				padding:0.15rem 0
				w_h(2.5rem)
				font-size:0.5rem
				color:$color_f
				background: $color_on
				border-radius:0.5rem
		.show
			position(fixed,1.4rem,0,0,0)
			background:$color_0
			.video
				w_h(,90%)
			video
				background:$color_0;
				border: 1px solid $color_9;
			.others
				w_h(,97%)
			.selfs
				position(absolute,0.15rem,auto,auto,0.15rem,1)
				w_h(25%,3.6rem);
			.btn-group
				margin:0.2rem auto
			
</style>