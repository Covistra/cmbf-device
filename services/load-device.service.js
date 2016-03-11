var P = require('bluebird'),
    Schemas = require('../lib/schemas'),
    Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var service = P.method(function(msg) {
        var Devices = MongoDB.STABLE.collection('devices');
        return P.promisify(Devices.findOne, Devices)({uuid: msg.device});
    });

    return {
        pattern: {role:'device', target: 'device', action:'load'},
        event: 'load-device',
        schema: Joi.object().keys({
            device: Joi.string()
        }),
        responseSchema: Schemas.device,
        callback: service
    }
};
