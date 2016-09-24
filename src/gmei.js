"use strict";

const request = require('superagent')
const cheerio = require('cheerio')
const moment = require('moment')

const url = 'http://backend.gmei.com/api/community/index?device_id=869014026101460&lng=113.411888\
    &os_version=5.1&channel=meizu&screen=1080x1920&version=6.2.1&platform=android&app_name=com.wanmeizhensuo.zhensuo\
    &model=m1+metal&tabtype=1&lat=23.131033&current_city_id=guangzhou&start_num='

/**
 * Count the article in gmei.com
 * @param  {Number}   time timestamp of the day article be post
 * @param  {Function} cb   callback
 * @return {Void}
 */
function countPost(time, cb) {
    let result = []
    countFromPage(0, time, result, cb)
}

/**
 * Count the article from a page
 * @param  {Number}   index The page index
 * @param  {Number}   time  Timestamp
 * @param  {Array}    data  The data store
 * @param  {Function} cb    Callback
 * @return {Void}
 */
function countFromPage(index, time, data, cb) {
    let isOutday = false

    request.get(url + index * 10)
    .set('Accept', 'application/json')
    .end(function(err, res) {
        if (err) console.log(err);

        const topics = res.body.data.topics
        console.log(index)

        let isPrevIn = false
        function pushInDate(text, item) {
            isPrevIn = true
            console.log(text)
            data.push(item)
        }

        topics.forEach(item => {
            const dateStr = item.date
            if (dateStr != '刚刚' && dateStr.indexOf('分钟') < 0){
                const hour = new Date().getHours()
                if (dateStr.indexOf('小时') >= 0) {
                    if (parseInt(dateStr) > hour) {
                        // IN
                        pushInDate(dateStr, item)
                    } else if (parseInt(dateStr) == hour) {
                        if (item.images.length) {
                            if (item.images[0].image.indexOf(moment(time).format('YYYY/MM/DD')) > 0) {
                                // IN
                                return pushInDate('images in ' + dateStr, item)
                            }
                        } else if (isPrevIn) {
                            return pushInDate('no images in ' + dateStr, item)
                        }
                    }
                } else if (dateStr.indexOf('天') >= 0) {
                    if (dateStr === '1天前') {
                        if (item.images.length) {
                            // if (item.images[0].image.indexOf(moment(time).format('YYYY/MM/DD')) > 0) {
                                // IN
                                return pushInDate('images in ' + dateStr, item)
                            // } else {
                            //     isOutday = true
                            //     console.log('outday ' + dateStr)
                            //     return false
                            // }
                        } else if (isPrevIn) {
                            return pushInDate('no images in ' + dateStr, item)
                        }
                    } else {
                        isOutday = true
                        console.log('outday ' + dateStr)
                        return false
                    }
                } else {
                    const mt = parseInt(moment(new Date(time).getFullYear() + '-' + item.date, 'YYYY-MM-DD').format('x'), 10)
                    if (time === mt) {
                        // IN
                        return pushInDate(dateStr, item)

                    } else if (time > mt) {
                        isOutday = true
                        console.log('outday ' + dateStr)
                        return false
                    }
                }
            }

            isPrevIn = false
        })

        if (isOutday) {
            cb(data)
        } else {
            countFromPage(index + 1, time, data, cb)
        }
    })
}

module.exports = countPost
