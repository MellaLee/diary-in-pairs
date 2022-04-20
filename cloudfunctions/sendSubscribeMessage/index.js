// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
    try {
        const result = await cloud.openapi.subscribeMessage.send({
            "touser": event.touser,
            "page": 'pages/diary/index',
            "lang": 'zh_CN',
            "data": {
                "thing2": {
                    "value": event.content
                },
                "time3": {
                    "value": event.createdAt
                },
                "thing4": {
                    "value": event.commentUser 
                }
            },
            "templateId": event.templateId,
            "miniprogramState": 'developer'
        })
        return result
    } catch (err) {
        return err
    }
}