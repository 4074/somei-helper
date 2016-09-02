const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost/sg_helper')

const RecordSchema = new mongoose.Schema({
    site: {type: String},
    date: {type: String},
    count: {type: Number},
    special: {type: Number},
    _date: {type: Date, default: Date.now}
})

module.exports = mongoose.model('Record', RecordSchema)