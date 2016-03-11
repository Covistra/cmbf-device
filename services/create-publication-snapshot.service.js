var P = require('bluebird'),
    moment = require('moment'),
    Joi = require('joi');

module.exports = function(server) {
    "use strict";

    var MongoDB = server.plugins['covistra-mongodb'];

    var _processContextualFields = P.method(function(context, value) {
        if(value === '$owner') {
            return context.owner;
        }
        else if(value === '$userId') {
            return context.userId;
        }
        else {
            return value;
        }
    });

    var service = P.method(function(msg) {
        return server.service({role:'device', target:'data-publication', action:'load', publication: msg.publication}).then(function(pub) {
            if(pub) {
                var db = MongoDB[pub.collection.db || 'STABLE'];
                var coll = db.collection(pub.collection.name);
                var q = {};

                if(msg.since) {
                    q[pub.collection.timestamp || 'ts'] = { $gte: moment(msg.since).toDate() };
                }

                // Apply selector
                _.forOwn(pub.selector, function(val, key) {
                    q[key] = _processContextualFields(msg.context, val)
                });

                return P.props(q).then(function(query) {
                    var sortOrder = {};
                    sortOrder[pub.collection.timestamp || 'ts'] = 1;
                    var cursor = coll.find(query).sort(sortOrder);
                    return P.promisify(cursor.toArray, cursor)().then(function(data) {

                        var result = {
                            meta:{
                                collection: pub.collection,
                                selector: pub.selector,
                                since: msg.since || Date.now(),
                                sort: sortOrder,
                                size: data.length
                            }
                        };

                        if(pub.processor) {
                            result.data = P.map(data, function(obj) {
                                pub.processor.data = obj;
                                return server.service(pub.processor);
                            });
                        }
                        else {
                            result.data = data;
                        }

                        return P.props(result);
                    });
                });
            }
        });
    });

    return {
        pattern: {role:'device', target: 'data-publication', action:'snapshot'},
        event: 'create-publication-snapshot',
        schema: Joi.object().keys({
            publication: Joi.string(),
            context: Joi.object()
        }),
        callback: service
    }
};
