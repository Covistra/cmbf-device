var P = require('bluebird'),
    Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var service = P.method(function(msg) {

        return server.service({role:'device', target:'data-publication', action:'list'}).then(function(publications) {

            return P.map(publications, function(pub) {
                // Find all applicable devices for this publication
                return server.service({role:'device', target:'device', action:'list', filter: pub.scope }).then(function(devices) {
                    var device = _.find(devices, function(dev) { return dev.uuid === msg.device});
                    if(device) {
                        return pub;
                    }
                });
            }).then(function(publications) {
                return _.filter(publications, _.identity);
            });

        });

    });

    return {
        pattern: {role:'device', target: 'data-publication', action:'list-available-for-device'},
        event: 'list-available-publication-for-device',
        schema: Joi.object().keys({
            device: Joi.string().required()
        }),
        callback: service
    }
};
