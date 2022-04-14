// pages/index/editor/editor.js
const util = require('../../../utils/util.js')
const app = getApp()

Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },

    /**
     * 组件的初始数据
     */
    data: {
        selectedDate: util.formatDay(new Date()),
        editContent: '',
        location: '',
        media: [],
        maxMediaItemLength: 3,
        touchStart: '',
        imgPreviewPaths: [],
        publishBtnLoading: false,
        // 编辑器属性
        formats: {},
        readOnly: false,
        placeholder: '今天发生了...',
        editorHeight: 300,
        keyboardHeight: 0,
        isIOS: false,
        safeHeight: 0,
        toolBarHeight: 50,
    },

    /**
     * 组件的方法列表
     */
    methods: {
        bindDateChange(e) {
            this.setData({
                selectedDate: e.detail.value
            })
        },
        readOnlyChange() {
            this.setData({
                readOnly: !this.data.readOnly
            })
        },
        onLoad() {
            this.setData({
                theme: wx.getSystemInfoSync().theme || 'light'
            })

            if (wx.onThemeChange) {
                wx.onThemeChange(({
                    theme
                }) => {
                    this.setData({
                        theme
                    })
                })
            }
            const {
                platform,
                safeArea,
                screenHeight
            } = wx.getSystemInfoSync()
            let safeHeight
            if (safeArea) {
                safeHeight = (screenHeight - safeArea.bottom)
            } else {
                safeHeight = 32
            }
            this._safeHeight = safeHeight
            const isIOS = platform === 'ios'
            this.setData({
                isIOS,
                safeHeight,
                toolBarHeight: isIOS ? safeHeight + 50 : 50
            })
            const that = this
            this.updatePosition(0)
            let keyboardHeight = 0
            wx.onKeyboardHeightChange(res => {
                if (res.height === keyboardHeight) {
                    return
                }
                const duration = res.height > 0 ? res.duration * 1000 : 0
                keyboardHeight = res.height
                setTimeout(() => {
                    wx.pageScrollTo({
                        scrollTop: 0,
                        success() {
                            that.updatePosition(keyboardHeight)
                            that.editorCtx.scrollIntoView()
                        }
                    })
                }, duration)
            })
        },
        updatePosition(keyboardHeight) {
            const toolbarHeight = 50
            const {
                windowHeight
            } = wx.getSystemInfoSync()
            let editorHeight = windowHeight
            if (keyboardHeight > 0) {
                editorHeight = windowHeight - keyboardHeight - toolbarHeight
            }
            if (keyboardHeight === 0) {
                this.setData({
                    editorHeight,
                    keyboardHeight,
                    toolBarHeight: this.data.isIOS ? 50 + this._safeHeight : 50,
                    safeHeight: this._safeHeight,
                })
            } else {
                this.setData({
                    editorHeight,
                    keyboardHeight,
                    toolBarHeight: 50,
                    safeHeight: 0,
                })
            }
        },
        calNavigationBarAndStatusBar() {
            const systemInfo = wx.getSystemInfoSync()
            const {
                statusBarHeight,
                platform
            } = systemInfo
            const isIOS = platform === 'ios'
            const navigationBarHeight = isIOS ? 44 : 48
            return statusBarHeight + navigationBarHeight
        },
        onEditorReady() {
            const that = this
            wx.createSelectorQuery().in(that).select('.editor-id').context(function (res) {
                that.editorCtx = res.context
            }).exec()
        },
        onEditing(e) {
            if (e) {
                console.log('lmy editing', e.detail)
                this.setData({
                    editContent: e.detail.html
                })
            }
        },
        format(e) {
            const {
                name,
                value
            } = e.target.dataset
            if (!name) return
            this.editorCtx.format(name, value)
        },
        onStatusChange(e) {
            const formats = e.detail
            console.log('lmy status change', e)
            this.setData({
                formats
            })
        },
        insertDivider() {
            this.editorCtx.insertDivider({
                success() {
                    console.log('insert divider success')
                }
            })
        },
        clear() {
            this.setData({
                location: '',
                media: [],
                imgPreviewPaths: []
            })
            this.editorCtx.clear({
                success() {
                    console.log('clear success')
                }
            })
        },
        removeFormat() {
            this.editorCtx.removeFormat()
        },
        insertDate() {
            const date = new Date()
            const formatDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
            this.editorCtx.insertText({
                text: formatDate
            })
        },
        insertImage() {
            const that = this
            let media = that.data.media
            wx.chooseImage({
                count: that.data.maxMediaItemLength - media.length,
                sizeType: ['compressed'],
                success(chooseResult) {
                    let tempFilePaths = chooseResult.tempFilePaths
                    tempFilePaths.forEach(tempFilePath => {
                        let type = util.getFileType(tempFilePath)
                        new Promise((resolve, reject) => {
                            if (type === 'jpg') {
                                wx.compressImage({
                                    src: tempFilePath,
                                    quality: 60,
                                    success(compressResult) {
                                        tempFilePath = compressResult.tempFilePath
                                        resolve()
                                    },
                                    fail() {
                                        reject()
                                    }
                                })
                            } else {
                                resolve()
                            }
                        }).then(() => {
                            let imgPreviewPaths = that.data.imgPreviewPaths
                            media.push({
                                type,
                                tempFilePath,
                            })
                            imgPreviewPaths.push(tempFilePath)
                            that.setData({
                                media,
                                imgPreviewPaths
                            })
                        });
                    });
                }
            })
        },
        chooseLocation() {
            const that = this
            wx.getLocation({
                type: 'wgs84',
                success(res) {
                    wx.chooseLocation({
                        latitude: res.latitude,
                        longitude: res.longitude,
                        success(data) {
                            that.setData({
                                location: data.name
                            })
                        }
                    })
                }
            })
        },
        onImageTouchStart(e) {
            console.log('touch start', e.timeStamp)
            this.setData({
                touchStart: e.timeStamp
            })
        },
        onImageTouchEnd(e) {
            console.log('touch end', e.timeStamp)
            let touchEnd = e.timeStamp
            let touchStart = this.data.touchStart
            const that = this
            if (touchEnd - touchStart < 500) {
                this.previewCurrentImage(e.currentTarget.dataset.path)
            } else {
                wx.showModal({
                    content: '是否删除此图片',
                    success(res) {
                        if (res.confirm) {
                            let media = that.data.media
                            let imgPreviewPaths = that.data.imgPreviewPaths
                            let deleteIndex = e.currentTarget.dataset.index
                            media.splice(deleteIndex, 1)
                            imgPreviewPaths.splice(deleteIndex, 1)
                            that.setData({
                                media,
                                imgPreviewPaths
                            })
                        }
                    }
                })
                console.log('trigger to delete')
            }
        },
        previewCurrentImage(currentImagePath) {
            console.log("lmy preview image", currentImagePath, this.data.imgPreviewPaths);
            wx.previewImage({
                urls: this.data.imgPreviewPaths,
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
        uploadMedia(diaryId) {
            // 上传到云存储
            let promises = this.data.media.map(item => {
                return wx.cloud.uploadFile({
                    cloudPath: app.globalData.openid + '/' + new Date().valueOf() + '.' + item.type.format,
                    filePath: item.tempFilePath,
                })
            })
            return Promise.all(promises).then(res => {
                let insertData = []
                const media = this.data.media
                res.forEach((item, index) => {
                    insertData.push({
                        diaryId,
                        type: media[index].type,
                        fileID: item.fileID,
                        createdAt: util.formatSec(new Date()),
                        deleted: 0
                    })
                })
                console.log("lmy", res, insertData);
                wx.cloud.callFunction({
                    name: 'bulkInsert',
                    data: {
                        data: insertData,
                        table: 'attachment'
                    }
                })
            })
        },
        onPublish() {
            this.setData({
                publishBtnLoading: true
            });
            console.log('lmy publish', this.data.location, this.data.editContent)
            // 1. 获取数据库引用
            const db = wx.cloud.database()
            // 2. 保存日记 
            const that = this
            db.collection('diary').add({
                data: {
                    content: this.data.editContent,
                    location: this.data.location,
                    createdAt: util.formatSec(new Date()),
                    deleted: 0
                }
            }).then(res => {
                that.uploadMedia(res._id).then(res => {
                    wx.showToast({
                        title: '发表成功',
                        duration: 2000,
                        success: () => {
                            that.clear()
                            that.setData({
                                publishBtnLoading: false 
                            });
                            app.globalData.switchToDiaryList = 1
                            wx.switchTab({
                                url: '/pages/diary/index'
                            })
                        }
                    })
                })
            }).catch(res => {
                console.error('failed to publish media', res)
                wx.showToast({
                    title: '图片上传失败',
                })
            })
        }
    },

    lifetimes: {
        ready: function () {
            console.log("ready")
        }
    }
})