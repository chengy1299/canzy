// pages/order/detail/detail.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderData: [],
    eatType: 1,//用餐方式
    payType: 1,//支付方式
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
    console.log(JSON.parse(options.orderInfo))
    that.data.orderData = JSON.parse(options.orderInfo);
    that.data.note = that.data.orderData.remark ? that.data.orderData.remark : '';
    that.data.eatType = that.data.orderData.eat_type;
    this.setData({
      orderData: that.data.orderData,
      note:that.data.note,
      eatType: that.data.eatType,
    })
  },
  noteblur: function(e){
    var that = this;
    that.data.note = e.detail.value;
    console.log(e)
  },
  radioEatChange: function(e) {
    var that = this;
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    that.data.eatType = e.detail.value;
    that.setData({
      eatType:that.data.eatType
    })
    console.log(that.data)
  },
  radioOrderChange: function(e) {
    var that = this;
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    this.data.OrderTypetime = e.detail.value == 2? '点击选择时间':0
    this.data.TakeOrder = e.detail.value
    
    this.setData({
      OrderTypetime : this.data.OrderTypetime,
      TakeOrder : this.data.TakeOrder
    })
  },
  payorder:function(e){
    var that = this;
    console.log(e)
    if(that.data.TakeOrder==2 && that.data.OrderTypetime=='点击选择时间'){
      wx.showModal({
        title: '提示',
        content: '请选择预约时间',
        showCancel: false
      })
      return;
    }
    var payType = e.currentTarget.dataset.index;
    that.data.payType = payType;
    if( payType == 3 )
    { //余额支付
      wx.showModal({
        title: '提示',
        content: '您确认余额支付 ' + that.data.orderData.order_amount + ' 元？',
        success: function(res) {
          if (res.confirm) {
            console.log('用户点击确定')
            that.repay();//提交订单
            return;
          } else if (res.cancel) {
            console.log('用户点击取消');
            return;
          }
        }
      })
    }else{
      //微信支付
      wx.showModal({
        title: '提示',
        content: '您确认微信支付？',
        success: function(res) {
          if (res.confirm) {
            console.log('用户点击确定')
            that.repay();//提交订单
            return;
          } else if (res.cancel) {
            console.log('用户点击取消');
            return;
          }
        }
      })
    }
  },
  repay:function(e){
    var that = this;

    var user = wx.getStorageSync('userInfoData');
    var token = wx.getStorageSync('token');
    wx.request({
      url: app.globalData.domain+'api/order/repay',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        user_id: user.user_id,
        token: token,
        order_id: that.data.orderData.order_id,
        eatType: that.data.eatType,//用餐方式
        payType: that.data.payType,//支付方式
        note: that.data.note,
        OrderTypetime: that.data.OrderTypetime
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
        }else if(res.data.data == 'error total_charge')
        {
          console.log('余额不足');
          wx.showModal({
            title: '提示',
            content: '余额不足',
            showCancel: false
          })
          return;
        }else if(res.data.data == 'error order')
        {
          console.log('订单生成失败');
          wx.showModal({
            title: '提示',
            content: '订单有误',
            showCancel: false
          })
          return;
        }
        else if(res.data.data.order_id)
        { 
          try {
            wx.removeStorageSync('couponIndex');
            wx.removeStorageSync('couponMoney');
          } catch (e) {
            console.log('error');
          }
          //console.log(res.data.data)
          if(res.data.msg == 'create order success')
          {  console.log(res.data.data)
            wx.requestPayment(
            {
              'timeStamp': ''+ res.data.data.payData.timeStamp +'',
              'nonceStr': ''+ res.data.data.payData.nonceStr +'',
              'package': ''+ res.data.data.payData.package +'',
              'signType': 'MD5',
              'paySign': ''+ res.data.data.payData.sign +'',
              'success':function(e){
                wx.request({
                  url: app.globalData.domain+'api/order/getorderstatus',
                  method: 'POST',
                  data: {
                    order_id:res.data.data.order_id,
                    user_id:wx.getStorageSync('userInfoData').user_id,
                    token:wx.getStorageSync('token')
                  },
                  header: {
                    "Content-Type": "application/x-www-form-urlencoded"
                  },
                  success: function (res) {
                    wx.hideLoading();
                    console.log(res.data.data)
                    if(res.data.data.order_state == 2)
                    {
                      wx.showToast({
                        title: '支付成功',
                        icon: 'success',
                        duration: 2000,
                        success: function(e)
                        { 
                          setTimeout(function (){
                            that.setData({
                              orderData:res.data.data
                            })
                          },2000);
                        }
                      })
                    }else
                    {
                      wx.showToast({
                        title: '支付失败',
                        icon: 'fail',
                        duration: 2000,
                        success: function(e)
                        { 
                          setTimeout(function (){
                            wx.navigateBack({ changed: true });//返回上一页
                          },2000);
                        }
                      })
                    }
                  }
                })
                
              },
              fail:function(e){
                wx.showToast({
                  title: '支付失败',
                  icon: 'fail',
                  duration: 2000,
                  success: function(e)
                  { 
                    setTimeout(function (){
                      wx.navigateBack({ changed: true });//返回上一页
                    },2000);
                  }
                })
              },
              complete:function(e){

              }
            })
          }else if(res.data.msg == 'pay success')
          { 
            
            wx.showToast({
              title: '支付成功',
              icon: 'success',
              duration: 2000,
              success: function(e)
              { 
                setTimeout(function (){
                  that.setData({
                    orderData:res.data.data
                  })
                },2000);
              }
            })
          }
        }
      }
    })
  },
   delorder:function(e){
    var that=this
    console.log(e.target.dataset.id)
    wx.showModal({
      title: '提示',
      content: '您确定取消该订单？',
      success: function(res) {
        if (res.confirm) {
          console.log('用户点击确定')
          wx.request({
            url: app.globalData.domain+'api/order/delorder',
            method: 'POST',
            data: {
              user_id:wx.getStorageSync('userInfoData').user_id,
              token:wx.getStorageSync('token'),
              order_id : that.data.orderData.order_id
            },
            header: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            success: function(res){
              console.log(res)
              if(res.data.code==1){
                wx.showToast({
                  title: '取消成功',
                  icon: 'success',
                  duration: 2000,
                  success: function(e)
                  { 
                    setTimeout(function (){
                      wx.navigateBack({ changed: true });//返回上一页
                    },2000);
                  }
                })

              }else{
                wx.showToast({
                  title: '取消失败',
                  icon: 'fail',
                  duration: 2000,
                })
              }   
            },
            fail: function() {
              // fail
            },
            complete: function() {
              // complete
            }
          })
          return;
        } else if (res.cancel) {
          console.log('用户点击取消');
          return;
        }
      }
    })
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
  
  }
})