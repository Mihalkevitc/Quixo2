import json
from flask import render_template, request, redirect, url_for, session, flash
from flask_socketio import SocketIO, send, emit, disconnect
from application import create_app, db
from models import User

app = create_app()
socketio = SocketIO(app)

def init_board():
    return [None, None, None, None, None, None, None, None, None]

def is_draw():
    global board
    return all(cell is not None for cell in board)

def if_won():
    global board
    winning_combinations = [
        (0, 1, 2), (3, 4, 5), (6, 7, 8),
        (0, 3, 6), (1, 4, 7), (2, 5, 8),
        (0, 4, 8), (2, 4, 6)
    ]
    for combo in winning_combinations:
        if board[combo[0]] == board[combo[1]] == board[combo[2]] is not None:
            return board[combo[0]], combo
    return None, None

def init_game():
    global board, turn
    board = init_board()
    turn = 'X'

init_game()

def update_board(data):
    global board, turn
    ind = int(data['cell'])
    data['init'] = False

    if data['player'] != turn:
        data['message'] = "It's not your turn"
        emit('message', data, room=request.sid)
        return

    if not board[ind]:
        board[ind] = data['player']
        turn = 'O' if turn == 'X' else 'X'
        data['nextTurn'] = turn
        data['message'] = "move"
        send(data, broadcast=True)

        winner, winning_combo = if_won()
        if winner:
            update_stats(winner)
            for client in clients:
                emit('message', {'cell': ind, 'player': data['player'], 'message': f'You {"won" if client["player"] == winner else "lost"}!', 'gameOver': True}, room=client['sid'])
            emit('winning_combo', {'combo': winning_combo}, broadcast=True)
            emit_main_data()  # Emit updated data after committing to the database
            return

        if is_draw():
            send({'message': "It's a draw!", 'gameOver': True}, broadcast=True)
            return
    else:
        data['message'] = "Cell is already taken"
        emit('message', data, room=request.sid)

def update_stats(winner):
    for client in clients:
        user = User.query.filter_by(username=client['username']).first()
        if client['player'] == winner:
            user.wins += 1
        user.games_played += 1
    db.session.commit()

def emit_main_data():
    users = User.query.all()
    players = [{'username': user.username, 'games_played': user.games_played, 'wins': user.wins} for user in users]
    socketio.emit('update_main_data', {'players': players}, namespace='/')

clients = []

@socketio.on('move')
def handle_move(json_data):
    data = json.loads(json_data)
    update_board(data)

@socketio.on('reset')
def handle_reset():
    init_game()
    for client in clients:
        emit('reset', room=client['sid'])

@socketio.on('connect')
def handle_connect():
    global clients
    if len(clients) < 2:
        username = session.get('username', 'Unknown')
        player = 'X' if not any(client['player'] == 'X' for client in clients) else 'O'
        clients.append({'sid': request.sid, 'player': player, 'username': username})
        emit('init', {'player': player, 'username': username, 'opponent': get_opponent_username(player)})
        emit('players', {'clients': clients}, broadcast=True)
        if len(clients) == 2:
            emit('game_start', {'message': 'Both players connected. Game starts!'}, broadcast=True)
    else:
        emit('message', {'message': 'Server is full'})
        disconnect()

@socketio.on('disconnect')
def handle_disconnect():
    global clients
    clients = [client for client in clients if client['sid'] != request.sid]
    if len(clients) < 2:
        init_game()
        socketio.emit('game_pause', {'message': 'Waiting for another player...'}, broadcast=True)

def get_opponent_username(player):
    for client in clients:
        if client['player'] != player:
            return client['username']
    return 'Waiting for opponent'

@app.route('/')
def index():
    return redirect(url_for('register'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return 'Пользователь с таким именем уже существует!'
        new_user = User(username=username, password=password)
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username, password=password).first()
        if user:
            session['username'] = user.username
            return redirect(url_for('main'))
        else:
            flash('Неправильное имя пользователя или пароль')
    return render_template('login.html')

@app.route('/main')
def main():
    if 'username' not in session:
        return redirect(url_for('login'))
    username = session['username']
    users = User.query.all()
    players = [{'username': user.username, 'games_played': user.games_played, 'wins': user.wins} for user in users]
    return render_template('main.html', username=username, players=players)


if __name__ == '__main__':
    socketio.run(app, debug=True)
