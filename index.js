const express = require('express');
const mongodb = require('mongodb');
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
    const data = await artists.find().toArray();
    res.json(data);
    client.close();
  });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
});