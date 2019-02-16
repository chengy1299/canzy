// pages/list/list.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    listData: [],
    activeIndex: 0,
    toView: 'a0',
    scrollTop: 100,
    screenWidth: 667,
    showModalStatus: false,
    currentType: 0,
    currentIndex: 0,
    type_id:1,
    models:[],
    cartList: [],
    sumMonney: 0,
    cupNumber:0,
    showCart: false,
    loading: false,
    ecartItems: {
      cartList: [],
      sumMonney: 0,
      cupNumber:0,
    },
    open: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var sysinfo = wx.getSystemInfoSync().windowHeight;
    console.log(sysinfo)
    wx.showLoading({
      title: '努力加载中',
    })
    //获取缓存中的已购物车信息  
    try {
      var value = wx.getStorageSync('ecartItems');
      console.log(value);
      if(value){
        that.setData({
          cartList: value.cartList,
          sumMonney: value.sumMonney,
          cupNumber: value.cupNumber,
        });
      }
    } catch (e) {
      console.log('error');
    }
    
    //所有数据一次请求完 略大。。
    wx.request({
      url: app.globalData.domain+'api/goods/getegoods',
      method: 'POST',
      data: {},
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function (res) {
        wx.hideLoading();
        console.log(res.data)
        that.data.models = res.data.data.goods_type;
        that.data.open = res.data.data.open;
        that.setData({
          listData: res.data.data.goods,
          open: res.data.data.open,
          loading: true
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
  selectMenu: function (e) {
    var index = e.currentTarget.dataset.index
    console.log(index)
    this.setData({
      activeIndex: index,
      toView: 'a' + index,
      // scrollTop: 1186
    })
    console.log(this.data.toView);
  },
  scroll: function (e) {
    console.log(e)
    var dis = e.detail.scrollTop
    if (dis > 0 && dis < 259) {
      this.setData({
        activeIndex: 0,
      })
    }
    if (dis > 259 && dis < 1867) {
      this.setData({
        activeIndex: 1,
      })
    }
    if (dis > 1867 && dis < 2180) {
      this.setData({
        activeIndex: 2,
      })
    }
    if (dis > 2180 && dis < 2785) {
      this.setData({
        activeIndex: 3,
      })
    }
    if (dis > 2785 && dis < 2879) {
      this.setData({
        activeIndex: 4,
      })
    }
    if (dis > 2879 && dis < 4287) {
      this.setData({
        activeIndex: 5,
      })
    }
    if (dis > 4287 && dis < 4454) {
      this.setData({
        activeIndex: 6,
      })
    }
    if (dis > 4454 && dis < 4986) {
      this.setData({
        activeIndex: 7,
      })
    }
    if (dis > 4986) {
      this.setData({
        activeIndex: 8,
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  selectInfo: function (e) {
    var that = this
    //检测当前用户登录态是否有效
    wx.checkSession({
      success: function(res){
        //console.log(res);
        if(!wx.getStorageSync('token')){
          that.checklogin();
          return false;
        }else{
          var type = e.currentTarget.dataset.type;
          var index = e.currentTarget.dataset.index;
          var type_id = e.currentTarget.dataset.type_id;
          if(type_id){
            that.data.type_id = type_id;
          }
          type_id = that.data.type_id;
          for (var i = 0; i < that.data.models[type_id].length; i++) {
            that.data.models[type_id][i].index = 0
          } 
          console.log(e)
          that.setData({
            showModalStatus: !that.data.showModalStatus,
            currentType: type?type:0,
            currentIndex: index?index:0,
            type_id: that.data.type_id,
            Items:that.data.models[type_id]
          });
        }
      },
      fail: function(){
        //登录态过期
        that.checklogin();
        return false;
      }
    });
  },

  chooseSE: function (e) {
    var index = e.currentTarget.dataset.index;
    var indexs = e.currentTarget.dataset.indexs;
    var type_id = e.currentTarget.dataset.type_id;
    this.data.type_id = type_id;
    this.data.models[type_id][indexs].index = index
    console.log(e)
    console.log(this.data.models[type_id])
    this.setData({
      type_id: this.data.type_id,
      Items:this.data.models[type_id]
    });
  },
  addToCart: function (e) {
    console.log(e)
    var a = this.data
    var detail = '';
    for (var i = 0; i < a.models[a.type_id].length; i++) {
      if(detail){
        detail = detail+"+"+a.models[a.type_id][i].item[a.models[a.type_id][i].index]
      }else{
        detail = a.models[a.type_id][i].item[a.models[a.type_id][i].index]
      }
    }
    console.log(detail)
    var addItem = {
      "goods_id": a.listData[a.currentType].goods[a.currentIndex].id,
      "name": a.listData[a.currentType].goods[a.currentIndex].name,
      "price": Number(a.listData[a.currentType].goods[a.currentIndex].e_price),
      "detail": detail,
      "number": 1,
      "sum": a.listData[a.currentType].goods[a.currentIndex].e_price,
    }
    var sumMonney = a.sumMonney + Number(a.listData[a.currentType].goods[a.currentIndex].e_price);

    var cartList = this.data.cartList;
    cartList.push(addItem);
    this.setData({
      cartList: cartList,
      showModalStatus: false,
      sumMonney: sumMonney,
      cupNumber: a.cupNumber + 1
    });
    var ecartItems  = this.data.ecartItems; 
    ecartItems.cartList = cartList;
    ecartItems.sumMonney = sumMonney;
    ecartItems.cupNumber = a.cupNumber;
    console.log(ecartItems);
    try {
      wx.setStorageSync('ecartItems', ecartItems);
    } catch (e) { 
      console.log('erorr');
    }
    console.log(this.data.cartList)
  },
  showCartList: function () {
    console.log(this.data.showCart)
    if (this.data.cartList.length != 0) {
      this.setData({
        showCart: !this.data.showCart,
      });
    }
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
  addNumber: function (e) {
    var index = e.currentTarget.dataset.index;
    console.log(index)
    var cartList = this.data.cartList;
    cartList[index].number++;
    var sum = Number(this.data.sumMonney) + Number(cartList[index].price);
    cartList[index].sum = Number(cartList[index].sum) + Number(cartList[index].price);

    console.log(sum);
    this.setData({
      cartList: cartList,
      sumMonney: sum,
      cupNumber: this.data.cupNumber+1
    });
    var ecartItems  = this.data.ecartItems;
    ecartItems.cartList = cartList;
    ecartItems.sumMonney = sum;
    ecartItems.cupNumber = this.data.cupNumber;
    console.log(ecartItems);
    try {
      wx.setStorageSync('ecartItems', ecartItems);
    } catch (e) { 
      console.log('erorr');
    }
  },
  decNumber: function (e) {
    var index = e.currentTarget.dataset.index;
    console.log(index)
    var cartList = this.data.cartList;

    var sum = Number(this.data.sumMonney) - Number(cartList[index].price);
    cartList[index].sum = Number(cartList[index].sum) - Number(cartList[index].price);
    cartList[index].number == 1 ? cartList.splice(index, 1) : cartList[index].number--;

    this.setData({
      cartList: cartList,
      sumMonney: sum,
      showCart: cartList.length == 0 ? false : true,
      cupNumber: this.data.cupNumber-1
    });
    var ecartItems  = this.data.ecartItems;
    ecartItems.cartList = cartList;
    ecartItems.sumMonney = sum;
    ecartItems.cupNumber = this.data.cupNumber;
    console.log(ecartItems);
    try {
      wx.setStorageSync('ecartItems', ecartItems);
    } catch (e) { 
      console.log('erorr');
    }

  },
  goBalance: function () {
    var that = this
    if(that.data.open == 1){
      wx.showModal({
        title: '提示',
        content: '已打烊',
        showCancel: false
      })
      return;
    }
    if (this.data.sumMonney != 0) {
      wx.setStorageSync('ecartList', this.data.cartList);
      wx.setStorageSync('esumMonney', this.data.sumMonney);
      wx.setStorageSync('ecupNumber', this.data.cupNumber);
       wx.navigateTo({
        url: '../balance/balance'
      })
    }
  },

  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if(!wx.getStorageSync('ecartItems'))
    {
     this.clearCartList();
    }
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