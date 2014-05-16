var HapiCrud = require('./hapicrud');

module.exports = {
  register : function(plugin, options, next) {
    var hapiCrud = new HapiCrud(options);
    var crudRoutes = hapiCrud.defineRoutes();

    plugin.route(crudRoutes);
    next();
  }
};

