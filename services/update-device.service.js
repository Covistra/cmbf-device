var P = require('bluebird'),
    Schemas = require('../lib/schemas'),
    Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var service = P.method(function(msg) {
        var Devices = MongoDB.STABLE.collection('devices');
        return P.promisify(Devices.updateOne, Devices)({uuid: msg.device}, { $set: msg.data || {} }).then(function() {
            return server.service({role:'device', target:'device', action:'load', device: msg.device});
        });
    });

    return {
        pattern: {role:'device', target: 'device', action:'update'},
        event: 'update-device',
        schema: Joi.object().keys({
            device: Joi.string().required(),
            data: Joi.object()
        }),
        responseSchema: Schemas.device,
        callback: service
    }
};
