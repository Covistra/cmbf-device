var P = require('bluebird'),
    Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var service = P.method(function(msg) {
        var Subscriptions = MongoDB.STABLE.collection('data_subscriptions');
        return P.promisify(Subscriptions.findOne, Subscriptions)({pub: msg.pub, device: msg.device });
    });

    return {
        pattern: {role:'device', target:'data-subscription', action:'resolve' },
        event: 'resolve-data-subscription',
        schema: Joi.object().keys({
            device: Joi.string(),
            pub: Joi.string().description('Unique subscription key (not _id)')
        }),
        callback: service
    }
};


