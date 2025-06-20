const express = require('express');
const path = require('path');
require('dotenv').config();
const session = require('express-session');

const app = express();

app.use(session({
    secret: 'JIYAN123!',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000*60*60,secure: false }
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');


app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

app.get('/api/dogs',async (req,res,next) => {
    try{
        const [dogs] = await db.execute(`
            SELECT name AS dog_name,size,Users.username AS owner_username FROM Dogs
            JOIN Users ON Users.user_id = Dogs.owner_id
        `);
        res.json(dogs);
    }catch(error){
        res.status(500).json({ error: 'Failed to fetch Dogs' });
    }
});

// Export the app instead of listening here
module.exports = app;