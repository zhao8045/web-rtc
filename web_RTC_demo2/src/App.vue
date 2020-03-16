<template>
  <div id="app">
  	<transition name="page-fade">
			<router-view/>		
		</transition>
  </div>
</template>

<script>
	export default {
	  name: 'app',
	  data(){
	  	return{
	  		
	  	}
	  },
	  created(){
		
	  }
	}
</script>

<style>
	@import "~common/style/base"
	#app {
	  font-family: 'Avenir', Helvetica, Arial, sans-serif;
	  -webkit-font-smoothing: antialiased;
	  -moz-osx-font-smoothing: grayscale;
	  text-align: center;
	  color: #2c3e50;
	}
</style>
