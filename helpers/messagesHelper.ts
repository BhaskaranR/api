import * as giphy from './giphy';
import * as weather from './weather';
import * as text from './text';

const ACTIONS = {
    '/giphy': giphy.getGiphy,
    '/weather': weather.getWeather,
    '/wetter': weather.getWeather,
    '/shruggie': text.getShruggie,
    '/shrug': text.getShruggie
};

export const getMessageObject = (messageData) => {
    let msgArray = messageData.message.split(' ');
    return new Promise(resolve => {

        let fn = ACTIONS[msgArray[0]];
        if (fn) {
            return fn(messageData, msgArray).then(resolve);
        }
        resolve(messageData);
    });
};

module.exports = fns;