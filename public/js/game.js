const gameBgMusic = document.getElementById('game-bg');
gameBgMusic.play();

// toggle chat
const toggleChat = () => {
    if (document.querySelector('.chat').style.display === "none") {
        document.querySelector('.chat').style.display = "block";
        document.querySelector('.chat-btn').style.backgroundColor = "#333333";
    } else {
        document.querySelector('.chat').style.display = "none";
        document.querySelector('.chat-btn').style.backgroundColor = "#4d4d4d";
    }
}

// Chat pops up if chat button is clicked on
document.querySelector('.chat-btn').addEventListener("click", () => {
    toggleChat();
})

// Make chat appear at a certain width
$(window).resize(function() {
    if (document.width >= 1000) {
        document.querySelector('.chat').style.display = "block";
    }
});

// Connect to the game server
const socket = io();
const ingameName = window.localStorage.getItem('leaguetrivial-name') 
console.log("name: ", ingameName);
socket.on("connection");

// Send the name of the current player to the server
socket.emit("game-new-player", ingameName);
socket.on("game-players", players => {
    // console.log("Player list: ", players);
    document.querySelector('.player-container').innerHTML = "";

    for (let i = 0; i < players.length; i++) {
        if (players[i] === ingameName) {
            // Construct containers for players
            let playerDiv = document.createElement("div");
            let playerNameP = document.createElement("p");
            let playerName = document.createTextNode(`${players[i]}: 0`);
            let playerAnswerP = document.createElement("p");
            let playerAnswer = document.createTextNode("answer");
            playerNameP.appendChild(playerName);
            playerNameP.className = "player-name";
            playerAnswerP.appendChild(playerAnswer);
            playerAnswerP.className = "player-answer";
            playerDiv.appendChild(playerNameP);
            playerDiv.appendChild(playerAnswerP);
            playerDiv.className = "your-player";
            document.querySelector('.player-container').insertAdjacentElement("beforeend", playerDiv);

            // Announce the new player joining on the chat
            let joinP = document.createElement("p");
            let joinText = document.createTextNode(`Player ${players[i]} just joined the lobby.`);
            joinP.appendChild(joinText);
            joinP.className = "chat-text";
            document.querySelector('.chat-box').insertAdjacentElement("beforeend", joinP);
        } else {
            let playerDiv = document.createElement("div");
            let playerNameP = document.createElement("p");
            let playerName = document.createTextNode(`${players[i]}: 0`);
            let playerAnswerP = document.createElement("p");
            let playerAnswer = document.createTextNode("answer");
            playerNameP.appendChild(playerName);
            playerNameP.className = "player-name";
            playerAnswerP.appendChild(playerAnswer);
            playerAnswerP.className = "player-answer";
            playerDiv.appendChild(playerNameP);
            playerDiv.appendChild(playerAnswerP);
            playerDiv.className = "player";
            document.querySelector('.player-container').insertAdjacentElement("beforeend", playerDiv);
        
            // Announce the new player joining on the chat
            let joinP = document.createElement("p");
            let joinText = document.createTextNode(`Player ${players[i]} just joined the lobby.`);
            joinP.appendChild(joinText);
            joinP.className = "chat-text";
            document.querySelector('.chat-box').insertAdjacentElement("beforeend", joinP);
        }
    }
})

socket.on('game-new-player', player => {
    // console.log('New player: ', player);
    // Construct new container for the new player
    let playerDiv = document.createElement("div");
    let playerNameP = document.createElement("p");
    let playerName = document.createTextNode(`${player}: 0`);
    let playerAnswerP = document.createElement("p");
    let playerAnswer = document.createTextNode("answer");
    playerNameP.appendChild(playerName);
    playerNameP.className = "player-name";
    playerAnswerP.appendChild(playerAnswer);
    playerAnswerP.className = "player-answer";
    playerDiv.appendChild(playerNameP);
    playerDiv.appendChild(playerAnswerP);
    playerDiv.className = "player";
    document.querySelector('.player-container').insertAdjacentElement("beforeend", playerDiv);

    // Announce the new player joining on the chat
    let joinP = document.createElement("p");
    let joinText = document.createTextNode(`Player ${player} just joined the lobby.`);
    joinP.appendChild(joinText);
    joinP.className = "chat-text";
    document.querySelector('.chat-box').insertAdjacentElement("beforeend", joinP);
})

