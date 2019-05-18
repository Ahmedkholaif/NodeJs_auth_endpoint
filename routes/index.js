const userRouter = require ('./userRouter');

const bodyParser = require('body-parser');


module.exports = (server)=>{
    server.use(bodyParser.json());
    
    server.use('/users',userRouter)
}