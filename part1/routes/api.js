var express = require('express');
var router = express.Router();

router.get('/dogs',async (req,res,next) => {
    try{
        const [rows] = await req.db.execute(`
            SELECT name AS dog_name,size,Users.username AS owner_username FROM Dogs
            JOIN Users ON Dogs.owner_id = Users.user_id
        `);
        res.json(rows);
    }catch(error){
        res.status(500).json({ error: 'Failed to fetch Dogs' });
    }
});

router.get('/walkrequests/open',async (req,res,next) => {
    try{
        const [rows] = await req.db.execute(`
            
        `);
        res.json(rows);
    }catch(error){
        res.status(500).json({ error: 'Failed to fetch Dogs' });
    }
});

module.exports = router;
