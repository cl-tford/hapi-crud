var _ = require('underscore');

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


function assertValidationMethod(resourceModule, parameterName) {
  var validationMethodName = getValidationMethodName(parameterName);
  var validationMethod = resourceModule[validationMethodName];
  var errorMessage = null;

  if (!validationMethod || typeof validationMethod !== 'function') {
    errorMessage = "Missing method '" + validationMethodName + "' in:\n";
    errorMessage += util.inspect(resourceModule);
    throw new Error(errorMessage);
  }
}


// Class
var CrudRequest = function(options) {
  this._request = options.request;
  this._replyCallback = options.reply;
  this.documentClass = options.documentClass;
  this._errors = [];
};

// Class Methods
_.extend(CrudRequest, {
  handler : function(documentClass) {
    var Self = this;
    
    return function handle(request, reply) {
      var crudRequest = new Self({
        request       : request,
        reply         : reply,
        documentClass : documentClass
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
  
  checkQueryValidation : function(resourceModule) {
    _.each(_.keys(allParameters), function(parameterName) {
      assertValidationMethod(resourceModule, parameterName);
    });
  },

  checkPayloadValidation : function(resourceModule) {
    if (!resourceModule.payloadValidationRules ||
        typeof resourceModule.payloadValidationRules !== 'function') {
      throw new Error("Resource module must have payloadValidationRules function.");
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
//      var validationMethodName = self._getValidationMethodName(key);
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
/*
  getUser : function() {
    var userJSON = this._request.state.cl_data;
console.log("Inside /Users/terranceford/vagrant/src/hapi-crud/lib/crudrequest.js.getUser, about to try and parse userJSON of:\n", userJSON);
    var parsedUserJSON = null;

    if (userJSON && userJSON.length) {
      try {
        parsedUserJSON = JSON.parse(userJSON);
        return {
          _id  : Number(parsedUserJSON.uid),
          name : parsedUserJSON.name
        };
      } catch {
        
      }
    }
    return null;
  },
*/
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
    self._replyCallback(self._unsuccessfulResponse(message)).code(500);
  },

  _handleUserError : function(errors) {
    var self = this;

    self._replyCallback(self._unsuccessfulResponse(errors))
      .code(400);
  },

  _handleSuccess : function(data) {
    var self = this;

    self._replyCallback(self._successfulResponse(data))
      .code(200);
  },

  _unsuccessfulResponse : function(errors) {
    if (!_.isArray(errors)) {
      errors = [errors];
    }
    return {
      errors : errors
    };
  },

  _successfulResponse : function(data) {
    return {
      data : data
    };
  }
});


module.exports = CrudRequest;
