const app = require('express')()
const http = require('http').createServer(app)
const mongo = require('mongodb').MongoClient;
const io = require('socket.io')(http)

//Connect to mongo
mongo.connect('mongodb://127.0.0.1/chatroom', function(err,client) {
    if(err) {
        throw err;
    }
    console.log('MongoDB connected');
    var db = client.db('chatroom');
    let chat = db.collection('chats');
    const users = {};

    io.on('connection', socket => {
        //Creat function to send status
        sendStatus = function(s) {
            io.emit('status', s);
        }
    
        //Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res) {
            if(err) {
                throw err
            }
            //Emit the messages
            io.emit('message', res);
        });
        
        //Handle new user join in chat
        socket.on("new-user", username => {
            users[socket.id] = username;
            socket.broadcast.emit('new-user',username + ' has joined the chat')
        })

        //Handle input events
        socket.on('message', ({username, message}) => {
            //Check for username and message
            if(message == '') {
                //Send error status
                sendStatus('Please enter a message')
            } else {
                //Insert message
                chat.insertOne({username : username, message: message}, function() {
                    io.emit('message', {username,message})
                    //Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    })
                })
            }
        })

        //Handle user leaving the chat
        socket.on('user-leave', username => {
            socket.broadcast.emit('user-leave', username+ ' has left the chat')
        })
        
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