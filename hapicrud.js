var crud = require('./lib');
var _ = require('underscore');
var Joi = require('joi');

var defaultAuthorizationOptions = false; // Default to no authentication.


var validOptions = {
  resources : Joi.object(),
  authorizationStrategies : {
    "sensitive" : Joi.string(),
    "safe"      : Joi.string()
  },
  basePath : Joi.string(),
  success : Joi.func(),
  failure : Joi.func()
};

var HapiCrud = function(options) {
  this._assertValidOptions(options);
  this._resources = options.resources;
  this._authorizationStrategies = options.authorizationStrategies;
  this._basePath = options.basePath || '';
  this._responseOptions = {
    success : options.success || null,
    failure : options.failure || null
  }
};

_.extend(HapiCrud.prototype, {
  defineRoutes : function() {
    var self = this;
    var routes = [];

    _.each(self._resources, function(resourceModule, resourceName) {
      var blessedResourceModule = Object.create(resourceModule);
      self.checkInterface(blessedResourceModule);
      _.each(
        [
          'defineApiGetOneRoute',
          'defineApiGetRoute',
          'defineApiDeleteRoute',
          'defineApiPostRoute',
          'defineApiSearchRoute'
        ],
        function(routeDefiner) {
          var routeDefinition = self[routeDefiner](resourceName, blessedResourceModule);

          if (routeDefinition) {
            routes.push(routeDefinition);
          }
        }
      );
    });
    return routes;
  },

  checkInterface : function(resourceModule) {
    crud.checkInterface(resourceModule);
    crud.request.checkInterface(resourceModule);
  },

  defineApiGetOneRoute : function(resourceName, resourceModule) {
    return  {
      method : 'GET', path : this._basePath + '/data/' + resourceName + '/{id}',
      config : {
        handler : crud.get(resourceModule, this._responseOptions),
        auth : this._getAuthorizationOptions(resourceModule),
        validate : {
          query : crud.request.validateSingularQuery(resourceModule)
        }
      }
    };
  },
  
  defineApiGetRoute : function(resourceName, resourceModule) {
    return {
      method : 'GET', path : this._basePath + '/data/' + resourceName,
      config : {
        handler : crud.get(resourceModule, this._responseOptions),
        auth : this._getAuthorizationOptions(resourceModule),
        validate : {
          query : crud.request.validatePluralQuery(resourceModule)
        }
      }
    };
  },
  
  defineApiDeleteRoute : function(resourceName, resourceModule) {
    return  {
      method : 'DELETE', path : this._basePath + '/data/' + resourceName + '/{id?}',
      config : {
        handler : crud.del(resourceModule, this._responseOptions),
        auth : this._getSensitiveAuthOptions()
      }
    };
  },
  
  defineApiPostRoute : function(resourceName, resourceModule) {
    return {
      method : 'POST', path : this._basePath + '/data/' + resourceName,
      config : {
        handler : crud.post(resourceModule, this._responseOptions),
        auth : this._getSensitiveAuthOptions(),
        validate : {
          payload : resourceModule.payloadValidationRules()
        }
      }
    };
  },
    
  defineApiSearchRoute : function(resourceName, resourceModule) {
    if (!resourceModule.textSearch ||
        typeof resourceModule.textSearch !== 'function') {

      return null;
    }
    return {
      method : 'Get', path : this._basePath + '/search/' + resourceName,
      config : {
        handler : crud.search(resourceModule, this._responseOptions),
        auth : this._getAuthorizationOptions(resourceModule)
      }
    };
  },
  
  _getAuthorizationOptions : function(resourceModule) {
    var defaultAuthorizationOptions = {};

    if (resourceModule.containsSensitiveData()) {
      return this._getSensitiveAuthOptions();
    } else {
      return this._getSafeAuthOptions();
    }
  },

  _getSensitiveAuthOptions : function() {
    var strategy = this._getSensitiveAuthorizationStrategy();
    
    if (strategy) {
      return {
        mode : 'required',
        strategies : [strategy]
      };
    } else {
      return defaultAuthorizationOptions;
    }
  },
  
  _getSafeAuthOptions : function() {
    var strategy = this._getSafeAuthorizationStrategy();

    if (strategy) {
      return {
        mode : 'required',
        strategies : [strategy]
      };
    } else {
      return defaultAuthorizationOptions;
    }
  },

  _getSensitiveAuthorizationStrategy : function() {
    var strategies = this._authorizationStrategies;

    if (strategies) {
      return strategies.sensitive || null;
    }
    return null;
  },

  _getSafeAuthorizationStrategy : function() {
    var strategies = this._authorizationStrategies;

    if (strategies) {
      return strategies.safe || null;
    }
  },
  _assertValidOptions : function(options) {
    var validationErrors = Joi.validate(options, validOptions);
    
    if (validationErrors) {
      throw new Error(validationErrors);
    }
  }
});

module.exports = HapiCrud;

