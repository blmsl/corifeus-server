[//]: #@corifeus-header

 [![Build Status](https://travis-ci.org/patrikx3/corifeus-server.svg?branch=master)](https://travis-ci.org/patrikx3/corifeus-server)  [![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/patrikx3/corifeus-server/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/patrikx3/corifeus-server/?branch=master)  [![Code Coverage](https://scrutinizer-ci.com/g/patrikx3/corifeus-server/badges/coverage.png?b=master)](https://scrutinizer-ci.com/g/patrikx3/corifeus-server/?branch=master)  
  
[![NPM](https://nodei.co/npm/corifeus-server.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/corifeus-server/)
---
# Corifeus Server - Motor

This is an open source project. Just code.

### Node Version Requirement 
``` 
>=7.8.0 
```  
   
### Built on Node 
``` 
v8.2.1
```   
   
The ```async``` and ```await``` keywords are required.

Install NodeJs:    
https://nodejs.org/en/download/package-manager/    

# Description  

                        
[//]: #@corifeus-header:end

# Dependencies
* Nginx
* Redis
* MongoDB
* NodeJs 

  
This is the NodeJs based server / SocketIO / Mongoose.

# corifeus-boot.json
See [corifeus-boot.json](artifacts/skeleton/corifeus-boot.json)

# Needed

## Request limit
https://www.npmjs.com/package/express-request-limit

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
  * chrome (experimental server side rendering via Chrome, becoming stable)

# Layers
There are built in layers for Express and Mongoose. A layer is a composite module in every project that uses the Corifeus Server. Every project is prefix. The built is ```core```.

## Express
Will become ```/api/PROJECT/APP/ROUTE/ACTION```.

# Work
* PhantomJs load babel-polyfill, libraryPath before loading

## For Chrome
Debian based:
```bash
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 
sudo sh -c 'echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' 
sudo apt-get update 
sudo apt-get install google-chrome-stable 
```


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

[**CORIFEUS-SERVER**](https://pages.corifeus.com/corifeus-server) Build v1.1.601-96

[Corifeus](http://www.corifeus.com) by [Patrik Laszlo](http://patrikx3.com)

[//]: #@corifeus-footer:end