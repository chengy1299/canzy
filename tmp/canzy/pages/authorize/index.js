// pages/authorize/index.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },
  bindGetUserInfo: function (e) {
    if (!e.detail.userInfo){
      return;
    }
    wx.navigateTo({url:'../user/login/login'})
    //wx.setStorageSync('userInfo', e.detail.userInfo)
    //this.registerUser();
  },
  login: function () {
    wx.login({
      success: res => {
        //console.log(res);
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        wx.request({
          url: app.globalData.domain+'api/user/wechatminilogin',
          method: 'POST',
          header: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          data: {
            code: res.code,
          },
          success: function (res) {
            //console.log(res)
            //登录成功
            wx.setStorageSync('token', res.data.data.userinfo.token);
            wx.setStorageSync('userInfoData', res.data.data.userinfo);
          }
        })
      }
    });
  },
  //授权注册登录
  registerUser: function () {
    var that = this;
    wx.login({
      success: function (res) {
        var code = res.code; // 微信登录接口返回的 code 参数，下面注册接口需要用到
        wx.getUserInfo({
          success: function (res) {
            var rawData = res.rawData;
            //console.log(rawData)
            // 下面开始调用注册接口
            wx.request({
              url: app.globalData.domain+'api/user/wechatminiauth',
              method: 'POST',
              header: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              data: { code: code, rawData: rawData}, // 设置请求的 参数
              success: (res) => {
                //console.log(res);
                if(res.data.data == 666){
                  that.login();
                }else if(res.data.code == 1){
                  //授权登录成功
                  wx.setStorageSync('token', res.data.data.userinfo.token);
                  wx.setStorageSync('userInfoData', res.data.data.userinfo);
                  wx.navigateBack();
                }else{
                  // 登录错误
                  wx.hideLoading();
                  wx.showModal({
                    title: '提示',
                    content: '无法登录，请重试',
                    showCancel: false
                  })
                  return;
                }
              }
            })
          }
        })
      }
    })
  }
})