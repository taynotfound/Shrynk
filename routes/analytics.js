const express = require('express');
const { QuickDB } = require('quick.db');
const router = express.Router();
const db = new QuickDB();

// Get analytics for a link
router.get('/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    const linkData = await db.get(`link_${shortUrl}`);
    let author = linkData.author || "Tay"; 
    
    if (linkData) {
        res.json(linkData);
    } else {
        res.status(404).send('Link not found');
    }
});

module.exports = router;
