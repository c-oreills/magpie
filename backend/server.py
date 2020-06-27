from functools import wraps
from json import load
import pickle
from random import shuffle
import sys
from threading import Lock

from flask import Flask, render_template, request
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
app.config['DEBUG'] = True

# Enables all crossorigin domains by default
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

game_lock = Lock()
sids_to_players = {}
game_state = None

GAME_STATE_FILE = 'game_state.pickle'


def dump_game_state():
    with open(GAME_STATE_FILE, 'wb') as f:
        pickle.dump(game_state, f)


def load_game_state():
    with open(GAME_STATE_FILE, 'rb') as f:
        return pickle.load(f)


def send_alert_to_user(alert):
    socketio.emit('alert', alert, room=request.sid)


class UserVisibleError(Exception):
    def __init__(self, msg):
        self.msg = msg


def atomic_state_change(fn):
    @wraps(fn)
    def inner(*a, **k):
        global game_state
        with game_lock:
            try:
                ret = fn(*a, **k)
            except Exception as e:
                # Refresh game state from disk so it's not corrupted
                game_state = load_game_state()
                if isinstance(e, UserVisibleError):
                    send_alert_to_user(e.msg)
                raise
            else:
                dump_game_state()
                return ret

    return inner


def only_on_turn(fn):
    @wraps(fn)
    def inner(player_id, *a, **k):
        if game_state['playerTurn'] != player_id:
            raise UserVisibleError('Tried to perform action out of turn')
        return fn(player_id, *a, **k)

    return inner


def broadcast_state_to_players():
    # Explicitly listifying stops concurrency errors where dict changes size
    # during iteration
    for sid, player_id in list(sids_to_players.items()):
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


def _is_superwild(card):
    return len(card['sets']) > 2


def _is_enhancer(card):
    return card['type'] in ['enhance_primary', 'enhance_secondary']


def _create_set_from_card(card):
    if _is_superwild(card):
        raise UserVisibleError('Cannot create sets from superwildcards')
    set_id = card['id']
    return {
        'id': set_id,
        'set': card['sets'][0],
        'members': [card],
        'enhancers': [],
        'charges': card['charges']
    }


def init_game_state(players):
    global game_state
    game_json = read_game_json()

    sets = game_json['sets']
    cards = game_json['cards']

    deck = []
    for s in sets:
        c = dict(s, **{'type': 'member', 'sets': [s['id']]})
        for n, name in enumerate(s['names']):
            card = _clone_with_id(c, n)
            card['name'] = name
            deck.append(card)

    for c in cards:
        count = c.pop('count', 1)
        for n in range(count):
            card = _clone_with_id(c, n)
            if card['type'] == 'wild':
                card['name'] = 'Wild'
                # Copy list so it's editable independantly
                card['sets'] = list(card['sets'])
                if len(card['sets']) == 2:
                    first_set, = [s for s in sets if s['id'] == card['sets'][0]]
                    alt_set, = [s for s in sets if s['id'] == card['sets'][1]]
                    card['charges'] = first_set['charges']
                    card['altCharges'] = alt_set['charges']
            elif card['type'] == 'charge':
                card['name'] = 'Feed'
            elif card['type'] == 'energy':
                card['name'] = 'Seeds'
            deck.append(card)

    shuffle(deck)

    boards = {n: {'sets': [], 'store': []} for n in range(len(players))}
    hands = {n: [deck.pop() for _ in range(5)] for n in range(len(players))}

    game_state = {
        'sets': sets,
        'players': players,
        'playerTurn': 0,
        'boards': boards,
        'hands': hands,
        'deck': deck,
        'discard': [],
        'log': []
    }


def game_state_for_player(player_id):
    gs = dict(game_state)

    # Don't send other hands to player
    hands = gs.pop('hands')
    if player_id is not None:
        gs['hand'] = hands[player_id]
    else:
        gs['hand'] = []

    # Don't send deck to player
    del gs['deck']

    return gs


