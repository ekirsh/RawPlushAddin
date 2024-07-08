const express = require('express');
const mongodb = require('mongodb');
const { spawn } = require('child_process');
const moment = require('moment');
var cors = require('cors')
const app = express();
const port = 3001;
const MongoClient = mongodb.MongoClient;
const url = "mongodb+srv://ezra:fbVFtTwornawziKT@cluster0.owft8n4.mongodb.net/?retryWrites=true&w=majority"; // replace with your MongoDB connection string

app.use(cors())

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database connected!");
  db.close();
});

app.get('/artists', async (req, res) => {
    const client = new MongoClient(url);
    await client.connect();
    const database = client.db('spotify_data'); // replace 'mydb' with your database name
    const artists = database.collection('artists');
    const data = await artists
    .find({})
    .toArray();
    res.json(data);
    client.close();
  });

app.get('/instagram', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 21;
    const sort = req.query.sort || 'change_in_notable_followers';
    
    const filter = req.query.filter || '';
    const filters = filter.split(',').filter(f => f);
    console.log(filters);
    const query = filters.length ? { 'follower_list.username': { $all: filters } } : {};

    const skip = (page - 1) * limit;

    let sortQuery = {};
    if (sort === 'notable_followers') {
      sortQuery = { notable_followers: -1 };
    } else if (sort === 'first_date_tracked') {
      sortQuery = { first_date_tracked: -1 };
    } else if (sort === 'change_in_notable_followers') {
      sortQuery = { notable_follower_growth: -1 };
    }
    
    const client = new MongoClient(url);
    await client.connect();
    const db = client.db('instagram_data'); 
    const collection = db.collection('users'); // Replace 'users' with your collection name

    const users = await collection.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .toArray();

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/tiktok', async (req, res) => {
    const client = new MongoClient(url);
    await client.connect();
    const database = client.db('tiktok_data'); // replace 'mydb' with your database name
    const artists = database.collection('artist_data');
    const data = await artists
    .find({})
    .sort({
      viewsPerDay: -1,
    })
    .toArray();
    res.json(data);
    client.close();
  });

app.get('/scanstatus', async (req, res) => {
    const client = new MongoClient(url);
    await client.connect();
    const database = client.db('spotify_data'); // replace 'mydb' with your database name
    const artists = database.collection('scan_status');
    const data = await artists
    .find({})
    .toArray();
    res.json(data);
    client.close();
  });

app.get('/ai', (req, res) => {
  const artistName = req.query.name;
  const python = spawn('python', ['./testing.py', artistName]);

  python.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  python.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
  });

  python.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
  });

  
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
});
