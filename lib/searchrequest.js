var _           = require('underscore');
var GetRequest  = require('./getrequest.js');

var allParameters = {
  'text'     : true,
  'limit'    : true,
  'skip'     : true,
  'fields'   : true,
  'criteria' : true
};

// Class
var SearchRequest = function(options) {
  GetRequest.call(this, options);
};

// Class Methods
_.extend(SearchRequest, GetRequest);

// InstanceMethods
_.extend(SearchRequest.prototype, GetRequest.prototype, {

  _allParameterNames : _.keys(allParameters),

  execute : function() {
    var findOptions = this._getFindOptions();
    var text = findOptions.text;
    
    if (!text) {
      this.addError("Can't search without search text");
      return this.resultsHandler()(null, []);
    }
    delete findOptions.text;
    this.documentClass.textSearch(
      text,
      findOptions,
      this.resultsHandler()
    );
  }
  
});

module.exports = SearchRequest;
