// pages/list/list.js
const util = require('../../utils/util.js')
var app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    listData: [],
    activeIndex: 0,
    toView: 'a0',
    scrollTop: 0,
    screenWidth: 667,
    showModalStatus: false,
    currentType: 0,
    currentIndex: 0,
    type_id:1,
    models:[],
    cartList: [],
    sumMonney: 0.00,
    cupNumber:0,
    showCart: false,
    loading: false,
    cartItems: {
      cartList: [],
      sumMonney: 0.00,
      cupNumber:0,
      orderCartNum:[],
    },
    orderCartNum:[],
    total_money: 0.00, 
    is_coupon: false, 
    coupon : 0.00,
    coupon_id: 0,
    open: 0,
    showImg:false,
    cartIndex:0,
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

    that.data.coupon_id = options.coupon_id?options.coupon_id:0;
    console.log(that.data.coupon_id)
    //获取缓存中的已购物车信息  
    try {
      var value = wx.getStorageSync('cartItems');
      console.log(value);
      if(value){
        that.data.orderCartNum = value.orderCartNum;
        that.setData({
          cartList: value.cartList,
          sumMonney: value.sumMonney,
          cupNumber: value.cupNumber,
          orderCartNum:value.orderCartNum
        });
      }
    } catch (e) {
      console.log('error');
    }
    
    wx.request({
      url: app.globalData.domain+'api/goods/getgoods',
      method: 'POST',
      data: {},
      header: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      success: function (res) {
        wx.hideLoading();
        console.log(res)
        that.data.total_money = res.data.data.coupon.total_money;
        that.data.coupon = res.data.data.coupon.coupon;
        that.data.models = res.data.data.goods_type;
        that.data.open = res.data.data.open;
        console.log(that.data.models)
        that.setData({
          listData: res.data.data,
          is_coupon: res.data.data.coupon.is_coupon, 
          coupon : res.data.data.coupon.coupon,
          total_money : res.data.data.coupon.total_money,
          open: res.data.data.open,
          models:that.data.models,
          cartIndex:that.data.cartIndex,
          loading: true
        })
      }
    })
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
    if (dis > 0 && dis < 921) {
      this.setData({
        activeIndex: 0,
      })
    }
    if (dis > 921 && dis < 1742) {
      this.setData({
        activeIndex: 1,
      })
    }
    if (dis > 1742 && dis < 2763) {
      this.setData({
        activeIndex: 2,
      })
    }
    if (dis > 2763 && dis < 3384) {
      this.setData({
        activeIndex: 3,
      })
    }
    if (dis > 3384 && dis < 5000) {
      this.setData({
        activeIndex: 4,
      })
    }
    // if (dis > 2879 && dis < 4287) {
    //   this.setData({
    //     activeIndex: 5,
    //   })
    // }
    // if (dis > 4287 && dis < 4454) {
    //   this.setData({
    //     activeIndex: 6,
    //   })
    // }
    // if (dis > 4454 && dis < 4986) {
    //   this.setData({
    //     activeIndex: 7,
    //   })
    // }
    // if (dis > 4986) {
    //   this.setData({
    //     activeIndex: 8,
    //   })
    // }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  showImg: function (e) {
    var that = this
    var type = e.currentTarget.dataset.type;
    var index = e.currentTarget.dataset.index;
    //console.log(e)
    that.setData({
      showImg: !that.data.showImg,
      currentType: type?type:0,
      currentIndex: index?index:0,
      goods_id: e.currentTarget.dataset.goods_id?e.currentTarget.dataset.goods_id:0,
    });
  },
  selectInfo: function (e) {
    console.log(e)
    var that = this
    //console.log(that.data)
    //检测当前用户登录态是否有效
    wx.checkSession({
      success: function(res){
        //console.log(res);
        if(!wx.getStorageSync('token')){
          that.setData({
            showModalStatus: false,
          });
          util.checklogin();
          return false;
        }else{
          var type = e.currentTarget.dataset.type;
          var index = e.currentTarget.dataset.index;
          var type_id = e.currentTarget.dataset.type_id;
          if(type_id){
            that.data.type_id = type_id;
          }
 
          if(that.data.models[type_id]){
            for (var i = 0; i < that.data.models[type_id].length; i++) {
              that.data.models[type_id][i].index = 0
            } 

            if(that.data.orderCartNum[that.data.listData.data[type].goods[index].id]){
              for(let cartId in that.data.orderCartNum[that.data.listData.data[type].goods[index].id]){
                that.data.cartIndex = cartId;
                break;
              }
            }else{
              that.data.cartIndex = that.data.cartList.length;
            }
  
            that.setData({
              showModalStatus: !that.data.showModalStatus,
              currentType: type?type:0,
              currentIndex: index?index:0,
              type_id: that.data.type_id,
              Items:that.data.models[type_id],
              orderCartNum:that.data.orderCartNum,
              cartIndex:that.data.cartIndex,
              showImg: false,
              goods_id:that.data.listData.data[type].goods[index].id
            });
          }else{
            if(type_id){
              var TypeData = [];
              TypeData['currentType'] = type?type:0;
              TypeData['currentIndex'] = index?index:0;
              TypeData['type_id'] = type_id;
              that.addToCart(TypeData);
            }else{
              that.setData({
                showModalStatus: !that.data.showModalStatus,
              });
            }
            
          }
        }
      },
      fail: function(){
        that.setData({
          showModalStatus: false,
        });
        //登录态过期
        util.checklogin();
        return false;
      }
    });
  },

  chooseSE: function (e) {
    console.log(e);
    //console.log(this.data);
    var index = e.currentTarget.dataset.index;
    var indexs = e.currentTarget.dataset.indexs;
    var type_id = e.currentTarget.dataset.type_id;
    var cartIndex = e.currentTarget.dataset.cartindex;
    this.data.type_id = type_id;
    this.data.models[type_id][indexs].index = index
    
    var a = this.data;
    if(this.data.orderCartNum.length != 0){
      var detail = '';
      for (var i = 0; i < a.models[a.type_id].length; i++) {
        if(detail){
          detail = detail+"+"+a.models[a.type_id][i].item[a.models[a.type_id][i].index]
        }else{
          detail = a.models[a.type_id][i].item[a.models[a.type_id][i].index]
        }
      }
      var flog = false;
      for(let i in this.data.orderCartNum[a.goods_id]){
        if(this.data.orderCartNum[a.goods_id][i].detail != detail){
          flog = false;
        }else if(this.data.orderCartNum[a.goods_id][i].detail == detail){
          cartIndex = i;
          flog = true;
          break;
        }
      }
      if(flog===false){
        cartIndex = this.data.cartList.length;
      }
      console.log(cartIndex);
    }
    
    this.setData({
      type_id: this.data.type_id,
      Items:this.data.models[type_id],
      cartIndex: cartIndex,
      goods_id:a.goods_id
    });
  },
  addToCart: function (e) {
    console.log(e)
    var a = this.data
    var detail = '';
    if(a.models[a.type_id]){
      for (var i = 0; i < a.models[a.type_id].length; i++) {
        if(detail){
          detail = detail+"+"+a.models[a.type_id][i].item[a.models[a.type_id][i].index]
        }else{
          detail = a.models[a.type_id][i].item[a.models[a.type_id][i].index]
        }
      }
      var currentType = a.currentType;
      var  currentIndex = a.currentIndex;
    }else{
      var currentType = e.currentType;
      var  currentIndex = e.currentIndex;
    }
    
    if(this.data.orderCartNum[a.listData.data[currentType].goods[currentIndex].id]){
      if(this.data.orderCartNum[a.listData.data[currentType].goods[currentIndex].id][a.cartIndex]){
        var toAddCartNum = {
          'currentTarget':{
            'dataset':{
              'index':0,
              'goods_id':a.listData.data[currentType].goods[currentIndex].id
            }
          }
        };

        toAddCartNum.currentTarget.dataset.index = this.data.orderCartNum[a.listData.data[currentType].goods[currentIndex].id][a.cartIndex].cartIndex;
        this.addNumber(toAddCartNum);
        return false;
      }
    }
    //console.log(detail)
    var addItem = {
      "goods_id": a.listData.data[currentType].goods[currentIndex].id,
      "name": a.listData.data[currentType].goods[currentIndex].name,
      "price": a.listData.data[currentType].goods[currentIndex].price,
      "detail": detail,
      "number": 1,
      "sum": a.listData.data[currentType].goods[currentIndex].price,
    }
    var sumMonney = (a.sumMonney*100 + a.listData.data[currentType].goods[currentIndex].price*100)/100 + ".00";
    
    var cartList = this.data.cartList;
    cartList.push(addItem);

    var orderCartNum = this.data.orderCartNum;
    var cartIndex = cartList.length - 1;
    //处理数组
    var k = a.listData.data[currentType].goods[currentIndex].id;
    if(orderCartNum[k]){
      var yyyy = orderCartNum[k];
      yyyy.num += 1;
      yyyy.cartIndex = cartIndex;
      var arr = [];
      for(let j in yyyy){
        arr.push(yyyy[j]);
      }
      for (var i = 0; i <= arr.length;i++) {
        if(i == arr.length){
          yyyy[cartIndex] = {
            'cartIndex': cartIndex,
            'detail': detail,//规格
            'num':1
          }
        }
      }
    }else{
      //已选择的商品数量
      var orderCartData = {
        [cartIndex]:{
          'cartIndex': cartIndex,
          'detail': detail,//规格
          'num':1
        },
        'num':1,
        'cartIndex':cartIndex
      }
      orderCartNum[k] = orderCartData;
    }
    
    this.setData({
      cartList: cartList,
      showModalStatus: detail == '' ? false : true,
      sumMonney: sumMonney,
      cupNumber: a.cupNumber + 1,
      orderCartNum: orderCartNum,
      goods_id:a.listData.data[currentType].goods[currentIndex].id,
      cartIndex:cartIndex
    });
    var cartItems  = this.data.cartItems; 
    cartItems.cartList = cartList;
    cartItems.sumMonney = sumMonney;
    cartItems.cupNumber = a.cupNumber;
    cartItems.orderCartNum = orderCartNum;
    console.log(cartItems);
    try {
      wx.setStorageSync('cartItems', cartItems);
    } catch (e) { 
      console.log('erorr');
    }
    //console.log(this.data.cartList)
  },
  showCartList: function () {
    //console.log(this.data.showCart)
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
      cupNumber: 0,
      orderCartNum:[],
    });
    try {
      wx.removeStorageSync('cartItems')
    } catch (e) {
      console.log('error');
    }
  },
  addNumber: function (e) {
    var index = e.currentTarget.dataset.index;
    console.log(e)
    var cartList = this.data.cartList;
    //console.log(cartList)
    cartList[index].number++;
    var sum = this.data.sumMonney*100 + cartList[index].price*100;
    cartList[index].sum = (cartList[index].sum*100 + cartList[index].price*100)/100 + ".00";
    sum =  sum/100 + ".00";
    //console.log(sum);
    var orderCartNum = this.data.orderCartNum; 
    orderCartNum[e.currentTarget.dataset.goods_id].num += 1;
    orderCartNum[e.currentTarget.dataset.goods_id][index].num += 1;
    this.setData({
      cartList: cartList,
      sumMonney: sum,
      cupNumber: this.data.cupNumber+1,
      orderCartNum:orderCartNum,
      goods_id:e.currentTarget.dataset.goods_id,
      showModalStatus: e.currentTarget.dataset.typeup == 'true' ? true : false
    });
    var cartItems  = this.data.cartItems;
    cartItems.cartList = cartList;
    cartItems.sumMonney = sum;
    cartItems.cupNumber = this.data.cupNumber;
    cartItems.orderCartNum = orderCartNum;
    console.log(cartItems);
    try {
      wx.setStorageSync('cartItems', cartItems);
    } catch (e) { 
      console.log('erorr');
    }
  },
  decNumber: function (e) {
    var index = e.currentTarget.dataset.index;
    console.log(e)
    var cartList = this.data.cartList;
    
    var sum = this.data.sumMonney*100 - cartList[index].price*100;
    cartList[index].sum = (cartList[index].sum*100 - cartList[index].price*100)/100 + ".00";
    cartList[index].number == 1 ? cartList.splice(index, 1) : cartList[index].number--;
    sum =  sum/100 + ".00";

    var orderCartNum = this.data.orderCartNum; 
    console.log(orderCartNum);
    orderCartNum[e.currentTarget.dataset.goods_id][index].num -= 1;
    orderCartNum[e.currentTarget.dataset.goods_id].num -= 1;
 
    if(orderCartNum[e.currentTarget.dataset.goods_id][index].num <= 0){
      delete orderCartNum[e.currentTarget.dataset.goods_id][index];
      //刷新数据
      var temp = {};
      for(let goodsId in orderCartNum){
        if(!orderCartNum[goodsId]) continue;
        var arr = {};
        var num = 0;
        var cart = 0;
        for(let i in cartList){
          if(goodsId == cartList[i].goods_id){
            arr[i] = {
              'cartIndex': i,
              'detail': cartList[i].detail,//规格
              'num':cartList[i].number
            }
            num += cartList[i].number
            cart = i;
          }
        }
        var key = "num";
        arr[key] = num;
        var cartIndex= 'cartIndex';
        arr[cartIndex] = cart;
        temp[goodsId] = arr;
      }

      orderCartNum = temp;
    }
    
    if(orderCartNum[e.currentTarget.dataset.goods_id].num <= 0){
      delete orderCartNum[e.currentTarget.dataset.goods_id];
    }

    this.setData({
      cartList: cartList,
      sumMonney: sum,
      showCart: e.currentTarget.dataset.getjian == 'true' ? false : cartList.length == 0 ? false : true,
      cupNumber: this.data.cupNumber-1,
      orderCartNum: orderCartNum,
      goods_id:e.currentTarget.dataset.goods_id,
      showModalStatus: e.currentTarget.dataset.typeup == 'true' ? true : false
    });
    var cartItems  = this.data.cartItems;
    cartItems.cartList = cartList;
    cartItems.sumMonney = sum;
    cartItems.cupNumber = this.data.cupNumber;
    cartItems.orderCartNum = orderCartNum;
    //console.log(cartList.length);
    try {
      wx.setStorageSync('cartItems', cartItems);
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
    if (that.data.sumMonney != 0 ) {
      wx.setStorageSync('cartList', that.data.cartList);
      wx.setStorageSync('sumMonney', that.data.sumMonney);
      wx.setStorageSync('cupNumber', that.data.cupNumber);
      var cutMonney = that.data.sumMonney >= that.data.total_money ? that.data.coupon : 0;
      wx.setStorageSync('cutMonney', cutMonney);
      wx.navigateTo({
        url: '../order/balance/balance?coupon_id='+that.data.coupon_id
      })
    }
  },

  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    if(!wx.getStorageSync('cartItems'))
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