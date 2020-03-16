var appid = 'wx0ed0ae03c7c688ed';//小犀
var __clientTokenKey = 'clientToken';
var user = 'user';//用户存储名
var cardinality = 1000000;//ONB数量基础倍数
var successCode = '000000000'|'0000000';//区块链成功编码

var defaultShow = '****';//钱包余额默认显示
var chainApi = [ //ONB钱包区块链请求地址
	"https://114.116.88.62/",
	"https://114.116.68.154/"
];

//var systemApi='http://26t13m1315.wicp.vip:32401/TransServlet';//正式服
var systemApi='http://192.168.0.140:31070/TransServlet';//测试服
//var systemApi='http://192.168.0.15:8080/TransServlet';//喻泽
//var systemApi='http://192.168.0.35:8080/TransServlet';//罗马
var imageSever= systemApi +'?ext=jpg&transCode=B00022&clientToken=';//图片服务