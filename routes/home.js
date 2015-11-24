var util = require('util');
var moment = require('moment');
var _ = require('underscore');
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

    choose(request, response);

  } else {

    console.log('loading home');

    loadHome(request, response, moment());

  }
};

var homeWithDay = (request, response) => {

  var day = request.params.day;

  if (!request.session.accessToken) {
    response.redirect('/login');
    return;
  }

  if (!request.session.boardId) {

    choose(request, response);

  } else {

    console.log('loading home');

    loadHome(request, response, moment(day));

  }
};

var loadHome = (request, response, day) => {

  var boardPromise = agent
    .get('https://api.trello.com/1/boards/' + request.session.boardId)
    .query('fields=name&key=' + key + '&token=' + request.session.accessToken)
    .then( (response1) => {

      return response1.body;

    });

  var cardsPromise = agent
    .get('https://api.trello.com/1/boards/' + request.session.boardId + '/cards')
    .query('fields=name,due,labels,desc,url,idList&key=' + key + '&token=' + request.session.accessToken)
    .then( (response1) => {

      var cards = response1.body;

      // Filter out cards which do not have the matching due date for today
      cards = cards.filter( (card) => {

        if (!card.due) {
          return false;
        }

        return moment(card.due).isSame(day, 'day');

      });

      return cards;

    });

  var listsPromise = agent
    .get('https://api.trello.com/1/boards/' + request.session.boardId + '/lists')
    .query('fields=name&key=' + key + '&token=' + request.session.accessToken)
    .then( (response1) => {

      var lists = response1.body;

      return lists;

    });

  Promise
    .all([ boardPromise, cardsPromise, listsPromise ])
    .then(
      (values) => {

        var board = values[0];
        var cards = values[1];
        var lists = values[2];

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

          var lines = card.desc.split('\n');

          // Find the first valid url in the description and turn that into the activity url
          card.activityUrl = _.find(lines, (line) => { return validUrl.isUri(line); });

          // Remove the activity url from the remaining description lines
          lines = _.without(lines, card.activityUrl);

          // Substitute the array of separated lines for the original description string
          card.description = lines;
          delete card.desc;

          return card;

        });

        // turn cards idList into list names
        cards = cards.map( (card) => {

          var list = _.find(lists, (_) => { return _.id === card.idList; });

          card.list = list.name;

          return card;

        });

        // Sort cards, putting the done cards at the end of the list
        cards = cards.sort( (card) => { if (card.done) return 1; else return 0; });

        response.render('home.hbs', {
          board: board,
          cards: cards,
          today: day.format('YYYY-MM-DD'),
          previousDay: day.subtract(1, 'days').format('YYYY-MM-DD'),
          nextDay: day.add(2, 'days').format('YYYY-MM-DD')
        });

      },
      (error) => {

        if (error.message == 'Unauthorized') {

          response.redirect('/login');

        } else {

          console.log(error.message);
          throw error;

        }
      }
    );

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

var chooseBoard = (request, response) => {

  var boardId = request.params.id;
  request.session.boardId = boardId;

  response.redirect('/');

};

var choose = (request, response) => {

  console.log('choosing board');

  agent
    .get('https://api.trello.com/1/members/me/boards')
    .query('fields=name&key=' + key + '&token=' + request.session.accessToken)
    .then( (response1) => {

      var boards = response1.body;
      response.render('chooseBoard.hbs', { boards: boards });

    })
    .catch ( (error) => {

      console.log(error);
      throw error;

    });

};

router.get('/', home);
router.get('/cards', cards);
router.get('/cardDone/:id', cardDone);
router.get('/choose', choose);
router.get('/chooseBoard/:id', chooseBoard);
router.get('/day/:day', homeWithDay);

export default router;
