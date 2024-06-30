const express = require('express');
const mongodb = require('mongodb');
const { spawn } = require('child_process');
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
  const client = new MongoClient(url);
  try {
    await client.connect();
    const database = client.db('instagram_data');
    const artists = database.collection('users');

    const cursor = artists.find({});
    cursor.on('data', (doc) => {
      res.write(JSON.stringify(doc) + '\n');
    });

    cursor.on('end', () => {
      res.end();
      client.close();
    });

    cursor.on('error', (err) => {
      res.status(500).json({ error: err.message });
      client.close();
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
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
