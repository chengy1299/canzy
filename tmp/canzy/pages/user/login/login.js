var app = getApp();
Page({
    data: {
      tips: '',
      pageType: 1, //0为登陆，1为注册，2为关于        
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
      this.login()
    },
    onReady: function(){
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
              if(res.data.data == false)
              {//没有注册
                return;
              }else{
                //登录成功
                wx.setStorageSync('token', res.data.data.userinfo.token);
                wx.setStorageSync('userInfoData', res.data.data.userinfo);
                try {
                  wx.removeStorageSync('pid')
                } catch (e) {
                  console.log('error');
                }
                wx.showToast({
                  title: '登录成功',
                  icon: 'success',
                  duration: 2000,
                  success: function(e)
                  { 
                    setTimeout(function (){
                      wx.switchTab({url: '../../index/index'});
                    },2000);
                  }
                })
              }
            }
          })
        }
      });
    },
    register: function(e){
        console.log(e.detail.value);
        var rData = e.detail.value;
        var that = this;

        that.setData({tips: '请稍后...'});
        if(!rData.mobile){
            that.setData({tips: '请输入手机号!'});
            return;
        }else{
          var myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
          if(!myreg.test(rData.mobile))
          {
            that.setData({tips: '请输入有效手机号码！'});
            return;
          }
        }
        if(rData.password != rData.rePassword) {
            that.setData({tips: '两次密码输入不一样，请检查!'});
            return;
        } else if(!rData.password){
            that.setData({tips: '请输入密码!'});
            return;
        } else {
            wx.login({
              success: function (res) {
                var code = res.code; // 微信登录接口返回的 code 参数，下面注册接口需要用到
                wx.getUserInfo({
                  success: function (res) {
                    var rawData = res.rawData;
                    console.log(rawData)
                    // 下面开始调用注册接口
                    wx.request({
                      url: app.globalData.domain+'api/user/wechatminiauth',
                      method: 'POST',
                      header: {
                        "Content-Type": "application/x-www-form-urlencoded"
                      },
                      data: { 
                        code: code, 
                        rawData: rawData,
                        mobile:rData.mobile,
                        password:rData.password,
                        pid:wx.getStorageSync('pid') ? wx.getStorageSync('pid') : 0 
                      }, // 设置请求的 参数
                      success: (res) => {
                        console.log(res);
                        if(res.data.data == 666){
                          that.login();
                        }else if(res.data.data == 777){
                          that.setData({tips: '此号码已经注册过!'});
                          return;
                        }else if(res.data.code == 1){
                          //授权登录成功
                          wx.setStorageSync('token', res.data.data.userinfo.token);
                          wx.setStorageSync('userInfoData', res.data.data.userinfo);
                          try {
                            wx.removeStorageSync('pid')
                          } catch (e) {
                            console.log('error');
                          }
                          //wx.navigateBack();
                          wx.showToast({
                            title: '授权注册成功',
                            icon: 'success',
                            duration: 2000,
                            success: function(e)
                            { 
                              setTimeout(function (){
                                wx.switchTab({url: '../../index/index'});
                              },2000);
                            }
                          })
                        }else{
                          // 登录错误
                          wx.hideLoading();
                          wx.showModal({
                            title: '提示',
                            content: '无法注册，请重试',
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

    }
});