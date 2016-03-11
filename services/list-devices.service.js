var P = require('bluebird'),
    Schemas = require('../lib/schemas'),
    _ = require('lodash'),
    Joi = require('joi');

module.exports = function(server, config, log) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var service = P.method(function(msg) {
        var Devices = MongoDB.STABLE.collection('devices');

        var q = {};

        if(msg.filter) {
            if(msg.filter.account) {
                q.owner = {$in: msg.filter.account };
            }
            if(msg.filter.user) {
                q.userId = { $in: msg.filter.userId };
            }
        }

        //TODO: Add support for geolocated devices filter, country and language

        log.debug("Listing all devices for filter", q);

        var cursor = Devices.find(q);

        if(_.isNumber(msg.limit)) {
            cursor.limit(msg.limit);
        }
        else {
            cursor.limit(1000);
        }

        if(_.isNumber(msg.skip)) {
            cursor.skip(msg.skip);
        }

        return P.promisify(cursor.toArray, cursor)();
    });

    return {
        pattern: {role:'device', target: 'device', action:'list'},
        event: 'list-devices',
        schema: Joi.object().keys({
            role: Joi.string().allow('device'),
            target: Joi.string().allow('device'),
            action: Joi.string().allow('list'),
            limit: Joi.number(),
            skip: Joi.number(),
            filter: Schemas.deviceFilter
        }),
        callback: service
    }
};
