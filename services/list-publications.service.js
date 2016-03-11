var P = require('bluebird'),
    Schemas = require('../lib/schemas'),
    Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var service = P.method(function() {
        var Publications = MongoDB.STABLE.collection('data_publications');
        var cursor = Publications.find();
        return P.promisify(cursor.toArray, cursor)();
    });

    return {
        pattern: {role:'device', target: 'data-publication', action:'list'},
        event: 'list-publications',
        responseSchema: Joi.array().items(Schemas.publication),
        callback: service
    }
};
