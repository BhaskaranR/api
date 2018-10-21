'use strict';
import * as Joi from 'joi';
export const bizvalidations:any = {};
const mongoIdField = Joi.string().optional();
const mongoIdFieldRequired = mongoIdField.required();

bizvalidations.nearbyQuery = Joi.object().keys({
    long: Joi.number().required(),
    lat: Joi.number().required(),
    maxDistance: Joi.number().default(2),
    limit: Joi.number().default(20)
});
bizvalidations.nearbyQueryOptional = Joi.object().keys({
    long: Joi.number(),
    lat: Joi.number(),
    maxDistance: Joi.number().default(2),
    limit: Joi.number().default(20)
});

bizvalidations.postGeoBiz = Joi.object().keys({
    long: Joi.number().required(),
    lat: Joi.number().required()
});

bizvalidations.bizId = Joi.object().keys({
    bizId: Joi.string().required()
});


bizvalidations.follow = Joi.object().keys({
    follow_id: mongoIdFieldRequired
});


bizvalidations.categoryId = Joi.object().keys({
    category_id: Joi.string().required().disallow('undefined')
});

bizvalidations.bizByName = Joi.object().keys({
    bizName: Joi.string()
});

bizvalidations.coordinates = Joi.object().keys({
    long: Joi.number().required(),
    lat: Joi.number().required(),
    bizName: Joi.string().allow('')
});

bizvalidations.userIDBiz = Joi.object().keys({
    userId: Joi.string().required()
});

bizvalidations.deleteBiz = Joi.object().keys({
    bizId: Joi.string().required()
});


bizvalidations.register = Joi.object().keys({
    referredBy: Joi.string().allow([null, ""]),
    bizname: Joi.string().required().description('Business type'),
    categoryId: Joi.string().required().description('Category'),
    subcategoryId: Joi.string().allow([null, ""]),
    zipcode: Joi.number().allow([null, ""]),
    address:  Joi.string().required(),
    title: Joi.string().required(),
    website: Joi.string().allow([null, ""]),
    lat: Joi.number().allow([null, ""]),
    long: Joi.number().allow([null, ""])
});

bizvalidations.newBiz = Joi.object({
    referredBy: Joi.string().optional().allow([null, ""]),
    categoryId: Joi.string().required().description('Category'),
    subcategoryId: Joi.string().optional().allow([null, ""]),
    zipcode: Joi.number().optional().allow([null, ""]),
    address: Joi.string().required(),
    title: Joi.string().required(),
    website: Joi.string().optional().allow([null, ""]),
    geotag: Joi.object().optional().allow([null, ""]),
    userId: Joi.string().required()
});

bizvalidations.editBiz = Joi.object({
    categoryId: Joi.string().optional().description('Category'),
    subcategoryId: Joi.string().optional().allow([null, ""]),
    zipcode: Joi.number().optional().allow([null, ""]),
    address: Joi.string().optional(),
    title: Joi.string().optional(),
    website: Joi.string().optional().allow([null, ""]),
    geotag: Joi.object().optional().allow([null, ""]),
    userId: Joi.string().required()
});

bizvalidations.geobizNearby = Joi.object({
    maxDistance: Joi.number().default(10),
    limit: Joi.number().required(),
    coordinates: Joi.object().required().keys({
        lat: Joi.number().required(),
        long:Joi.number().required()
    }),
    bizName:Joi.string().optional().allow(''),
});
