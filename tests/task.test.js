const request = require('supertest');
const app = require('../src/app');
const Task = require('../src/models/task');
const { userOne, userTwo, setupDatabase, taskOne, taskThree } = require('./fixtures/db');

beforeEach(setupDatabase);

test('should create a new task', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'From test file'
    })
    .expect(201);

  const task = await Task.findById(response.body._id);
  expect(task).not.toBeNull();
});

describe('Read Task', () => {
  test('should read userOne task', async () => {
    const response = await request(app)
      .get(`/tasks/${taskOne._id}`)
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send()
      .expect(200);
    
    expect(response.body).not.toBeNull();
  });
  
  test('should read all task of userOne', async () => {
    const response = await request(app)
      .get('/mytasks')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send()
      .expect(200);
  
    expect(response.body.length).toBe(2);
  });
  
  test('should read all incomplete task of userOne', async () => {
    const response = await request(app)
      .get('/mytasks?completed=false')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send()
      .expect(200);
  
    expect(response.body.length).toBe(2);
  });
  
  test('should read userTwo task', async () => {
    const response = await request(app)
      .get(`/tasks/${taskThree._id}`)
      .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
      .send()
      .expect(200);
    
    expect(response.body).not.toBeNull();
  });
  
  test('should read all task of userTwo', async () => {
    const response = await request(app)
      .get('/mytasks')
      .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
      .send()
      .expect(200);
  
    expect(response.body.length).toBe(1);
  });
  
  test('should read all incomplete task of userTwo', async () => {
    const response = await request(app)
      .get('/mytasks?completed=false')
      .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
      .send()
      .expect(200);
  
    expect(response.body.length).toBe(1);
  });
});

describe('Delete Task', () => {
  test('should deletes userOne Task', async () => {
    await request(app)
      .delete(`/tasks/${taskOne._id}`)
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send()
      .expect(200);

    const userOneTask = await Task.findById(taskOne._id);
    expect(userOneTask).toBeNull();
  });

  test('should not delete other users task', async () => {
    await request(app)
      .delete(`/tasks/${taskOne._id}`)
      .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
      .send()
      .expect(404);

    const userOneTask = await Task.findById(taskOne._id);
    expect(userOneTask).not.toBeNull();
  });
});
