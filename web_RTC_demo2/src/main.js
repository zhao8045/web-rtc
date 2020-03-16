// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import router from './router'
import MintUI from 'mint-ui'
import 'mint-ui/lib/style.css'
import App from './App'

Vue.use(MintUI)
import { Header,Button } from 'mint-ui'
Vue.component( Header.name,Header,Button.name,Button)

import jquery from './common/publicJs/jquery.js'

import store from './store/store.js'
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,//使用vuex的store
  components: { App },
  template: '<App/>'
})