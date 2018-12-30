var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Busboy = require ('busboy');
var fs = require('fs');
var bcrypt = require('bcrypt');

var app = express();

//mysql setup 
var mysql = require('mysql');

var pool = mysql.createPool({
    host  : 'us-cdbr-iron-east-01.cleardb.net',
    user  : '',
    password: '',
    database: '',
    dateStrings: true,
    multipleStatements: true
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.set('port', port);

//global variable to denote either logged-in or logged-out state
var loggedInState = 0;

function setLoggedInState(state) {
    loggedInState = state;
}

function getLoggedInState() {
    return loggedInState;
}

function checkAnd(num_parameters) {
    if (num_parameters > 0) {
        return 1;
    }
    return 0;
}

//create all page routes

//create or reset the papers table
app.get('/reset_papers', function(req, res, next) {
    var context = {};

    pool.query("DROP TABLE IF EXISTS papers", function(err) {
        var createString = "CREATE TABLE papers(" +
        "id INT PRIMARY KEY AUTO_INCREMENT," +
        "title VARCHAR(255) NOT NULL," +
        "author_first VARCHAR(255) NOT NULL," +
        "author_last VARCHAR(255) NOT NULL," +
        "publication_date DATE NOT NULL," +
        "field VARCHAR(255) NOT NULL," +
        "link VARCHAR(255) DEFAULT NULL," +
        "approval_status VARCHAR(255) NOT NULL)";
        pool.query(createString, function(err) {
            //insert values into paper
            pool.query("INSERT INTO papers(`title`, `author_first`, `author_last`, `publication_date`, `field`, `link`, `approval_status`) VALUES \
                        ('Air Pollution Not Linked to Respiratory Disease', 'Bob', 'Smith', '2017-01-22 06:14:12', 'Health Sciences', 'files/Smith.pdf', 'approved'), \
                        ('Exercise Not Shown to Improve Weight Loss', 'Belinda', 'Knox', '2003-01-31 04:14:34', 'Health Sciences', 'files/Knox.pdf', 'approved'), \
                        ('The Effects of Drug Decriminalization on Low-Income Neighborhoods', 'Jane', 'Lee', '2014-11-12 16:14:12', 'Social Sciences', 'files/Lee.pdf', 'approved'), \
                        ('Bridge Stability in Chronic High-Wind Areas', 'Austin', 'Cross', '2018-09-02 08:58:13', 'Engineering', 'files/Cross.pdf', 'approved'), \
                        ('Womb Conditions Not Shown to Impact Bacterial Infection Response', 'Alexa', 'Patel', '2005-04-04 12:54:02', 'Life Sciences', 'files/Patel.pdf', 'approved')"
            , function(err, result) {
                if(err) {
                next(err);
                return;
                }
            })

            // render the login page
            context.results = "Table reset";
            context.loggedIn = getLoggedInState();
            res.render('login', context);
        });
    });
});

//create or reset the users table
app.get('/reset_users', function(req, res, next) {
    var context = {};
    var saltRounds = 12;
    pool.query("DROP TABLE IF EXISTS users", function(err) {
        var createString = "CREATE TABLE users(" +
        "id INT PRIMARY KEY AUTO_INCREMENT," +
        "first_name VARCHAR(255) NOT NULL," +
        "last_name VARCHAR(255) NOT NULL," +
        "email VARCHAR(255) NOT NULL," +
        "password VARCHAR(255) NOT NULL," +
        "type VARCHAR(255) NOT NULL)";
        pool.query(createString, function(err) {
            //insert values into paper
             pool.query("INSERT INTO users(`first_name`, `last_name`, `email`, `password`, `type`) VALUES \
                         ('Bob', 'Smith', 'bsmith@princeton.edu', '"+bcrypt.hashSync('bob123', saltRounds)+"', 'user'), \
                         ('Belinda', 'Knox', 'bknox@stanford.edu', '"+bcrypt.hashSync('belinda123', saltRounds)+"', 'user'), \
                         ('Jane', 'Lee', 'jlee@oregonstate.edu', '"+bcrypt.hashSync('jane123', saltRounds)+"', 'user'), \
                         ('Austin', 'Cross', 'across@msu.edu', '"+bcrypt.hashSync('austin123', saltRounds)+"', 'user'), \
                         ('Alexa', 'Patel', 'apatel@lse.edu', '"+bcrypt.hashSync('alexa123', saltRounds)+"', 'user')"
            , function(err, result) {
                if(err) {
                next(err);
                return;
                }
            })

            // render the login page
            context.results = "Table reset";
            context.loggedIn = getLoggedInState();
            res.render('login', context);
        });
    });
});

app.get('/', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('welcome', context);
});

app.get('/login', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('login', context);
});

