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
    total_money: 0.00, 
    is_coupon: false, 
    coupon: 0.00,
    couponData:[],//代金卷
    eatType: 1,//用餐方式
    payType: 1,//支付方式
    showModalStatus: false,
    couponIndex: null,
    couponMoney: 0,
    note: '',
    select: '',
    OrderTypetime: 0,
    TakeOrder: 1,//1即使订单，2预约订单
    isShow: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.setNavigationBarTitle({
      title: '确认订单'
    })
    wx.showLoading({
      title: '努力加载中',
    })
    console.log(options.coupon_id)
    wx.request({
      url: app.globalData.domain+'api/user/getusercoupon',
      method: 'POST',
      data: {
        user_id:wx.getStorageSync('userInfoData').user_id,
        token:wx.getStorageSync('token'),
        checkMoney:wx.getStorageSync('sumMonney') - wx.getStorageSync('cutMonney'),
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function (res) {
        wx.hideLoading();
        console.log(res.data.data)
        that.data.coupon = res.data.data.coupon.coupon;
        that.data.total_money = res.data.data.coupon.total_money;
        that.data.is_coupon = res.data.data.coupon.is_coupon;
        that.data.couponData = res.data.data.usercoupon;
        //处理优惠劵
        var user_coupon = [];
        if(res.data.data.usercoupon.length == 0 ){
          user_coupon.push('无');
          that.data.select = '无可用优惠卷';
        }else{
          
          for (var i = 0; i < res.data.data.usercoupon.length; i++) {
            user_coupon.push(res.data.data.usercoupon[i].desc)
            if(res.data.data.usercoupon[i].coupon_id == options.coupon_id){
              var index = i;
            } 
          }
          if(index){
            that.data.couponIndex = index
            that.data.couponMoney = that.data.couponData[index].worth
            // wx.setStorageSync('couponIndex',index);
            // wx.setStorageSync('couponMoney',that.data.couponMoney)
          }else{
            if(wx.getStorageSync('couponIndex')){
              that.data.couponIndex = wx.getStorageSync('couponIndex');
            }
            if(wx.getStorageSync('couponMoney')){
              that.data.couponMoney = wx.getStorageSync('couponMoney');
            }     
          }
          if(wx.getStorageSync('select')){
            that.data.select = wx.getStorageSync('select');
          }else{
            that.data.select = '有可用优惠卷';
          }
        }
        that.setData({
          cartList: wx.getStorageSync('cartList'),
          sumMonney: wx.getStorageSync('sumMonney'),
          cutMonney: res.data.data.coupon.is_coupon ? (wx.getStorageSync('sumMonney')>=res.data.data.coupon.total_money?res.data.data.coupon.coupon:0):0,
          cupNumber: wx.getStorageSync('cupNumber'),
          total_money: res.data.data.coupon.total_money,
          is_coupon: res.data.data.coupon.is_coupon,
          coupon: res.data.data.coupon.coupon,
          user_coupon: user_coupon,
          showCart: true,
          select: that.data.select,
          index:that.data.couponIndex,
          couponMoney: that.data.couponMoney,
          OrderTypetime: that.data.OrderTypetime
        })
      }
    })
  },
  radioEatChange: function(e) {
    var that = this;
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    that.data.eatType = e.detail.value;
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
  radioPayChange: function(e) {
    var that = this;
    that.data.payType = e.detail.value;
    console.log('radio发生change事件，携带value值为：', e.detail.value)
  },
  bindPickerChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    var index = e.detail.value;
    wx.setStorageSync('couponIndex',index);
    this.data.couponIndex = index;
    var value = 0;
    if(this.data.couponData.length > 0){
      value = this.data.couponData[index].worth;
      this.data.select = '当前选择：';
    }else{
      this.data.select = '无可用优惠卷：';
    }
    wx.setStorageSync('select',this.data.select);
    wx.setStorageSync('couponMoney',value);
    this.data.couponMoney = value;
    this.setData({
      index: index,
      couponMoney:this.data.couponMoney,
      select:this.data.select
    })
  },
  noteblur: function(e){
    var that = this;
    that.data.note = e.detail.value;
    console.log(e)
  },
  gopay:function(e){
    console.log(e.detail.formId);
    var that = this;
    if(that.data.TakeOrder==2 && that.data.OrderTypetime=='点击选择时间'){
      wx.showModal({
        title: '提示',
        content: '请选择预约时间',
        showCancel: false
      })
      return;
    }
    if( that.data.payType == 3 )
    { //余额支付
      var j_money = that.data.couponData.length > 0 ? (that.data.couponIndex ? that.data.couponData[that.data.couponIndex].worth : 0 ) : 0;
      var jj_money = 0;
      if(that.data.is_coupon == true && wx.getStorageSync('sumMonney') >= that.data.total_money )
      {
        jj_money = that.data.coupon;
      }
      var payMoney = wx.getStorageSync('sumMonney') - j_money - jj_money;
      wx.showModal({
        title: '提示',
        content: '您确认余额支付 ' + payMoney + ' 元？',
        success: function(res) {
          if (res.confirm) {
            console.log('用户点击确定')
            that.putorder(e.detail.formId);//提交订单
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
            that.putorder(e.detail.formId);//提交订单
            return;
          } else if (res.cancel) {
            console.log('用户点击取消');
            return;
          }
        }
      })
    }
    
  },
  putorder:function(formId){
    var that = this;

    var user = wx.getStorageSync('userInfoData');
    var token = wx.getStorageSync('token');
    wx.request({
      url: app.globalData.domain+'api/order/putorder',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        user_id: user.user_id,
        token: token,
        cartList: JSON.stringify(wx.getStorageSync('cartList')),
        sumMonney: wx.getStorageSync('sumMonney'),
        cupNumber: wx.getStorageSync('cupNumber'),
        eatType: that.data.eatType,//用餐方式
        payType: that.data.payType,//支付方式
        coupon_id: that.data.couponData.length > 0 ? (that.data.couponIndex ? that.data.couponData[that.data.couponIndex].coupon_id : 0 ) : 0,
        OrderTypetime: that.data.OrderTypetime,
        note: that.data.note
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
            content: '系统出错',
            showCancel: false
          })
          return;
        }
        else if(res.data.data.order_id)
        { 
          //console.log(res.data.data)
          if(res.data.msg == 'create order success')
          {
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
                            //清除购物车
                            that.clearCartList();
                            wx.redirectTo({
                              url: '../detail/detail?orderInfo='+JSON.stringify(res.data.data)
                            })
                          },2000);
                          //发送推送消息
                          var msg = {};
                          msg['take_food_no'] = res.data.data.take_food_no;
                          msg['eat_type'] = res.data.data.eat_type;
                          msg['order_type_time'] = res.data.data.order_type_time;
                          msg['createtime'] = res.data.data.createtime;
                          msg['formId'] = formId;
                          that.sendMsg(msg);
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
                            //清除购物车
                            that.clearCartList();
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
                      //清除购物车
                      that.clearCartList();
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
            if(res.data.data.payment_code == 5){
              var failtitl = [];
              failtitl['msg'] = "恭喜您，获取免单！"; 
              failtitl['data'] = JSON.stringify(res.data.data); 
              that.showToast(failtitl)
            }else{
              wx.showToast({
                title: '支付成功',
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
            //发送推送消息
            var msg = {};
            msg['take_food_no'] = res.data.data.take_food_no;
            msg['eat_type'] = res.data.data.eat_type;
            msg['order_type_time'] = res.data.data.order_type_time;
            msg['createtime'] = res.data.data.createtime;
            msg['formId'] = formId;
            that.sendMsg(msg);
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
      wx.removeStorageSync('cartItems');
      //清楚下单相关缓存
      wx.removeStorageSync('couponIndex');
      wx.removeStorageSync('couponMoney');
      wx.removeStorageSync('select');
      wx.removeStorageSync('cutMonney');
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
  showToast:function(e){ //方法
    var that = this
    that.setData({
      isShow: true ,
      text:e.msg
    })
    setTimeout(function(){
      that.setData({
        isShow: false
      })
      //清除购物车
      that.clearCartList();
      wx.redirectTo({
        url: '../detail/detail?orderInfo='+e.data
      })
    },2000)
  },
  sendMsg:function(e){
    //发送推送消息
    // var data = {};
    // data['take_food_no'] = e.take_food_no;
    // data['eat_type'] = e.eat_type;
    // data['order_type_time'] = e.order_type_time;
    // data['createtime'] = e.createtime;
    console.log("msg:"+JSON.stringify(e));
    wx.request({
      url: app.globalData.domain+'api/wxmsg/send',
      method: 'POST',
      data: {
        data:JSON.stringify(e),
        form_id:e.formId,
        user_id:wx.getStorageSync('userInfoData').user_id,
        token:wx.getStorageSync('token')
      },
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function (msg) {
        console.log(msg)
      }
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
    // if(!wx.getStorageSync('cartItems'))
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
  
  }
})