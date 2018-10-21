import * as Joi from "joi";

export const validation: any = {};
validation.registerDevice = Joi.object().keys({
    endpoint: Joi.string().required(),
    expirationTime: Joi.string().allow(null),
    keys: Joi.object().keys({
        auth: Joi.string().required(),
        p256dh: Joi.string().required()
    })
});

validation.unregisterDevice = Joi.object().keys({
    endpoint: Joi.string().required(),
    expirationTime: Joi.string().allow(null),
    keys: Joi.object().keys({
        auth: Joi.string().required(),
        p256dh: Joi.string().required()
    })
});

validation.idArray = Joi.object().keys({
    user_ids: Joi.array().items(Joi.string()).required()
});