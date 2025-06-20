var express = require('express');
var router = express.Router();

router.get('/dogs',async (req,res,next) => {
    try{
        const [rows] = await req.db.execute(`
            SELECT name,size,Users.username 
        `);
    }
});

module.exports = router;
