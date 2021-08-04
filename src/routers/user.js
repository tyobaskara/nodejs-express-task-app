const express = require('express');
const router = new express.Router();
const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/user');
const Auth = require('../middleware/auth');

const avatarsUpload = multer({ 
  limits: 1000000, // 1MB max,
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|png|jpeg)$/)) {
      return cb(new Error('Please upload an image')); // callback error
    }

    cb(undefined, true); // callback success
  }
});

// AVATAR UPLOAD
// POST - http://localhost:3000/users/me/avatar
router.post('/users/me/avatar', Auth, avatarsUpload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
  req.user.avatar = buffer;

  await req.user.save();

  res.send();
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message });
});

// DELETE AVATAR
// POST - http://localhost:3000/users/me/avatar
router.delete('/users/me/avatar', Auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();

  res.send();
});

// SERVING IMAGE
// GET - http://localhost:3000/users/610906403d4b19406f84b47f/avatar
router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
  
    if (!user | !user.avatar) {
      throw new Error();
    }
  
    res.set('Content-Type', 'image/png');
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

// CREATE USER
// POST - http://localhost:3000/users
router.post('/users', async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save(); // to catch error if save user failed
    const token = await user.generateAuthToken(); // userSchema.methods

    res.status(201).send({ user, token });
  } catch(e) {
    res.status(400).send(e);
  }
});

// LOGIN USER
// POST - http://localhost:3000/users/login
router.post('/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password); // userSchema.statics
    const token = await user.generateAuthToken(); // userSchema.methods
    
    res.status(200).send({ user, token });
  } catch(e) {
    res.status(400).send(e);
  }
});

// LOGOUT USER
// POST - http://localhost:3000/users/logout
router.post('/users/logout', Auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();

    res.status(200).send({});
  } catch(e) {
    console.log(e);
    res.status(500).send(e);
  }
});


// LOGOUT USER all session
// POST - http://localhost:3000/users/logoutAll
router.post('/users/logoutAll', Auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.status(200).send({});
  } catch(e) {
    console.log(e);
    res.status(500).send(e);
  }
});

// READ MY USER
// GET - http://localhost:3000/users/me
router.get('/users/me', Auth, (req, res) => {
  res.send(req.user);
});

// READ USERS
// GET - http://localhost:3000/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({});

    res.status(200).send(users);
  } catch(error) {
    res.status(500).send();
  }
});

// READ USER BY ID
// GET - http://localhost:3000/users/12345
router.get('/users/:id', async (req, res) => {
  const _id = req.params.id;

  try {
    const user = await User.findById(_id);

    if (!user) { return res.status(404).send(); }
    res.status(200).send(user);
  } catch(error) {
    res.status(500).send();
  }
});

// UPDATE USER
// PATCH - http://localhost:3000/users/me
router.patch('/users/me', Auth, async (req, res) => {
  const keys = Object.keys(req.body);
  const allowedUpdates = ['name', 'age', 'email', 'password'];
  const isAllowed = keys.every(key => allowedUpdates.includes(key));

  if (!isAllowed) { return res.status(400).send({ error: 'Updates not allowed!' }); }
  
  try {
    const { user } = req;

    // iterates keys to update user
    keys.forEach(key => user[key] = req.body[key]);
    await user.save();
    
    res.status(200).send(user);
  } catch(e) {
    res.status(500).send(e);
  }
});

// DELETE USER
// DELETE - http://localhost:3000/users/me
router.delete('/users/me', Auth, async (req, res) => {
  try {
    await req.user.remove()

    res.status(200).send(req.user);
  } catch(e) {
    res.status(500).send();
  }
});

module.exports = router;
