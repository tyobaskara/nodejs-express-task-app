const express = require('express');
const router = new express.Router();
const Task = require('../models/task');
const Auth = require('../middleware/auth');

// CREATE TASK
// POST - http://localhost:3000/tasks
router.post('/tasks', Auth, async (req, res) => {
  try {
    const { user, body } = req;
    const task = new Task({
      ...body,
      owner: user._id
    });

    await task.save();

    res.status(201).send(task);
  } catch(error) {
    res.status(400).send();
  };
});

// READ MY TASK
// GET - http://localhost:3000/tasks/12345
router.get('/tasks/:id', Auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

    if (!task) { res.status(401).send('task not found!') }
    res.status(200).send(task);
  } catch(error) {
    res.status(500).send(error);
  }
});

// READ MY TASKS
// GET - http://localhost:3000/mytasks
// GET - http://localhost:3000/mytasks?completed=false
// GET - http://localhost:3000/mytasks?limit=2&skip=0 -> page 1 of 2 task
// GET - http://localhost:3000/mytasks?limit=2&skip=2 -> page 2 of another 2 task
// GET - http://localhost:3000/mytasks?sortBy=createdAt:desc
router.get('/mytasks', Auth, async (req, res) => {
  const match = {};
  const sort = {};
  const { completed, sortBy } = req.query;

  if (completed) {
    match.completed = completed === 'true' // to return boolean from string
  }

  if (sortBy) {
    const parts = sortBy.split(':');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    // sort = {
    //  createdAt: 1 or -1
    // }
  }
  
  try {
    // technique 1
    // const task = await Task.find({ owner: req.user._id }).populate('owner');
    
    // technique 2 (Recommended)
    // using userSchema.virtual -> task-manager/src/models/user.js
    await req.user.populate({
      path: 'tasks',
      match, // filter
      options: {
        limit: parseInt(req.query.limit), // limit of pagination
        skip: parseInt(req.query.skip), // pagination
        sort // sort = { createdAt: 1 or -1 }
      }
    }).execPopulate();

    res.status(200).send(req.user.tasks);
  } catch(error) {
    res.status(500).send(error);
  }
});

// READ TASKS ALL USER
// GET - http://localhost:3000/tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({}).populate('owner');

    res.status(200).send(tasks);
  } catch(e) {
    res.status(500).send();
  }
});

// UPDATE TASK
// PATCH - http://localhost:3000/tasks/12345
router.patch('/tasks/:id', Auth, async (req, res) => {
  const keys = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isAllowed = keys.every(key => allowedUpdates.includes(key));

  if (!isAllowed) { return res.status(400).send({ error: 'Updates not allowed!' }); }
  
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    keys.forEach(key => task[key] = req.body[key]);
    await task.save();
    
    res.status(200).send(task);
  } catch(e) {
    res.status(500).send();
  }
});

// DELETE TASK
// DELETE - http://localhost:3000/tasks/12345
router.delete('/tasks/:id', Auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

    if (!task) { return res.status(404).send(); }
    res.status(200).send(task);
  } catch(e) {
    res.status(500).send();
  }
});

module.exports = router;
