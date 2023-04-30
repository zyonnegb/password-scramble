module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        db.collection('passwords').find().toArray((err, result) => { //displays data on page
          // console.log(result)
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            passwords: result
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout(() => {
          console.log('User has logged out!')
        });
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/messages', (req, res) => {
      //console.log(req.body.password) // console logs password 
       //console.log(scrambled)

       db.collection('passwords').save({password: req.body.password, passwordPassword: req.body.password}, (err, result) => { //saved data to database
       if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })





      app.put('/messages', (req, res) => {
        console.log(req.body.name)
        
        function getScrambledPassword(pwd) {
          var cipher = ['k', 's', 'z', 'h', 'x', 'b', 'p', 'j', 'v', 'c', 'g', 'f', 'q', 'n', 't', 'm', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
          var result="";
          if (pwd == null)
              pwd = "";
          pwd = encodeURIComponent(pwd);
          //alert("encoded password: " + pwd);
          for(var i=0;i<pwd.length;i++) {
                  var cc = pwd.charCodeAt(i);
              result += cipher[Math.floor(cc/16)] + cipher[cc%16];
          }
         // alert("scrambled password: " + result);
          return result;
        }
        let hashed = getScrambledPassword(req.body.name)

        db.collection('passwords')
        .findOneAndUpdate({password: req.body.name}, 
          {
          $set: {
            password: hashed
          }
        }, {
          sort: {_id: -1},
          upsert: true
        }, (err, result) => {
          if (err) return res.send(err)
          res.send(result)
        })
      })

      app.put('/messages/unscramble', (req, res) => {
        console.log(req.body.name)
        
        // function getScrambledPassword(pwd) {
        //   var cipher = ['k', 's', 'z', 'h', 'x', 'b', 'p', 'j', 'v', 'c', 'g', 'f', 'q', 'n', 't', 'm'];
        //   var result="";
        //   if (pwd == null)
        //       pwd = "";
        //   pwd = encodeURIComponent(pwd);
        //   //alert("encoded password: " + pwd);
        //   for(var i=0;i<pwd.length;i++) {
        //           var cc = pwd.charCodeAt(i);
        //       result += cipher[Math.floor(cc/16)] + cipher[cc%16];
        //   }
        //  // alert("scrambled password: " + result);
        //   return result;
        // }
        // let hashed = getScrambledPassword(req.body.name)

        // db.collection('passwords')
        // .findOneAndUpdate({password: req.body.name}, 
        //   {
        //   $set: {
        //     password: 'hi'
        //   }
        // }, 
        // {
        //   sort: {_id: -1},
        //   upsert: true
        // }, (err, result) => {
        //   if (err) return res.send(err)
        //   res.send(result)
        // })
      })


    app.delete('/messages', (req, res) => {
      db.collection('passwords').findOneAndDelete({password: req.body.name}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
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

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
