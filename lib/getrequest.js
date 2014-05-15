var _           = require('underscore');
var CrudRequest = require('./crudrequest.js');
var util        = require('util');

var generalParameters = CrudRequest.getGeneralParameters();

var listParameters = CrudRequest.getListParameters();

var allParameters = CrudRequest.getAllParameters();

// Class
var GetRequest = function(options) {
  CrudRequest.call(this, options);
};

// Class Methods
_.extend(GetRequest, CrudRequest, {

});

// Instance Methods
_.extend(GetRequest.prototype, CrudRequest.prototype, {

  _allParameterNames : _.keys(allParameters),
  
  _validIdParameters : generalParameters,

  execute : function() {
    var findOptions = this._getFindOptions();

    if (this._hasId()) {
      this.documentClass.findById(
        this._getId(),
        findOptions,
        this.resultsHandler()
      );
    } else {
      this.documentClass.find(
        findOptions,
        this.resultsHandler()
      );
    }
  },
  
  _getFindOptions : function() {
    var self            = this;
    var findOptions     = {};

    _.each(self._allParameterNames, function(name) {
      findOptions[name] = self._validateQueryParameter(name);
    });
    return findOptions;
  },

  _validateQueryParameter : function(name) {
    var parsedQueryParameter = this.parseQueryParameter(name);

    if (!parsedQueryParameter) {
      return null;
    }
    if (this._hasId()) {
      if (!this._validIdParameters[name]) {
        this.addError("parameter " + name + " doesn't apply when getting by id.");
        return null;
      }
    }
    return parsedQueryParameter;
  },
  
  _hasId : function() {
    return (this._request.params.id) ? true : false;
  },
  _getId : function() {
    return this._request.params.id;
  }

});

module.exports = GetRequest;
