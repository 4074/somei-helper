const express = require('express')
const moment = require('moment')
const schedule = require('node-schedule')
const pug = require('pug')

const Record = require('./src/models')
const run = require('./src/run')

let job = null
let production = process.env.NODE_ENV === 'production'


if (production) {
    job = schedule.scheduleJob('0 0 9 * * *', function() {
        run.soyoung()
        run.gmei()
    })
    console.log('job is running')
}

const app = express()

function fetch(cb) {
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
}
// fetch()

app.use(express.static(__dirname + '/static'))
app.engine('pug', pug.__express)
app.get('/', function(req, res) {
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

app.get('/run', function(req, res) {
    run.soyoung()
    run.gmei()
    res.send('running')
})

app.get('/cancelJob', function(req, res) {
    job && job.cancel()
    res.send(job ? 'cancel' : 'null')
})

app.listen(3344, function() {
    console.log('app listen on port 3344')
})
