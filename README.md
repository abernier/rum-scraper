[![Build Status](https://travis-ci.org/oiim/rum-scraper.png?branch=master)](https://travis-ci.org/oiim/rum-scraper)

## INSTALL

Requirements:

 - http://nodejs.org/download/
 - http://casperjs.org/installation.html

```
npm install
```

Edit your `.rumrc` configuration file: see [rum-conf](https://github.com/oiim/rum-conf#readme)

## Synopsis

```sh
./bin/index.js --help
```

## Heroku

Review that with the Procfile too!

```sh
heroku create -b https://github.com/abernier/heroku-buildpack-nodejs.git
git push heroku master
```

```sh
heroku config:add RUM_AUM_USERNAME=john@example.org RUM_AUM_PASSWORD=XXXXXX
heroku ps:scale seeder=1
```
