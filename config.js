const config = {
    port: 3344,
    database: 'mongodb'
}

const configOnHeroku = {
    port: 80,
    database: 'json'
}

module.exports = process.env.NODE && ~process.env.NODE.indexOf("heroku") ? configOnHeroku : config
