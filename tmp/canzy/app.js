//app.js
const util = require('./utils/util.js')
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    
    var that = this;
    //检测当前用户登录态是否有效
    // wx.checkSession({
    //   success: function(res){
    //     //console.log(res);
    //     if(!wx.getStorageSync('token')){
    //       util.checklogin();
    //     }
    //   },
    //   fail: function(){
    //     //登录态过期
    //     util.checklogin();
    //   }
    // });
    // 获取用户信息
    // wx.getSetting({
    //   success: res => {
    //     //console.log(res);
    //     if (res.authSetting['scope.userInfo']) {
    //       // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
    //       wx.getUserInfo({
    //         success: res => {
    //           //console.log(res.userInfo);
    //           // 可以将 res 发送给后台解码出 unionId
    //           that.globalData.userInfo = res.userInfo
    //           // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //           // 所以此处加入 callback 以防止这种情况
    //           if (that.userInfoReadyCallback) {
    //             that.userInfoReadyCallback(res)
    //           }
    //         }
    //       })
    //     }
    //   }
    // });
  },
  globalData: {
    userInfo: null,
    domain: "https://order123.top/canzy/"
  }
})