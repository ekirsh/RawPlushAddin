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
    .find({
      playlist_count: { $gte: 2 } // Filter for playlist_count greater than or equal to 2
    })
    .sort({
      playlist_count: -1, // Sort playlist_count in descending order
      artist_followers: 1, // Sort artist_followers in ascending order
      popularity: 1 // Sort popularity in ascending order
    })
    .toArray();
    res.json(data);
    client.close();
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
