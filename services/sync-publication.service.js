var P = require('bluebird'),
    Boom = require('boom'),
    _ = require('lodash'),
    Joi = require('joi');

module.exports = function(server, config, log) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];
    var Socket = server.plugins['covistra-socket'];

    var service = P.method(function(msg) {

        return server.service({role:'device', target: 'data-publication', action:'load', publication: msg.publication}).then(function(pub) {

            if(pub) {
                log.debug("Received account %s", msg.account);

                // We accept either the full object of just the id itself
                var account = _.get(msg.account, "_id") || msg.account;

                if(!account) {
                    throw Boom.badRequest('Must provide an account or account id');
                }

                return server.service({role:'device', target: 'device', action:'list', filter: {account: [account] }}).then(function(devices) {
                    log.debug("Found %d device(s) to sync for account %s", devices.length, account);
                    return P.map(devices, function(device) {
                        log.debug("Updating publication %s for device %s", msg.publication, device.uuid);
                        return server.service({role:'device', target:'data-subscription', action:'resolve', pub: msg.publication, device: device.uuid}).then(function(sub) {
                            log.debug("Syncing subscription %s", sub._id);

                            
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

                        });

                    });

                });
            }
            else {
                throw Boom.notFound("missing data-publication:", msg.publication);
            }

        });

    });

    return {
        pattern: {role:'device', target: 'data-publication', action:'sync'},
        event: 'sync-data-publication',
        schema: Joi.object().keys({
            publication: Joi.string(),
            account: Joi.any()
        }),
        callback: service
    }
};
