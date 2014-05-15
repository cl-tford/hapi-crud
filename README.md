Plugin for hapi servers. Takes an index of resource modules, installs crud-routes for each.

Example Usage:

Make a new directory for your project, and create a package.json file:

```
npm init
```

Install hapi, and hapi-crud:

```
npm install --save hapi hapi-crud
```

Create a resource and expose it to the world via apis (server.js):

```
var Hapi = require('hapi');

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
Run this server, and go to

```
http://localhost:8000/data/users
```

to receive a list of users.