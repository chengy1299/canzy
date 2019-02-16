const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function checklogin (){
  wx.login({// 登录
    success: res => {
      //console.log(res);
      // 发送 res.code 到后台换取 openId, sessionKey, unionId
      wx.request({
        url: 'https://order123.top/canzy/api/user/wechatminilogin',
        method: 'GET',
        data: {
          code: res.code,
        },
        success: function (res) {
          //console.log(res)
          if(res.data.data == false)
          {//没有注册则跳去注册（直接返回登录状态）
            wx.navigateTo({
              url: '../authorize/index'
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
}

module.exports = {
  formatTime: formatTime,
  checklogin: checklogin,
}
