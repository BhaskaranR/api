'use strict';
import * as Seneca from 'seneca';
import * as myModule from './lib/module';
const config = require('config');
const patternPin = 'role:notifications';
const seneca = Seneca({
    actcache: {     
        active: true,
        size: 257
    }
});
seneca.use('seneca-amqp-transport');
seneca
    .add(patternPin + ',cmd:notify,entity:newShare', myModule.notifyPostNewShare)
    .add(patternPin + ',cmd:notify,entity:newComment', myModule.notifyNewImpression)
    .add(patternPin + ',cmd:notify,entity:newFollower', myModule.notifyNewFollower)
    .add(patternPin + ',cmd:notify,entity:post,action:newLike', myModule.notifyMyPostHasNewLike)
seneca.listen({
    type: 'amqp',
    pin: patternPin
}).client({ type: 'amqp',  pin: 'role:user' })
;