def _find_card_loc(player_id, card_id):
    sets = game_state['boards'][player_id]['sets']
    hand = game_state['hands'][player_id]
    store = game_state['boards'][player_id]['store']

    def _check_card_in_list(l):
        cards = [c for c in l if c['id'] == card_id]
        if cards:
            card, = cards
            return card

    for s in sets:
        for l in (s['members'], s['enhancers']):
            card = _check_card_in_list(l)
            if card:
                return ('set', s, card)

    card = _check_card_in_list(hand)
    if card:
        return ('hand', hand, card)

    card = _check_card_in_list(store)
    if card:
        return ('store', store, card)

    assert False, 'Card was not found in any location'


def _remove_card_from_loc(player_id, loc_type, loc, card):
    if loc_type != 'set':
        loc.remove(card)
        return

    if _is_enhancer(card):
        loc['enhancers'].remove(card)
        return

    loc['members'].remove(card)
    if loc['members']:
        loc['id'] = _calc_set_id(loc)
    else:
        if loc['enhancers']:
            raise UserVisibleError('Must remove enhancers first')
        # Delete set
        game_state['boards'][player_id]['sets'].remove(loc)


def _redeal_discard_pile(player_id):
    assert not game_state['deck'], 'Deck must be empty'

    shuffle(game_state['discard'])
    game_state['deck'].extend(game_state['discard'])
    game_state['discard'].clear()

    _log(player_id, 'redeal')


def _get_player_name(player_id):
    return game_state['players'][player_id]


def _log(player_id, action, *args):
    game_state['log'].append((player_id, action, *args))


@atomic_state_change
@only_on_turn
def draw_cards(player_id):
    deck = game_state['deck']
    hand = game_state['hands'][player_id]
    num_cards = 2 if hand else 5

    for _ in range(num_cards):
        if not deck:
            _redeal_discard_pile(player_id)
        hand.append(deck.pop())

    _log(player_id, 'draw', num_cards)


@atomic_state_change
@only_on_turn
def end_turn(player_id):
    hand = game_state['hands'][player_id]
    if len(hand) > 7:
        raise UserVisibleError('Discard hand down to 7 cards')

    game_state['playerTurn'] += 1
    game_state['playerTurn'] %= len(game_state['players'])

    _log(player_id, 'end_turn', game_state['playerTurn'])


def _flip_card(card, error_on_superwild=True):
    if _is_superwild(card):
        if error_on_superwild:
            assert False, 'Cannot flip superwildcards'
        else:
            return

    card['charges'], card['altCharges'] = card['altCharges'], card['charges']
    card['sets'].reverse()


@atomic_state_change
def flip_card(player_id, card_id):
    loc_type, loc, card = _find_card_loc(player_id, card_id)

    if loc_type == 'set':
        assert len(loc['members']
                   ) == 1, 'Cannot flip wildcards with other cards in set'
        loc['charges'] = card['altCharges']
        loc['set'] = card['sets'][1]

    _flip_card(card)


@atomic_state_change
def play_card(player_id, card_id):
    loc_type, loc, card = _find_card_loc(player_id, card_id)
    if game_state['playerTurn'] != player_id and card['type'] != 'negate':
        raise UserVisibleError("Can't play that card on someone else's turn")
    assert loc_type == 'hand', "Card not in hand"
    _remove_card_from_loc(player_id, loc_type, loc, card)
    game_state['discard'].append(card)

    _log(player_id, 'play', card)


@atomic_state_change
@only_on_turn
def place_card(player_id, card_id, set_id):
    loc_type, loc, card = _find_card_loc(player_id, card_id)
    assert loc_type != 'store', "Can't place card from store"
    _remove_card_from_loc(player_id, loc_type, loc, card)

    sets = game_state['boards'][player_id]['sets']
    if set_id is None:
        sets.append(_create_set_from_card(card))
    else:
        set_, = [s for s in sets if s['id'] == set_id]

        if card['type'] == 'wild' and card['sets'][0] != set_['set']:
            _flip_card(card, error_on_superwild=False)

        if _is_enhancer(card):
            set_['enhancers'].append(card)
        else:
            set_['members'].append(card)

    # Don't log moves around board
    if loc_type != 'set':
        _log(player_id, 'place', card)


