var Joi = require('joi'),
    deviceFilter = require('./device-filter.schema');

module.exports = Joi.object().keys({
    key: Joi.string().required(),
    collection: Joi.object().keys({
        db: Joi.string(),
        name: Joi.string().required(),
        timestamp: Joi.string().default('ts'),
        key: Joi.string().default('_id')
    }).required(),
    selector: Joi.object().description("DB query to select data to sync."),
    processor: Joi.object(),
    parent: Joi.string().description('Key of the parent for this publication. Used for master-slave selectors'),
    scope: deviceFilter.description('Devices that are able to subscribe to this publication'),
    last_sync: Joi.date(),
    options: Joi.object().keys({
        expireDays: Joi.number().description('Number of days before the data is forced to be refreshed. Optional'),
        syncIntervalHour: Joi.number().description('Interval between automatic sync. Default to none (manual or triggered)')
    })
});
