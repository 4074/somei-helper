const config = {
    port: 3344,
    database: 'mongodb'
}

const configOnHeroku = {
    port: 3100,
    database: 'json'
}

module.exports = process.env.NODE && ~process.env.NODE.indexOf("heroku") || 1 ? configOnHeroku : config
