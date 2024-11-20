const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const linkRoutes = require('./routes/links');
const analyticsRoutes = require('./routes/analytics');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', './views'); // Specify the views directory

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public', {
    maxAge: '1d' // Cache static assets for 1 day
}));
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/links', linkRoutes);
app.use('/analytics', analyticsRoutes);

// Home route
app.get('/', (req, res) => {
    console.log(req.session.user);
    res.render('index', { user: req.session.user }); // Render the index.ejs file
});

app.get("/dashboard", async (req, res) => {
    //If user is not logged in, redirect to login page
    console.log(req.session.user);
    if (!req.session.user) {
        return res.redirect("/auth/login");
    } else {
        try{
        let links = await db.get(`${req.session.user.username}.links`) || [];
        console.log(await db.get(`${req.session.user.username}.links`) === null);
        if(links === null) { 
            console.log("links are null");
            links = [];
        
        } else {
            console.log("links arent null");
        links = Object.entries(links).map(([key, value]) => ({
            id: key,
            shortUrl: key,
            originalUrl: value.originalUrl,
            disabled: value.disabled,
            clicks: value.clicks
        }));
        }
        console.log(links);
        console.log(req.session.user.username); 
    res.render("dashboard", { user: req.session.user , links, req });
        } catch (e) {
            console.log(e);
            res.send("An error occurred");
        }
    }
});

app.get("/l/:shortUrl", async (req, res) => {
    const { shortUrl } = req.params;
    const linkData = await db.get(`link_${shortUrl}`);
    if (linkData) {
        if (!linkData.disabled) {
            let author = linkData.author || "Tay";
            await db.set(`${author}.links.${shortUrl}.clicks`, (linkData.clicks || 0) + 1);
            await db.set(`link_${shortUrl}.clicks`, (linkData.clicks || 0) + 1);
            return res.redirect(linkData.originalUrl);
        } else {
            return res.status(410).send('This link has been disabled.');
        }
    }
    return res.status(404).send('Link not found');
});

// Handle 404 errors
app.use((req, res, next) => {
    res.status(404).render('404', { user: req.session.user });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
