// Patches to node-modules, specifically botbuilder
//
// Note: patches based on botbuilder 3.14.0

"use strict";

const builder = require('botbuilder');

builder.Session.prototype._delay = builder.Session.prototype.delay;

builder.Session.prototype.delay = function (delay) {
    // Accumulate delays (for a given batch) into a session variable
    this.privateConversationData.totalDelay =
    this.privateConversationData.totalDelay ?
    this.privateConversationData.totalDelay + delay : delay;

    // Call original
    return this._delay(delay);
};

builder.Session.prototype._sendBatch = builder.Session.prototype.sendBatch;

builder.Session.prototype.sendBatch = function (done) {
    if (!this.sendingBatch) {
        // Record timestamp when batch sent out along with total accumulated delay
        // Add 500 ms to ensure a minimum spacing between batches
        // Note: without extra delay, messages can still get out of order
        this.privateConversationData.lastBatchCompletionTime = Date.now();
        this.privateConversationData.lastBatchTotalDelay =
            this.privateConversationData.totalDelay ?
            this.privateConversationData.totalDelay + 500 : 500;
        this.privateConversationData.totalDelay = 0;        
    }

    // Call original
    return this._sendBatch(done);
};

builder.Session.prototype._startBatch = builder.Session.prototype.startBatch;

builder.Session.prototype.startBatch = function () {
    if (!this.batchStarted) {
        // new batch
        if (this.privateConversationData.lastBatchTotalDelay) {
            let now = Date.now();
            let ts = this.privateConversationData.lastBatchCompletionTime;
            let delay = this.privateConversationData.lastBatchTotalDelay;
            // are we within the delay window of the previous batch?
            if (now - ts < delay) {
                // reset total
                this.privateConversationData.lastBatchTotalDelay = 0;
                // insert delay for time remaining on previous batch(es)
                this.delay(delay - now + ts);
            }
        }
    }

    // Call original
    return this._startBatch();
};


builder.Session.prototype._send = builder.Session.prototype.send;

builder.Session.prototype.send = function (message) {
    //For each send add a delay.
	this.delay(getRandomInt(5, 10)*1000);
	return this._send(message);
};

function getRandomInt(min, max) {
	return Math.floor(min) + Math.floor(Math.random() * Math.floor(max));
  }
