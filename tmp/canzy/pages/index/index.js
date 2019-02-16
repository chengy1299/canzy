//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    //轮播图
    imgUrls: [
      '../../images/banner1.jpg',
      '../../images/banner2.jpg',
      '../../images/banner3.jpg',
    ],
    centerImg:'../../images/2-1.jpg',
    indicatorDots: true,
    autoplay: true,
    interval: 5000,
    duration: 1000
  },
  onLoad: function (options) {
    var that = this;
    if(options.pid){
      wx.setStorageSync('pid',options.pid)
    }
    wx.showLoading({
      title: '努力加载中',
    })
    wx.request({
      url: app.globalData.domain+'api/banner/getbanner',
      method: 'POST',
      data: {},
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function (res) {
        wx.hideLoading();
        console.log(res)
        if(res.data.data.banner.lenght!=0){
          that.data.imgUrls = res.data.data.banner;
        }
        if(res.data.data.center){
          that.data.centerImg = res.data.data.center;
        }
        that.setData({
          imgUrls: that.data.imgUrls,
          centerImg: that.data.centerImg
        })
      }
    })
  },
  golist: function () {
    wx.navigateTo({
      url: '../list/list'
    })
  },
  goelist: function () {
    wx.navigateTo({
      url: '../eorder/list/list'
    })
  },
  showe: function () {
    wx.navigateTo({
      url: '../explain/enote/enote'
    })
  },
  showc: function () {
    wx.navigateTo({
      url: '../explain/cnote/cnote'
    })
  },
  shows: function () {
    wx.navigateTo({
      url: '../explain/snote/snote'
    })
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '餐中苑-分享好友',
      path: 'pages/index/index?pid='+wx.getStorageSync('userInfoData').user_id // 路径，传递参数到指定页面。
    }
  },
})
