var router = require('express').Router();

var key = process.env.TRELLO_KEY;
var secret = process.env.TRELLO_SECRET;

var appName = 'RUDoneYet';

var OAuth = (require("oauth")).OAuth;
var requestUrl = "https://trello.com/1/OAuthGetRequestToken";
var accessUrl = "https://trello.com/1/OAuthGetAccessToken";
var authorizeUrl = "https://trello.com/1/OAuthAuthorizeToken";

var loginCallback = 'http://localhost:3000/callback';

var oauth = new OAuth(requestUrl, accessUrl, key, secret, "1.0", loginCallback, "HMAC-SHA1");

var login = (request, response) => {

  oauth.getOAuthRequestToken(function (error, token, tokenSecret, results) {

    if (error) {
      response.status(500).send(error);
      return;
    }

    request.session.requestTokenSecret = tokenSecret;

    response.redirect(authorizeUrl + "?oauth_token=" + token + "&scope=read,write&name=" + appName);

  });

};

var callback = (request, response) => {

  var requestToken = request.query.oauth_token;
  var verifier = request.query.oauth_verifier;

  oauth.getOAuthAccessToken(requestToken, request.session.requestTokenSecret, verifier, function (error, accessToken, accessTokenSecret, results) {

    if (error) {
      response.status(500).send(error);
      return;
    }

    request.session.requestToken = requestToken;
    request.session.accessToken = accessToken;
    request.session.accessTokenSecret = accessTokenSecret;

    response.redirect('/');

  });

};

router.get('/callback', callback);

router.get('/login', login);

export default router;
