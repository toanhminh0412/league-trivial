const socket = io("http://localhost:3001");
socket.on("connection");

const ingameName = window.localStorage.getItem('leaguetrivial-name');

// First time player receives names of all current players
socket.on('players', players => {
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
            socket.emit('game-start');
        })

        // Make the player room onwer
        window.localStorage.setItem("role", "room-owner");
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
socket.emit("new-player", ingameName);

// Receive signal if a new player arrives
socket.on('new-player', name => {
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
socket.on("game-start", () => {
    window.location.href = "/game";
})