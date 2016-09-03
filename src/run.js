const countSoyoung = require('./soyoung')
const countGmei = require('./gmei')
const moment = require('moment')
const Record = require('./models')

function soyoung() {
    const now = new Date()
    const m = moment([now.getFullYear(), now.getMonth(), now.getDate()]).add(-1, 'days')
    countSoyoung(parseInt(m.format('x'), 10), function(data) {
        let special = 0
        let ids = []
        data.forEach(item => {
            console.log(item.author)
            if (ids.indexOf(item.id) < 0) {
                if (item.verify || item.author.indexOf('医院') >= 0) special ++;
                ids.push(item.id)
            }
        })
        
        let record = {
            site: 'soyoung',
            date: m.format('YYYY-MM-DD'),
            count: ids.length,
            special: special
        }
        console.log(record)
        saveRecord(record)
    })
}

function gmei() {
    const now = new Date()
    const m = moment([now.getFullYear(), now.getMonth(), now.getDate()]).add(-1, 'days')
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
        
        let record = {
            site: 'gmei',
            date: m.format('YYYY-MM-DD'),
            count: data.length,
            special: buyCount
        }
        console.log(record)
        saveRecord(record)
    })
}

function saveRecord(data) {
    const record = new Record(data)

    record.save(function(err, data) {
        if (err) console.log(err)
    })
}

module.exports = {
    soyoung: soyoung,
    gmei: gmei
}