[//]: #@corifeus-header

 [![Build Status](https://travis-ci.org/patrikx3/corifeus-server.svg?branch=master)](https://travis-ci.org/patrikx3/corifeus-server)  [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/patrikx3/corifeus-server/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/patrikx3/corifeus-server/?branch=master)  [![Code Coverage](https://scrutinizer-ci.com/g/patrikx3/corifeus-server/badges/coverage.png?b=master)](https://scrutinizer-ci.com/g/patrikx3/corifeus-server/?branch=master)  
  
[![NPM](https://nodei.co/npm/corifeus-server.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/corifeus-server/)
---
# Corifeus Server - Motor

## Issues / Support
This is an open source project. Time is a precious thing, so I have rarely time to give support and fix issues for someone else. I fix a bug, when I have an error that I need. If you got an issue, error or bug, I hope someone will have time to do it for you, otherwise, you are on your own.

Though, if I know the solution, I will tell you. Besides, core errors will be fixed by me.

***If you want to extend, fix bugs or add in new features, I promptly merge pull requests or you can become a ```patrikx3``` member.***

### Node Version Requirement 
``` 
>=7.8.0 
```  
   
### Built on Node 
``` 
v7.10.0
```   
   
The ```async``` and ```await``` keywords are required.

Install NodeJs:    
https://nodejs.org/en/download/package-manager/    
  
# Description  

                        
[//]: #@corifeus-header:end



This is the NodeJs based server / SocketIO / Mongoose.

# corifeus-boot.json
See [corifeus-boot.json](artifacts/skeleton/corifeus-boot.json)

# Enable cors
https://www.npmjs.com/package/cors

# Modules

* Libaries
  * auth
  * cluster (1 - x cores at once)
  * console
  * error
  * loader (libs and services in multiple projects)
  * process
  * settings
  * util
  
* Services
  * email
  * express (roles)
  * mongoose
  * redis
  * phantom (server side rendering via PhantomJs)

# Layers
There are built in layers for Express and Mongoose. A layer is a composite module in every project that uses the Corifeus Server. Every project is prefix. The built is ```core```.

## Express
Will become ```/api/PROJECT/APP/ROUTE/ACTION```.

# Work
* PhantomJs load babel-polyfill, libraryPath before loading

# MongoDB and Redis for Windows

[MongoDB Windows](artifacts/readme/mongodb.md)  
[Redis Windows](artifacts/readme/redis.md)

# Registry
There is a ```require('corifeus-server').registry```, it shows all modules, libraries.

```json
{
"status": "ok",
"registry": {
  "alias": {
    "corifeus.core.auth": "corifeus.core.lib.auth",
    "corifeus.core.loader": "corifeus.core.lib.loader",
    "corifeus.core.settings": "corifeus.core.lib.settings",
    "corifeus.core.util": "corifeus.core.lib.util",
    "corifeus.core.email": "corifeus.core.service.email",
    "corifeus.core.redis": "corifeus.core.service.redis",
    "corifeus.core.mongoose": "corifeus.core.service.mongoose",
    "corifeus.core.session": "corifeus.core.service.session",
    "corifeus.core.phantom": "corifeus.core.service.phantom",
    "corifeus.core.express": "corifeus.core.service.express"
  },
  "layers": {
    "deployer": [
      "express",
      "mongoose"
    ],
    
  },
  "corifeus": {
    "core": {
      "lib": [
        "auth",
        "cluster",
        "console",
        "loader",
        "process",
        "settings",
        "util"
      ],
      "service": [
        "redis",
        "email",
        "mongoose",
        "session",
        "phantom",
        "express"
      ],
      
    }
  },
  "stats": {
    "core": {
      "service": {
        "redis": {
          "prefix": [
            "session",
            "phantom"
          ],
          
        },
        "mongoose": {
          "models": [
            "deployer-hook"
          ],
          
        },
        "express": {
          "routes": {
            "/api/core/auth/login": "POST",
            "/api/core/auth/verify": "GET",
            "/api/core/auth/prolongate": "GET",
            "/api/core/phantom/render/*": "GET",
            "/api/core/system/pkg": "GET",
            "/api/core/system/registry": "GET",
            "/api/core/system/settings": "GET",
            "/api/core/util/random/:length?": "GET",
            "/api/deployer/hook/:key": "POST"
          }
        }
      }
    }
  }
}
```

[//]: #@corifeus-footer

---
[**CORIFEUS-SERVER**](https://pages.corifeus.tk/corifeus-server) Build v1.1.495-53

[Corifeus](http://www.corifeus.tk) by [Patrik Laszlo](http://patrikx3.tk)

[//]: #@corifeus-footer:end