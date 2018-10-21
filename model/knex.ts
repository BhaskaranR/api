'use strict';
import * as _ from 'lodash';
import { knexInst } from '../db/mysql-connector'
import { event_points } from '../interfaces/rewardEvents';
import * as knex from 'knex';

import * as moment from 'moment';
var kn: knex = knexInst;

export const event = (person, eventId, id) => {
    return new Promise((resolve, reject) => {
        kn.insert({
            person: person,
            event_id: eventId,
            action_id: id
        })
            .returning('id')
            .into('pricing.event')
            .then((id) => {
                resolve(id)
            });
    }).catch((ex) => { }
        );
};

var events: event_points[];
export const getEvents = () => {
    return new Promise((resolve, reject) => {
        if (events) {
            resolve(events);
        }
        kn.select().from('pricing.event_points').then((rows: event_points[]) => {
            events = rows;
            resolve(events);
        }).catch((ex) => {
            reject(ex);
        });
    })
};


export const calculateRewards = (person, eventId, id) => {
    return new Promise((resolve, reject) => {
        console.log(`Call pricing.CALCULATE_PRICING('${person}', ${eventId}, '${id}');`);
        kn.raw(`call pricing.CALCULATE_PRICING('${person}', '${eventId}', '${id}')`)
            .then((result) => {
                console.dir(result, { depth: null })
                resolve(result)
            }).catch((ex) => {
                reject(ex);
            });
    })
};


export const getTrending = (postType: string) => {
    return new Promise((resolve, reject) => {
        kn.raw(`call pricing.GetTrending('${postType}'`)
            .then((result) => {
                console.dir(result, { depth: null })
                resolve(result)
            }).catch((ex) => {
                reject(ex);
            });
    });
};