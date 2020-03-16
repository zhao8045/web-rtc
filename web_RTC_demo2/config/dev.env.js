'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
	API_ROOT:'"/api1"',//ATM后台请求地址
	NODE_ENV: '"development"'
})
