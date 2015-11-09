var util = require('util');
var validUrl = require('valid-url');
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

    var boardPromise = agent
      .get('https://api.trello.com/1/boards/' + request.session.boardId)
      .query('fields=name&key=' + key + '&token=' + request.session.accessToken)
      .then( (response1) => {

        return response1.body;

      });

    var cardsPromise = agent
      .get('https://api.trello.com/1/boards/' + request.session.boardId + '/cards')
      .query('fields=name,due,labels,desc&key=' + key + '&token=' + request.session.accessToken)
      .then( (response1) => {

        var cards = response1.body;
        return cards.filter( (card) => { return card.due !== null; });

      });

    Promise
      .all([ boardPromise, cardsPromise ])
      .then(
        (values) => {

          var board = values[0];
          var cards = values[1];

          // Add a root 'done' property to the card, based on whether the card has a label of 'Done'
          cards = cards.map( (card) => {

            if (card.labels.some( (label) => {
              return label.name === 'Done';
            })) {

              card.done = true;

            } else {

              card.done = false;

            }

            return card;

          });

          // Translate the card description into an activityUrl if all the description contains is a url
          cards = cards.map( (card) => {

            if (validUrl.isUri(card.desc)) {

              card.activityUrl = card.desc;
              delete card.desc;

            }

            return card;

          });

          // Sort cards, putting the done cards at the end of the list
          cards = cards.sort( (card) => { if (card.done) return 1; else return 0; });

          response.render('home.hbs', { board: board, cards: cards });

        },
        (error) => {

          console.log(error); throw error;

        }
      );
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

      response.send('Hello Cards: ' + cardNames.join());

    })
    .catch ( (error) => {

      console.log(error);
      throw error;

    });

};

var cardDone = (request, response) => {

  var cardId = request.params.id;

  var labelPromise = agent
    .post('https://api.trello.com/1/cards/' + cardId + '/labels')
    .query('key=' + key + '&token=' + request.session.accessToken)
    .send({ name: 'Done', color: 'black' })
    .end();

  var bottomPromise = agent
    .put('https://api.trello.com/1/cards/' + cardId + '/pos')
    .query('key=' + key + '&token=' + request.session.accessToken)
    .send({ value: 'bottom' })
    .end();

  Promise
    .all([ labelPromise, bottomPromise ])
    .then( () => {

      console.log('Done');
      response.redirect('/');

    })
    .catch( (error) => {

      console.log(error);
      throw error;

    });

};

router.get('/', home);
router.get('/cards', cards);
router.get('/cardDone/:id', cardDone);

export default router;
