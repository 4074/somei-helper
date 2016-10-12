"use strict";

const fs = require('fs')
const express = require('express')
const moment = require('moment')
const schedule = require('node-schedule')
const pug = require('pug')

const config = require('./config')
const Record = require('./src/models')
const crawler = require('./src/crawler')

let job = null
let production = process.env.NODE_ENV === 'production'

// In production
// Run a job 9:00 every day
if (production) {
    job = schedule.scheduleJob('0 30 9 * * *', function() {
        crawler.soyoung()
    })

    schedule.scheduleJob('0 28 9 * * *', function() {
        crawler.gmei()
    })
    console.log('job is running')
}

const app = express()

/**
 * Get crawler result data from database
 * @param  {Function} cb callback
 * @return {Void}
 */
function fetch(cb) {
    if (config.database === "mongodb" && config.databaseConnected) {
        Record.aggregate([{
            $sort: {_date: -1}
        }, {
            $group: {
                _id: {site: '$site', date: '$date'},
                _date: {$first: '$_date'},
                site: {$first: '$site'},
                count: {$first: '$count'},
                special: {$first: '$special'},
                date: {$first: '$date'}
            }
        }, {
            $sort: {date: -1, site: 1}
        }]).limit(12).exec(function(err, data) {
            if (err) {
                console.log(err)
            }
            cb && cb(err, data)
        })
    } else {
        fs.readFile('./records.json', 'utf8', function (err, data) {
            if (err) cb(err);

            var result = []
            const keys = []
            var json = JSON.parse(data).reverse()
            json = json.sort(function(a, b) {
                return a.date < b.date ? 1 : -1
            })

            for (var i=0, len=json.length; i<len; i++) {
                const item = json[i]
                const key = item.site + item.date
                if (keys.indexOf(key) < 0) {
                    keys.push(key)
                    result.push(item)
                }
                if (result.length >= 12) {
                    break
                }
            }

            result.sort(function(a, b) {
                return a.date === b.date ? (a.site > b.site ? 1 : -1) : a.date < b.date ? 1 : -1
            })

            cb(null, result)
        })
    }
}

app.use(express.static(__dirname + '/static'))
app.engine('pug', pug.__express)
app.get('/', function(req, res) {
    // fetch data and render
    fetch(function(err, data) {
        if (err) {
            res.send(err)
        } else {
            res.render('index.pug', {
                list: data,
                keys: ['date', 'site', 'count', 'special'],
                titles: ['日期', '地址', '发帖', '其他']
            })
        }
    })
})

app.get('/run/:type?', function(req, res) {
    if (req.params.type) {
        if (req.params.type === 'soyoung') {
            crawler.soyoung()
        } else if (req.params.type === 'gmei') {
            crawler.gmei()
        }
    } else {
        crawler.soyoung()
        crawler.gmei()
    }
    res.send('running')
})

app.get('/cancelJob', function(req, res) {
    job && job.cancel()
    res.send(job ? 'cancel' : 'null')
})

app.listen(config.port, function() {
    console.log('app listen on port ', config.port)
})
