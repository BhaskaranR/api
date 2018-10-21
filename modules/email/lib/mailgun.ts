'use strict';
import * as config from 'config';

const mailgun = require('mailgun-js')({ apiKey: config.get('mailGunApiKey'), domain: config.get('mailGunDomain') });
const KARMASOC_TEAM = 'Karmasoc Team <team@' + config.get('mailGunDomain') + '>';

export const sendMailToMailgun = (user, mail, subject) => {
    return new Promise((resolve, reject) => {
        let data = {
            from: KARMASOC_TEAM,
            to: user.mail,
            subject: subject,
            html: mail
        };
        // send mail
        mailgun.messages().send(data, err => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
};