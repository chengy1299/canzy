// pages/order/list/list.js
var app = getApp();
Page({
  data: {
    current: 0,
    loading : false,
    order0:[],
    order1:[],
    order2:[],
    order3:[],
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
      url: app.globalData.domain+'api/order/getorder',
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
        that.data.order0 = res.data.data.orderall?res.data.data.orderall:[];
        that.data.order1 = res.data.data.order1?res.data.data.order1:[];
        that.data.order2 = res.data.data.order2?res.data.data.order2:[];
        that.data.order3 = res.data.data.order3?res.data.data.order3:[];
        that.setData({
          order0: that.data.order0,
          order1: that.data.order1,
          order2: that.data.order2,
          order3: that.data.order3,
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
    var that = this
    that.getdata();
  },
  godetail: function (e) {
    console.log(e)
    var index = e.currentTarget.dataset.index;
    var order_id = e.currentTarget.id;
    console.log(index)
    console.log(order_id)
    if(this.data.current == 0){
      var data = this.data.order0[index];
    }else if(this.data.current == 1){
      var data = this.data.order1[index];
    }else if(this.data.current == 2){
      var data = this.data.order2[index];
    }else if(this.data.current == 3){
      var data = this.data.order3[index];
    }
    if(data.order_state > 1){
      wx.navigateTo({
        url: '../detail/detail?orderInfo='+JSON.stringify(data)
      })
    }else{
      wx.navigateTo({
        url: '../repay/repay?orderInfo='+JSON.stringify(data)
      })
    }
  },
  golist: function () {
    wx.navigateTo({
      url: '../../list/list'
    })
  },
})