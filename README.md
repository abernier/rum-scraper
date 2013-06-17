[![Build Status](https://travis-ci.org/oiim/rum-scraper.png?branch=master)](https://travis-ci.org/oiim/rum-scraper)

## INSTALL

Requirements:

 - http://nodejs.org/download/
 - http://casperjs.org/installation.html

```
npm install
```

## Synopsis

```sh
rum-scrap --help
```

## Heroku

Review that with the Procfile too!

```sh
heroku create -b https://github.com/abernier/heroku-buildpack-nodejs.git
git push heroku master
```

```sh
heroku config:add AUM_USERNAME=john@example.org AUM_PASSWORD=XXXXXX
heroku ps:scale seeder=1
```
