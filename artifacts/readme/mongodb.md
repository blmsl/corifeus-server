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


