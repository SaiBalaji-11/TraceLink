const express = require('express');
const mongoose = require('./db/db');
const ejs = require('ejs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();


// Model imports
const LostPerson = require('./schema/LostPerson');
const FoundPerson = require('./schema/FoundPerson');

const app = express();
app.use(express.static('public'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// Serve models folder
app.use('/models', express.static(path.join(__dirname, 'models')));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
}).single('image');

// Routes
app.get('/', (req, res) => {
  res.render('Home', { recentMissing: [] });
});

app.get('/lost-someone', (req, res) => {
  res.render('lost-someone');
});

// Show the form page
app.get('/found-someone', (req, res) => {
  res.render('found-someone'); // renders found-someone.ejs
});




app.get('/services', (req, res) => {
  res.render('services');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

app.get('/logout', (req, res) => {
  res.redirect('/');
});

app.get('/view-missing', async (req, res) => {
  const lostPersons = await LostPerson.find({});
  const foundPersons = await FoundPerson.find({});
  res.render('view-missing', { lostPersons, foundPersons });
});

app.get('/search-missing', async (req, res) => {
  const query = req.query.query || '';
  const regex = new RegExp(query, 'i');

  const lostPersons = await LostPerson.find({
    $or: [{ name: regex }, { city: regex }]
  });

  const foundPersons = await FoundPerson.find({
    $or: [{ name: regex }, { city: regex }]
  });

  res.render('view-missing', { lostPersons, foundPersons });
});

// Image search API
app.get('/api/all-images', async (req, res) => {
  try {
    const lost = await LostPerson.find({}, 'name image');
    const found = await FoundPerson.find({}, 'name image');

    const all = [
      ...lost.map(p => ({ name: p.name, imageUrl: p.image, collection: 'Lost' })),
      ...found.map(p => ({ name: p.name, imageUrl: p.image, collection: 'Found' }))
    ];

    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load images' });
  }
});

// Route to handle image uploads for Lost Person
app.post('/lost-someone', upload, async (req, res) => {
  try {
    const { name, age, contact, address, lostLocation, reward } = req.body;

    if (!req.file) {
      return res.status(400).send('Image upload failed or no image provided');
    }



    const newLostPerson = new LostPerson({
      name,
      age,
      contact,
      address,
      lostLocation,
      reward,
      image: `/uploads/${req.file.filename}`
    });

    await newLostPerson.save();
    res.redirect('/view-missing');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error while saving lost person data');
  }
});

app.post('/found-someone', upload, async (req, res) => {

  try {
    const { name, age, location, contact } = req.body;
    const imagePath = req.file.path;

    const foundPerson = new FoundPerson({
      name,
      age,
      location,
      contact,
      image: `/uploads/${req.file.filename}`

    });

    await foundPerson.save();

    res.redirect('/view-missing');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error while saving found person');
  }
});


// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
