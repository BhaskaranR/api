'use strict';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as Joi from 'joi';
import * as path from 'path';
import * as config from 'config';
import {validation} from './validation';
import * as mailgun from './mailgun';
import { getUserByMail } from './service';

const PASSWORT_FORGOTTEN_MAIL_TEMPLATE = path.resolve(__dirname, './../template/passwordForget.html');
const CONFIRM_EMAIL_TEMPLATE = path.resolve(__dirname, './../template/confirmEmail.html');
const log = require('karmasoc-util').logger;


export const sendPwForgottenMail = (message, next) => {
    let seneca = this;
    Joi.validate(message.data, validation.passwordForgotten, (err, data) => {
        if (err) {
            return util.validationError(err, 'send password forgotten service', next);
        }
        let user;
        getUserByMail(data.mail, seneca)
            .then(dbUser => {
                user = dbUser;
                return renderMail(PASSWORT_FORGOTTEN_MAIL_TEMPLATE, {
                    name: user.name,
                    password: data.new_password,
                    mail: user.mail
                })
            })
            .then(mail => mailgun.sendMailToMailgun(user, mail, 'Forgot Password Email'))
            .then(() => next(null, { ok: true }))
            .catch(err => {
                log.fatal('Unable to send password forgotten mail', { error: err });
                return next(null, { err: { msg: 'MAIL_SEND_FAILED', detail: err } });
            })
    });
}


export const sendConfirmationMail = (message, next) => {
    let seneca = this;
    Joi.validate(message.data, validation.confirmMail, (err, data) => {
        if (err) {
            return util.validationError(err, 'send confirmation email service', next);
        }
        let userActivationUrl = `${config.get("env.hostUrlExternal.karmasoc-web")}/activate/`;
        let user = {
            name: data.name,
            mail: data.userid,
            activationLink: userActivationUrl + data.token
        };

        return renderMail(CONFIRM_EMAIL_TEMPLATE, user)
            .then(mail => {
                return mailgun.sendMailToMailgun(user, mail, 'Email Verification')
            })
            .then(() => {
                return next(null, { ok: true })
            })
            .catch(err => {
                log.fatal('Unable to send verification mail', { error: err });
                return next(null, { err: { msg: 'MAIL_SEND_FAILED', detail: err } });
            })
    });
}


export const  sendGenericMail = (message, next) => {
    //DO NOTHING
}

export const renderMail = (mail, user) => {
    return new Promise((resolve, reject) => {
        fs.readFile(mail, 'utf-8', (err, template) => {
            if (err) {
                return reject('Unable to read mail template');
            }
            let compiled = _.template(template);
            let renderedMail = compiled(user);
            resolve(renderedMail);
        });
    });
}