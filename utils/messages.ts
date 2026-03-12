const moment = require('moment');

function formatMessage(username: string, text: string) {
  return {
    username,
    text,
    time: moment().format('h:mm a')
  };
}

module.exports = formatMessage;
