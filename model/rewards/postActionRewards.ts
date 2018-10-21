'use strict';
import * as reporter from '../reporter';
import * as _ from 'lodash';
import * as knexhelper from '../knex';
import { event_points } from '../../interfaces/rewardEvents';


const getExpireDate = (years) => {
    return new Date(Date.now() + 31536000 * 1000 * years || 1);
};
export class PostActionRewards {

    async newPost(requesting_user_id, data) {
        const action = data.fileUrl ? 'video' : data.photos ? 'photo' : 'text';
        const events = <event_points[]>await knexhelper.getEvents();
        const event = _.find(events, (event) => {
            return event.event_subcategory == action && event.event_category == 'post' && event.event_name == 'create' && event.expired == 0
        })
        return await knexhelper.calculateRewards(requesting_user_id, event.id, data.id);
    };

    async deletePost(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        const eventId = _.find(events, (event) => {
            return event.event_category == 'post' && event.event_name == 'delete' && event.expired == 0
        }).id

        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.id);

        //knexhelper.event(message.requesting_user_id, event.id, message.data._id).then((val: any[]) => {
        //    const eventId = val[0];
        //    knexhelper.rewardPoint(message.requesting_user_id, eventId, event.reward_type, event.reward_value);
        // })
        // knexhelper.event(message.requesting_user_id, eventId, message.data._id)
    };

    async getPost(requesting_user_id, data) {
        //reporter.action('posts', message.requesting_user_id, 'views', message.data._id, getExpireDate(2));
        const events = <event_points[]>await knexhelper.getEvents();
        const eventId = _.find(events, (event) => {
            return event.event_category == 'post' && event.event_name == 'delete' && event.expired == 0
        }).id
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data._id);
    };

    async favorPost(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        const eventId = _.find(events, (event) => {
            return event.event_category == 'post' && event.event_name == 'like' && event.expired == 0
        }).id
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.id);
        //knexhelper.event(message.requesting_user_id, 'post', 'likes', null, message.data.postId)
    };

    async unfavorPost(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        const eventId = _.find(events, (event) => {
            return event.event_category == 'post' && event.event_name == 'delete-like' && event.expired == 0
        }).id
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.id);
        // knexhelper.event(message.requesting_user_id, 'post', 'likes', null, message.data.postId)
    }

    async addimpression(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        const eventId = _.find(events, (event) => {
            return event.event_category == 'post' && event.event_name == 'comment' && event.event_subcategory == 'text' && event.expired == 0
        }).id
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.id);
        // reporter.action('posts', message.requesting_user_id, 'comments', message.data.postId, getExpireDate(4));
    };


    async deleteImpression(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        let eventId = _.find(events, (event) => {
            return event.event_category == 'post' && event.event_name == 'delete-comment' && event.event_subcategory == 'text' && event.expired == 0
        }).id;
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.id)
    }

    //bookmark post
    async bookmarkPost(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        const eventId = _.find(events, (event) => {
            return event.event_category == 'post' && event.event_name == 'bookmark' && event.expired == 0
        }).id
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.id);
        //knexhelper.event(message.requesting_user_id, 'post', 'likes', null, message.data.postId)
    };


    //unbookmark post
    async unBookmarkPost(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        const eventId = _.find(events, (event) => {
            return event.event_category == 'post' && event.event_name == 'delete-bookmark' && event.expired == 0
        }).id
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.id);
        //knexhelper.event(message.requesting_user_id, 'post', 'likes', null, message.data.postId)
    };

    //bookmark post
    async sharePost(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        const eventId = _.find(events, (event) => {
            return event.event_category == 'post' && event.event_name == 'share' && event.expired == 0
        }).id
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.id);
        //knexhelper.event(message.requesting_user_id, 'post', 'likes', null, message.data.postId)
    };

    //unbookmark post
    async unSharePost(requesting_user_id, data) {
        const events = <event_points[]>await knexhelper.getEvents();
        const eventId = _.find(events, (event) => {
            return event.event_category == 'post' && event.event_name == 'delete-share' && event.expired == 0
        }).id
        return await knexhelper.calculateRewards(requesting_user_id, eventId, data.id);
        //knexhelper.event(message.requesting_user_id, 'post', 'likes', null, message.data.postId)
    };
}