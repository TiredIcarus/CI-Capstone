const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from the 'public' and 'images' directories
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, 'images')));

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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
