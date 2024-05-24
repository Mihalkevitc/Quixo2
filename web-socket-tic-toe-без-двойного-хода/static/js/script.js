var socket = io();
var player;
var opponent;
var gameOver = false;
var currentPlayer;

document.addEventListener('DOMContentLoaded', (event) => {
    disableBoard();
});

socket.on('init', function(data) {
    player = data.player;
    currentPlayer = data.player; // Set the current player
    document.getElementById('player1').innerText = player === 'X' ? data.username : data.opponent;
    document.getElementById('player2').innerText = player === 'O' ? data.username : data.opponent;
    highlightCurrentPlayer();
    if (data.message) {
        displayMessage(data.message);
    }
});

socket.on('game_start', function(data) {
    displayMessage(data.message);
    enableBoard();
});

socket.on('game_pause', function(data) {
    displayMessage(data.message);
    disableBoard();
});

socket.on('message', function(data) {
    if (data.init !== undefined && data.init === false) {
        document.getElementById('cell-' + data.cell).innerText = data.player;
        currentPlayer = data.nextTurn; // Update current player after a move
        highlightCurrentPlayer(); // Highlight the current player
    }
    if (data.message && data.message !== 'move') {
        displayMessage(data.message);
    }
    if (data.gameOver) {
        gameOver = true;
        document.getElementById('reset-button').style.display = 'block';
    }
});

socket.on('players', function(data) {
    data.clients.forEach(client => {
        if (client.player === 'X') {
            document.getElementById('player1').innerText = client.username;
        } else if (client.player === 'O') {
            document.getElementById('player2').innerText = client.username;
        }
    });
});

socket.on('winning_combo', function(data) {
    const combo = data.combo;
    const cells = document.querySelectorAll('#board > div');
    combo.forEach(index => {
        cells[index].style.border = '2px solid red';
    });
});

function makeMove(cell) {
    if (gameOver || !isBoardEnabled() || player !== currentPlayer) return;
    socket.emit('move', JSON.stringify({cell: cell, player: player}));
}

function displayMessage(message) {
    var messagesDiv = document.getElementById('messages');
    var messageElement = document.createElement('div');
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
}

function openModal() {
    var modal = document.getElementById('rules-modal');
    modal.style.display = 'block';
}

function closeModal() {
    var modal = document.getElementById('rules-modal');
    modal.style.display = 'none';
}

function resetGame() {
    socket.emit('reset');
}

socket.on('reset', function() {
    const cells = document.querySelectorAll('#board > div');
    cells.forEach(cell => {
        cell.innerText = '';
        cell.style.border = '1px solid #f0f0f0';
    });
    gameOver = false;
    document.getElementById('messages').innerHTML = '';
});

function highlightCurrentPlayer() {
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');
    if (currentPlayer === 'X') {
        player1.classList.add('current-player');
        player2.classList.remove('current-player');
    } else {
        player1.classList.remove('current-player');
        player2.classList.add('current-player');
    }
}


function disableBoard() {
    document.getElementById('board').style.pointerEvents = 'none';
}

function enableBoard() {
    document.getElementById('board').style.pointerEvents = 'auto';
}

function isBoardEnabled() {
    return document.getElementById('board').style.pointerEvents !== 'none';
}

socket.on('connect', function() {
    console.log('Connected to server');
});

socket.on('update_main_data', function(data) {
    console.log('Received update_main_data:', data);
    updateMainData(data.players);
});

function updateMainData(players) {
    console.log('Updating main data:', players);
    var playersBody = document.getElementById('players-body');
    playersBody.innerHTML = '';
    players.forEach(function(player) {
        var row = document.createElement('tr');
        var usernameCell = document.createElement('td');
        var gamesPlayedCell = document.createElement('td');
        var winsCell = document.createElement('td');

        usernameCell.textContent = player.username;
        gamesPlayedCell.textContent = player.games_played;
        winsCell.textContent = player.wins;

        row.appendChild(usernameCell);
        row.appendChild(gamesPlayedCell);
        row.appendChild(winsCell);
        playersBody.appendChild(row);
    });
}
