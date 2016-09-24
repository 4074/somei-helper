"use strict";

const config = {
    port: 3344,
    database: 'mongodb',
    databaseConnected: false
}

const configOnHeroku = {
    port: process.env.PORT,
    database: 'json'
}

module.exports = process.env.NODE && ~process.env.NODE.indexOf("heroku") ? configOnHeroku : config
