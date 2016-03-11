var P = require('bluebird'),
    Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var service = P.method(function(msg) {
        var Publications = MongoDB.STABLE.collection('data_publications');
        var Subscriptions = MongoDB.STABLE.collection('data_subscriptions');

        return P.promisify(Publications.findOne, Publications)({key: msg.publication }).then(function(pub) {
            if(pub) {

                var subscription = {
                    pub: pub.key,
                    device: msg.device
                };

                // Create a subscription or update the existing one
                return P.promisify(Subscriptions.update, Subscriptions)({pub: pub.key, device: msg.device}, subscription,{upsert: true}).then(function() {
                    return server.service({role:'device', target:'data-subscription', action:'resolve', pub: pub.key, device: msg.device});
                });

            }
        });
    });

    return {
        pattern: {role:'device', target:'data-publication', action:'subscribe' },
        event: 'subscribe-data-publication',
        schema: Joi.object().keys({
            role: Joi.string().allow('device'),
            target: Joi.string().allow('data-publication'),
            action: Joi.string().allow('subscribe'),
            device: Joi.string(),
            publication: Joi.string().description('Unique subscription key (not _id)')
        }),
        callback: service
    }
};


