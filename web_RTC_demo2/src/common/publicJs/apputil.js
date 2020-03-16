import Vue from 'vue'
import axios from 'axios'
import qs from 'qs'
import { MessageBox,Toast } from 'mint-ui'

import router from '../../router/index.js'
const vue = new Vue({
    router
});

//axios配置
//全局的 axios 默认值:指定将被用在各个请求的配置默认值
axios.defaults.timeout = 20000;//设置超时时间
//axios.defaults.baseURL = process.env.API_ROOT;
//axios.defaults.headers.common['Authorization'] = AUTH_TOKEN;
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
//axios.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';//此处是增加的代码，设置请求头的类型
// 添加请求拦截器
axios.interceptors.request.use(function (config) {
    return config
}, function (error) {
    return Promise.reject(error)
});
// 添加响应拦截器
axios.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    return Promise.reject(error);
});

var cancelArr=[];
export { cancelArr }

//后台请求
export function axiosPost(params, transCode){
	//配置后台请求地址
	let axiosTemp = axios.create({
		baseURL: process.env.API_ROOT,
		cancelToken : new axios.CancelToken(cancel => {
		    cancelArr.push({cancel})
		})
	});
	let finalUrl = 'TransServlet';//请求地址默认拼接TransServlet
	let finalData = getparams(params, transCode, 'service');//配置上行报文公共包头
	return new Promise(function(resolve, reject){
		axiosTemp.post(finalUrl, finalData).then(response => {
			let data = response.data;
			if(data.returnCode == successCode){
				resolve(data);
			}else if(data.returnCode=='EB8000006'){
				reject(data);
				MessageBox({
				  title: data.returnMsg,
				  message: '请确定是否执行重新登录操作?',
				  showCancelButton: true
				}).then(action => {
					if(action=='confirm'){
						vue.$router.push({path:'/login',name:'Login',query:{fromPage:'ReLogin'}});
					}else if(action=='cancel'){
						console.log('取消');
					}
				});
			}else if(data.returnCode=='EB8000006'){
				checkRealName('0');
			}else{
				reject(data);
			}
		}).catch(error => {
			let err;
			if(error.message.indexOf('timeout') != -1){
				err = {
					returnMsg:'请求超时'
				};
			}else{
				err = {
					returnMsg:'通讯异常'
				};
			}
			reject(err);
		});
	});	
}

//文件上传
export function axiosPostFile(params, transCode){
	let axiosTemp = axios.create({
		baseURL: process.env.API_ROOT,
		cancelToken : new axios.CancelToken(cancel => {
		    cancelArr.push({cancel})
		}),
		timeout: 300000,
  		headers: { "Content-Type": "multipart/form-data" },
  		onUploadProgress: progress => {
  			//属性lengthComputable主要表明总共需要完成的工作量和已经完成的工作是否可以被测量,如果lengthComputable为false，就获取不到progress.total和progress.loaded
  			if (progress.lengthComputable) {
	          	let complete = (progress.loaded / progress.total * 100 | 0) + '%';
		    	console.log('上传 ' + complete);
		    	self.uploadMessage = '上传 ' + complete;
	       	}
		    
		}
	});
	let finalUrl = 'TransServlet';//请求地址默认拼接TransServlet
	params.append("transCode", transCode);
	params.append("clientToken", getClientToken());
	params.append("userId", store.get('userId') || '10000');
	params.append("channelNo", 'service');
	params.append("transTime", getNowTime());
	let finalData = params;//配置上行报文公共包头
	return new Promise(function(resolve, reject){
		axiosTemp.post(finalUrl, finalData).then(response => {
			let data = response.data;
			if(data.returnCode == successCode){
				resolve(data);
			}else if(data.returnCode=='EB8000006'){
				reject(data);
				MessageBox({
				  title: data.returnMsg,
				  message: '请确定是否执行重新登录操作?',
				  showCancelButton: true
				}).then(action => {
					if(action=='confirm'){
						vue.$router.push({path:'/login',name:'Login',query:{fromPage:'ReLogin'}});
					}else if(action=='cancel'){
						console.log('取消');
					}
				});
			}else{
				reject(data);
			}
		}).catch(error => {
			let err;
			if(error.message.indexOf('timeout') != -1){
				err = {
					returnMsg:'请求超时'
				};
			}else{
				err = {
					returnMsg:'通讯异常'
				};
			}
			reject(err);
		});
	});
}

//加密密码
export function enPasswd(password){
	var mytoken = getClientToken();
	return DES3.encrypt(mytoken,password);
}

