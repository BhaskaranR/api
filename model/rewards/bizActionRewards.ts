'use strict';
import * as reporter from '../reporter';
import * as knexhelper from '../knex';
import * as _ from 'lodash';

import { event_points } from '../../interfaces/rewardEvents';

export class BusinessActionRewards {

    referBusiness(message) {
        knexhelper.getEvents().then((events: event_points[]) => {
            let eventId = _.find(events, (event) => {
                return event.event_category == 'biz' && event.event_name == 'refer' && event.expired == 0
            }).id
            knexhelper.calculateRewards(message.requesting_user_id, eventId, message.data.bizId).then((result) => {
                //console.dir(result, { depth: null });
            });
        });
    }

    followBiz(message) {
        knexhelper.getEvents().then((events: event_points[]) => {
            let eventId = _.find(events, (event) => {
                return event.event_category == 'biz' && event.event_name == 'follow' && event.expired == 0
            }).id
            knexhelper.calculateRewards(message.requesting_user_id, eventId, message.data.bizId).then((result) => {
                //console.dir(result, { depth: null });
            });
        });
    }

    unFollowBiz(message) {
        knexhelper.getEvents().then((events: event_points[]) => {
            let eventId = _.find(events, (event) => {
                return event.event_category == 'biz' && event.event_name == 'delete-follow' && event.expired == 0
            }).id
            knexhelper.calculateRewards(message.requesting_user_id, eventId, message.data.bizId).then((result) => {
                //console.dir(result, { depth: null });
            });
        });
    }

    addBusiness(message) {
        knexhelper.getEvents().then((events: event_points[]) => {
            let eventId = _.find(events, (event) => {
                return event.event_category == 'biz' && event.event_name == 'refer' && event.expired == 0
            }).id
            knexhelper.calculateRewards(message.requesting_user_id, eventId, message.data.bizId).then((result) => {
                //console.dir(result, { depth: null });
            });
        });
    }

    addimpression(message) {
        knexhelper.getEvents().then((events: event_points[]) => {
            let eventId = _.find(events, (event) => {
                return event.event_category == 'biz' && event.event_name == 'refer' && event.expired == 0
            }).id
            knexhelper.calculateRewards(message.requesting_user_id, eventId, message.data.bizId).then((result) => {
                //console.dir(result, { depth: null });
            });
        });
    }

    favorBizPost(message) {
        let action = message.data.fileUrl ? 'video' : message.data.photos ? 'photo' : message.data.geotag ? 'geo' : 'text';
        knexhelper.getEvents().then((events: event_points[]) => {
            let eventId = _.find(events, (event) => {
                return event.event_category == 'biz' && event.event_name == 'likes' && event.expired == 0
            }).id

            knexhelper.calculateRewards(message.requesting_user_id, eventId, message.data.bizId).then((result) => {
                //console.dir(result, { depth: null });
            });
        });
    }

    unfavorBizPost(message) {
        knexhelper.getEvents().then((events: event_points[]) => {
            let eventId = _.find(events, (event) => {
                return event.event_category == 'biz' && event.event_name == 'delete-like' && event.expired == 0
            }).id

            knexhelper.calculateRewards(message.requesting_user_id, eventId, message.data.bizId).then((result) => {
                //console.dir(result, { depth: null });
            });
        });
        //console.log('uff, training', message);
    }
}