var express = require('express');
var router = express.Router();

router.get('/dogs',async (req,res,next) => {
    try{
        const [rows] = await req.db.execute();
    }
});

module.exports = router;
