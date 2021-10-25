// folders I need to create:
// app, config, public, views

//app folder: models folder, routes.js
//config folder: database.js, passport.js
//public folder: .css, main.js
//views folder: .ejs files

// =============================================================================
//server.js set up:
// =============================================================================
    //require all tools I need:
    "bcrypt"
    "bcrypt-nodejs"
    "body-parser"
    "connect-flash"
    "cookie-parser"
    "ejs"
    "express"
    "express-session"
    "lodash"
    "method-override"
    "mongodb"
    "mongoose":
    "morgan"
    "mpath"
    "passport"
    "passport-facebook"
    "passport-google-oauth": 
    "passport-local":
    "passport-twitter"

    //require database.js
        //configDB = require('./config/database')

    // connect to our database
    mongoose.connect(configDB.url, (err, database) => {
  	if (err) return console.log(err)
  	db = database
  	require('./app/routes.js')(app, passport, db);
	}); 

    require('./config/passport')(passport) (passport for configuration)

    // set up our express application
        app.use(morgan('dev')); // log every request to the console
        app.use(cookieParser()); // read cookies (needed for auth)
        app.use(bodyParser.json()); // get information from html forms
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(express.static('public'))

    //app.set('view engine', 'ejs'); // set up ejs for templating

    //passport app.use:
    //required for passport
        //app.use(session({
            secret: 'rcbootcamp2021b', // session secret
            resave: true,
             aveUninitialized: true
        }));
        app.use(passport.initialize());
        app.use(passport.session()); // persistent login sessions
        app.use(flash()); // use connect-flash for flash messages stored in session
    //launching server:
        //app.listen(port)
        //console.log something 

// =============================================================================
//routes.js set up:
// =============================================================================
    //you need to module.exports a function with (app, passport, db)
    
    // the crud magic happens GET-POST-PUT-DELETE

    //Login locally
        // login form:
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form:
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP ========================
        // show the signup form:
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form:
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // UNLINK ACCOUNTS ===============
        // used to unlink accounts. for social accounts, just remove the token
        // for local account, remove email and password
        // user account will stay active in case they want to reconnect in the future

            // local -----------------------------------
            app.get('/unlink/local', isLoggedIn, function(req, res) {
                var user            = req.user;
                user.local.email    = undefined;
                user.local.password = undefined;
                user.save(function(err) {
                    res.redirect('/profile');
                });
            });
    //outside the module.exports function:
        // route middleware to ensure user is logged in
        function isLoggedIn(req, res, next) {
            if (req.isAuthenticated())
                return next();
            res.redirect('/');
        }

// =============================================================================
//config set up:
// =============================================================================
    //database.js
        //module.exports = {
            'url' : 'mongodb+srv://demo:demo@cluster0.q2ojb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', 
            'dbName': 'demo'
        }
    //passport.js
        // load all the things we need
            const LocalStrategy   = require('passport-local').Strategy;
        // load up the user model
            const User = require('../app/models/user');
        
        // expose this function to our app using module.exports
            module.exports = function(passport) {

                // =========================================================================
                // passport session setup ==================================================
                // =========================================================================
                // required for persistent login sessions
                // passport needs ability to serialize and unserialize users out of session

                // used to serialize the user for the session
                passport.serializeUser(function(user, done) {
                    done(null, user.id);
                });

                // used to deserialize the user
                passport.deserializeUser(function(id, done) {
                    User.findById(id, function(err, user) {
                        done(err, user);
                    });
                });

                // =========================================================================
                // LOCAL SIGNUP ============================================================
                // =========================================================================
                // we are using named strategies since we have one for login and one for signup
                // by default, if there was no name, it would just be called 'local'

                passport.use('local-signup', new LocalStrategy({
                    // by default, local strategy uses username and password, we will override with email
                    usernameField : 'email',
                    passwordField : 'password',
                    passReqToCallback : true // allows us to pass back the entire request to the callback
                },
                function(req, email, password, done) {

                    // find a user whose email is the same as the forms email
                    // we are checking to see if the user trying to login already exists
                    User.findOne({ 'local.email' :  email }, function(err, user) {
                        // if there are any errors, return the error
                        if (err)
                            return done(err);

                        // check to see if theres already a user with that email
                        if (user) {
                            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                        } else {

                            // if there is no user with that email
                            // create the user
                            var newUser            = new User();

                            // set the user's local credentials
                            newUser.local.email    = email;
                            newUser.local.password = newUser.generateHash(password); // use the generateHash function in our user model

                            // save the user
                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, newUser);
                            });
                        }

                    });

                }));

                // =========================================================================
                // LOCAL LOGIN =============================================================
                // =========================================================================
                // we are using named strategies since we have one for login and one for signup
                // by default, if there was no name, it would just be called 'local'

                passport.use('local-login', new LocalStrategy({
                    // by default, local strategy uses username and password, we will override with email
                    usernameField : 'email',
                    passwordField : 'password',
                    passReqToCallback : true // allows us to pass back the entire request to the callback
                },
                function(req, email, password, done) { // callback with email and password from our form

                    // find a user whose email is the same as the forms email
                    // we are checking to see if the user trying to login already exists
                    User.findOne({ 'local.email' :  email }, function(err, user) {
                        // if there are any errors, return the error before anything else
                        if (err)
                            return done(err);

                        // if no user is found, return the message
                        if (!user)
                            return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

                        // if the user is found but the password is wrong
                        if (!user.validPassword(password))
                            return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                        // all is well, return successful user
                        return done(null, user);
                    });

                }));

            };


// =============================================================================
//models set up:
// =============================================================================
    //require the things we need:
        //mongoose and bcrypt-nodejs
    
    //define the schema for our user model:
        //const userSchema = mongoose.Schema({
                local            : {
                    email        : String,
                    password     : String
                },
                facebook         : {
                    id           : String,
                    token        : String,
                    name         : String,
                    email        : String
                },
                twitter          : {
                    id           : String,
                    token        : String,
                    displayName  : String,
                    username     : String
                },
                google           : {
                    id           : String,
                    token        : String,
                    email        : String,
                    name         : String
                }
            });
    
    // generating a hash:
    userSchema.methods.generateHash = function(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };

    // checking if password is valid:
    userSchema.methods.validPassword = function(password) {
        return bcrypt.compareSync(password, this.local.password);
    };

    // create the model for users and expose it to our app:
    module.exports = mongoose.model('User', userSchema);