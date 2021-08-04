const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isEmail, isStrongPassword } = require('validator');
const Task = require('../models/task');

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 1
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    validate(value) {
      if (!isEmail(value)) {
        throw new Error('Email is invalid')
      }
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 7,
    validate(value) {
      // validator.isStrongPassword minLength default is 8, minSymbols default is 1
      if (!isStrongPassword(value, { minLength: 7, minSymbols: 0 })) {
        throw new Error('Password is invalid')
      }
      else if (value.toLowerCase().includes('password')) {
        throw new Error('Password cannot contain "password"')
      }
    }
  },
  age: {
    type: Number,
    default: 0,
    validate: (value) => {
      if (value < 0) {
        throw new Error('Age must be a positive number')
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  avatar: {
    type: Buffer
  }
}, {
  timestamps: true // produce createdAt and updatedAt
});

// READ MY TASKS
// GET - http://localhost:3000/mytasks
// task-manager/src/routers/task.js
userSchema.virtual('tasks', {
  ref: 'task', // task model
  localField: '_id', // userSchema._id
  foreignField: 'owner' // taskSchema.owner
});

// applied to all response from user schema
// no need to use method on router response
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
}

// not applied to all response from user schema
// only applied to response with method on specific router
// userSchema.methods.getPublicProfile = function() {
//   const user = this;
//   const userObject = user.toObject();

//   delete userObject.password;
//   delete userObject.tokens;

//   return userObject;
// }

userSchema.methods.generateAuthToken = async function() {
  const user = this;

  try {
    const token = await jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET,
    {
      expiresIn: '1h'
    });

    user.tokens = user.tokens.concat({ token });
    await user.save();
    
    return token;
  } catch(e) {
    throw new Error(e);
  }
};

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('Email not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Wrong password');
  }

  return user;
};

userSchema.pre('save', async function(next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// DELETE USER
// DELETE - http://localhost:3000/users/me
userSchema.pre('remove', async function(next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });

  next()
});

const User = mongoose.model('user', userSchema);

module.exports = User;
