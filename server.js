const Koa = require('koa');
const Router = require('koa-router');
const cors = require('koa2-cors');
const serve = require('koa-static');
const { Sequelize, DataTypes } = require('sequelize');
const axios = require('axios');
const bodyParser = require('koa-bodyparser');
const swagger = require('koa2-swagger-ui');2
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
const fs = require('fs');

const app = new Koa();
const router = new Router();

// Use bodyParser middleware to parse request bodies
app.use(bodyParser());

//add cors for swagger to access documentation
app.use(cors());

// Serve static files
app.use(serve(__dirname));

// Initialize Sequelize with SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log
});

// Define Sequelize models
const Track = sequelize.define('Track', {
  isrc: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: DataTypes.STRING,
  imageUri: DataTypes.STRING,
});

const Artist = sequelize.define('Artist', {
  name: DataTypes.STRING,
  TrackIsrc: {
    type: DataTypes.STRING,
    references: {
      model: Track,
      key: 'isrc'
    }
  }
});

Track.hasMany(Artist, {foreignKey: 'TrackIsrc'});
Artist.belongsTo(Track, {foreignKey: 'TrackIsrc'});

// Sync Sequelize models
sequelize.sync();

// Spotify API credentials
const clientId = 'ff0a55f98cfc4d38a0a32c1a84db57c8';
const clientSecret = 'db5ccf08e1d8426bb5824cf705e67fc8';

async function spotifyAuth() {
  const response = await axios({
    url: 'https://accounts.spotify.com/api/token',
    method: 'post',
    params: {
      grant_type: 'client_credentials'
    },
    headers: {
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    }
  });
  return response.data.access_token;
}

async function getTrackData(isrc) {
  const accessToken = await spotifyAuth();
  const response = await axios({
    url: `https://api.spotify.com/v1/search?q=isrc:${isrc}&type=track`,
    method: 'get',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  // Get the most popular track if there are multiple
  const mostPopularTrack = response.data.tracks.items.reduce((prev, current) => {
    return (prev.popularity > current.popularity) ? prev : current;
  });

  return mostPopularTrack;
}
router.post('/track', async ctx => {
    const { isrc } = ctx.request.body;
    const trackData = await getTrackData(isrc);
  
    try {
      // Try to create the track
      const track = await Track.create({
        isrc,
        title: trackData.name,
        imageUri: trackData.album.images[0].url,
      });
  
      // If the track creation is successful, create the artists
      for (let artistData of trackData.artists) {
        await Artist.create({
          name: artistData.name,
          TrackIsrc: isrc
        });
      }
    
      // Transform artists into an array of names for response
      const artistNames = trackData.artists.map(artist => artist.name);
  
      ctx.body = {
        message: 'Track created',
        track: {
          isrc: track.isrc,
          title: track.title,
          imageUri: track.imageUri,
          artists: artistNames,
        }
      };
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        // Handle the case when the track already exists
        ctx.status = 409; // Conflict status code
        ctx.body = {
          error: 'Track already exists in the database.'
        };
      } else {
        // Handle other errors
        ctx.status = 500; // Internal Server Error status code
        ctx.body = {
          error: 'An error occurred while creating the track.'
        };
      }
    }
  });
  

router.get('/track/:isrc', async ctx => {
  const { isrc } = ctx.params;
  const track = await Track.findOne({
    where: { isrc },
    include: Artist
  });
  
  ctx.body = track;
});

router.get('/artist/:artistName', async ctx => {
  const { artistName } = ctx.params;
  const tracks = await Track.findAll({
    include: {
      model: Artist,
      where: {
        name: {
          [Sequelize.Op.like]: `%${artistName}%`
        }
      }
    }
  });
  
  ctx.body = tracks;
});

app.use(router.routes()).use(router.allowedMethods());

// Serve Swagger UI
app.use(swagger({
  routePrefix: '/swagger',
  swaggerOptions: {
    url: '/swagger.yaml' // Specify the updated Swagger YAML file
  }
}));


app.listen(3000, () => {
  console.log('Server running on port 3000');
});
