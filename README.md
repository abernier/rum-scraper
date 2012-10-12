## INSTALL

Requirements:

 - http://nodejs.org/download/
 - http://casperjs.org/installation.html

```
npm install
```

## Synopsis

### Seeder

```sh
./seed.js --help
```

### Consolidator

```sh
./consolidate.js --help
```

## Heroku

```sh
heroku create -b https://github.com/abernier/heroku-buildpack-nodejs.git
git push heroku master
```

### Seeder

```sh
heroku config:add AUM_USERNAME=john@example.org AUM_PASSWORD=XXXXXX
heroku ps:scale seeder=1
```

### Consolidator

```sh
heroku ps:scale consolidator=1
```