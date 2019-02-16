//index.js
//获取应用实例
var  app = getApp();
Page({
  data: {
    images:'',
    items:[],
    loading:false
  },
  onLoad:function(){
    wx.showLoading({
      title: '努力加载中',
    })
    wx.request({
      url: app.globalData.domain+'api/charge/getchargedetail',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        user_id: wx.getStorageSync('userInfoData').user_id,
        token: wx.getStorageSync('token'),
      }, // 设置请求的 参数
      success: (res) => {
        console.log(res.data.data);
        wx.hideLoading();
        this.setData({
          items:res.data.data,
          loading:true
        })  
      }
    })
  },
})
