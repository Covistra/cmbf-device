var P = require('bluebird'),
    Schemas = require('../lib/schemas'),
    Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var service = P.method(function(msg) {
        var Publications = MongoDB.STABLE.collection('data_publications');
        return P.promisify(Publications.update, Publications)({key: msg.publication.key}, msg.publication ,{ upsert: true}).then(function() {
            return server.service({role:'device', target: 'data-publication', action:'subscribe-all-devices', publication: msg.publication.key, sync: msg.sync});
        });
    });

    return {
        pattern: {role:'device', target: 'data-publication', action:'register'},
        event: 'register-data-publication',
        schema: Joi.object().keys({
            role: Joi.string().allow('device'),
            target: Joi.string().allow('data-publication'),
            action: Joi.string().allow('register'),
            publication: Schemas.publication,
            sync: Joi.boolean().default(true)
        }),
        callback: service
    }
};
