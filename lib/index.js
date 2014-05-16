var CrudRequest   = require('./crudrequest.js');
var GetRequest    = require('./getrequest.js');
var PostRequest   = require('./postrequest.js');
var RemoveRequest   = require('./removerequest.js');
var SearchRequest = require('./searchrequest.js');
var _             = require('underscore');

function handler(requestClass, documentClass, options) {
  return requestClass.handler(documentClass, options);
}

function checkInterface(resourceModule) {
  if (!resourceModule) {
    throw new Error("Cannot create CRUD route without a resource module.");
  }
  if (!resourceModule.find ||
      typeof resourceModule.find !== 'function') {
    throw new Error("Resource Module must have a find function.");
  }
  if (!resourceModule.findById ||
      typeof resourceModule.findById !== 'function') {
    throw new Error("Resource module must have a findById function.");
  }
  if (!resourceModule.save ||
      typeof resourceModule.save !== 'function') {
    throw new Error("Resource module must have a save function.");
  }
//  GetRequest.checkInterface(resourceModule);
}





module.exports = {
  get    : _.partial(handler, GetRequest),
  del    : _.partial(handler, RemoveRequest),
  post   : _.partial(handler, PostRequest),
  search : _.partial(handler, SearchRequest),
  checkInterface : checkInterface,
  request : CrudRequest
//  checkQueryValidation : CrudRequest.checkQueryValidation,
//  checkPayloadValidation : CrudRequest.checkPayloadValidation,
//  queryValidationRules : CrudRequest.queryValidationRules
};
