// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
    return db.collection(event.collect).aggregate()
        .match({
            deleted: 0 
        })
        .lookup({
            from: event.from, 
            localField: event.localField,
            foreignField: event.foreignField, 
            as: event.as 
        })
        .skip(event.skip)
        .limit(event.limit)
        .sort(event.sort)
        .end()
        .then(res => {
            console.log("success to aggregate", res)
            return res
        })
        .catch(res => {
            console.error("failed to aggregate", res)
            return res
        })
}