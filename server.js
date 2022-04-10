const express = require('express');
const app = express();
const path = require('path');
const lobbyServer = require('http').createServer(app);
const io = require('socket.io')(lobbyServer, { cors: { origin: "*" }})
const spellQuestions = require('./questions/spells.json').spellQuestions;
let socketIdName = {};
const PORT = process.env.PORT || 3001;

// Player list for the lobby
let lobbyPlayerList = [];

// Player list for a game
let gamePlayerList = [];

app.use(express.static('public'))

// Lobby for players before joining the game
app.get('/prep', (req, res) => {
    res.sendFile(path.join(__dirname,'views/lobby.html'));
})

// Page for players to add their username
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html')); 
})

// Actual gameplay
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/game.html')); 
})

// Store questions about spells
app.get('/spell-questions', (req, res) => {
    res.status(200).send(spellQuestions);
})

lobbyServer.listen(PORT, () => {
    console.log('Server running...');
})

io.on("connection", (socket) => {

    // Signal received when a new player joins
    socket.on('lobby-new-player', (name) => {
        if (!lobbyPlayerList.includes(name)) {
            lobbyPlayerList.push(name);
        }
        socketIdName[socket.id] = name;
        console.log(socketIdName);
        io.emit('lobby-players', lobbyPlayerList);
    })

    // Signal received when an owner of a lobby start a game
    socket.on("lobby-game-start", () => {
        if (gamePlayerList.length === 0) {
            io.emit("lobby-game-start");
        }
    })

    socket.on("disconnect", () => {
        const name = socketIdName[socket.id];
        console.log(`Player ${name} just left the lobby`);
        if (lobbyPlayerList.includes(name)) {
            const index = lobbyPlayerList.indexOf(name);
            lobbyPlayerList.splice(index, 1);
            io.emit("lobby-players", lobbyPlayerList);
        } else {
            const index = gamePlayerList.indexOf(name);
            gamePlayerList.splice(index, 1);
            io.emit("game-players", gamePlayerList);
        }
        delete socketIdName[socket.id];
    })

    socket.on("game-new-player", name => {
        if (!gamePlayerList.includes(name)) {
            gamePlayerList.push(name);
        }
        socketIdName[socket.id] = name;
        socket.emit("game-players", gamePlayerList);
        socket.broadcast.emit('game-new-player', name);
    })

    socket.on("game-game-start", () => {
        io.emit("game-game-start");
    })

    socket.on("game-chat", msgObj => {
        // console.log(`${msgObj.name}: ${msgObj.msg}`);
        io.emit("game-chat", msgObj);
    })

    socket.on("game-get-question", () => {
        const questionIndex = Math.floor(Math.random() * (spellQuestions.length - 1));
        const questionObj = spellQuestions[questionIndex];
        io.emit("game-question", questionObj);
    })

    socket.on("game-wrong-answer", answerObj => {
        io.emit("game-wrong-answer", answerObj);
    })

    socket.on("game-right-answer", answerObj => {
        console.log(answerObj);
        io.emit("game-right-answer", answerObj);
    })

})