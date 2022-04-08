const util = require('../../utils/util.js')

Page({
  data: {
    diary: [],
    currentPage: 1,
    size: 10,
    isLastPage: false,
    users: [],
    pullRefresh: false
  },
  onLoad() {
    console.log("lmy on load")
    this.getRefreshPage(1)
  },
  onShow() {
    console.log("lmy on show");
    if (this.data.users.length !== 0) {
      this.getRefreshPage(this.data.currentPage)
    }
  },
  getRefreshPage(page) {
    wx.showLoading({
      title: '日志加载中',
    });
    if (this.data.users.length === 0) {
      this.getAllUsers().then(res => {
        this.getCertainPageDiary(page)
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '获取用户信息错误',
        })
      })
    } else {
      this.getCertainPageDiary(page)
    }

  },
  getAllUsers() {
    const db = wx.cloud.database()
    return db.collection('user')
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
      })
  },
  getCertainPageDiary(page) {
    const db = wx.cloud.database()
    db.collection('diary')
      .where({
        deleted: 0
      })
      .skip((page - 1) * this.data.size)
      .limit(this.data.size)
      .orderBy('createdAt', 'desc')
      .get()
      .then(res => {
        const data = res.data
        let addedDiary = []
        data.forEach(item => {
          let user = this.data.users[item._openid] ? this.data.users[item._openid] : {
            nickName: '未知用户'
          }
          addedDiary.push({
            "_id": item._id,
            "content": item.content,
            "createdAt": util.formatDateDiff(item.createdAt),
            "nickName": user.nickName,
            "avatarUrl": user.avatarUrl,
            "location": item.location
          })
        })
        let diary = this.data.diary
        let currentPage = this.data.currentPage
        let isLastPage = this.data.isLastPage
        let pullRefresh = false;
        // 若是顶部刷新或首次加载
        if (page === 1) {
          // 重新加载
            diary = addedDiary
            currentPage = 1
        } else if (!isLastPage) {
          // 底部刷新且非最后一页
          diary = diary.concat(addedDiary)
        } else {
          // 底部刷新且是最后一页
          let lastPageItemCount = diary.length % this.data.size
          if (lastPageItemCount === 0) {
            diary = diary.concat(addedDiary)
          } else {
            diary.splice(-lastPageItemCount, lastPageItemCount, ...addedDiary)
          }
        }
        
        if (addedDiary.length < this.data.size) {
          isLastPage = true
        } else {
          isLastPage = false
          currentPage += 1
        }
        this.setData({
          diary,
          currentPage,
          isLastPage,
          pullRefresh
        })
        console.log('lmy get all diary', this.data.diary, this.data.currentPage)
        wx.hideLoading();
      }).catch(err => {
        console.log("lmy diary list err", err);
        wx.hideLoading();
      })
  },
  upper() {
    console.log("lmy trigger pull update");
    this.getRefreshPage(1)
  },
  lower() {
    console.log("lmy trigger bottom update");
    this.getRefreshPage(this.data.currentPage)
  }
})