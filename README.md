## INSTALL

Requirements:

 - http://nodejs.org/download/
 - http://casperjs.org/installation.html

```
npm install
```

## Synopsis

```sh
./index.js --help
```

Run forever with: `while true; do ./index.js -u john@example.org -p XXXXXX; done`

## Misc

Default database is here: https://abernier.iriscouch.com:6984/_utils/database.html?aum/_all_docs

## Heroku

```sh
heroku create -b https://github.com/abernier/heroku-buildpack-nodejs.git
git push heroku master
heroku config:add AUM_USERNAME=antoine.bernier@gmail.com AUM_PASSWORD=292901
heroku ps:scale scraper=1
```