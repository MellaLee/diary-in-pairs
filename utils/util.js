const formatDay = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${[year, month, day].map(formatNumber).join('-')}`
}

const formatSec = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const min = date.getMinutes()
  const sec = date.getSeconds()
  return `${[year, month, day].map(formatNumber).join('-') + ' ' + [hour, min, sec].map(formatNumber).join(':')}`
}

const formatDateDiff = (dateTimeStamp) => {
  // 时间字符串转时间戳
  var timestamp = new Date(dateTimeStamp).getTime();
  
  var minute = 1000 * 60;
  var hour = minute * 60;
  var day = hour * 24;
  var halfamonth = day * 15;
  var month = day * 30;
  var year = day * 365;
  var now = new Date().getTime();
  var diffValue = now - timestamp;
  var result;
  if (diffValue < 0) {
      return;
  }
  var yearC = diffValue / year;
  var monthC = diffValue / month;
  var weekC = diffValue / (7 * day);
  var dayC = diffValue / day;
  var hourC = diffValue / hour;
  var minC = diffValue / minute;
  if (yearC >= 1) {
      result = "" + parseInt(yearC) + "年前";
  } else if (monthC >= 1) {
      result = "" + parseInt(monthC) + "月前";
  } else if (weekC >= 1) {
      result = "" + parseInt(weekC) + "周前";
  } else if (dayC >= 1) {
      result = "" + parseInt(dayC) + "天前";
  } else if (hourC >= 1) {
      result = "" + parseInt(hourC) + "小时前";
  } else if (minC >= 1) {
      result = "" + parseInt(minC) + "分钟前";
  } else
      result = "刚刚";
  return result;
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

module.exports = {
  formatDay,
  formatSec,
  formatDateDiff
}
