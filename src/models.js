"use strict";

const mongoose = require('mongoose')
const moment = require('moment')
const config = require('./../config')

mongoose.connect('mongodb://localhost/sg_helper', function(err, connection) {
    if (err) {
        console.log('mongodb connect fail')
    } else {
        console.log('mongodb connected')
        config.databaseConnected = true
    }
})

const RecordSchema = new mongoose.Schema({
    site: {type: String},
    date: {type: String},
    count: {type: Number},
    special: {type: Number},
    _date: {type: Date, default: moment().utcOffset(8).toDate()}
})

module.exports = mongoose.model('Record', RecordSchema)
