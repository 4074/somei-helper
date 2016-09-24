"use strict";

const fs = require('fs')
const config = require('./../config')
const countSoyoung = require('./soyoung')
const countGmei = require('./gmei')
const moment = require('moment')
const Record = require('./models')

// Get data from soyoung.com and save to database
function soyoung() {
    const now = new Date()
    const m = moment([now.getFullYear(), now.getMonth(), now.getDate()]).add(-1, 'days')
    countSoyoung(parseInt(m.format('x'), 10), function(data) {
        let special = 0
        let ids = []
        data.forEach(item => {
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

// Get data from gmei.com and save to database
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

/**
 * Save data to database
 * @param  {Object} data
 * @return {Void}
 */
function saveRecord(data) {
    data._date = moment().utcOffset(8).toDate()
    if (config.database === 'mongodb') {
        const record = new Record(data)
        record.save(function(err, data) {
            if (err) console.log(err)
        })
    } else {
        const filePath = './records.json'
        fs.readFile(filePath, 'utf8', function (err, source) {
            if (err) console.log(err);

            var json = JSON.parse(source)
            json.push(data)

            fs.writeFile(filePath, JSON.stringify(json), function(err){
                if (err) console.log(err)
            })
        })
    }
}

module.exports = {
    soyoung: soyoung,
    gmei: gmei
}
