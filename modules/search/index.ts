'use strict';
let config = require('config');
var ELASTIC = config.get('elasticSearchUrl') || 'localhost';
var Seneca = require('seneca')

const patternPin = 'role:search';

Seneca({ tag: 'search' })
    .use('seneca-amqp-transport')
    .listen({
        type: 'amqp',
        pin: patternPin
    })
    .test('print')
    .use('./lib/search.js', {
        elastic: {
            host: ELASTIC
        }
    });
/*.ready(function() {
    this.add('role:search,cmd:search', function(msg, reply) {
        this.prior(msg, reply)
            //  this.act('role:suggest,cmd:add', { query: msg.query, default$: {} })
    })
})*/