/*前端uuid*/
function uuid() {
	var s = [];
	var hexDigits = "0123456789abcdef";
	for ( var i = 0; i < 36; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
	s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
	s[8] = s[13] = s[18] = s[23] = "";
	var uuid = s.join("");
	return uuid;
}

/*存储token*/
function setClientToken(clientToken) {
	store.session(__clientTokenKey,clientToken);
}

/*获取token firstTime 第一次使用，参数传1*/
function getClientToken(firstTime) {
	if(firstTime == 1 || store.session.get(__clientTokenKey) == null || store.session.get(__clientTokenKey) == '') {
		setClientToken(uuid());
	}
	return store.session.get(__clientTokenKey);
}

//完善接口参数
export function getparams(params,transCode,system) {
	params['transCode'] = transCode;
	params['clientToken'] = getClientToken();
	params['userId'] = store.get('userId') || '10000';
	params['channelNo'] = system;
	params['transTime'] = getNowTime();
	return params;
}

/**
 * 获取接口路径
 * urls:服务端应用路径
 * system:系统编码
 */
function geturl(urls,system){
	return urls + system + "/TransServlet";//拍链区块链测试应用路径xibl
}

//数值小于10时前面加零校验
function inspectionTime(num){
	num = num < 10 ? '0' + num : num;
	return num;
}

//转换时间格式为YYYY-MM-DD hh:mm:ss
function convertTimeFormat(date){
	let Y = inspectionTime(date.getFullYear());
  	let M = inspectionTime(date.getMonth() + 1);
  	let D = inspectionTime(date.getDate());
    let h = inspectionTime(date.getHours());
  	let m = inspectionTime(date.getMinutes());
  	let s = inspectionTime(date.getSeconds());
  	return Y + '-' + M + '-' + D + ' ' + h + ':' + m + ':' + s;
}

//获取YYYY-MM-DD hh:mm:ss格式的当前北京时间
export function getNowTime(){
	let timezone = 8; //目标时区时间，东八区
	let offset_GMT = new Date().getTimezoneOffset(); // 本地时间和格林威治的时间差，单位为分钟
	let nowDate = new Date().getTime(); // 本地时间距 1970 年 1 月 1 日午夜（GMT 时间）之间的毫秒数
	let date = new Date(nowDate + offset_GMT * 60 * 1000 + timezone * 60 * 60 * 1000);
	return convertTimeFormat(date);
}

//比较两个日期大小
export function compare(date1,date2) {
	let dates1 = new Date(date1);
	let dates2 = new Date(date2);
	if (dates1 >= dates2) {
		return true
	} else {
		return false
	}
}

//解决小数相乘进制bug
export function accMul(arg1, arg2){
	let m = 0,
	s1 = arg1.toString(),
	s2 = arg2.toString();
    try{
    	m += s1.split(".")[1].length
    }catch(e){
    	
    }
    try{
    	m += s2.split(".")[1].length
    }catch(e){
    	
    }
    return Number(s1.replace(".","")) * Number(s2.replace(".","")) / Math.pow(10,m);
}

//获取图片
export function getImage(imageId){
	return imageSever + getClientToken() +'&id='+imageId;
}


//账号规则验证
export function telReg(accountNum){
	if(accountNum){
		let RegExp = /^[1][3,4,5,6,7,8,9][0-9]{9}$/;
		if(RegExp.test(accountNum)){
			return true
		}else{
			return "手机号格式错误";
		}
	}else{
		return "手机号不能为空";
	}
}

//验证码验证
export function codeReg(verificationCode){
	if(verificationCode){
		let RegExp = /^[0-9]{6}$/;
  		if(RegExp.test(verificationCode)){
  			return true
  		}else{
  			return "验证码格式错误";
  		}
	}else{
		return "验证码不能为空";
	}
}

//密码规则验证
export function pwdReg(password){
	if(password){
		let week = /^[a-zA-Z]{8,16}$/;//弱:8位 纯字母
		let weeks = /^[0-9]{8,16}$/;//弱:8位 纯数字
	    let middle = /^(?!\d+$)(?![a-zA-Z]+$)[\dA-Za-z]{8,16}$/;//中:8-16位 数字+字母
	    let strongest = /^(?=.*((?=[\x21-\x7e]+)[^A-Za-z0-9]))(?=.*[a-zA-Z])(?=.*[0-9])[^\u4e00-\u9fa5]{8,16}$/;//强:8-16位 数字+字母+字符
  		if(week.test(password) || weeks.test(password) || middle.test(password) || strongest.test(password)){
  			return true
  		}else{
  			return "密码不符合要求";
  		}
	}else{
		return "密码不能为空";
	}
}

//二次密码规则验证
export function secondpswReg(password1,password2){
	if(password2){
  		if(password1 == password2){
  			return true
  		}else{
  			return "密码不一致";
  		}
  	}else{
  		return "密码不能为空";
  	}
}

//余额转赠、积分转赠规则验证
export function transferNumReg(transferNum,currentBalance,type){
	if(transferNum){
		let RegExp = /^[0-9]+(\.[0-9]{1,2})?$/;
  		if(RegExp.test(transferNum)){
  			if(transferNum.valueOf() >= 0.01){
  				if(transferNum <= currentBalance){
					return true
				}else{
					if(type = 'balance'){
						return "当前余额不足";
					}else{
						return "当前积分不足";
					}
				}
  			}else{
				return "转赠数量不能小于0.01";
  			}
  		}else{
  			return "转赠数量格式错误";
  		}
	}else{
		return "转赠数量不能为空";
	}
}

//钱包地址规则验证
export function AddressReg(walletAddress){
	if(walletAddress){
		let RegExp = /^[a-zA-Z0-9]{23}$/;
  		if(RegExp.test(walletAddress)){
  			return true
  		}else{
  			return '钱包地址不符合要求';
  		}
	}else{
		return "钱包地址不能为空";
	}
}

//转账金额规则验证
export function NumberReg(transferNumber, transferAccountsMax){
	if(transferNumber){
		let RegExp = /^[0-9]+(\.[0-9]{1,6})?$/;
  		if(RegExp.test(transferNumber) && transferNumber.valueOf() > 0){
  			if(transferNumber.valueOf() >= 0.001){
  				if(Number(transferNumber) <= Number(transferAccountsMax)){
					return true
				}else{
					return '余额不足';
				}
  			}else{
  				return "金额不能小于0.001";
  			}
  		}else{
  			return "金额格式不正确";
  		}
	}else{
		return "金额不能为空";
	}
}

// 保留两位小数(位数不足自动补位)
export function keepTwoDecimalFull(num) {
	var result = parseFloat(num);
	if (isNaN(result)) {
		alert('传递参数错误，请检查！');
		return false;
	}
	result = Math.round(num * 100) / 100;
	var s_x = result.toString();
	var pos_decimal = s_x.indexOf('.');
	if (pos_decimal < 0) {
		pos_decimal = s_x.length;
		s_x += '.';
	}
	while (s_x.length <= pos_decimal + 2) {
		s_x += '0';
	}
	return s_x;
}

//类别格式化
export function formatType(type){
	switch (type){
		case '0':
			return '自然人'
		case '100':
			return '有限责任公司'
		case '101':
			return '股份有限公司'
		case '104':
			return '个人独资公司'
		case '105':
			return '全民所有制'
		case '106':
			return '集体所有制'
		case '107':
			return '联营企业'
		default:
        	break
	}
}

//证件类型格式化
export function formatIdType(type){
	switch (type){
		case '0':
			return '居民身份证'
		case '1':
			return '军官证'
		case '2':
			return '护照'
		case '3':
			return '台湾居民来往大陆通行证'
		case '4':
			return '士兵证'
		case '5':
			return '户口'
		case '6':
			return '港澳居民来往大陆通行证'
		case '8':
			return '外国护照'
		case '9':
			return '大陆居民往来台湾通行证'
		case '101':
			return '营业执照'
		default:
        	break
	}
}

//时间格式化
export function formatDate(dates){
	let Y = dates.split(' ')[0].split('-')[0];
	let M = dates.split(' ')[0].split('-')[1];
  	let D = dates.split(' ')[0].split('-')[2];
  	let T=dates.split(' ')[1];
  	return Y + '年' + M + '月' + D +'日 '+T;
}

//商标业务申请状态
export function formatTrademark(status){
	switch (status){
		case '0':
			return '申请提交'
		case '1':
			return '提交完成'
		case '2':
			return '活体检测'
		case '3':
			return '活体检测失败'
		case '4':
			return '审核成功'
		case '5':
			return '审核失败'
		case '6':
			return '制证完成'
		case '7':
			return '待受理'
		case '8':
			return '受理中'
		case '9':
			return '驳回'
		case '10':
			return '不予受理'
		case '11':
			return '待制证'
		default:
        	break
	}
}

//电子数据存证业务申请状态
export function formatElectronic(applyState,auditorState){
	switch (applyState){
		case '0':
			return '申请提交'
		case '1':
			return '待支付'
		case '2':
			switch (auditorState){
				case '0':
					return '默认'
				case '1':
					return '通过'
				case '2':
					return '驳回'
				case '3':
					return '拒绝受理'
				case '4':
					return '等待受理'
				default:
        			break
			}
		case '3':
			return '上链中'
		case '4':
			return '完成'
		default:
        	break
	}
}

//实名验证
export function checkRealName(isCertificate,index){
	if(isCertificate){
		return true
	}else{
		MessageBox({
		  title: "提示",
		  message: '所有公证服务都需要核定当事人实名信息，是否立刻进行实名认证?',
		  confirmButtonText:'去认证',
		  cancelButtonText:'稍后认证',
		  closeOnClickModal:false,
		  showCancelButton: true
		}).then(action => {
			if(action=='confirm'){
				vue.$router.push({path:'/authentication'});
			}else if(action=='cancel'){
				if(index){
					vue.$router.push({path: '/index'});
				}else{
					store.set('isCertificate','0');
					Toast({
						message:'稍后认证',
						duration:1500
					});
				}
				
			}
		});
	}
}
