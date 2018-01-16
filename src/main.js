import App from './App.vue'

new Vue({
  router: new VueRouter({ mode: 'history' }),
  el: '#app',
  render: h => h(App)
})
