# Monopoly Deal Clone

[Monopoly Deal](https://en.wikipedia.org/wiki/Monopoly_Deal) is an excellent game but hard to play over the internet and lacking in birds.

![Demo video](images/magpie.gif?raw=true)

## Playing
The full Monopoly Deal rules are [here](http://monopolydealrules.com/). All cards are 200% more bird themed.

Currently there is no player selector interface/auth, just append a `p` query param from 0-3, e.g.:

http://localhost:3000?p=0

### Setup
```
# Install FE/BE
npm install;
pushd backend; pipenv install; popd;

# Initialise backend with player names (between 2 and 4)
pushd backend;
pipenv run python server.py init Alice Bob Charlie Danny;
popd;

# Run these in separate terminals and navigate to http://localhost:3000?p=0
bin/fe-watch
bin/be-serve
```

## Tech
React/Redux frontend using socket.io for comms.

Flask backend using immutable data structures and hand-rolled atomic state changes for speedier debugging and development.

Plays best on [IPoAC](https://tools.ietf.org/html/rfc1149) connections.

