// index.js
// 获取应用实例
const app = getApp()
const {
  env
} = require('../../env.js')
const util = require('../../utils/util.js')

Page({
  data: {
    motto: 'Diary in pairs',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false
  },
  // 事件处理函数
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad() {
    wx.showLoading({
      title: '登录中',
    });
    this.getOpenId()
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },
  getOpenId() {
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      config: {
        env: env.cloudId
      },
      data: {
        type: 'getOpenId'
      }
    }).then((resp) => {
      let openid = resp.result.openid
      app.globalData.openid = openid
      this.getUserFromDB(openid)
    })
  },
  getUserFromDB(openid) {
    const db = wx.cloud.database()
    db.collection('user').where({
      _openid: openid
    }).get({
      success: (res) => {
        let data = res.data
        console.log("lmy", data, openid);
        if (data && data.length > 0) {
          this.setData({
            hasUserInfo: true
          })
          app.globalData.nickName = data[0].nickName;
          app.globalData.avatarUrl = data[0].avarUrl;
        }

        wx.hideLoading();
      },
      fail: () => {
        wx.hideLoading();
      }
    })
  },
  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log('lmy get user profile', res)
        const nickName = res.userInfo.nickName
        const avatarUrl = res.userInfo.avatarUrl
        const db = wx.cloud.database()
        db.collection('user').add({
          data: {
            nickName,
            avatarUrl,
            createdAt: util.formatSec(new Date())
          }
        }).then(res => {
          console.log('lmy db add user', res);
          app.globalData.nickName = nickName
          app.globalData.avatarUrl = avatarUrl
        }).catch(err => {
          console.log('lmy error to add user', err)
        })
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  getUserInfo(e) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    console.log(e)
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
})