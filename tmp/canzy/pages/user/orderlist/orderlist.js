// pages/order/list/list.js
var app = getApp();
Page({
  data: {
    current: 0,
    loading : false,
    order0:[],
  },
  onLoad:function(){
    var that = this;
    wx.showLoading({
      title: '努力加载中',
    })
    
  },
  getdata: function (){
    var that = this;
    var user = wx.getStorageSync('userInfoData');
    wx.request({
      url: app.globalData.domain+'api/order/getworder',
      method: 'POST',
      data: {
        user_id : user.user_id,
        token : user.token,
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function (res) {
        wx.hideLoading();
        console.log(res.data.data)
        if(res.data.data == 'error user'){
          that.data.order0 = []
        }else{
          that.data.order0 = res.data.data;
        }
        that.setData({
          order0: that.data.order0,
          loading: true
        })
      }
    })
  },
  switchSlider: function (e) {
    this.data.current = e.target.dataset.index
    this.setData({
      current: e.target.dataset.index
    })
  },
  changeSlider: function (e) {
    this.data.current = e.detail.current
    this.setData({
      current: e.detail.current
    })
  },
   /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getdata();
  },
  godetail: function (e) {
    console.log(e)
    var index = e.currentTarget.dataset.index;
    var order_id = e.currentTarget.id;
    console.log(index)
    console.log(order_id)
    
    var data = this.data.order0[index];
    wx.navigateTo({
      url: '../../order/detail/detail?orderInfo='+JSON.stringify(data)
    })
    
  },
  golist: function () {
    wx.navigateTo({
      url: '../../list/list'
    })
  },
})