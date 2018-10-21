'use strict';
import * as Joi from "joi";
import DeviceRepository from "./mongoDevice"
import { validationError, serviceError } from '../../../helpers/util';
import { validation } from './validation';

export default class Device {

    registerDevice(message, next) {
        Joi.validate(message.data, validation.registerDevice, (err, data) => {
            if (err) {
                return validationError(err, 'register device service', next);
            }
            let db = new DeviceRepository();
            db.upsertDevice(data)
                .then(() => {
                    console.log("response sending");
                    console.log({ data: { deviceId: message.data.subscription } });
                    return next(null, { data: { deviceId: message.data.subscription } });
                })
                .catch(err => serviceError(err, 'register device service', next));
        });
    }

    unregisterDevice(message, next) {
        Joi.validate(message.data, validation.unregisterDevice, (err, data) => {
            if (err) {
                return validationError(err, 'unregister device service', next);
            }
            let db = new DeviceRepository();
            db.deactivateDevice(data.user_id, data, next);
        });
    }

    getPushToken(message, next) {
        Joi.validate(message.data, validation.idArray, (err, data) => {
            if (err) {
                return validationError(err, 'get push token service', next);
            }
            let db = new DeviceRepository();
            db.getPushTokenFromUser(data.user_ids)
                .then(tokens => next(null, { data: tokens }))
                .catch(err => serviceError(err, 'get push token service', next));

        });
    }


    private activateDevice(subscription, userId) {
        return this.collectionPromise.then((collection: MongoDb.Collection) => {
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
                        log.error(err, 'Error updating device to active', { userid: userId, deviceId: subscription });
                    }
                })
        });
    }


    private deactivateDevice(userId, device, callback) {
        return this.collectionPromise.then((collection: MongoDb.Collection) => {
            return collection.updateOne(
                {
                    _id: userId
                },
                {
                    '$pull':  {devices: {endpoint: device.endpoint}}
                }, err => {
                    if (err) {
                        return callback(err);
                    } else {
                        return callback(null, { data: { ok: true } });
                    }
                })
        });
    }

    private upsertDevice = (device) => {
        device._id = device.user_id;
        delete device.user_id;
        return this.collectionPromise.then((collection: MongoDb.Collection) => {
            return collection.updateOne(
                {
                    _id: device._id
                },
                {
                    '$addToSet': {
                        devices: device
                    }
                }, { upsert: true })
        });
    }

    private getPushTokenFromUser(userIds: string[]): Promise<T[]> {
        return this.collectionPromise.then(collection => {
            return collection
                .find({ _id: { $in: userIds } })
                .toArray();
        });
    }


}