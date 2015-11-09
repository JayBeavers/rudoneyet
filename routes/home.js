var util = require('util');
var router = require('express').Router();

var agent = require('superagent-promise')(require('superagent'), Promise);

var key = process.env.TRELLO_KEY;

var home = (request, response) => {

  if (!request.session.accessToken) {
    response.redirect('/login');
    return;
  }

  if (!request.session.boardId) {

    console.log('finding board id');

    agent
      .get('https://api.trello.com/1/members/me/boards')
      .query('fields=name&key=' + key + '&token=' + request.session.accessToken)
      .then( (response1) => {

        var boards = response1.body;
        var boardNames = boards.map( (board) => { return board.name; });
        var index = boardNames.indexOf('Amalia\'s Test Board');

        request.session.boardId = boards[index].id;
        response.render('home.hbs', boards[index]);

      })
      .catch ( (error) => {

        console.log(error);
        throw error;

      });

  } else {

    agent
      .get('https://api.trello.com/1/boards/' + request.session.boardId)
      .query('fields=name&key=' + key + '&token=' + request.session.accessToken)
      .then( (response1) => {

        var board = response1.body;
        response.render('home.hbs', board);

      })
      .catch ( (error) => {

        console.log(error);
        throw error;

      });

  }

};

var cards = (request, response) => {

  if (!request.session.accessToken) {
    response.redirect('/login');
    return;
  }

  agent
    .get('https://api.trello.com/1/boards/' + request.session.boardId + '/cards')
    .query('fields=name,due,labels&key=' + key + '&token=' + request.session.accessToken)
    .then( (response1) => {

      var cards = response1.body;
      cards = cards.filter( (card) => { return card.due !== null; });
      var cardNames = cards.map( (card) => { return card.name; });

      /*
      agent
        .post('https://api.trello.com/1/cards/' + cards[1].id + '/labels')
        .query('fields=name,due,labels&key=' + key + '&token=' + request.session.accessToken)
        .send({ name: 'Done', color: 'blue' })
        .end()
        .then( () => {
          console.log('done!');
        })
        .catch( (error) => {
          console.log(error);
        });
      */

      response.send('Hello Cards: ' + cardNames.join());

    })
    .catch ( (error) => {

      console.log(error);
      throw error;

    });

};

router.get('/', home);
router.get('/cards', cards);

export default router;
