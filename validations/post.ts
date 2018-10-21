'use strict';
import * as Joi from 'joi';

export const validations: any = {};

validations.mongoId = Joi.string().optional();
validations.mongoIdRequired = Joi.string().required();

let basicDataWithUserData = Joi.object().keys({
    userId: validations.mongoIdRequired
});

validations.favorPost = basicDataWithUserData.keys({
    postId: validations.mongoIdRequired,
    like: Joi.string().valid(
        'love',
        'like',
        'dislike',
        'smile',
        'happy',
        'sad',
        'very sad')
});

validations.impression = Joi.object({
    userId: validations.mongoIdRequired,
    postId: validations.mongoIdRequired,
    file: Joi.object().keys({
        id: validations.mongoIdRequired,
        name: Joi.string().required()
    }),
    content: Joi.string().allow('').optional()
});

validations.postOfUser = Joi.object({
    userId: validations.mongoIdRequired
});


validations.getSettings = Joi.object().keys({
    postId: validations.mongoIdRequired
});

validations.updateSettings = Joi.object().keys({
    postId: validations.mongoIdRequired,
    settings: Joi.object().required()
});

validations.postId = Joi.object().keys({
    postId: Joi.string().required()
});

validations.favor = Joi.object().keys({
    favor: Joi.string().valid(
        'love',
        'like',
        'dislike',
        'smile',
        'happy',
        'sad',
        'very sad')
});

validations.textImpression = Joi.object().keys({
    content: Joi.string().min(0).required()
});

validations.deletePost = Joi.object().keys({
    postId: Joi.string().required()
});
validations.videoImpressionId = Joi.object().keys({
    videoId: Joi.string().required()
});

validations.imageImpressionId = Joi.object().keys({
    imageId: Joi.string().required()
});

validations.settings = Joi.object().keys({
    settings: Joi.object().required()
});

validations.geotag = Joi.object({
    long: Joi.number().required(),
    lat: Joi.number().required(),
    title: Joi.string().required(),
    place: Joi.string().required(),
}).required();

validations.post = Joi.alternatives().try(
    Joi.object().keys({
        bizId: Joi.string().allow('').optional(),
        title: Joi.string().allow('').optional(),
        visibility: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
        content: Joi.string(),
        withFriends: Joi.array().items().allow(null).optional(),
        fileIds: Joi.array().items().allow(null).optional(),
        geotag: Joi.object().allow(null).optional()
    }),
    Joi.object().keys({
        title: Joi.string().allow('').optional(),
        bizId: Joi.string().allow('').optional(),
        visibility: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
        content: Joi.string().allow(''),
        withFriends:  Joi.array().items().allow(null).optional(),
        fileIds: Joi.array().items().min(1),
        geotag: Joi.object().allow(null).optional()
    }),
    Joi.object().keys({
        title: Joi.string().allow('').optional(),
        bizId: Joi.string().allow('').optional(),
        visibility: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
        content: Joi.string().allow(''),
        withFriends: Joi.array().items().min(1),
        fileIds: Joi.array().items().allow(null).optional(),
        geotag: Joi.object().allow(null).optional()
    }),
    Joi.object().keys({
        title: Joi.string().allow('').optional(),
        bizId: Joi.string().allow('').optional(),
        visibility: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
        content: Joi.string().allow(''),
        withFriends: Joi.array().items().allow(null),
        fileIds: Joi.array().items().allow(null).optional(),
        geotag: validations.geotag
    })
);

validations.editPost = Joi.object({
    _id: Joi.string().required(),
    title: Joi.string().allow('').optional(),
    content: Joi.string().allow('').optional(),
    BizId: Joi.string().allow('').optional(),
    geotag: Joi.object().allow(null).optional(),
    withFriends: Joi.array().items().allow(null).optional(),
    shares:Joi.array().items().allow(null).optional(),
    fileIds:Joi.array().items().allow(null).optional(),
    visibility: Joi.string().allow(null).valid('public', 'private', 'friends').required(),
}).required();


validations.postOthers = Joi.alternatives({
    clientId: Joi.string(),
    bizId: Joi.string().allow('').optional(),
    bookmarks: Joi.array().allow(null).items(Joi.string().valid('mypage', 'fun', 'learn')).max(3).optional(),
    access: Joi.string().allow(null).valid('public', 'private', 'friends').optional(),
    likes: Joi.array().allow(null).optional(),
    favorites: Joi.array().allow(null).optional(),
});

validations.likeType =  Joi.string().valid('like', 'heart', 'smile','laugh','sad');
