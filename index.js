const express = require('express');

const cors = require('cors');

const server = express();


const PORT = process.env.PORT || 9000 ;

require('./config/mongo-conf');

require('./routes')(server);

server.use(cors());

server.use(express.static('public'));

server.listen( PORT ,()=>{
    console.log(`Server Started at port ${PORT}`)
});

// start server with env_variables $ PORT= SECRET= MONGO_URL= node .