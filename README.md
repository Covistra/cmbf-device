# Device Plugin

The device plugin provides a high-level interface to manage data storage on specific devices. Our goal is to
propagate useful data on the device to avoid roundtrips and increase application performance. The propagation
is controlled by each plugin, based on its needs. The device plugin will manage the connection with the device,
through the websocket plugin.

## Device Local Storage

Some plugins might want to store and sync data on all devices. This is achieved by sending subscriptions to
the device for specific collection subset. When the device is connected, the plugin will make sure that the
subscription is in sync and forward any incoming changes (like Meteor DDP).

createSubscription
syncSubscription
removeSubscription

The query is provided, with certain fields like deviceId, owner, userId being available to scope the collection.

The subscription can be applied to specific devices only by geolocation,  by country, language, account level, etc.
