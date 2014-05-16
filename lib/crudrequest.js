var _ = require('underscore');
var util = require('util');
var Joi = require('joi');

var generalParameters = {
  'fields' : true
};

var listParameters = {
  'sort'     : true,
  'limit'    : true,
  'skip'     : true,
  'criteria' : true,
};

var allParameters = _.extend({}, generalParameters, listParameters);

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getValidationMethodName(parameterName) {
  return "validate" + capitalizeFirstLetter(parameterName);
}

var defaultMethods = {
  validateFields : function() {
    return Joi.object();
  },
  validateSort : function() {
    return Joi.array().includes(Joi.array());
  },
  validateLimit : function() {
    return Joi.number().integer().min(0);
  },
  validateSkip : function() {
    return Joi.number().integer().min(0);
  },
  validateCriteria : function() {
    return Joi.object();
  },
  payloadValidationRules : function() {
    return Joi.any();
  },
  containsSensitiveData : function() {
    return false;
  },
  success : function(data) {
    return data;
  },
  failure : function(errors) {
    return errors;
  }
}

function assertValidationMethod(resourceModule, parameterName) {
  var validationMethodName = getValidationMethodName(parameterName);
  var validationMethod = resourceModule[validationMethodName];

  if (!validationMethod || typeof validationMethod !== 'function') {
    resourceModule[validationMethodName] = defaultMethods[validationMethodName];
  }
}


// Class
var CrudRequest = function(options) {
  this._request = options.request;
  this._replyCallback = options.reply;
  this.documentClass = options.documentClass;
  this.success = options.success || defaultMethods.success;
  this.failure = options.failure || defaultMethods.failure;
  this._errors = [];
};

// Class Methods
_.extend(CrudRequest, {
  handler : function(documentClass, responseOptions) {
    var Self = this;
    
    return function handle(request, reply) {
      var crudRequest = new Self({
        request       : request,
        reply         : reply,
        documentClass : documentClass,
        success       : responseOptions.success,
        failure       : responseOptions.failure
      });
      crudRequest.execute();
    };
  },

  getGeneralParameters : function() {
    return generalParameters;
  },

  getListParameters : function() {
    return listParameters;
  },

  getAllParameters : function() {
    return allParameters;
  },
  
  checkInterface : function(resourceModule) {
    this.checkQueryValidation(resourceModule);
    this.checkPayloadValidation(resourceModule);
    if (!resourceModule.containsSensitiveData ||
        typeof resourceModule.containsSensitiveData !== 'function') {

      resourceModule.containsSensitiveData = defaultMethods.containsSensitiveData;
    }
  },

  checkQueryValidation : function(resourceModule) {
    _.each(_.keys(allParameters), function(parameterName) {
      assertValidationMethod(resourceModule, parameterName);
    });
  },

  checkPayloadValidation : function(resourceModule) {
    if (!resourceModule.payloadValidationRules ||
        typeof resourceModule.payloadValidationRules !== 'function') {

      resourceModule.payloadValidationRules = defaultMethods.payloadValidationRules;
    }
  },
  
  validateSingularQuery : function(resourceModule) {
    var self = this;
    var validator = {};

    _.each(generalParameters, function(value, key) {
      var validationMethodName = getValidationMethodName(key);

      validator[key] = resourceModule[validationMethodName]();
    });
    return validator;
  },

  validatePluralQuery : function(resourceModule) {
    var self = this;
    var validator = {};

    _.each(allParameters, function(value, key) {
      var validationMethodName = getValidationMethodName(key);

      validator[key] = resourceModule[validationMethodName]();
      
    });
    return validator;
  }

});


// Instance Methods.
_.extend(CrudRequest.prototype, {
  parseQueryParameter : function(parameterName) {
    var parsed = null;

    if (this._request.query && this._request.query[parameterName]) {
      parsed = this._request.query[parameterName];
    }
    return parsed;
  },

  addError : function(error) {
    this._errors.push(error);
  },

  getErrors : function() {
    return this._errors.slice(0);
  },

  hasErrors : function() {
    return (this._errors.length > 0);
  },

  resultsHandler : function() {
    var self = this;

    return function handleResults(err, data) {
      if (err) {
        return self._handleApplicationError(err);
      }
      if (self.hasErrors()) {
        return self._handleUserError(self.getErrors());
      }
      self._handleSuccess(data);
    };
  },

  execute : function() {
    throw new Error("execute unimplimented");
  },

  getState : function() {
    return this._request.state;
  },

  _handleApplicationError : function(error) {
    var self = this;
    var message = '';

    if (error.isBoom) {
      return self._replyCallback(error);
    }

    if (error.toString && typeof error.toString === 'function') {
      message = error.toString();
    }
    else {
      message = JSON.stringify(error);
    }
    self._replyCallback(self.failure(message)).code(500);
  },

  _handleUserError : function(errors) {
    var self = this;

    self._replyCallback(self.failure(errors))
      .code(400);
  },

  _handleSuccess : function(data) {
    var self = this;

    self._replyCallback(self.success(data))
      .code(200);
  }
  
});


module.exports = CrudRequest;
