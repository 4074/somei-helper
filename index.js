const express = require('express')
const request = require('superagent')
const cheerio = require('cheerio')
const moment = require('moment')

const app = express()

const url = 'http://www.soyoung.com/post1?post_type=0&list_type=1&time=3&page='


function countFromPage(index, time, data, cb) {
    let maxTime = time + 3600 * 24 * 1000
    let isOutday = false

    request.post(url + index)
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
                    console.log(dateStr)
                    data.push({
                        id: $item.find('.head_pic div').first().attr('uid_s'),
                        uid: $item.find('.head_pic').first().attr('uid'),
                        date: dateStr,
                        verify: ($item.find('.head_pic a').first().attr('href') || '').indexOf('y.soyoung.com') >= 0
                    })
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
    let isAllToday = false
    let result = []
    
    countFromPage(1, time, result, cb)

}
// countPost(function(data) {
//     let verifyCount = 0
//     data.forEach(item => {
//         if (item.verify) {
//             verifyCount ++
//         }
//     })
//     console.log({
//         count: data.length,
//         verifyCount: verifyCount
//     })
// })

app.use(express.static(__dirname + '/static'))

app.use('/:date?', function(req, res) {
    const now = new Date()
    var m = moment([now.getFullYear(), now.getMonth(), now.getDate()]).add(-1, 'days')
    console.log(req.params.date)
    if (req.params.date) {
        m = moment(req.params.date, 'YYYY-MM-DD')
        if (!m.isValid) {
            res.send('非法日期，日期格式：2016-08-30')
            return
        }
    }
    
    countPost(parseInt(m.format('x'), 10), function(data) {
        let verifyCount = 0
        data.forEach(item => {
            if (item.verify) {
                verifyCount ++
            }
        })
        console.log({
            count: data.length,
            verifyCount: verifyCount
        })
        
        res.send('日期:' + m.format('YYYY-MM-DD') + ' 发帖数:' + data.length + '认证发帖数:' + verifyCount)
    })
    
})

app.listen(3344, function() {
    console.log('app listen on port 3344')
})