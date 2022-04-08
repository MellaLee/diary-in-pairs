// pages/index/editor/editor.js
const util = require('../../../utils/util.js')

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
            wx.chooseImage({
                count: 1,
                success(res) {
                    that.editorCtx.insertImage({
                        src: res.tempFilePaths[0],
                        data: {
                            id: 'abcd',
                            role: 'god'
                        },
                        width: '80%',
                        success() {
                            console.log('insert image success')
                        }
                    })
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
        onPublish() {
            console.log('lmy publish', this.data.location, this.data.editContent)
            // 1. 获取数据库引用
            const db = wx.cloud.database()
            // 2. 构造查询语句
            db.collection('diary').add({
                data: {
                    content: this.data.editContent,
                    location: this.data.location,
                    createdAt: util.formatSec(new Date()),
                    deleted: 0
                },
                success: res => {       
                    wx.showToast({
                        title: '发表成功',
                        duration: 2000,
                        success: () => {
                            this.clear()
                            wx.switchTab({
                                url: '/pages/diary/index',
                            })
                        }
                    })
                },
                fail: res => {
                    wx.showToast({
                        title: '发表失败',
                    })
                }
            })
        }
    },

    lifetimes: {
        ready: function () {
            console.log("ready")
        }
    }
})