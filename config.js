"use strict";

const config = {
    port: 3344,
    database: 'mongodb',
    databaseConnected: false
}

const configOnHeroku = {
    port: process.env.port,
    database: 'json'
}

module.exports = process.env.NODE && ~process.env.NODE.indexOf("heroku") ? configOnHeroku : config
