const request = require('superagent')
const cheerio = require('cheerio')

const url = 'http://www.soyoung.com/post1?post_type=0&list_type=1&time=3&page='
// const tags = '眼 鼻 脸 腿 耳 下巴 牙 腰 手 唇 眉 发'.split(' ')

/**
 * Count the article in gmei.com
 * @param  {Number}   time timestamp of the day article be post
 * @param  {Function} cb   callback
 * @return {Void}
 */
function countPost(time, cb) {
    let result = []
    countFromPage(1, time, result, cb)
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
                    // console.log(dateStr)

                    // const tagStr = $(item).find('.tag').text().replace(/ |\n/g, '')
                    // let tagCount = 0
                    //
                    // tags.forEach(item => {
                    //     if (tagStr.indexOf(item) >= 0) {
                    //         tagCount ++
                    //     }
                    //     if (tagCount >= 2) {
                    //         return false
                    //     }
                    // })
                    // if (tagCount < 2 && tagStr.indexOf('眼') === -1 && tagStr.indexOf('鼻') === -1) {

                        // console.log(tagStr)
                        const d = {
                            id: $item.find('.head_pic div').first().attr('uid_s'),
                            author: $item.find('.head_pic a img').first().attr('alt') || '',
                            uid: $item.find('.head_pic').first().attr('uid'),
                            date: dateStr,
                            verify: ($item.find('.head_pic a').first().attr('href') || '').indexOf('y.soyoung.com') >= 0
                                    || ($item.find('.head_pic a img').first().attr('src') || '').indexOf('soyoung.com/doctor') >= 0
                        }
                        data.push(d)
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

module.exports = countPost
