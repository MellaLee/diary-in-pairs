const util = require('../../utils/util.js')

Page({
  data: {
    diary: [],
    currentPage: 1,
    size: 6,
    isLastPage: false,
    users: [],
    diaryLoading: false
  },
  onLoad() {
    wx.showLoading({
      title: '日志加载中',
    });
    this.getRefreshPage(1)
  },
  onShow() {
    if (getApp().globalData.switchToDiaryList === 1) {
      getApp().globalData.switchToDiaryList = 0
      this.getRefreshPage(1)
    }
  },
  onTabItemTap() {
    if (this.data.users.length !== 0) {
      // 非首次加载页面，通过tab进入时加载页面
      console.log('lmy get tab diary on page', this.data.currentPage)
      this.getRefreshPage(this.data.currentPage)
    }
  },
  getRefreshPage(page) {
    if (this.data.users.length === 0) {
      this.getAllUsers().then(res => {
        this.getCertainPageDiary(page)
      }).catch(err => {
        console.error(err);
        wx.hideLoading();
        wx.showToast({
          title: '获取用户信息错误',
        })
      })
    } else {
      this.setData({
        diaryLoading: true
      })
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
    wx.cloud.callFunction({
      name: 'collectionAggregate',
      data: {
        collect: 'diary',
        from: 'attachment',
        localField: '_id',
        foreignField: 'diaryId',
        as: 'attachmentList',
        skip: (page - 1) * this.data.size,
        limit: this.data.size,
        sort: {
          createdAt: -1
        }
      }
    }).then(res => {
      const data = res.result.list
      let addedDiary = []
      let promises = data.map((item, index) => {
        let user = this.data.users[item._openid] ? this.data.users[item._openid] : {
          nickName: '未知用户'
        }
        return this.getTempFileUrlsOnOss(item.attachmentList).then(res => {
          addedDiary[index] = {
            "_id": item._id,
            "content": item.content,
            "createdAt": util.formatDateDiff(item.createdAt),
            "nickName": user.nickName,
            "avatarUrl": user.avatarUrl,
            "location": item.location,
            "attachmentLists": res
          }
        });
      })
      Promise.all(promises).then(res => {
        let diary = this.data.diary
        let currentPage = this.data.currentPage
        let isLastPage = this.data.isLastPage
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

        console.log('lmy get diary on Page', currentPage, diary)
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
          diaryLoading: false
        })
        wx.hideLoading();
      })
    }).catch(err => {
      console.log("lmy diary list err", err);
      wx.hideLoading();
      this.setData({
        diaryLoading: false
      })
    })
  },
  upper() {
    console.log("lmy trigger pull update");
    this.getRefreshPage(1)
  },
  lower() {
    console.log("lmy trigger bottom update");
    this.getRefreshPage(this.data.currentPage)
  },
  getTempFileUrlsOnOss(attachmentList) {
    return new Promise((resolve, reject) => {
      if (!attachmentList || attachmentList.length === 0) {
        resolve([])
      } else {
        let fileList = attachmentList.map(item => {
          return {
            fileID: item.fileID,
            maxAge: 60 * 60, // one hour
          }
        })
        wx.cloud.getTempFileURL({
          fileList
        }).then(res => {
          let result = res.fileList.map((item, index) => {
            // return {
            //   "type": attachmentList[index].type.type,
            //   "url": item.tempFileURL
            // }
            return item.tempFileURL
          })
          resolve(result)
        }).catch(res => {
          console.error(res)
          reject([])
        })
      }
    })
  },
  previewCurrentImage(e) {
    let index = e.currentTarget.dataset.diaryIndex
    let currentImagePath = e.currentTarget.dataset.path
    wx.previewImage({
      urls: this.data.diary[index].attachmentLists,
      current: currentImagePath,
      showmenu: true,
      success: (res) => {},
      fail: (res) => {
        console.error('failed to preview image', res)
        wx.showToast({
          title: '预览失败',
        })
      },
      complete: (res) => {},
    })
  },
  
})