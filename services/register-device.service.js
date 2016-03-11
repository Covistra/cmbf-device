var P = require('bluebird'),
    Schemas = require('../lib/schemas'),
    Boom = require('boom'),
    _ = require('lodash'),
    Joi = require('joi');

module.exports = function(server, config, log) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var service = P.method(function(msg) {
        log.debug("Registering device %s", msg.uuid, msg.socketId);
        var Devices = MongoDB.STABLE.collection('devices');

        var device = _.omit(msg, 'role', 'target', 'action', "subscribe", "sync");

        if(!device.owner && msg.userId) {
            device.owner = server.service({role:'crm', target:'customer', action:'lookup-for-user', user: msg.userId});
        }
        else {
            throw Boom.badRequest("We need at least userId if no owner is provided");
        }

        return P.props(device).then(function(deviceInfo) {
            if(deviceInfo.owner) {
                deviceInfo.owner = _.get(deviceInfo.owner, "_id");
                deviceInfo.userId = MongoDB.ObjectId(deviceInfo.userId);
                return P.promisify(Devices.update, Devices)({uuid: deviceInfo.uuid}, deviceInfo, { upsert: true }).then(function() {

                    // Auto-created all subscriptions to all allowed publications
                    if(msg.subscribe) {
                        return server.service({role:'device', target: 'device', action:'subscribe-all-publications', device: deviceInfo.uuid, sync: msg.sync}).then(function(){
                            return deviceInfo;
                        });
                    }

                    return deviceInfo;
                });
            }
            else {
                throw new Boom.badRequest('user must have a customer account');
            }
        });
    });

    return {
        pattern: {role:'device', target: 'device', action:'register'},
        event: 'register-device',
        schema: Schemas.device.keys({
            role: Joi.string().allow('device'),
            target: Joi.string().allow('device'),
            action: Joi.string().allow('register'),
            subscribe: Joi.boolean().default(true),
            sync: Joi.boolean().default(true)
        }),
        responseSchema: Schemas.device,
        callback: service
    }
};
