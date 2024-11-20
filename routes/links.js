const express = require('express');
const { QuickDB } = require('quick.db');
const router = express.Router();
const db = new QuickDB();
// Serve the dashboard page


// Create link with custom short URL
router.post('/create', async (req, res) => {
    const { originalUrl, customShortUrl } = req.body;
    console.log(req.body);
    const shortUrl = customShortUrl || generateShortUrl(); // Use custom short URL if provided

    // Check if the short URL already exists
    const existingLink = await db.get(`link_${shortUrl}`);
    if (existingLink) {
        return res.status(400).send('Short URL already exists. Please choose another one.');
    }

    // Store the link under the user's username
    await db.set(`link_${shortUrl}`, { originalUrl, disabled: false, clicks: 0, author: req.session.user.username });
    await db.set(`${req.session.user.username}.links.${shortUrl}`, { originalUrl, disabled: false, clicks: 0, author: req.session.user.username }); // Add the short URL to the user's links

    res.redirect('/dashboard'); // Redirect to the dashboard after creating a link
});

// Redirect to the original URL and increment analytics
router.get('/l/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    const linkData = await db.get(`link_${shortUrl}`);

    if (linkData) {
        if (!linkData.disabled) {
            await db.set(`link_${shortUrl}.clicks`, linkData.clicks + 1); // Increment click count
            await db.set(`${req.session.user.username}.links.${shortUrl}.clicks`, linkData.clicks + 1); // Increment click count
            return res.redirect(linkData.originalUrl);
        } else {
            return res.status(410).send('This link has been disabled.');
        }
    }

    return res.status(404).send('Link not found');
});

// Edit link
router.post('/edit/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    const { newUrl } = req.body;
    await db.set(`link_${shortUrl}.originalUrl`, newUrl);
    await db.set(`${req.session.user.username}.links.${shortUrl}.originalUrl`, newUrl);
    res.send('Link updated');
});



// Delete link
router.post('/delete/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    await db.delete(`link_${shortUrl}`);
    await db.delete(`${req.session.user.username}.links.${shortUrl}`);
    res.send('Link deleted');
});

// Enable link
router.post('/enable/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    await db.set(`link_${shortUrl}.disabled`, false);
    await db.set(`${req.session.user.username}.links.${shortUrl}.disabled`, false);
    res.redirect('/dashboard'); // Redirect to the dashboard after enabling the link
});

// Disable link
router.post('/disable/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    await db.set(`link_${shortUrl}.disabled`, true);
    await db.set(`${req.session.user.username}.links.${shortUrl}.disabled`, true);
    res.redirect('/dashboard'); // Redirect to the dashboard after disabling the link
});

// Function to generate a random short URL
function generateShortUrl() {
    return Math.random().toString(36).substring(2, 8);
}

module.exports = router;
