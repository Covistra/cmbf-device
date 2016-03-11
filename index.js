"use strict";

exports.deps = ['covistra-socket'];

exports.register = function (server, options, next) {
    server.log(['plugin', 'info'], "Registering the Device plugin");

    // Retrieve a reference to the current system configuration
    var config = server.plugins['hapi-config'].CurrentConfiguration;
    var systemLog = server.plugins['covistra-system'].systemLog;
    var channelManager = server.plugins['covistra-messaging'].channelManager;
    var Services = server.plugins['covistra-system'].Services;

    // Open the raw channel to broadcast significant data events
    channelManager.openChannel('device');

    // Register all services
    Services.discover(__dirname, "services");

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};
