const { ObjectID } = require("mongodb");
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const Auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });

    // logDiffTime(decoded._id);

    if (!user) { throw new Error(); }

    req.token = token;
    req.user = user;
    next();
  } catch(error) {
    res.status(401).send({ error, message: 'Please Authenticate' });
  }
};

// check token expired date
// subtract current date to token date
// expiresIn: '1h' -> task-manager/src/models/user.js -> generateAuthToken
const logDiffTime = (id) => {
  const tokenDate = new ObjectID(id).getTimestamp();
    
  var date = new Date();
  const diffTime = new Date(date.toString()) - new Date(tokenDate.toString());

  console.log('minutes:seconds', millisToMinutesAndSeconds(diffTime));
  console.log('hours', millisToHours(diffTime));
};

const millisToMinutesAndSeconds = (millis) => {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
};

const millisToHours = (millis) => {
  var minutes = Math.floor(millis / 60000);
  return minutes / 60;
};

module.exports = Auth;
