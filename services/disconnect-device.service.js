var P = require('bluebird'),
    Schemas = require('../lib/schemas'),
    Joi = require('joi');

module.exports = function(server, config, log) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var service = P.method(function(msg) {
        return server.service({role:'device', target:'device', device: msg.device, action:'load'}).then(function(device) {
            if(device) {
                var Devices = MongoDB.STABLE.collection('devices');
                return P.promisify(Devices.update, Devices)({_id: device._id}, { $set:{
                    socketId: null,
                    connected: false,
                    updated_at: new Date()
                }}).then(function() {
                    log.info("Device %s has been disconnected", device.uuid);
                    return {
                        success: true,
                        connected: false,
                        uuid: device.uuid
                    };
                });
            }
        });
    });

    return {
        pattern: {role:'device', target: 'device', action:'disconnect'},
        event: 'disconnect-device',
        schema: Joi.object().keys({
            device: Joi.string()
        }),
        responseSchema: Schemas.device,
        callback: service
    }
};
