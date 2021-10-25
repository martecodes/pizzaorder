var express = require('express')
var mongoose = require('mongoose')
var MongoClient = require('mongodb').MongoClient
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')
var morgan = require('morgan')
var flash = require('connect-flash')
var passport = require('passport')

var app = express()
var port = process.env.PORT || 8000

var configDB = require('./config/database.js')

var db;

mongoose.connect(configDB.url, (err, database) => {
    if(err) console.log(err)
    db = database
    require('./app/routes.js')(app, passport, db)
}) // connect to our database

require('./config/passport')(passport) //pass passport for configutaion

// set up our express application
// app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))

app.set('view engine', 'ejs'); // set up ejs for templating

app.use(session({
    secret: 'gglobby', // session secret
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.listen(port)
console.log(`connected to level: ${port}`);
