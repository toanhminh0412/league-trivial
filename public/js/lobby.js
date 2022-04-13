const socket = io();
socket.on("connection");

// Open/close setting
document.getElementById('setting').addEventListener('click', () => {
    document.getElementById('setting-lightbox').style.display = 'flex';
});

document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('setting-lightbox').style.display = 'none';
})

document.getElementById('game-mode').onchange = event => {
    if (event.target.value === "sudden-death") {
        document.getElementById("lives-label").style.display = "block";
        document.getElementById("lives").style.display = "block";
        document.getElementById("turns-label").style.display = "none";
        document.getElementById("turns").style.display = "none";
    } else {
        document.getElementById("lives-label").style.display = "none";
        document.getElementById("lives").style.display = "none";
        document.getElementById("turns-label").style.display = "block";
        document.getElementById("turns").style.display = "block";
    }
}

document.getElementById("setting-form").onsubmit = event => {
    event.preventDefault();
    const gameMode = document.getElementById("game-mode").value;
    if (gameMode === "sudden-death") {
        const gameObject = {
            gameMode: "sudden-death",
            time: parseInt(document.getElementById("time").value),
            lives: parseInt(document.getElementById("lives").value),
            turns: -1
        }
        socket.emit("game-setting", gameObject);
    } else {
        const gameObject = {
            gameMode: "points",
            time: parseInt(document.getElementById("time").value),
            lives: -1,
            turns: parseInt(document.getElementById("turns").value)
        }
        socket.emit("game-setting", gameObject);
    } 
    document.getElementById("setting-lightbox").style.display = "none";
}

const ingameName = window.localStorage.getItem('leaguetrivial-name');

// First time player receives names of all current players
socket.on('lobby-players', players => {
    window.localStorage.setItem("role", "");
    console.log("Player list: ", players);

    document.querySelector('.players-container').innerHTML = "";
    // Create a container for our game character
    let newDiv = document.createElement("div");
    let newName = document.createTextNode(ingameName);
    newDiv.appendChild(newName);
    newDiv.className = "player-container";

    const playersContainer = document.querySelector('.players-container');
    playersContainer.insertAdjacentElement("beforeend", newDiv);

    // Render the start game button if your the first person in the room
    if (players[0] === ingameName) {
        let btnDiv = document.createElement("div");
        let btnText = document.createTextNode("Start Game");
        btnDiv.appendChild(btnText);
        btnDiv.className = "start-btn";
        document.querySelector('.players-container').insertAdjacentElement("afterend", btnDiv);

        // Start game button gets clicked
        document.querySelector('.start-btn').addEventListener("click", () => {
            socket.emit('lobby-game-start');
        })

        // Make the player room onwer
        window.localStorage.setItem("role", "room-owner");

        // Allow the room owner to have access to setting
        document.getElementById("setting").style.display = "flex";
    }
    
    // Create a container for other players' characters
    for (let i = 0; i < players.length; i++) {
        if (players[i] !== ingameName) {
            let playerDiv = document.createElement("div");
            let playerName = document.createTextNode(players[i]);
            playerDiv.appendChild(playerName);
            playerDiv.className = "player-container";
            if (i === 0) {
                playerDiv.style.color = "#2dfc5a";
            }

            const playersContainer = document.querySelector('.players-container');
            playersContainer.insertAdjacentElement("beforeend", playerDiv);    
        }  
    }
})

// Notify the server that we just arrives
socket.emit("lobby-new-player", ingameName);

// Receive signal if a new player arrives
socket.on('lobby-new-player', name => {
    console.log("New player: ", name);
    if (name !== ingameName) {
        let playerDiv = document.createElement("div");
        let playerName = document.createTextNode(name);
        playerDiv.appendChild(playerName);
        playerDiv.className = "player-container";

        const playersContainer = document.querySelector('.players-container');
        playersContainer.insertAdjacentElement("beforeend", playerDiv);
    }
});

// Waiting for signal from server to join a game
socket.on("lobby-game-start", () => {
    window.location.href = "/game";
})