@atomic_state_change
@only_on_turn
def store_card(player_id, card_id):
    loc_type, loc, card = _find_card_loc(player_id, card_id)
    _remove_card_from_loc(player_id, loc_type, loc, card)
    game_state['boards'][player_id]['store'].append(card)

    _log(player_id, 'store', card)


@atomic_state_change
def give_card(player_id, card_id, to_player_id):
    loc_type, loc, card = _find_card_loc(player_id, card_id)

    assert loc_type != 'hand', 'Cannot give card from hand'

    _remove_card_from_loc(player_id, loc_type, loc, card)

    to_player_board = game_state['boards'][to_player_id]
    # Enhancers should go straight to other players' store when not giving as part of a set
    if loc_type == 'store' or _is_enhancer(card):
        to_player_board['store'].append(card)
    else:
        to_player_board['sets'].append(_create_set_from_card(card))

    _log(player_id, 'give_card', card, to_player_id)


@atomic_state_change
def give_card_set(player_id, card_id, to_player_id):
    loc_type, loc, card = _find_card_loc(player_id, card_id)

    assert loc_type != 'hand', 'Cannot give card from hand'

    from_player_board = game_state['boards'][player_id]
    from_player_board['sets'].remove(loc)

    to_player_board = game_state['boards'][to_player_id]
    to_player_board['sets'].append(loc)

    _log(player_id, 'give_set', card, to_player_id)


@atomic_state_change
def discard_card(player_id, card_id):
    loc_type, loc, card = _find_card_loc(player_id, card_id)

    assert loc_type == 'hand', 'Can only discard from hand'

    _remove_card_from_loc(player_id, loc_type, loc, card)

    _log(player_id, 'discard', card)


@atomic_state_change
def restart_game(player_id):
    if player_id != 0:
        raise UserVisibleError("Only first player can restart game")
    init_game_state(game_state['players'])


@socketio.on('connect')
def handle_connect():
    socketio.emit('server_state_update',
                  game_state_for_player(None),
                  room=request.sid)


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
    socketio.emit('server_state_update',
                  game_state_for_player(player_id),
                  room=request.sid)


@socketio.on('end')
def handle_end():
    player_id = sids_to_players[request.sid]
    end_turn(player_id)
    broadcast_state_to_players()


@socketio.on('flip')
def handle_flip(card_id):
    player_id = sids_to_players[request.sid]
    flip_card(player_id, card_id)
    broadcast_state_to_players()


@socketio.on('play')
def handle_play(card_id):
    player_id = sids_to_players[request.sid]
    play_card(player_id, card_id)
    broadcast_state_to_players()


@socketio.on('place')
def handle_place(card_id, set_id):
    player_id = sids_to_players[request.sid]
    place_card(player_id, card_id, set_id)
    broadcast_state_to_players()


@socketio.on('store')
def handle_store(card_id):
    player_id = sids_to_players[request.sid]
    store_card(player_id, card_id)
    broadcast_state_to_players()


@socketio.on('give_card')
def handle_give_card(card_id, to_player_id):
    player_id = sids_to_players[request.sid]
    give_card(player_id, card_id, to_player_id)
    broadcast_state_to_players()


@socketio.on('give_set')
def handle_give_set(card_id, to_player_id):
    player_id = sids_to_players[request.sid]
    give_card_set(player_id, card_id, to_player_id)
    broadcast_state_to_players()


@socketio.on('discard')
def handle_discard(card_id):
    player_id = sids_to_players[request.sid]
    discard_card(player_id, card_id)
    broadcast_state_to_players()


@socketio.on('restart')
def handle_restart():
    player_id = sids_to_players[request.sid]
    restart_game(player_id)
    broadcast_state_to_players()


if __name__ == '__main__':
    if sys.argv[1] == 'init':
        init_game_state(sys.argv[2:])
        dump_game_state()
    else:
        game_state = load_game_state()
        socketio.run(app, host='0.0.0.0')
