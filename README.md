Plugin for hapi servers. Takes an index of resource modules, installs crud-routes for each.

Example Usage:

```
var Hapi = require('hapi');
var Joi  = require('joi');

var userModule = {
	find : function(options, callback) {
		callback(null, [{id : 1, name : "ren"},{id : 2, name : "stimpy"}]);
	},
	findById : function() {},
	save : function() {},
	remove : function() {}
};

var server = Hapi.createServer('localhost', 8000);

server.pack.require('hapi-crud', {
	resources : {
		'users' : userModule
	}
}, function(err) { if (err) { console.log("Plugin error: ", err);}});

server.start();

console.log("Serving crud on port 8000");
```

After running this server, you should be able to go to

```
http://localhost:8000/data/users
```

and receive a list of users.