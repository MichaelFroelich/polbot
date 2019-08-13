require('./constants.js');
const fs = require('fs');

const log = fs.createWriteStream(LogFile, {flags : 'w'});

exports.write = function(message) {
    log.write(new Date().toISOString() + ':\t' + message + " \r\n");
}

exports.LogSuccess = function(operation, value) {
    var loggingKey;
    if(value.hasOwnProperty(name)) {
        loggingKey = value.name;
    }
    else if(value.hasOwnProperty(id)) {
        loggingKey = value.id;
    } else {
        loggingKey = value;
    }
    this.write('Successfully ' + operation + ' for ' + loggingKey );
}

exports.LogFail = function(operation, reason) {
    this.write('Failed to ' + operation + ' because ' + reason.message );
}