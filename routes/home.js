var router = require('express').Router();

var trello = require('trello-yello');

var key = process.env.TRELLO_KEY;

var home = (request, response) => {

  if (!request.session.accessToken) {
    response.redirect('/login');
    return;
  }

  var t = trello({ key: key, token: request.session.accessToken });

  t.getCurrentUser().getBoards().then( (boards) => {

    return Promise.all(boards.map( (board) => { return board.getName(); }));

  }).then( (boardNames) => {

    response.send('Hello Trello: ' + boardNames.join());

  }).catch( (error) => {

    response.status(500).send(error);

  });

};

router.get('/', home);

export default router;
