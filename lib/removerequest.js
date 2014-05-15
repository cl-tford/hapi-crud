var _ = require('underscore');
var CrudRequest = require('./crudrequest');

var RemoveRequest = function(request) {
  CrudRequest.call(this, request);
};

_.extend(RemoveRequest, CrudRequest);

_.extend(RemoveRequest.prototype, CrudRequest.prototype, {
  execute: function() {
    var self = this;

    self.documentClass.remove(self._getId(), self, self.resultsHandler());
  },

  _getId : function() {
    return this._request.params.id;
  }
});

module.exports = RemoveRequest;
