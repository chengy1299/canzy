// pages/order/balance/balance.js
var app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    cartList: [],
    sumMonney: 0,
    cutMonney: 0,
    cupNumber:0,
    showCart: false,
    eatType: 1,//用餐方式
    showModalStatus: false,
    note: '',
    OrderTypetime: 0,
    TakeOrder: 1,//1即使订单，2预约订单
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.setNavigationBarTitle({
      title: '订单详情'
    })
    that.setData({
      cartList: wx.getStorageSync('ecartList'),
      sumMonney: wx.getStorageSync('esumMonney'),
      cupNumber: wx.getStorageSync('ecupNumber'),
      showCart: true,
      OrderTypetime: that.data.OrderTypetime
    })
  },
  radioEatChange: function(e) {
    var that = this;
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    that.data.eatType = e.detail.value;
    console.log(that.data)
  },
  radioOrderChange: function(e) {
    var that = this;
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    this.data.OrderTypetime = e.detail.value == 2? '点击选择时间':0
    this.data.TakeOrder = e.detail.value
    
    this.setData({
      OrderTypetime : this.data.OrderTypetime,
      TakeOrder : this.data.TakeOrder,
    })
  },
  noteblur: function(e){
    var that = this;
    that.data.note = e.detail.value;
    console.log(e)
  },
  gopay:function(e){
    var that = this;
    if(that.data.TakeOrder==2 && that.data.OrderTypetime=='点击选择时间'){
      wx.showModal({
        title: '提示',
        content: '请选择预约时间',
        showCancel: false
      })
      return;
    }
    var payMoney = wx.getStorageSync('esumMonney');
    wx.showModal({
      title: '提示',
      content: '您确认兑换 ' + payMoney + ' E币？',
      success: function(res) {
        if (res.confirm) {
          console.log('用户点击确定')
          that.putorder();//提交订单
          return;
        } else if (res.cancel) {
          console.log('用户点击取消');
          return;
        }
      }
    })
    
  },
  putorder:function(e){
    var that = this;
  
    var user = wx.getStorageSync('userInfoData');
    var token = wx.getStorageSync('token');
    wx.request({
      url: app.globalData.domain+'api/order/puteorder',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        user_id: user.user_id,
        token: token,
        cartList: JSON.stringify(wx.getStorageSync('ecartList')),
        sumMonney: wx.getStorageSync('esumMonney'),
        cupNumber: wx.getStorageSync('ecupNumber'),
        eatType: that.data.eatType,//用餐方式
        note: that.data.note,
        OrderTypetime:that.data.OrderTypetime
      },
      success: function (res) {
        //console.log(res)
        if(res.data.data == 'error count or money')
        {
          console.log('金钱或数量有误');
          wx.showModal({
            title: '提示',
            content: '金钱或数量有误',
            showCancel: false
          })
          return;
        }else if(res.data.data == 'error user')
        {
          console.log('用户信息错误');
          wx.showModal({
            title: '提示',
            content: '用户信息错误',
            showCancel: false
          })
          return;
        }else if(res.data.data == 'error e_coin')
        {
          console.log('E币不足');
          wx.showModal({
            title: '提示',
            content: 'E币不足',
            showCancel: false
          })
          return;
        }else if(res.data.data == 'error order')
        {
          console.log('订单生成失败');
          wx.showModal({
            title: '提示',
            content: '系统出错',
            showCancel: false
          })
          return;
        }
        else if(res.data.data.order_id)
        { 
          
          if(res.data.msg == 'pay success')
          { 
            
            wx.showToast({
              title: '兑换成功',
              icon: 'success',
              duration: 2000,
              success: function(e)
              { 
                setTimeout(function (){
                  //清除购物车
                  that.clearCartList();
                  wx.redirectTo({
                    url: '../detail/detail?orderInfo='+JSON.stringify(res.data.data)
                  })
                },2000);
              }
            })
          }
        }
      }
    })
  },
  clearCartList: function () {
    this.setData({
      cartList: [],
      showCart: false,
      sumMonney: 0,
      cupNumber: 0
    });
    try {
      wx.removeStorageSync('ecartItems')
    } catch (e) {
      console.log('error');
    }
  }, 
  bindTimeChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.data.OrderTypetime = e.detail.value
    this.setData({
      OrderTypetime: "预约 "+e.detail.value
    })
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
    // if(!wx.getStorageSync('ecartItems'))
    // {
    //   wx.navigateBack({ changed: true });//返回上一页
    // }
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
    return {
      title: '餐中苑-分享好友',
      path: 'pages/index/index?userid='+wx.getStorageSync('userInfoData').user_id // 路径，传递参数到指定页面。
    }
  },
})