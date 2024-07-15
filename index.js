const express = require('express');
const mongodb = require('mongodb');
const { spawn } = require('child_process');
const moment = require('moment');
var cors = require('cors')
const app = express();
const port = 3001;
const MongoClient = mongodb.MongoClient;
const url = "mongodb+srv://ezra:fbVFtTwornawziKT@cluster0.owft8n4.mongodb.net/?retryWrites=true&w=majority";

app.use(cors())

let client;

async function connectToDatabase() {
  try {
    client = new MongoClient(url);
    await client.connect();
    console.log("Database connected!");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
}

connectToDatabase();

app.get('/artists', async (req, res) => {
  try {
    const database = client.db('spotify_data');
    const artists = database.collection('artists');
    const data = await artists.find({}).toArray();
    res.json(data);
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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
    let additionalQuery = {};

    if (sort === 'notable_followers') {
      sortQuery = { notable_followers: -1 };
    } else if (sort === 'first_date_tracked') {
      sortQuery = { first_date_tracked: -1, notable_followers: -1 };
      additionalQuery = {
        $and: [
          { follower_list: { $exists: true } },
          {
            $nor: [
              { 'follower_list': { $elemMatch: { first_time_tracked: 'y' } } }
            ]
          }
        ]
      };
    } else if (sort === 'change_in_notable_followers') {
      sortQuery = { notable_follower_growth: -1 };
    }

    // Combine the original query with the additional query
    const finalQuery = { ...query, ...additionalQuery };
    console.log(finalQuery);
    
    const db = client.db('instagram_data');
    const collection = db.collection('users');

    const users = await collection.find(finalQuery)
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
  try {
    const database = client.db('tiktok_data');
    const artists = database.collection('artist_data');
    const data = await artists
      .find({})
      .sort({
        viewsPerDay: -1,
      })
      .toArray();
    res.json(data);
  } catch (error) {
    console.error('Error fetching TikTok data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/scanstatus', async (req, res) => {
  try {
    const database = client.db('spotify_data');
    const artists = database.collection('scan_status');
    const data = await artists.find({}).toArray();
    res.json(data);
  } catch (error) {
    console.error('Error fetching scan status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
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

  res.json({ message: 'AI process started' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  await client.close();
  console.log('Database connection closed.');
  process.exit(0);
});
