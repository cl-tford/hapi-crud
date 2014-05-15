var _           = require('underscore');
var CrudRequest = require('./crudrequest.js');
var util        = require('util');

var generalParameters = CrudRequest.getGeneralParameters();

/*
var generalParameters = {
  'fields' : true
};
*/

var listParameters = CrudRequest.getListParameters();
/*
var listParameters = {
  'sort'     : true,
  'limit'    : true,
  'skip'     : true,
  'criteria' : true,
};
*/
//var allParameters = _.extend({}, generalParameters, listParameters);
var allParameters = CrudRequest.getAllParameters();


// Class
var GetRequest = function(options) {
  CrudRequest.call(this, options);
};

// Class Methods
_.extend(GetRequest, CrudRequest, {
//,
/*
  checkInterface : function(documentClass) {
    var self = this;

    _.each(allParameters, function(value, key) {
      self._assertValidationMethod(documentClass, key);
    });
  },
  getAllParameters : function() {
    return allParameters;
  },
  _assertValidationMethod : function(documentClass, key) {
    var validationMethodName = this._getValidationMethodName(key);
    var validationMethod = documentClass[validationMethodName];
    var errorMessage = null;

    if (!validationMethod || typeof validationMethod !== 'function') {
      errorMessage = "Missing method '" + validationMethodName + "' in:\n";
      errorMessage += util.inspect(documentClass);
      throw new Error(errorMessage);
    }
  }
*/
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
