const app = require('express')()
const http = require('http').createServer(app)
const mongo = require('mongodb').MongoClient;
const io = require('socket.io')(http)

//Connect to mongo
mongo.connect('mongodb://127.0.0.1/chatroom', { useNewUrlParser: true, useUnifiedTopology: true }, function(err,client) {
    if(err) {
        throw err;
    }
    console.log('MongoDB connected');
    var db = client.db('chatroom');
    let chat = db.collection('chats');
    const users = {};

    io.on('connection', socket => {
        socket.on("user-id",() => {
            socket.emit("user-id", socket.id);
        })
        
        //Handle new user join in chat
        socket.on("new-user", username => {
            socket.broadcast.emit('new-user',username + ' has joined the chat')
        })

        //Handle input events
        socket.on('message', ({userid, username, message}) => {
            //Check for username and message
            if(message.trim() != '') {
                //Insert message
                chat.insertOne({userid:userid, username : username, message: message}, function(err,done) {
                    if(err) {
                        console.log(err);
                    } else {
                        io.emit('message', {userid,username,message})  
                    }
                })
            }
        })

        //Handle user leaving the chat
        socket.on('user-leave', username => {
            socket.broadcast.emit('user-leave', username+ ' has left the chat')
        })
        
        //Landing api
        app.get('/',function(req,res) {
            if(err) {
                console.log(err)
            } else {
                res.send('Welcome to API')
            }
        })

        //Fetch chat list from mongo collection
        app.get('/api/chatlist', function (req, res) {
            var per = parseInt(req.query.per);
            var page = parseInt(req.query.page);

            chat.find().limit(per).skip(page).sort({_id:-1}).toArray(function(err, chats) {
                if(err) {
                    console.log(err);
                } else{
                    res.json(chats);
                }
            })
        })
    })
})

http.listen(4000, function() {
    console.log('listening on port 4000')
})