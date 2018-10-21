'use strict';
import * as _ from 'lodash';
import * as Hoek from 'hoek';
import * as Joi from 'joi';
import * as config from 'config';
import Q from 'q';


const ObjectID = require("bson-objectid");

export const validationError = (err, service, next) => {
    return next(err);
}

export const serviceError = (err, service, next) => {
    return next(err);
}

export const decorateNewDateData = (target) => {
    let isoDate = new Date().toISOString();
    return Hoek.merge(target, {
        create_date: isoDate,
        modified_date: isoDate
    });
};

export const updateModifiedDate = (target) => {
    return Hoek.merge(target, {
        $currentDate: {
            modified_date: true
        }
    });
};

export const safeObjectId = (objectIdString, idType = null) => {
    idType = idType || 'id';
    return new Promise((resolve) => {
        resolve(new ObjectID(objectIdString));
    }).catch(() => {
        throw new Error('Invalid ' + idType);
    });
};

export const setupSenecaPattern = (cmdOrMoreComplexObject, data, basicPin) => {
    let requestPattern: any = {};
    if (typeof cmdOrMoreComplexObject === 'string') {
        requestPattern.cmd = cmdOrMoreComplexObject;
    } else {
        requestPattern = cmdOrMoreComplexObject;
    }
    requestPattern.data = data;
    return Hoek.merge(requestPattern, basicPin);
};

export const clone = Hoek.clone;

export const getSessionId = requestAuth => {
    if (requestAuth.credentials && requestAuth.credentials.length > 1) {
        let flattArr: any[] = _.flattenDeep(requestAuth.credentials);
        return flattArr[0]._id;
    }
    return requestAuth.credentials && requestAuth.credentials._id ? requestAuth.credentials._id : 'unknown';
};

export const getUserId = requestAuth => {
    if (requestAuth.credentials && requestAuth.credentials.length > 1) {
        let flattArr: any[] = _.flattenDeep(requestAuth.credentials);
        return flattArr[0].user_id;
    }
    return requestAuth.credentials && requestAuth.credentials.user_id ? requestAuth.credentials.user_id : 'unknown';
};

export const getDeviceId = requestState => {
    return requestState['karmasoc'] && requestState['karmasoc'].device_id ? requestState['karmasoc'].device_id : 'unknown';
};


export const noop = () => {
    console.log('info: no implementation found');
}

export const validate = (param, schema) => {
    return new Promise((resolve, reject) => {
        Joi.validate(param, schema, (err, data)=> {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
}
