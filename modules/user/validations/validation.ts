import * as Joi from "joi";

export const validation: any = {};
validation.mongoId = Joi.string().optional();
validation.mongoIdRequired = Joi.string().required();
const basicDataWithUserData = Joi.object().keys({
    user_id: validation.mongoIdRequired
});

validation.follow = basicDataWithUserData.keys({
    follow_id: validation.mongoIdRequired
});


validation.register = Joi.object().keys({
    mail: Joi.string().email().min(3).max(60).required()
        .description('Mail address'),
    password: Joi.string().regex(/[a-zA-Z0-9@#$%_&!"§\/\(\)=\?\^]{3,30}/).required()
        .description('User set password'),
    firstName: Joi.string().required().description('User first name'),
    lastName: Joi.string().required().description('User last name'),
    requesting_device_id: Joi.string()
});

validation.confirmEmail = Joi.object().keys({
    id: validation.mongoIdRequired
});


validation.mail = Joi.object().keys({
    mail: Joi.string().email().min(3).max(60).required()
        .description('Mail address')
});

validation.login = Joi.object().keys({
    mail: Joi.string().email().min(3).max(60).required()
        .description('Mail address'),
    password: Joi.string().regex(/[a-zA-Z0-9@#$%_&!"§\/\(\)=\?\^]{3,30}/).required()
        .description('User set password'),
    requesting_device_id: Joi.string()
});

validation.smLogin = Joi.object().keys({
    mail: Joi.string().email().min(3).max(60).required()
        .description('Mail address'),
    firstName: Joi.string().required().description('User first name'),
    lastName: Joi.string().required().description('User last name'),
    id: Joi.string().alphanum().required().description('Social media user ID'),
    strategy: Joi.string().required().description('User strategy'),
    requesting_device_id: Joi.string()
});


validation.addImage = Joi.object().keys({
    user_id: Joi.string().required(),
    images: Joi.object().keys({
        small: Joi.string().required(),
        normal: Joi.string().required()
    }).required()
});

validation.addBgImage = Joi.object().keys({
    user_id: Joi.string().required(),
    bgimages: Joi.object().keys({
        small: Joi.string().required(),
        normal: Joi.string().required()
    }).required()
});

validation.changePwd = Joi.object().keys({
    user_id: validation.mongoIdRequired,
    old_password: Joi.string().regex(/[a-zA-Z0-9@#$%_&!"§\/\(\)=\?\^]{3,30}/).required().description('enter old password'),
    new_password: Joi.string().regex(/[a-zA-Z0-9@#$%_&!"§\/\(\)=\?\^]{3,30}/).required().description('enter new password')
});
validation.getFollowing = basicDataWithUserData;

validation.getUser = basicDataWithUserData;

validation.getUserByMail = Joi.object().keys({
    mail: Joi.string().email().min(3).max(60).description('Mail address')
});
validation.idArray = Joi.object().keys({
    user_ids: Joi.array().items(Joi.string()).required()
});

validation.upateSettings = Joi.object().keys({
    user_id: validation.mongoIdRequired,
    settings: Joi.object().required()
});

export const personalContact = Joi.object({
    user_id: validation.mongoIdRequired,
    website: Joi.array().allow(null).items(Joi.object().keys({
        email: Joi.string(),
        emailType: Joi.string()
    }).required()).max(3),
    phonenumber: Joi.array().allow(null).items(Joi.object().keys({
        phoneNumber: Joi.string(),
        phoneType: Joi.string()
    }).required()).max(3),
    address: Joi.array().allow(null).items(Joi.object().keys({
        address: Joi.string(),
    }).required()).max(3),
    visibility: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
});

export const personalInfo = Joi.object({
    user_id: validation.mongoIdRequired,
    gender: Joi.string().optional().allow(null),
    birthday: Joi.string().optional().allow(null),
    occupation: Joi.string().optional().allow(null),
    visibility: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
});



export const educationHistorySchema = Joi.object({
    schoolName: Joi.string().required(),
    major: Joi.string().optional().allow(null),
    year: Joi.number().optional().allow(null),
    endyear: Joi.number().optional().allow(null),
    description: Joi.string().optional(),
});


export const userCustomUrls = Joi.object().keys({
    user_id: validation.mongoIdRequired,
    customUrls: Joi.array().allow(null).items(Joi.string()).max(3),
    visibility: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
});


export const userPlacesHistory = Joi.object().keys({
    user_id: validation.mongoIdRequired,
    places: Joi.array().allow(null).items(Joi.string()).max(10),
    visibility: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
});


export const userEducationHistory = Joi.object().keys({
    user_id: validation.mongoIdRequired,
    educationHistory: Joi.array().items(educationHistorySchema),
    visibility: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
});


export const userWorkHistory = Joi.object().keys({
    user_id: validation.mongoIdRequired,
    workHistory: Joi.array().allow(null).items(Joi.string()).max(10),
    visibility: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
});

export const userStory = Joi.object().keys({
    user_id: validation.mongoIdRequired,
    story: Joi.string().optional().allow(null),
    tagline: Joi.string().optional().allow(null)
});
