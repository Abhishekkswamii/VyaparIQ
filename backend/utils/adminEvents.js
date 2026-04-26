"use strict";

const EventEmitter = require("events");

/**
 * Singleton in-process event bus.
 * Emitted events are forwarded to all connected admin SSE clients.
 *
 * Events:
 *   new_order   { orderId, userId, total, status }
 *   order_update { orderId, status }
 *   stock_update { productId, name, stock }
 *   invoice_ready { orderId, invoiceId }
 */
const adminEvents = new EventEmitter();
adminEvents.setMaxListeners(200); // allow many concurrent admin SSE connections

module.exports = adminEvents;
