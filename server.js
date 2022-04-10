const express = require('express');
const app = express();
const path = require('path');
const lobbyServer = require('http').createServer(app);
const lobbyIO = require('socket.io')(lobbyServer, { cors: { origin: "*" }})
const gameServer = require('http').createServer(app);
const gameIO = require('socket.io')(gameServer, { cors: { origin: "*" }})
const spellQuestions = require('./questions/spells.json').spellQuestions;
let socketIdName = {};
let gameSocketIdName = {};
const lobbyPORT = process.env.PORT || 3001;
const gamePORT = process.env.PORT || 5000;

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

lobbyServer.listen(lobbyPORT, () => {
    console.log('Lobby Server running...');
})

gameServer.listen(gamePORT, () => {
    console.log('Game Server running...');
})

lobbyIO.on("connection", (socket) => {

    // Signal received when a new player joins
    socket.on('new-player', (name) => {
        if (!lobbyPlayerList.includes(name)) {
            lobbyPlayerList.push(name);
        }
        socketIdName[socket.id] = name;
        console.log(socketIdName);
        lobbyIO.emit('players', lobbyPlayerList);
    })

    // Signal received when an owner of a lobby start a game
    socket.on("game-start", () => {
        console.log("game-start emmited :", Object.keys(gameSocketIdName).length)
        if (Object.keys(gameSocketIdName).length === 0) {
            lobbyIO.emit("game-start");
        }
    })

    socket.on("disconnect", () => {
        const name = socketIdName[socket.id];
        console.log(`Player ${name} just left the lobby`);
        const index = lobbyPlayerList.indexOf(name);
        lobbyPlayerList.splice(index, 1);
        lobbyIO.emit("players", lobbyPlayerList);
        delete socketIdName[socket.id];
    })

})

gameIO.on("connection", socket => {
    console.log('A player just joined the game');

    socket.on("new-player", name => {
        if (!gamePlayerList.includes(name)) {
            gamePlayerList.push(name);
        }
        gameSocketIdName[socket.id] = name;
        socket.emit("players", gamePlayerList);
        socket.broadcast.emit('new-player', name);
    })

    socket.on("game-start", () => {
        gameIO.emit("game-start");
    })

    socket.on("chat", msgObj => {
        // console.log(`${msgObj.name}: ${msgObj.msg}`);
        gameIO.emit("chat", msgObj);
    })

    socket.on("get-question", () => {
        const questionIndex = Math.floor(Math.random() * (spellQuestions.length - 1));
        const questionObj = spellQuestions[questionIndex];
        gameIO.emit("question", questionObj);
    })

    socket.on("wrong-answer", answerObj => {
        gameIO.emit("wrong-answer", answerObj);
    })

    socket.on("right-answer", answerObj => {
        console.log(answerObj);
        gameIO.emit("right-answer", answerObj);
    })

    socket.on("disconnect", () => {
        const name = gameSocketIdName[socket.id];
        console.log(`Player ${name} just left the game`);
        const index = gamePlayerList.indexOf(name);
        gamePlayerList.splice(index, 1);
        gameIO.emit("players", gamePlayerList);
        delete gameSocketIdName[socket.id];
    })

})