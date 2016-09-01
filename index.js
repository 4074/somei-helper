const express = require('express')
const request = require('superagent')
const cheerio = require('cheerio')
const moment = require('moment')

const app = express()

const urls = {
    soyoung: 'http://www.soyoung.com/post1?post_type=0&list_type=1&time=3&page=',
    gmei: 'http://backend.gmei.com/api/community/index?device_id=869014026101460&lng=113.411888\
    &os_version=5.1&channel=meizu&screen=1080x1920&version=6.2.1&platform=android&app_name=com.wanmeizhensuo.zhensuo\
    &model=m1+metal&tabtype=1&lat=23.131033&current_city_id=guangzhou&start_num=',
}
const tags = '眼 鼻 脸 腿 耳 下巴 牙 腰 手 唇 眉 发'.split(' ')

function countFromPage(index, time, data, cb) {
    let maxTime = time + 3600 * 24 * 1000
    let isOutday = false

    request.post(urls.soyoung + index)
    .end(function(err, res) {
        if (err) {
            console.log(err)
        }
        
        let $ = cheerio.load(res.text)
        let $ul = $('.beauty_list')
        let $li = $ul.find('>li').not('.top')
        console.log($li.length)
        $li.each((i, item) => {
            const $item = $(item)
            const dateStr = $(item).find('.date').text()
            const date = new Date(dateStr).getTime()
            
            if (date < time) {
                isOutday = true
                return false
            } else {
                if (date < maxTime) {
                    // console.log(dateStr)
                    
                    const tagStr = $(item).find('.tag').text().replace(/ |\n/g, '')
                    let tagCount = 0
                    
                    tags.forEach(item => {
                        if (tagStr.indexOf(item) >= 0) {
                            tagCount ++
                        }
                        if (tagCount >= 2) {
                            return false
                        }
                    })
                    // if (tagCount < 2 && tagStr.indexOf('眼') === -1 && tagStr.indexOf('鼻') === -1) {
                        
                        // console.log(tagStr)
                        data.push({
                            id: $item.find('.head_pic div').first().attr('uid_s'),
                            uid: $item.find('.head_pic').first().attr('uid'),
                            date: dateStr,
                            verify: ($item.find('.head_pic a').first().attr('href') || '').indexOf('y.soyoung.com') >= 0
                        })
                    // }
                }
            }
        })
        if (isOutday) {
            cb(data)
        } else {
            countFromPage(index + 1, time, data, cb)
        }
    })
}

function countPost(time, cb) {
    let result = []
    
    countFromPage(1, time, result, cb)

}

app.use(express.static(__dirname + '/static'))

app.use('/soyoung/:date?', function(req, res) {
    const now = new Date()
    var m = moment([now.getFullYear(), now.getMonth(), now.getDate()]).add(-1, 'days')
    if (req.params.date) {
        m = moment(req.params.date, 'YYYY-MM-DD')
        if (!m.isValid) {
            res.send('非法日期，日期格式：2016-08-30')
            return
        }
    }
    
    countPost(parseInt(m.format('x'), 10), function(data) {
        let verifyCount = 0
        let ids = []
        data.forEach(item => {
            if (ids.indexOf(item.id) < 0) {
                if (item.verify) verifyCount ++;
                ids.push(item.id)
            }
        })
        console.log({
            site: 'soyoung',
            date: m.format('YYYY-MM-DD'),
            count: ids.length,
            verifyCount: verifyCount
        })
        
        res.send('地址:soyoung 日期:' + m.format('YYYY-MM-DD') + ' 发帖数:' + ids.length + ' 认证发帖数:' + verifyCount)
    })
    
})

app.use('/gmei/:date?', function(req, res) {
    const now = new Date()
    var m = moment([now.getFullYear(), now.getMonth(), now.getDate()]).add(-1, 'days')
    if (req.params.date) {
        m = moment(req.params.date, 'YYYY-MM-DD')
        if (!m.isValid) {
            res.send('非法日期，日期格式：2016-08-30')
            return
        }
    }
    
    console.log('start gmei ', m.format('YYYY-MM-DD'))
    countGmei(parseInt(m.format('x'), 10), function(data) {
        let buyCount = 0
        
        data.forEach(item => {
            if (item.tags && item.tags.length) {
                item.tags.forEach(t => {
                    if (t.name == "美购日记") {
                        buyCount ++
                        return false
                    }
                })
            }
        })
        
        console.log({
            site: 'gmei',
            date: m.format('YYYY-MM-DD'),
            count: data.length,
            buyCount: buyCount
        })
        res.send('地址:gmei 日期:' + m.format('YYYY-MM-DD') + ' 发帖数:' + data.length + ' 美购日记:' + buyCount)
    })
})

function countGmei(time, cb) {
    let result = []
    countGmeiItem(0, time, result, cb)
}

function countGmeiItem(index, time, data, cb) {
    let isOutday = false
    
    request.get(urls.gmei + index * 10)
    .set('Accept', 'application/json')
    .end(function(err, res) {
        if (err) console.log(err);
        
        const topics = res.body.data.topics
        console.log(index)
        
        topics.forEach(item => {
            const dateStr = item.date
            if (dateStr != '刚刚' && dateStr.indexOf('分钟') < 0){
                const hour = new Date().getHours()
                if (dateStr.indexOf('小时') >= 0) {
                    if (parseInt(dateStr) > hour) {
                        // IN
                        console.log(dateStr)
                        data.push(item)
                    } else if (parseInt(dateStr) == hour) {
                        if (item.images.length) {
                            if (item.images[0].image.indexOf(moment(time).format('YYYY/MM/DD')) > 0) {
                                // IN
                                console.log('images in', dateStr)
                                data.push(item)
                            }
                        } else {
                            console.log('no images out')
                        }
                    }
                } else {
                    const mt = parseInt(moment(new Date(time).getFullYear() + '-' + item.date, 'YYYY-MM-DD').format('x'), 10)
                    if (time === mt) {
                        // IN
                        console.log(dateStr)
                        data.push(item)
                        
                    } else if (time > mt) {
                        isOutday = true
                        return false
                    }
                }
            }
            
            
            // console.log(item.date)
            
            // const images = item.images
            // if (images && images.length) {
            //     // images.forEach(d => {
            //     const image = images[0].image
            //     const dateStr = image.replace('http://pic.gmei.com/', '').substr(0, 10)
            //     const ttime = parseInt(moment(dateStr.split('/')).format('x'), 10)
            //     if (time === ttime) {
            //         // IN
            //         console.log('image in ', dateStr)
            //         console.log(item.date)
            //         data.push(item)
            //     } else if (time > ttime) {
            //         isOutday = true
            //         return false
            //     }
            //     // })
            // } else {
            //     if (isPrevIn) {
            //         // IN
            //         console.log('no images in~~~~~~')
            //         console.log(item.date)
            //         data.push(item)
            //     }
            // }
            
        })
        
        if (isOutday) {
            cb(data)
        } else {
            countGmeiItem(index + 1, time, data, cb)
        }
    })
}

app.listen(3344, function() {
    console.log('app listen on port 3344')
})