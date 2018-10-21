'use strict';
import * as reporter from '../reporter';
import * as knexhelper from '../knex';
import { event_points } from '../../interfaces/rewardEvents';
import * as _ from 'lodash';

export class UserActionRewards {
    /*
    fns.register = (requestData, done) => {
        database.event(message.data._id, 'user', 'register', null, message.data._id)
    };
    
    fns.login = (requestData, done) => {
        database.event(message.data._id, 'user', 'login', null, message.data._id)
    };
    */

    async follow(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        let eventId = _.find(events, (event) => {
            return event.event_category == 'user' && event.event_name == 'follow' && event.expired == 0
        }).id;
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.follow_id)
    };

    async unfollow(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        let eventId = _.find(events, (event) => {
            return event.event_category == 'user' && event.event_name == 'delete-follow' && event.expired == 0
        }).id
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.follow_id);
    };

    async refer(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        let eventId = _.find(events, (event) => {
            return event.event_category == 'user' && event.event_name == 'refer' && event.expired == 0
        }).id
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.user_id)
    }

}