app.post('/login_validate', function(req, res, next) {
    var context = {};

    pool.query("SELECT * FROM users WHERE email = ?",
                [req.body.email], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        
        context.results = rows;
        
        //if no results are returned, user doesn't exist, so tell client to display error
        if (context.results == undefined || context.results.length == 0) {
            context.error = true;
            context.loggedIn = getLoggedInState();
            res.render('login', context);
        } else if (context.results[0].type != req.body.type) {
            //if they're trying to log in as the wrong user type, display error
            context.typeError = true;
            context.loggedIn = getLoggedInState();
            res.render('login', context);
        }         
        else {
            //otherwise set logged in state to true and render browse page
            bcrypt.compare(req.body.password, context.results[0].password, function (err, result) {
                if (result == true) {
                    setLoggedInState(1);
                    context.loggedIn = getLoggedInState();
                    res.render('upload', context);
                } else {
                    res.send('Incorrect password');
                    res.redirect('/');
                }
            });
        }
    });
});

app.get('/sign_up', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('sign_up', context);
});

app.post('/sign_up_results', function(req, res, next) {
    var context = {};
    var saltRounds = 12;

    if (req.body.type === "administrator") {
        bcrypt.hash(req.body.pass_1, saltRounds, function (err, hash) {
            data = {
                first_name: req.body.firstName, last_name: req.body.lastName,
                email: req.body.email, password: hash, type: "administrator"
            };
            pool.query('INSERT INTO users SET ?', data, function(err, result) {
                if (err) {
                    next(err);
                    return;
                }
            });
        });
        setLoggedInState(1);
        context.loggedIn = getLoggedInState();
        res.render('sign_up_success', context);
    } else if (req.body.type === "user") {
        bcrypt.hash(req.body.pass_1, saltRounds, function (err, hash) {
            data = {first_name: req.body.firstName, last_name: req.body.lastName,
                email: req.body.email, password : hash, type : "user"};
            pool.query('INSERT INTO users SET ?', data, function(err, result) {
                if (err) {
                    next(err);
                    return;
                }
            });
        });
        setLoggedInState(1);
        context.loggedIn = getLoggedInState();
        res.render('sign_up_success_user', context);
    }
});

app.get('/search', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('search', context);
});

app.post('/search_results', function(req, res, next) {
    var context = {};

    var statement = "SELECT * FROM papers WHERE";
    var parameters = [];
    var num_parameters = 0;

    if (req.body.paperTitle) {
        statement += " title = ?";
        parameters.push(req.body.paperTitle);
        num_parameters++;
    }

    if (req.body.firstName) {
        if (checkAnd(num_parameters)) {
            statement += " AND author_first = ?";    
        } else {
            statement += " author_first = ?";
        }        
        parameters.push(req.body.firstName);
        num_parameters++;
    }

    if (req.body.lastName) {
        if (checkAnd(num_parameters)) {
            statement += " AND author_last = ?";    
        } else {
            statement += " author_last = ?";
        }        
        parameters.push(req.body.lastName);
        num_parameters++;
    }

    if (req.body.publicationYear) {
        if (checkAnd(num_parameters)) {
            statement += " AND YEAR(publication_date) = ?";    
        } else {
            statement += " YEAR(publication_date) = ?";
        }        
        parameters.push(req.body.publicationYear);
        num_parameters++;
    }
    
    if (req.body.field) {
        if (checkAnd(num_parameters)) {
            statement += " AND field = ?";    
        } else {
            statement += " field = ?";
        }        
        parameters.push(req.body.field);
        num_parameters++;
    }


    statement += " ORDER BY title asc";

    pool.query(statement, parameters, function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        //send relevant data to client
        context.loggedIn = getLoggedInState();
        context.rows = rows;
        if(context.rows.length > 0){
            res.render('search_results', context);        
        }
        else{
            res.render('no_results', context);
        }
    });
});

app.get('/browse', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('browse', context);
});

