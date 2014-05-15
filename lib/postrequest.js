var _           = require('underscore');
var CrudRequest = require('./crudrequest.js');

// Class
var PostRequest = function(options) {
  CrudRequest.call(this, options);
};

// Class Methods
_.extend(PostRequest, CrudRequest);

// Instance Methods
_.extend(PostRequest.prototype, CrudRequest.prototype, {
  execute : function() {
    var body = this._getBody();

    this.documentClass.save(
      body,
      this,
      this.resultsHandler()
    );
  },

  _getBody : function() {
    var body = _.extend({}, this._request.payload);
    
    if (!body.id || body.id === '0') {
      delete body.id;
    }
    if (!body._id || body._id === '0') {
      delete body._id;
    }
    return body;
  }
});

module.exports = PostRequest;
