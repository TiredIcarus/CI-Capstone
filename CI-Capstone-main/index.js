const express = require('express');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('weather.db');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' and 'images' directories
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Middleware
app.use(express.json());
app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));

// Create tables if not exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    location TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

// Function to fetch weather data
const getWeatherData = async (city, units = 'metric') => {
  const apiKey = '685e795d173e00ace5b19b16d2de5206';
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${units}`;
  const response = await axios.get(url);
  return response.data;
};

// Helper function to get local time and timezone string
const getLocalTimeInfo = (dt, timezone) => {
  // dt: UTC seconds, timezone: offset in seconds from UTC
  // Get UTC milliseconds
  const utcMillis = dt * 1000;
  // Add timezone offset in milliseconds
  const localMillis = utcMillis + timezone * 1000;
  const localDate = new Date(localMillis);

  // Format as YYYY-MM-DD HH:mm
  const pad = n => String(n).padStart(2, '0');
  const localTime = `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())} ${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}`;

  // Format timezone as UTC±HH:MM
  const tzHours = Math.floor(timezone / 3600);
  const tzMinutes = Math.abs(Math.floor((timezone % 3600) / 60));
  const sign = tzHours >= 0 ? '+' : '-';
  const tzString = `UTC${sign}${pad(Math.abs(tzHours))}:${pad(tzMinutes)}`;

  return { localTime, timeZone: tzString };
};

app.get('/weather', async (req, res) => {
  const city = req.query.city;
  const units = req.query.units || 'metric'; // Default to metric if units are not specified

  try {
    const data = await getWeatherData(city, units);
    const { localTime, timeZone } = getLocalTimeInfo(data.dt, data.timezone);
    res.json({ ...data, localTime, timeZone });
  } catch (error) {
    res.status(500).send('Error fetching weather data');
  }
});

app.get('/constant-weather', async (req, res) => {
  try {
    const tokyoWeather = await getWeatherData('Tokyo');
    const newYorkWeather = await getWeatherData('New York');
    const londonWeather = await getWeatherData('London');
    const sydneyWeather = await getWeatherData('Sydney');
    const parisWeather = await getWeatherData('Paris');
    const dubaiWeather = await getWeatherData('Dubai');

    res.json({
      tokyo: {
        weather: tokyoWeather,
        ...getLocalTimeInfo(tokyoWeather.dt, tokyoWeather.timezone),
      },
      newYork: {
        weather: newYorkWeather,
        ...getLocalTimeInfo(newYorkWeather.dt, newYorkWeather.timezone),
      },
      london: {
        weather: londonWeather,
        ...getLocalTimeInfo(londonWeather.dt, londonWeather.timezone),
      },
      sydney: {
        weather: sydneyWeather,
        ...getLocalTimeInfo(sydneyWeather.dt, sydneyWeather.timezone),
      },
      paris: {
        weather: parisWeather,
        ...getLocalTimeInfo(parisWeather.dt, parisWeather.timezone),
      },
      dubai: {
        weather: dubaiWeather,
        ...getLocalTimeInfo(dubaiWeather.dt, dubaiWeather.timezone),
      },
    });
  } catch (error) {
    res.status(500).send('Error fetching constant weather data');
  }
});

// Register
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing fields');
  const hash = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function(err) {
    if (err) return res.status(400).send('User exists');
    res.send('Registered');
  });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).send('Invalid credentials');
    }
    req.session.userId = user.id;
    res.send('Logged in');
  });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.send('Logged out'));
});

// Add favorite
app.post('/favorite', (req, res) => {
  if (!req.session.userId) return res.status(401).send('Login required');
  const { location } = req.body;
  db.run('INSERT INTO favorites (user_id, location) VALUES (?, ?)', [req.session.userId, location], function(err) {
    if (err) return res.status(400).send('Could not add favorite');
    res.send('Favorited');
  });
});

// Get favorites
app.get('/favorites', (req, res) => {
  if (!req.session.userId) return res.status(401).send('Login required');
  db.all('SELECT location FROM favorites WHERE user_id = ?', [req.session.userId], (err, rows) => {
    res.json(rows.map(r => r.location));
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
