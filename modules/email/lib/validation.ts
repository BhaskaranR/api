import * as Joi from 'joi';

export const validation : any = {};

validation.mongoId = Joi.string().optional();
validation.mongoIdRequired = Joi.string().required();

let basicDataWithUserData = Joi.object().keys({
    user_id: validation.mongoIdRequired
});

validation.passwordForgotten = Joi.object().keys({
    mail: Joi.string().email().min(3).max(60).required()
        .description('Mail address'),
    new_password: validation.mongoIdRequired
});


validation.confirmMail = Joi.object().keys({
    userid: Joi.string().email().min(3).max(60).required().description('Mail address'),
    token: Joi.string().required(),
    name: Joi.string().required()
});



validation.mailAndName = Joi.object().keys({
    mail: Joi.string().email().min(3).max(60).required()
        .description('Mail address'),
    name: Joi.string().required()
});

