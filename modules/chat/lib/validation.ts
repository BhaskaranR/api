import * as Joi from 'joi';

export const mongoId = Joi.string().optional();
export const mongoIdRequired = Joi.string().required();

export const basicMessage = Joi.object().keys({
    conversation_id: mongoIdRequired,
    from: mongoIdRequired,
    timestamp: Joi.number()
});

export const textMessage = basicMessage.keys({
    message: Joi.string().required()
});

export const postMessage = basicMessage.keys({
    post_id: mongoIdRequired
});

export const messagesByConversationId = Joi.object().keys({
    conversation_id: mongoIdRequired,
    query: Joi.object().keys({
        page: Joi.number(),
        elements: Joi.number().min(1)
    }).and('page', 'elements')
});

export const latestMessages = Joi.object().keys({
    user_id: mongoIdRequired,
    query: Joi.object().keys({
        count: Joi.number().min(1)
    })
});

let participant = Joi.object().keys({
    user_id: mongoIdRequired,
    last_read: Joi.number().optional().default(0)
});

export const newConversation = Joi.object().keys({
    participants: Joi.array().items(participant).min(2)
});

export const userId = Joi.object().keys({
    user_id: mongoIdRequired
});

export const conversationId = Joi.object().keys({
    conversation_id: mongoIdRequired
});

export const conversationAck = participant.keys({
    conversation_id: mongoIdRequired
});