var P = require('bluebird'),
    Joi = require('joi');

module.exports = function(server, config, log) {
    "use strict";

    var service = P.method(function(msg) {

        return server.service({role:'device', target:'device', action:'load', device: msg.device}).then(function(device) {
            if(device) {

                // Find all applicable publications
                return server.service({role:'device', target:'data-publication', action:'list-available-for-device', device: msg.device }).then(function(publications) {
                    return P.map(publications, function(pub) {

                        // Subscribe each device
                        return server.service({role:'device', target:'data-publication', action:'subscribe', device: device.uuid, publication: pub.key }).then(function(subscription) {

                            if(msg.sync) {
                                log.debug("Performing initial sync of publication %s to device %s", pub.key, device.uuid);

                                // Perform an initial sync to push the data to the device (async)
                                server.service({
                                    role: 'device',
                                    target: 'data-subscription',
                                    action: 'sync',
                                    subscription: subscription._id.toString()
                                }).catch(function (err) {
                                    log.error("Unable to sync data to device %s. Will retry later", device.uuid, err);
                                });
                            }

                            return { subscription: subscription };
                        });

                    });

                });

            }
        });
    });

    return {
        pattern: {role:'device', target: 'device', action:'subscribe-all-publications'},
        event: 'subscribe-all-publications',
        schema: Joi.object().keys({
            role: Joi.string().allow('device'),
            target: Joi.string().allow('device'),
            action: Joi.string().allow('subscribe-all-publications'),
            device: Joi.string().description('Target devices that will be subscribed'),
            sync: Joi.boolean().default(true)
        }),
        callback: service
    }
};
