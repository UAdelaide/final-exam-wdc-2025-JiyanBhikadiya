var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
    try{
        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });

        await db.query(sqlQuery);
        await db.changeUser({ database: "DogWalkService" });

        app.use((req,res,next) => {
            req.db = db;
            next();
        });
    } catch(error){
        console.error(error);
    }
})();

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