app.post('/browse_specific', function(req, res, next) {
    var context = {};

    //get relevant papers to display
    pool.query("SELECT * FROM papers WHERE field = ? ORDER BY title ASC", [req.body.field], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        //send relevant data to client
        context.loggedIn = getLoggedInState();
        context.rows = rows;
        res.render('browse_specific', context);
    });
});

app.get('/browse_all', function(req, res, next) {
    var context = {};
    
    //get relevant papers to display
    pool.query("SELECT * FROM papers WHERE approval_status = ? ORDER BY title ASC", ["approved"], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        //send relevant data to client
        context.loggedIn = getLoggedInState();
        context.rows = rows;
        res.render('browse_all', context);
    });
});

app.get('/logout', function(req, res, next) {
    var context = {};
    setLoggedInState(0);
    context.loggedIn = getLoggedInState();
    res.render('logout', context);
});

//render main upload page
app.get('/upload', function(req, res, next) {
    var context = {};
    context.loggedIn = getLoggedInState();
    res.render('upload', context);
});

//save details about paper into papers db, then render file upload page
app.post('/upload_file', function(req, res, next) {
    var context = {};
        
    //add data to papers database
    var data = {title: req.body.paperTitle, author_first: req.body.firstName, author_last: req.body.lastName,
        publication_date: req.body.publicationDate, field: req.body.field, approval_status: req.body.approvalStatus};
    pool.query('INSERT INTO papers SET ?', data, function(err, result) {
        if (err) {
            next(err);
            return;
        }
    }); 
    context.loggedIn = getLoggedInState();
    res.render('upload_file', context);
});

//upload pdf to files directory and then update the database accordingly
//right now, the pdf you upload needs to be in the format author_last_name.pdf and no authors can have the same last name
app.post('/save_details', function(req, res, next) {
    //source: https://stackoverflow.com/questions/29985950/how-to-stop-upload-and-redirect-in-busboy-if-mime-type-is-invalid
    var busboy = new Busboy ({
        headers: req.headers
    });

    var fstream;
    req.pipe(busboy);
    busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var saveTo = path.join("public/files/", path.basename(filename));
        fstream = fs.createWriteStream(saveTo);
        file.pipe(fstream);
        fstream.on('close', function () {
            //add the newly updated paper link to the db where the author's last name matches the paper pdf name
            pool.query("UPDATE papers SET `link` = ? WHERE CONCAT(author_last, '.pdf') = ?", 
            ['files/' + path.basename(filename), path.basename(filename)],function(err, rows, fields) {
                if (err) {
                    next(err);
                    return;
                }
                var context = {};
                context.loggedIn = getLoggedInState();
                res.render('upload_success', context);
            });
        });
    });
});

app.get('/review_papers', function(req, res, next){
    var context = {};
    pool.query("SELECT * FROM papers WHERE approval_status = ? ORDER BY title ASC", ["notReviewed"], function(err, rows, fields) {
        if (err) {
            next(err);
            return;
        }
        context.loggedIn = getLoggedInState();
        context.rows = rows;
        res.render('review_papers', context);
    });
});

app.post('/review_papers', function(req, res, next){
    // Get author last name and reviw status from req.body
    var context = {};
    var status_values = JSON.stringify(req.body);
    var open = false;
    var count = 0;
    var str = "";
    var values = [];
    var data = [];
    for (var i = 0; i < status_values.length; i++) {
        if (!open && status_values.charAt(i) === "\"") {
            open = true;
            str = "";
            continue;
        } else if (open && status_values.charAt(i) === "\"") {
            open = false;
            ++count;
            values.push(str);
            if (count === 2) {
                data.push(values);
                values = [];
                count = 0;
            }
            continue;
        }
        str += status_values.charAt(i);
    }
    // Update research paper status in database
    for (var i = 0; i < data.length; ++i) {
        pool.query('UPDATE papers SET approval_status = ? WHERE author_last = ?', [data[i][1], data[i][0]], function(err, result) {
            if (err) {
                next(err);
                return;
            }
        });
        if (data[i][1] === "notApproved") {
            pool.query('DELETE FROM papers WHERE author_last = ?', [data[i][0]], function(err, result) {
                if (err) {
                    next(err);
                    return;
                }
            });     
        }
    }
    context.loggedIn = getLoggedInState();
    res.render('welcome', context);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

app.listen(app.get('port'), function() {
    console.log('Express started on localhost:' + app.get('port') + '/');
});

