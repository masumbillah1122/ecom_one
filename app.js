var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
let mongoose = require('mongoose');
let ErrorHandler = require('./backend/middleware/error');
let dotenv = require('dotenv');


var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Route imports
const product = require('./backend/routes/ProductRoute');
const user =  require('./backend/routes/UserRoute');
const order = require("./backend/routes/OrderRoute");

app.use('/api/v2', product);
app.use('/api/v2', user);
app.use("/api/v2", order);

// It's for errorHandling
app.use(ErrorHandler);


dotenv.config({
  path:'backend/.env'
})

// DB Connnection Here
mongoose
  .connect(
    "mongodb+srv://masumhaque:169572274@cluster0.wnhig.mongodb.net/ecom_one?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false,
    }
  )
  .then(() => console.log("Datebase connected"))
  .catch((error) => {
    if (error) console.log("Database connection failed");
  });


  
// Handling uncaught Exception

process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server for Handling uncaught Exception`);
})
  
// Unhandled promise rejection
process.on('unhandledRejection', (err) => {
  console.log(`Shutting down server for ${err.message}`);
  console.log(`Shutting down the server due to Unhandled promise rejection`);
  server.close(() => {
    process.exit(1);
  });
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
