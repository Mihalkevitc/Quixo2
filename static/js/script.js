var socket = io();
var player;
var opponent;
var gameOver = false; // Переменная для отслеживания состояния игры
var currentTurn; // Переменная для отслеживания текущего хода
var gameActive = false; // Переменная для отслеживания состояния игры (активна или нет)

socket.on('init', function(data) {
    player = data.player;
    document.getElementById('player1').innerText = player === 'X' ? data.username : data.opponent;
    document.getElementById('player2').innerText = player === 'O' ? data.username : data.opponent;
    currentTurn = 'X'; // Инициализируем текущий ход как 'X', предполагая, что X всегда ходит первым
    highlightCurrentPlayer(currentTurn);
    if (data.message) {
        displayMessage(data.message);
    }
});

socket.on('message', function(data) {
    if (data.init !== undefined && data.init === false) {
        document.getElementById('cell-' + data.cell).innerText = data.player;
        currentTurn = data.player === 'X' ? 'O' : 'X'; // Меняем текущий ход
        highlightCurrentPlayer(currentTurn);
    }
    if (data.message && data.message !== 'move') {
        displayMessage(data.message); // Вывод сообщения о победе

    }
    if (data.message === 'Both players connected. Game starts now!') {
        gameActive = true; // Активируем игру
    }
    if (data.gameOver) {
        gameOver = true;
        gameActive = false; // Деактивируем игру
        document.getElementById('victory-message').style.display = 'block';
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
        cells[index].style.border = '2px solid rgb(228,88,101)';
        cells[index].style.backgroundColor = 'rgb(228, 88, 101)';
    });
});

function makeMove(cell) {
    if (gameOver || !gameActive) return; // Disallow moves if the game is over or not active
    var cellElement = document.getElementById('cell-' + cell);
    if (cellElement.innerText === '' && currentTurn === player) { // Check if cell is empty and it's the player's turn
        socket.emit('move', JSON.stringify({ cell: cell, player: player }));
    }
}


function displayMessage(message) {
    var messagesDiv = document.getElementById('messages');
    var messageElement = document.createElement('div');
    var messagesDiv2 = document.getElementById('message-text');
    if(message === 'You won!' || message === 'You lost!' || message === "It's a draw!") {
        messageElement.textContent = message;
        messagesDiv2.appendChild(messageElement);
    } else {
        messageElement.textContent = message;
        messagesDiv.appendChild(messageElement);
    }
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
        cell.style.backgroundColor = 'rgba(101, 2, 253, 0.3)';
    });
    gameOver = false; // Сбрасываем состояние игры
    gameActive = true; // Активируем игру при рестарте, если оба игрока подключены
    document.getElementById('messages').innerHTML = '';
    document.getElementById('message-text').innerHTML = '';
    document.getElementById('victory-message').style.display = 'none';
    document.getElementById('reset-button').style.display = 'none';
    currentTurn = data.startingPlayer; // Set the current turn to the new starting player
    highlightCurrentPlayer(currentTurn);

});

function highlightCurrentPlayer(currentPlayer) {
    const player1 = document.getElementById('player1');
    const player2 = document.getElementById('player2');
    const player1_png = document.getElementById('player1_png');
    const player2_png = document.getElementById('player2_png');

    if (currentPlayer === 'X') {
        player1.classList.add('current-player');
        player1_png.style.filter = "drop-shadow(-1rem 1rem 0.9rem rgb(228,88,101))"; // Добавляем свойство CSS через атрибут style
        player2.classList.remove('current-player');
        player2_png.style.filter = "contrast(10%)"; // Убираем эффект тени для второго игрока
    } else {
        player1.classList.remove('current-player');
        player2.classList.add('current-player');
        player2_png.style.filter = "drop-shadow(-1rem 1rem 0.9rem rgb(228,88,101))"; // Добавляем свойство CSS через атрибут style
        player1_png.style.filter = "contrast(10%)"; // Убираем эффект тени для второго игрока
    }
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
