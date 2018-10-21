import { noop } from '../helpers/util';
import { init_ger } from '../db/mysql-connector';
import * as knexhelper from './knex';
import * as g from 'ger';
var ger;

export class Reporter {
    async action(namespace, person, action, thing, dates) {
        await ger.events([{
            namespace: namespace,
            person: person,
            action: action,
            thing: thing,
            expires_at: dates
        }]);
    };

    async actionMultiple(multipleEvents) {
        try {
            let data = multipleEvents.data || multipleEvents;
            return await ger.events(data)
        }
        catch (err) {
            throw err;
        }
    }

    async getTrendingPosts() {
        return await knexhelper.getTrending("all")
    }

    async getTrendingPhotos() {
        try {
            return await knexhelper.getTrending("photo")
        }
        catch (ex) {
            throw ex;
        }
    };

    async getTrendingVideos() {
        try {
            return await knexhelper.getTrending("video");

        }
        catch (ex) {
            throw ex;
        }
    };

    async recommendationForPerson(data) {
        try {
            const reqData = data || {};
            return await ger.recommendations_for_person(reqData.namespace || 'posts', reqData.user_id, {
                actions: reqData.actions || {
                    views: 1,
                    likes: 1,
                    addimpression: 1
                }
            })
        }
        catch (ex) {
            throw ex;
        }
    };

    async recommendationForThing(data) {
        try {
            const reqData = data || {};
            return await ger.recommendations_for_thing(reqData.namespace || 'posts', reqData.thing_id, {
                actions: reqData.actions || {
                    view: 1,
                    likes: 1,
                    addimpression: 1
                }
            })
        }
        catch (ex) {
            throw ex;
        }
    };
}