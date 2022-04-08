const util = require('../../utils/util.js')

Page({
  data: {
    diary: [],
    currentPage: 0,
    size: 50,
    users: []
  },
  onLoad() {
    wx.showLoading({
      title: '加载日志中',
    });
    const db = wx.cloud.database()
    db.collection('user')
      .get()
      .then(res => {
        const data = res.data
        let users = {}
        data.forEach(item => {
          users[item._openid] = {
            nickName: item.nickName,
            avatarUrl: item.avatarUrl
          }
        });
        this.setData({
          users
        })
        this.getAllDiary()
      })
  },
  onShow() {
    console.log("lmy on show");
    this.getAllDiary()
  },
  getAllDiary() {
    const db = wx.cloud.database()
    db.collection('diary')
      .where({
        deleted: 0
      })
      .skip(this.data.currentPage * this.data.size)
      .limit(this.data.size)
      .orderBy('createdAt', 'desc')
      .get()
      .then(res => {
        const data = res.data
        console.log('lmy get all diary', data)
        let diary = []
        data.forEach(item => {
          let user = this.data.users[item._openid] ? this.data.users[item._openid] : {
            nickName: '未知用户'
          }
          diary.push({
            "_id": item._id,
            "content": item.content,
            "createdAt": util.formatDateDiff(item.createdAt),
            "nickName": user.nickName,
            "avatarUrl": user.avatarUrl,
            "location": item.location
          })
        })
        this.setData({
          diary
        })
        wx.hideLoading();
      }).catch(err => {
        console.log("lmy diary list err", err);
        wx.hideLoading();
      })
  }
})