var P = require('bluebird'),
    Joi = require('joi');

module.exports = function(server, config, log) {
    "use strict";

    var service = P.method(function(msg) {
        return server.service({role:'device', target:'data-publication', action:'load', publication: msg.publication}).then(function(pub) {
            if(pub) {

                // Find all applicable devices
                return server.service({role:'device', target:'device', action:'list', filter: pub.scope }).then(function(devices) {
                    return P.map(devices, function(device) {

                        // Subscribe each device
                        return server.service({role:'device', target:'data-publication', action:'subscribe', device: device.uuid, publication: msg.publication }).then(function(subscription) {

                            if(msg.sync) {
                                // Perform an initial sync to push the data to the device
                                return server.service({role:'device', target: 'data-subscription', action: 'sync', subscription: subscription._id.toString() }).then(function(syncReceipt){
                                    return {
                                        subscription: subscription,
                                        syncOp: syncReceipt
                                    };
                                });
                            }
                            else {
                                return { subscription: subscription };
                            }

                        });

                    });

                });

            }
        });
    });

    return {
        pattern: {role:'device', target: 'data-publication', action:'subscribe-all-devices'},
        event: 'subscribe-all-devices',
        schema: Joi.object().keys({
            role: Joi.string().allow('device'),
            target: Joi.string().allow('data-publication'),
            action: Joi.string().allow('subscribe-all-devices'),
            publication: Joi.string().description('Unique subscription key (not _id)'),
            sync: Joi.boolean().default(true)
        }),
        callback: service
    }
};
