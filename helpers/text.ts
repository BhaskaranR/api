export const getShruggie = (messageData) => {
    messageData.message = '¯\_(ツ)_/¯';
    messageData.type = 'text';
    return Promise.resolve(messageData);
};
