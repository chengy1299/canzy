//index.js
//获取应用实例
var app = getApp();
Page({
  data: {
    images:'',
    items:[]
  },
  onLoad:function(){
    wx.showLoading({
      title: '努力加载中',
    })
    wx.request({
      url: app.globalData.domain+'api/charge/getcharge',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {}, // 设置请求的 参数
      success: (res) => {
        console.log(res.data.data);
        wx.hideLoading();
        this.data.items = res.data.data;
        this.setData({
          items:res.data.data
        })  
      }
    })
  },
  checklogin:function (){
    wx.login({// 登录
      success: res => {
        //console.log(res);
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        wx.request({
          url: app.globalData.domain+'api/user/wechatminilogin',
          method: 'GET',
          data: {
            code: res.code,
          },
          success: function (res) {
            //console.log(res)
            if(res.data.data == false)
            {//没有注册则跳去注册（直接返回登录状态）
              wx.navigateTo({
                url: '../../authorize/index'
              });
            }else
            {//登录成功
              wx.setStorageSync('token', res.data.data.userinfo.token);
              wx.setStorageSync('userInfoData', res.data.data.userinfo);
            }
          }
        })
      }
    });
  },
  charge:function(e){
    var that = this
    //检测当前用户登录态是否有效
    wx.checkSession({
      success: function(res){
        //console.log(res);
        if(!wx.getStorageSync('token')){
          that.checklogin();
          return;
        }
      },
      fail: function(){
        //登录态过期
        that.checklogin();
        return;
      }
    });
    console.log(e)
    var charge_id = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '提示',
      content: '您确认充值 '+that.data.items[index].charge_worth+' 元么？',
      success: function(res) {
        if (res.cancel) {
          console.log('用户点击取消')
          return;
        } else if (res.confirm) {
          console.log('用户点击确定');
          //检测当前用户登录态是否有效
          wx.checkSession({
            success: function(res){
              //console.log(res);
              if(!wx.getStorageSync('token')){
                that.checklogin();
                return;
              }
            },
            fail: function(){
              //登录态过期
              that.checklogin();
              return;
            }
          });
          wx.request({
            url: app.globalData.domain+'api/charge/charge',
            method: 'POST',
            header: {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            data: {
              user_id: wx.getStorageSync('userInfoData').user_id, 
              token: wx.getStorageSync('token'),
              charge_id: charge_id
            }, // 设置请求的 参数
            success: function (res) {
              console.log(res)
              if(res.data.data == 'error user')
              {
                console.log('用户信息错误');
                wx.showModal({
                  title: '提示',
                  content: '用户信息错误',
                  showCancel: false
                })
                return;
              }else if(res.data.data == 'error order')
              {
                console.log('充值订单生成失败');
                wx.showModal({
                  title: '提示',
                  content: '充值失败',
                  showCancel: false
                })
                return;
              }
              else if(res.data.data.pay_no)
              { 
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
                        url: app.globalData.domain+'api/charge/getchargestatus',
                        method: 'POST',
                        data: {
                          pay_no:res.data.data.pay_no,
                          user_id:wx.getStorageSync('userInfoData').user_id,
                          token:wx.getStorageSync('token')
                        },
                        header: {
                          "Content-Type": "application/x-www-form-urlencoded"
                        },
                        success: function (res) {
                          wx.hideLoading();
                          console.log(res.data.data)
                          if(res.data.data.pay_status == 1)
                          {
                            wx.showToast({
                              title: '充值成功',
                              icon: 'success',
                              duration: 2000,
                              success: function(e)
                              { 
                                setTimeout(function (){
                                  wx.navigateBack({ changed: true });//返回上一页
                                },2000);
                              }
                            })
                          }else
                          {
                            wx.showToast({
                              title: '充值失败',
                              icon: 'fail',
                              duration: 2000,
                            })
                          }
                        }
                      })
                      
                    },
                    fail:function(e){
                      wx.showToast({
                        title: '充值失败',
                        icon: 'fail',
                        duration: 2000,
                      })
                    },
                    complete:function(e){

                    }
                  })
                }else 
                {  
                  wx.showToast({
                    title: '充值失败',
                    icon: 'fail',
                    duration: 2000,
                  })
                }
              }
            }
          })

        }
      }
    })
    
  },
})
