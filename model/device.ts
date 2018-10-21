'use strict';
import * as Joi from "joi";
import { validation } from '../validations/device';
import { validationError, validate } from '../helpers/util';
import { links } from '../db/mongo-connector';

export class Device {

    private async getDeviceCollection() {
        const collections = await links();
        return collections.device
    }

    async registerDevice(data) {
        try {
            const valid = await validate(data, validation.registerDevice);
        }
        catch (err) {
            throw err;
        }
        data._id = data.user_id;
        delete data.user_id;
        const collection = await this.getDeviceCollection();
        return await collection.updateOne(
            {
                _id: data._id
            },
            {
                '$addToSet': {
                    devices: data
                }
            }, { upsert: true })
    }

    async unregisterDevice(data) {
        try {
            const valid = await validate(data, validation.registerDevice);
        }
        catch (err) {
            throw err;
        }
        const collection = await this.getDeviceCollection()
        return await collection.updateOne(
            {
                _id: data.userId
            },
            {
                '$pull': { devices: { endpoint: data.endpoint } }
            }, err => {
                throw err;
            });
    }


    async getPushToken(data) {
        try {
            const valid = await validate(data, validation.idArray);
        }
        catch (err) {
            throw err;
        }
        return await this.getPushTokenFromUser(data.user_ids);
    }


    private async activateDevice(subscription, userId) {
        const collection = await this.getDeviceCollection()
        return collection
            .updateOne(
            {
                _id: userId.toString()
            },
            {
                $set: {
                    subscription: subscription,
                    active: true
                }
            },
            err => {
                if (err) {
                    throw err;
                }
            })
    }

    private async getPushTokenFromUser(userIds: string[]) {
        const collection = await this.getDeviceCollection();
        return await collection
            .find({ _id: { $in: userIds } })
            .toArray();
    }
}