'use strict';
import * as service from './services';
import * as push from './push';
import { validations } from './validation';
const Joi = require('joi');
const log = require('karmasoc-util').logger;


export function notifyPostNewShare(message, next) {
    let seneca = this;
    Joi.validate(message.data, validations.notifyNewPostShare, (err, data) => {
        if (err) {
            log.error(err, 'Validation failed of new post share notify service');
            return next(err);
        }
        log.info('composing push-notifications for new post share');
        next(null, { ok: true });
        // compose message
        let messageData = {
            message: data.user_name + ' has shared this post.',
            entity: 'post',
            entity_id: data.post_id
        };
        service.getFollowersByUserId(data.user_id, seneca)
            .then(follower => follower.map(o => o._id))
            .then(follower => service.getDevices(follower, seneca))
            .then(followerDevices => push.sendPush(followerDevices, messageData))
            .catch(err => log.error(err, 'Error executing notify new post service'));
    });
}


//Someone favorites a post of you
export function notifyMyPostHasNewLike(message, next) {

    let seneca = this;

    Joi.validate(message.data, validations.notifyNewPostFavorator, (err, data) => {

        if (err) {
            log.error(err, 'Validation failed of new post follower notify service');
            return next(err);
        }

        log.info('composing push-notifications for new post like');

        next(null, { ok: true });

        // compose message
        let messageData = {
            message: '',
            entity: 'post',
            entity_id: ''
        };


        let favorator = service.getUserById(data.favorator_id, seneca);
        let post = service.getPostById(data.post_id, seneca);

        Promise.all([favorator, post])
            .then(values => {

                let favoratorName = values[0].name;
                let postId = values[1]._id.toString();

                messageData.message = favoratorName + ' likes your post !';
                messageData.entity_id = postId;

                return service.getDevices([values[1].user_id], seneca)
            })
            .then(receiverDevice => push.sendPush(receiverDevice, messageData))
            .catch(err => {
                log.error(err, 'Error executing notify new favorator of post service');
            });
    });
}

export function notifyNewImpression(message, next) {

    let seneca = this;

    Joi.validate(message.data, validations.notifyNewImpression, (err, data) => {

        if (err) {
            log.error(err, 'Validation failed of new posts notify service');
            return next(err);
        }

        log.info('composing push-notifications for new impression');

        next(null, { ok: true });

        // compose message
        let messageData = {
            message: data.user_name + ' has a new  ' + data.type + '-comment.',
            entity: 'post',
            entity_id: data.post_id
        };

        service.getFollowersByUserId(data.user_id, seneca)
            .then(follower => follower.map(o => o._id))
            .then(follower => service.getDevices(follower, seneca))
            .then(followerDevices => push.sendPush(followerDevices, messageData))
            .catch(err => log.error(err, 'Error executing notify new impression service'));
    });
}