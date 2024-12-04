const path = require('path');
const http = require('http');
const express = require('express')
const socketio = require('socket.io');
const { isObject } = require('util');
const { Socket } = require('engine.io');
const formatMessage = require('./utils/messages');
const { format } = require('path');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);//creating an object 

//set static folder 
app.use(express.static(path.join(__dirname, 'public')));
//run when client connects 
const botName = "ChatCord";
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        //Welcome current user 
        socket.emit('message', formatMessage(botName, 'Welcome to chatChord !'));//This is to the single client 

        //Broadcast when a user connnects 
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} joined the room`));//This is to all client except the client that we are connecting  
        // io.emit(); To all clients in general 
        //Send users and room info 
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });


    });
    console.log('New Ws connection.....');


    //Listen for chatMessage 
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    //Runs when client disconnect 
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));
        }
        //Send users and room info 
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });


    });

})
const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));//port to setUp after on start 