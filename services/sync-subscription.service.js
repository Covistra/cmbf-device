var P = require('bluebird'),
    Boom = require('boom'),
    Joi = require('joi');

module.exports = function(server, config, log) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];
    var Socket = server.plugins['covistra-socket'];

    var service = P.method(function(msg) {
        var Subscriptions = MongoDB.STABLE.collection('data_subscriptions');
        return P.promisify(Subscriptions.findOne, Subscriptions)({_id: MongoDB.ObjectId(msg.subscription)}).then(function(sub) {
            if(sub) {

                // Load publication and device
                return server.service({role:'device', target:'device', action:'load', device: sub.device}).then(function(device) {

                    if(device) {
                        // Retrieve the device connection
                        var socket = Socket.socketManager.getClientForId('/#'+device.socketId);
                        if(socket) {
                            log.debug("Device %s connection has been found. Creating data snapshot for %s", socket.id, sub.pub);

                            var context = {
                                owner: device.owner,
                                userId: device.userId
                            };

                            // Retrieve a publication snapshot to send to the device
                            return server.service({role:'device', target:'data-publication', publication: sub.pub, context: context, action: 'snapshot'}).then(function(snapshot) {
                                log.debug("Generated a snapshot with %d document(s) for publication %s", snapshot.data.length, sub.pub);

                                return socket.emit('data-sync', snapshot).then(function(result) {
                                    log.info("All %s for publication %s were successfully sent to device %s", snapshot.meta.collection.name, sub.pub, device.uuid, result);
                                    return server.service({role:'device', target: 'device', action: 'update', device: device.uuid, data: { lastSync: new Date() }});
                                }).catch(function(err) {
                                    log.error(err);
                                });
                            });
                        }
                        else {
                            log.warn("Device %s socket connection is not valid. Sync will be aborted", device.uuid);
                            server.service({role:'device', target:'device', action:'disconnect', device: device.uuid});
                        }
                    }
                    else {
                        throw Boom.notFound("device-not-found:"+sub.device);
                    }
                });
            }
        });
    });

    return {
        pattern: {role:'device', target: 'data-subscription', action:'sync'},
        event: 'sync-data-subscription',
        schema: Joi.object().keys({
            role: Joi.string().allow('device'),
            target: Joi.string().allow('data-subscription'),
            action: Joi.string().allow('register'),
            subscription: Joi.string()
        }),
        callback: service
    }
};
