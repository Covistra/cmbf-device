var Joi = require('joi');

module.exports = Joi.object().keys({
    _id: Joi.any(),
    uuid: Joi.string().required(),
    owner: Joi.any().description('customer account id'),
    userId: Joi.any().description('the specific user handling this device'),
    socketId: Joi.any(),
    data: Joi.object().keys({
        platform: Joi.string(),
        app_version: Joi.string(),
        platform_version: Joi.string()
    }),
    connected: Joi.boolean().default(true),
    last_seen: Joi.date().default(Date.now, 'right now'),
    created_at: Joi.date().default(Date.now, 'right now')
});
