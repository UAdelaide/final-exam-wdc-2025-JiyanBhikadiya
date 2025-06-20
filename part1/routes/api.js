var express = require('express');
var router = express.Router();

router.get('/dogs',async (req,res,next) => {
    try{
        const [dogs] = await req.db.execute(`
            SELECT name AS dog_name,size,Users.username AS owner_username FROM Dogs
            JOIN Users ON Dogs.owner_id = Users.user_id
        `);
        res.json(dogs);
    }catch(error){
        res.status(500).json({ error: 'Failed to fetch Dogs' });
    }
});

router.get('/walkrequests/open',async (req,res,next) => {
    try{
        const [request] = await req.db.execute(`
            SELECT request_id,Dogs.name AS dog_name,requested_time,duration_minutes,location,Users.username AS owner_username FROM WalkRequests
            JOIN Dogs ON Dogs.dog
        `);
        res.json(request);
    }catch(error){
        res.status(500).json({ error: 'Failed to fetch Dogs' });
    }
});

module.exports = router;
