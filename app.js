// app.js
const { env } = require('./env')

App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: env.cloudId,
        traceUser: true,
      });
    }
    this.getUserInfo()
  },
  getUserInfo() {
    const that = this
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      config: {
        env: env.cloudId
      },
      data: {
        type: 'getOpenId'
      }
    }).then((resp) => {
      this.globalData.openid = resp.result.openid
   })
  },
  globalData: {
    openid: '',
    nickName: '',
    avatarUrl: ''
  }
})
