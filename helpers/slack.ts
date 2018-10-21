import * as Slack from 'slack-node';

const slack = new Slack();
export const sendSlackInfo = (channel, text) => {
    slack.setWebhook(channel);
    slack.webhook({
        text: JSON.stringify(text)
    }, (err) => {
        if (err) {
            console.log(err);
        }
    });
};