const express = require('express');
const server = express();
const fs = require('fs');
server.use(express.static(__dirname+ '/frontend/'));
server.listen(8080);


server.use('/', express.static(__dirname + '/frontend/index.html'));

server.use('/trades', express.static(__dirname + '/trades.json'));
server.use('/params', express.static(__dirname + '/params.json'));


