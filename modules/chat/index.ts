'use strict';
import * as seneca from 'seneca';
import * as messages from './lib/messages';
const conversations = require('./lib/conversations');
const database = require('./lib/database');
var patternPin = 'role:messenger';

seneca
    .add(patternPin + ',cmd:newmessage,message_type:text', messages.newTextMessage)
    .add(patternPin + ',cmd:newmessage,message_type:post', messages.newPostMessage)
    .add(patternPin + ',cmd:getmessagesbyconversationid', messages.getMessagesByConversationId)
    .add(patternPin + ',cmd:latestmessages,distict:conversation', messages.getLatestMessagesByDistinctConversation)
    .add(patternPin + ',cmd:newconversation', conversations.newConversation)
    .add(patternPin + ',cmd:getconversationsbyuser', conversations.getConversationsByUserId)
    .add(patternPin + ',cmd:getconversationbyid', conversations.getConversationById)
    .add(patternPin + ',cmd:ackConverstaion', conversations.ackConversation);