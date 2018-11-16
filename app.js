var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var handlebars = require('express-handlebars').create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', process.argv[2]);


//Place holders for the necessary pages
app.get('/sign_up', function(req, res, next){
	var context ={};
		res.render('sign_up', context);
 });


app.get('/login', function(req, res, next){
	var context ={};
		res.render('login', context);
 });


app.get('/search', function(req, res, next){
	var context ={};
		res.render('search', context);
 });


app.get('/browse', function(req, res, next){
	var context ={};
		res.render('browse', context);
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

app.listen(app.get('port'), function(){
    console.log('Express started on local host!');
});

