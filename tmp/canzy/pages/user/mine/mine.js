// pages/mine/mine.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nickName:"",
    avatarUrl:"",
    totalMoney:0.00,
    eCoin:0.00,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that=this;
    var userInfoData = wx.getStorageSync('userInfoData');
    that.setData({
      nickName: userInfoData.nickname?userInfoData.nickname:'',
      avatarUrl: userInfoData.avatar?userInfoData.avatar:'',
    })
    //检测当前用户登录态是否有效
    wx.checkSession({
      success: function(res){
        // console.log(res);
        if(!wx.getStorageSync('token')){
          that.checklogin();
        }
      },
      fail: function(){
        //登录态过期
        that.checklogin();
      }
    });
    // wx.getUserInfo({
    //   success: function (res) {
    //     var userInfo = res.userInfo
    //     that.setData({
    //       nickName: userInfo.nickName,
    //       avatarUrl: userInfo.avatarUrl,
    //     })
    //   }
    // })
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
  getmoney:function(){
    wx.request({
      url: app.globalData.domain+'api/user/getusercharge',
      method: 'POST',
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: { 
      user_id: wx.getStorageSync('userInfoData').user_id, 
      token: wx.getStorageSync('token')
      }, // 设置请求的 参数
      success: (res) => {
        console.log(res.data);
        this.setData({
          totalMoney:res.data.data.total_charge,
          eCoin:res.data.data.e_coin
        })
      }
    })
  },
  bitphone:function(){
    wx.makePhoneCall({
      phoneNumber: '13607853130' 
    })
  },
  onShow:function(){
    var that=this;
    if(wx.getStorageSync('token')){
      that.getmoney();
    }
  },
  showcoupon:function(){
    wx.navigateTo({
      url:'../coupon/coupon'
    })
  },
  showcharge:function(){
    wx.navigateTo({
      url:'../charge/charge'
    })
  },
  showchargedetail:function(){
    wx.navigateTo({
      url:'../chargedetail/chargedetail'
    })
  },
  showorderlist:function(){
    wx.navigateTo({
      url:'../orderlist/orderlist'
    })
  },
  showeorderlist:function(){
    wx.navigateTo({
      url:'../eorderlist/eorderlist'
    })
  }
})