from random import shuffle
from json import load

from flask import Flask, render_template, request
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True

# Enables all crossorigin domains by default
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

sids_to_players = {}
game_state = None


def read_game_json():
    with open('../src/cards.json', 'r') as f:
        return load(f)


def init_game_state(num_players):
    global game_state
    game_json = read_game_json()

    sets = game_json['sets']
    cards = game_json['cards']

    deck = []
    for s in sets:
        pass

    for c in cards:
        count = c.pop('count', 1)
        for n in range(count):
            deck.append(dict(c, **{'id': f'{c["id"]}_{n}'}))

    shuffle(deck)

    boards = {n: {} for n in range(num_players)}
    hands = {n: [deck.pop() for _ in range(5)] for n in range(num_players)}

    game_state = {'sets': sets, 'boards': boards, 'hands': hands, 'deck': deck}

    print(hands)


def game_state_for_player(player_id):
    gs = dict(game_state)

    # Don't send other hands to player
    hands = gs.pop('hands')
    gs['hand'] = hands[player_id]

    # Don't send deck to player
    del gs['deck']

    return gs


def draw_cards(player_id):
    deck = game_state['deck']
    hand = game_state['hands'][player_id]

    if hand:
        num_cards = 2
    else:
        num_cards = 5

    # TODO handle rerack from discard pile
    assert len(deck) >= num_cards, 'Exhausted deck'

    drawn_cards, game_state['deck'] = deck[:num_cards], deck[num_cards:]
    game_state['hands'][player_id].extend(drawn_cards)


@socketio.on('register')
def handle_register(player_id):
    sids_to_players[request.sid] = player_id
    print(f'register player{player_id} from sid: {request.sid}')
    socketio.emit('server_state_update',
                  game_state_for_player(player_id),
                  room=request.sid)


@socketio.on('disconnect')
def handle_disconnect():
    sids_to_players.pop(request.sid, None)
    socketio.emit('deregister', request.sid, broadcast=True)
    print(f'deregister from sid: {request.sid}')


@socketio.on('draw')
def handle_draw():
    player_id = sids_to_players[request.sid]
    draw_cards(player_id)
    print(f'draw cards from player{player_id}')
    socketio.emit('server_state_update',
                  game_state_for_player(player_id),
                  room=request.sid)


if __name__ == '__main__':
    init_game_state(2)
    socketio.run(app, host='0.0.0.0')
