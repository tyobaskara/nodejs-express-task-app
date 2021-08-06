const express = require('express');

require('./db/mongoose');

const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();

// Express Middleware
// do something before run Routes handler
// app.use((req, res, next) => {
//   console.log(req.method, req.path);

//   next();
// });

// Enable this If we want to disable api temporary(maintenance server)
// app.use((req, res, next) => {
//   console.log(req.method, req.path);

//   res.status(503).send('Site is currently down, Check back soon!');
// });

// parse incoming json to an object
app.use(express.json());

// Routes handler
app.use(userRouter);
app.use(taskRouter);

module.exports = app;
