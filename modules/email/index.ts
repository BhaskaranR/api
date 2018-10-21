
import * as path from 'path';
import * as config from 'config';
import * as Seneca from 'seneca';
import * as mailer from './lib/mailer';
const pwd = path.join(__dirname, '..', '/.env');

const seneca = Seneca();
const patternPin = 'role:mailer';
seneca
    .add(patternPin + ',cmd:send,subject:pwforget,', mailer.sendPwForgottenMail)
    .add(patternPin + ',cmd:send,subject:generic,', mailer.sendGenericMail)
    .add(patternPin + ',cmd:send,subject:confirmMail', mailer.sendConfirmationMail);
seneca
    .listen({
        type: 'amqp',
        pin: patternPin
    })
    .client({
        type: 'amqp',
        pin: 'role:user'
    });