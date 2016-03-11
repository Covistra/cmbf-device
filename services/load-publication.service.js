var P = require('bluebird'),
    Schemas = require('../lib/schemas'),
    Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var service = P.method(function(msg) {
        var Publications = MongoDB.STABLE.collection('data_publications');
        return P.promisify(Publications.findOne, Publications)({key: msg.publication || msg.id });
    });

    return {
        pattern: {role:'device', target: 'data-publication', action:'load'},
        event: 'load-publication',
        schema: Joi.object().keys({
            publication: Joi.string(),
            id: Joi.string()
        }),
        responseSchema: Schemas.publication,
        callback: service
    }
};
