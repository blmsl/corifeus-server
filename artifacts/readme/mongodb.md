[//]: #@corifeus-header

## Corifeus Server - Motor

---
                        
[//]: #@corifeus-header:end
# MongoDB

https://www.mongodb.com/download-center?jmp=nav#community

## PATH

```bash
C:\Program Files\MongoDB\Server\3.4\bin
```

## DB

```bash
c:\MONGODB\DATA
c:\MONGODB\LOG
C:\MONGODB\mongod.cfg
```

## mongod.cfg

```bash
systemLog:  
    destination: file  
    path: c:\mongodb\log\mongod.log  
storage:  
    dbPath: c:\mongodb\data  
```

## Service

```bash
"C:\Program Files\MongoDB\Server\3.4\bin\mongod.exe" --config C:\MONGODB\mongod.cfg --install
```



[//]: #@corifeus-footer

---

[**CORIFEUS-SERVER**](https://pages.corifeus.tk/corifeus-server) Build v1.1.563-64

[Corifeus](http://www.corifeus.tk) by [Patrik Laszlo](http://patrikx3.tk)

[//]: #@corifeus-footer:end