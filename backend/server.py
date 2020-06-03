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


def broadcast_state_to_players():
    for sid, player_id in sids_to_players.items():
        socketio.emit('server_state_update',
                      game_state_for_player(player_id),
                      room=sid)


def read_game_json():
    with open('../src/cards.json', 'r') as f:
        return load(f)


def _clone_with_id(d, n):
    return dict(d, **{'id': f'{d["id"]}_{n}'})


def _calc_set_id(set_):
    return min(c['id'] for c in set_['members'])


def create_set_from_card(card):
    set_id = card['id']
    return {
        'id': set_id,
        'sets': card['sets'][0],
        'members': [card],
        'enhancers': [],
        'charges': card['charges']
    }


def init_game_state(num_players):
    global game_state
    game_json = read_game_json()

    sets = game_json['sets']
    cards = game_json['cards']

    deck = []
    for s in sets:
        c = dict(s, **{'type': 'member', 'sets': [s['id']]})
        for n in range(len(s['charges'])):
            deck.append(_clone_with_id(c, n))

    for c in cards:
        count = c.pop('count', 1)
        for n in range(count):
            deck.append(_clone_with_id(c, n))

    shuffle(deck)

    boards = {n: {'sets': [], 'store': []} for n in range(num_players)}
    hands = {n: [deck.pop() for _ in range(5)] for n in range(num_players)}

    game_state = {
        'sets': sets,
        'boards': boards,
        'hands': hands,
        'deck': deck,
        'discard': []
    }


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


def remove_card_from_hand(player_id, card_id):
    hand = game_state['hands'][player_id]
    cards = [c for c in hand if c['id'] == card_id]
    assert cards, 'Card not in hand'
    card, = cards
    hand.remove(card)
    return card


def play_card(player_id, card_id):
    card = remove_card_from_hand(player_id, card_id)
    game_state['discard'].append(card)


def place_card(player_id, card_id, set_id):
    sets = game_state['boards'][player_id]['sets']
    hand = game_state['hands'][player_id]
    for loc in sets + [hand]:
        # FIXME this is gross. Works out if we're dealing with set or hand
        if isinstance(loc, dict):
            is_set = True
            l_ = loc['members']
        else:
            is_set = False
            l_ = loc
        cards = [c for c in l_ if c['id'] == card_id]
        if cards:
            card, = cards
            l_.remove(card)
            if is_set:
                loc['id'] = _calc_set_id(loc)
            break
    else:
        assert False, 'Card was not found in any location'

    if set_id is None:
        sets.append(create_set_from_card(card))
    else:
        set_ = [s for s in sets if s['id'] == set_id]


def store_card(player_id, card_id):
    card = remove_card_from_hand(player_id, card_id)
    game_state['boards'][player_id]['store'].append(card)


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


@socketio.on('play')
def handle_play(card_id):
    player_id = sids_to_players[request.sid]
    play_card(player_id, card_id)
    print(f'play card {card_id} from player{player_id}')
    broadcast_state_to_players()


@socketio.on('place')
def handle_place(card_id, set_id):
    player_id = sids_to_players[request.sid]
    place_card(player_id, card_id, set_id)
    print(f'place card {card_id} from player{player_id}')
    broadcast_state_to_players()


@socketio.on('store')
def handle_store(card_id):
    player_id = sids_to_players[request.sid]
    store_card(player_id, card_id)
    print(f'store card {card_id} from player{player_id}')
    broadcast_state_to_players()


if __name__ == '__main__':
    init_game_state(2)
    socketio.run(app, host='0.0.0.0')
