require('./constants.js');
const fs = require('fs');

const log = fs.createWriteStream(LogFile, {flags : 'w'});

exports.write = function(message) {
    log.write(new Date().toISOString() + ':\t' + message);
}