$("#chat-input").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
        // Send a message to everyone when enter is hit
        const message = document.querySelector('#chat-input').value;
        if (message !== "") {
            socket.emit("game-chat", {name: ingameName, msg: message});
            document.querySelector('#chat-input').value = "";
            var chatBox = document.querySelector(".chat-box");
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }
});

// Receive messages from players
socket.on("game-chat", msgObj => {
    let messageP = document.createElement("p");
    let messageText = document.createTextNode(`${msgObj.name}: ${msgObj.msg}`);
    messageP.appendChild(messageText);
    messageP.className = "chat-text";
    document.querySelector('.chat-box').insertAdjacentElement("beforeend", messageP);
})

// Game happens in this function
const gameRun = async () => {
    let curQuestionObj = {}
    const playerList = document.getElementsByClassName('player');
    let initialPoint = (playerList.length+1) * 10;
    let point = initialPoint;

    // Allow players to type in answer
    $("#answer").on('keyup', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            let answer = document.querySelector('#answer').value;
            answer = answer.replace(/\s/g, '').toLowerCase();
            if (answer !== "") {
                if (answer !== curQuestionObj.answer) {
                    socket.emit("game-wrong-answer", {name: ingameName, answer: answer});
                    document.querySelector('#answer').value = "";
                } else {
                    document.querySelector('#answer').disabled = true;
                    socket.emit("game-right-answer", {name: ingameName, answer: answer, point: point});
                    document.querySelector('#answer').value = "";
                }
            }
        }
    });

    // Receive questions from server
    socket.on("game-question", questionObj => {
        console.log(questionObj);
        curQuestionObj = questionObj;
        document.getElementById('question-img').src = questionObj.img;
        document.getElementById('question').innerText = questionObj.question;
        let yourPlayerDiv = document.getElementsByClassName('your-player')[0];
        yourPlayerDiv.style.borderColor = "#ffffff";
        let playerDivs = document.getElementsByClassName('player');
        for (let i = 0; i < playerDivs.length; i++) {
            playerDivs[i].style.borderColor = "#ffffff";
        }
    })

    // Wrong answer from players
    socket.on("game-wrong-answer", answerObj => {
        let yourPlayerDiv = document.getElementsByClassName('your-player')[0];
        let yourPlayerName = yourPlayerDiv.getElementsByTagName('p')[0].innerHTML.split(":")[0];
        if (yourPlayerName === answerObj.name) {
            yourPlayerDiv.getElementsByTagName('p')[1].innerHTML = answerObj.answer;
        } else {
            let playerDivs = document.getElementsByClassName('player');
            for (let i = 0; i < playerDivs.length; i++) {
                if (playerDivs[i].getElementsByTagName('p')[0].innerHTML.split(":")[0] === answerObj.name) {
                    playerDivs[i].getElementsByTagName('p')[1].innerHTML = answerObj.answer;
                    break;
                }
            }
        }
    })

    // Right answer from players
    socket.on("game-right-answer", answerObj => {
        let yourPlayerDiv = document.getElementsByClassName('your-player')[0];
        let yourPlayerName = yourPlayerDiv.getElementsByTagName('p')[0].innerHTML.split(":")[0];
        if (yourPlayerName === answerObj.name) {
            yourPlayerDiv.style.borderColor = "#009e12";
            let yourPlayerPoint = parseInt(yourPlayerDiv.getElementsByTagName('p')[0].innerHTML.split(": ")[1]);
            console.log("yourPlayerPoint: ", yourPlayerPoint);
            yourPlayerDiv.getElementsByTagName('p')[0].innerHTML = `${ingameName}: ${yourPlayerPoint + answerObj.point}`
            yourPlayerDiv.getElementsByTagName('p')[1].innerHTML = "";
        } else {
            let playerDivs = document.getElementsByClassName('player');
            for (let i = 0; i < playerDivs.length; i++) {
                if (playerDivs[i].getElementsByTagName('p')[0].innerHTML.split(":")[0] === answerObj.name) {
                    playerDivs[i].style.borderColor = "#009e12";
                    let playerPoint = parseInt(playerDivs[i].getElementsByTagName('p')[0].innerHTML.split(": ")[1]);
                    console.log("playerPoint: ", playerPoint);
                    playerDivs[i].getElementsByTagName('p')[0].innerHTML = `${answerObj.name}: ${playerPoint + answerObj.point}`
                    playerDivs[i].getElementsByTagName('p')[1].innerHTML = "";
                    point = point - 10;
                    break;
                }
            }
        }
        const rightMusic = document.getElementById('right-music');
        rightMusic.play();
    })

    // Utility function to delay a certain amount of time before executing the next line
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // time interval that players are allowed to write answer
    const answerTimer = async () => {
        document.querySelector("#answer").disabled = false;
        let seconds = 10;
        const timerElement = document.querySelector('.timer');
        interval = setInterval(() => {
            timerElement.innerHTML = seconds;
            seconds--;
            // console.log("seconds in answerTimer:", seconds);
            /*
            if (seconds === -1) {
                clearInterval(interval);
                return;
            }  
            */
        }, 1000); 
        await delay(11000);
        clearInterval(interval);
    }

    // time interval that correct answer is shown
    const resultTimer = async () => {
        document.querySelector("#answer").disabled = true;
        document.querySelector("#question").innerText = `Answer: ${curQuestionObj["display-answer"]}`;
        let seconds = 5;
        interval = setInterval(() => {
            seconds--;
            // console.log("seconds in resultTimer:", seconds);
            /*
            if (seconds === -1) {
                clearInterval(interval);
                return;
            }*/  
        }, 1000); 
        await delay(6000);
        clearInterval(interval);
    }

    let turns = 10;
    while(turns !== 0) {
        const role = window.localStorage.getItem("role");
        if (role === "room-owner") {
            // get question from the server
            socket.emit("game-get-question");
        }
        
        await answerTimer(); 
        await resultTimer();
        point = initialPoint;
        turns--;
    }

    // Stop game background music
    // document.getElementById("game-bg").pause();
    gameBgMusic.pause();

    // Decide and show the winner to the UI
    const players = document.getElementsByClassName('player');
    const yourPlayer = document.getElementsByClassName('your-player')[0];
    let winner = yourPlayer.getElementsByTagName('p')[0].innerHTML.split(": ");
    let winnerName = winner[0];
    let winnerPoint = parseInt(winner[1]);

    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const playerInfo = player.getElementsByTagName('p')[0].innerHTML.split(': ');
        const playerName = playerInfo[0];
        const playerPoint = parseInt(playerInfo[1]);
        if (playerPoint > winnerPoint) {
            winnerName = playerName;
            winnerPoint = playerPoint;
        }
    }

    document.getElementById('question-img').src = "imgs/victory.png";
    document.getElementById('question').innerText = `Winner: ${winnerName}`;
    document.getElementById('answer').style.display = "none";
    document.getElementsByClassName('lobby-btn')[0].style.display = "flex";
    document.getElementById("win-music").play();
}

// Room owner starts a game 
socket.on("game-game-start", () => {
    document.querySelector("#question-img").style.display = "block";
    document.querySelector("#question-img").style.marginLeft = "auto";
    document.querySelector("#question-img").style.marginRight = "auto";
    document.querySelector('.start-btn').style.display = "none";
    document.querySelector("#answer").style.display = "block";
    gameRun();
})

// Start a game by clicking on start button
if (window.localStorage.getItem("role") === "room-owner") {
    document.querySelector('.start-btn').addEventListener("click", () => {
        socket.emit("game-game-start");
    })
}

document.querySelector('.lobby-btn').addEventListener("click", () => {
    window.location.href = "/prep";
})