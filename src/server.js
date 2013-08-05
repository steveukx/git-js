
var HTTP = require('http');
var Express = require('express');
var Subscribable = require('subscribable');
var util = require('util');

function Server() {
   this._filters = {};

   this._app = Express();
   this._app.use(Express.bodyParser);
   this._app.use(this._router.bind(this));
}

(Server.prototype = (Object.create(Subscribable.prototype))).constructor = Server;

/**
 * @type {Number} Port number the server should listen to
 */
Server.prototype.port = 9876;

/**
 * @type {String} The hostname or DNS address the server should bind on to
 */
Server.prototype.host = '*';

Server.prototype.listenTo = function(host, port) {
   if(!port && !isNaN(host)) {
      port = host;
      host = '*';
   }

   if(!host) {
      host = '*';
   }

   this.port = port || this.port;
   this.host = host || this.host;

   this._disconnect();
   this._connect();
};

Server.prototype.receiveOn = function(url) {
   this._updateUrl = url;
   return this;
};

Server.prototype.restrictTo = function(header, value) {
   this._filters[header] = (this._filters[header] || []).concat(value);
   return this;
};

Server.prototype._validateRequest = function(headers, method, url) {
   for(var header in this._filters) {
      if(!this._filters.hasOwnProperty(header)) continue;

      var headerValue = headers[header.toLowerCase()];
      var filters = this._filters[header];
      var usingPositiveFilter = 0;

      for(var i = 0, l = filters.length, filter; filter = filters[i], i < l; i++) {
         if(/^\-:/.test(filter) && headerValue == filter.substr(2)) {
            return util.format("Rejecting %s to %s, filter violation: %s %s", req.method, req.url, header, filter);
         }

         else if(/^\+:/.test(filter)) {
            usingPositiveFilter = 1;
            if(headerValue == filter.substr(2)) {
               usingPositiveFilter = 2;
            }
         }
      }

      if(usingPositiveFilter === 1) {
         return util.format("Rejecting %s to %s, filter violation: %s was %s which is not an positive filter value", req.method, req.url, header, headerValue);
      }
   }

   return null;
};

Server.prototype._router = function(req, res, next) {
   var url = req.url;
   var filterMessage = this._validateRequest(req.headers, req.method, req.url);

   if(filterMessage) {
      console.log(filterMessage);
      return res.send(403);
   }

   if(url.indexOf(this._updateUrl) === 0 && req.method === 'POST') {
      res.send('OK');
      this.fire('udpate', req.body);
   }
};

Server.prototype._connect = function() {
   this._server = this._app.listen(this.host, this.port);
};

Server.prototype._disconnect = function() {
   if(this._server) {
      this._server.close();
      delete this._server;
   }
};

module.exports = function() {
   return new Server();
};


