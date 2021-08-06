const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user');
const { userOneId, userOne, setupDatabase } = require('./fixtures/db');

beforeEach(setupDatabase);

describe('Sign Up User', () => {
  test('should sign up a new user', async () => {
    const response = await request(app).post('/users').send({
      name: 'Tyo',
      email: 'tyo@gmail.com',
      password: 'MyPass123',
      age: 30
    }).expect(201);
  
    // Assert the database was changed correctly
    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull();
  
    // Assertions about the response
    expect(response.body).toMatchObject({
      user: {
        name: 'Tyo',
        email: 'tyo@gmail.com',
        age: 30
      },
      token: user.tokens[0].token
    });
  
    expect(user.password).not.toBe('MyPass123');
  });

  test('should not sign up if name not valid', async () => {
    await request(app)
      .post('/users')
      .send({
        name: '',
        email: 'tyo@gmail.com',
        password: 'MyPass123',
        age: 30
      })
      .expect(400);
  });
});

test('should login existing user', async () => {
  const response = await request(app).post('/users/login').send({
    email: userOne.email,
    password: userOne.password
  }).expect(200);

  const user = await User.findById(userOneId);
  expect(user).not.toBeNull();

  expect(response.body.token).toBe(user.tokens[1].token);
});

test('should not login if user invalid', async () => {
  await request(app).post('/users/login').send({
    email: 'adam@gmail.com',
    password: 'MyPass'
  }).expect(400);
});

describe('Auth', () => {
  test('should get profile for user', async () => {
    await request(app)
      .get('/users/me')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send()
      .expect(200);
  });
  
  test('should not get profile for unauthenticated user', async () => {
    await request(app)
      .get('/users/me')
      .send()
      .expect(401);
  });

  test('should delete account user', async () => {
    await request(app)
      .delete('/users/me')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send()
      .expect(200);

    const user = await User.findById(userOneId);
    expect(user).toBeNull();
  });

  test('should not delete account of unauthenticated user', async () => {
    await request(app)
      .delete('/users/me')
      .send()
      .expect(401);

    const user = await User.findById(userOneId);
    expect(user).not.toBeNull();
  });
});

describe('AVATAR', () => {
  test('should upload avatar', async () => {
    await request(app)
      .post('/users/me/avatar')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .attach('avatar', 'tests/fixtures/foto.png')
      .expect(200)

    const user = await User.findById(userOneId);
    expect(user.avatar).toEqual(expect.any(Buffer))
  });
});

describe('Update User', () => {
  test('should update valid user fields', async () => {
    const response = await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send({
        name: 'Prasetya',
        age: 31,
        email: 'prasetya@gmail.com',
        password: 'Pras123'
      })
      .expect(200);

    const user = await User.findById(userOneId);
    expect(response.body).toMatchObject({
      name: 'Prasetya',
      age: 31,
      email: 'prasetya@gmail.com'
    });

    expect(user.password).not.toBe('Pras123');
  });

  test('should not update invalid user fields', async () => {
    const response = await request(app)
      .patch('/users/me')
      .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
      .send({
        name: 'Prasetya',
        age: 31,
        email: 'prasetya@gmail.com',
        password: 'Pras123',
        location: 'jakarta'
      })
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Updates not allowed!'
    });
  });
});
