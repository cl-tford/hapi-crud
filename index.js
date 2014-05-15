var crud = require('./lib');
var _ = require('underscore');
var Joi = require('joi');

var defaultAuthorizationOptions = false; // Default to no authentication.


var validOptions = {
  resources : Joi.object(),
  authorizationStrategies : {
    "sensitive" : Joi.string(),
    "safe"      : Joi.string()
  }
};

var HapiCrud = function(options) {
  this._assertValidOptions(options);
//  if (!options.resources) {
//    throw new Error("HapiCrud needs resources");
//  }
  this._resources = options.resources;
//  this._sensitiveAuthorizationStrategy = options.sensitiveAuthorizationStrategy || null;
  this._authorizationStrategies = options.authorizationStrategies;
//  this._sensitiveAuthorizationStrategy = this._getS
//  this._safeAuthorizationStrategy = options.safeAuthorizationStrategy || null;
};

_.extend(HapiCrud.prototype, {
  defineRoutes : function() {
    var self = this;
    var routes = [];

    _.each(self._resources, function(resourceModule, resourceName) {
      self.checkInterface(resourceModule);
      _.each(
        [
          'defineApiGetOneRoute',
          'defineApiGetRoute',
          'defineApiDeleteRoute',
          'defineApiPostRoute',
          'defineApiSearchRoute'
        ],
        function(routeDefiner) {
          var routeDefinition = self[routeDefiner](resourceName, resourceModule);

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
    crud.request.checkQueryValidation(resourceModule);
    crud.request.checkPayloadValidation(resourceModule);
  },

  defineApiGetOneRoute : function(resourceName, resourceModule) {
    return  {
      method : 'GET', path : '/api/data/' + resourceName + '/{id}',
      config : {
        handler : crud.get(resourceModule),
        auth : this._getAuthorizationOptions(resourceModule),
        validate : {
          query : crud.request.validateSingularQuery(resourceModule)
        }
      }
    };
  },
  
  defineApiGetRoute : function(resourceName, resourceModule) {
    return {
      method : 'GET', path : '/api/data/' + resourceName,
      config : {
        handler : crud.get(resourceModule),
        auth : this._getAuthorizationOptions(resourceModule),
        validate : {
          query : crud.request.validatePluralQuery(resourceModule)
        }
      }
    };
  },
  
  defineApiDeleteRoute : function(resourceName, resourceModule) {
    return  {
      method : 'DELETE', path : '/api/data/' + resourceName + '/{id?}',
      config : {
        handler : crud.del(resourceModule),
        auth : this._getSensitiveAuthOptions()
      }
    };
  },
  
  defineApiPostRoute : function(resourceName, resourceModule) {
    return {
      method : 'POST', path : '/api/data/' + resourceName,
      config : {
        handler : crud.post(resourceModule),
        auth : this._getSensitiveAuthOptions(),
        validate : {
          payload : resourceModule.payloadValidationRules()
        }
      }
    };
  },
    
  defineApiSearchRoute : function(resourceName, resourceModule) {
    if (!resourceModule.hasTextSearch ||
        typeof resourceModule.hasTextSearch !== 'function') {
      
      return null;
    }
    return {
      method : 'Get', path : '/api/search/' + resourceName,
      config : {
        handler : crud.search(resourceModule),
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


module.exports = {
  register : function(plugin, options, next) {
    var hapiCrud = new HapiCrud(options);
    var crudRoutes = hapiCrud.defineRoutes();

    plugin.route(crudRoutes);
    next();
  }
};
