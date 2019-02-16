var  app = getApp();
Page({
  data: {
    coupons: [],
    loading:false
  },
  onLoad: function (options) {
    wx.showLoading({
      title: '努力加载中',
    })
    wx.request({
      url: app.globalData.domain+'api/user/getcoupon',
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
          coupons:res.data.data?res.data.data:[],
          loading:true
        })  
      }
    })
  },
  golist: function (e) {
    console.log(e)
    var coupon_id = e.currentTarget.dataset.id
    console.log(coupon_id)
    //wx.setStorageSync('coupon_id',coupon_id);
    wx.navigateTo({
      url:'../../list/list?coupon_id='+coupon_id
    })
  },
  gocharge: function (e) {
    wx.navigateTo({
      url:'../charge/charge'
    })
  },
  onReady: function () {

  },
  onShow: function () {
  },
  onHide: function () {
    // 页面隐藏

  },
  onUnload: function () {
    // 页面关闭
  }
})