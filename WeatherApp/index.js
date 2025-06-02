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

app.get('/weather', async (req, res) => {
  const city = req.query.city;
  const units = req.query.units || 'metric'; // Default to metric if units are not specified

  try {
    const data = await getWeatherData(city, units);
    res.json(data);
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

    res.json({
      tokyo: tokyoWeather,
      newYork: newYorkWeather,
      london: londonWeather,
      sydney: sydneyWeather,
    });
  } catch (error) {
    res.status(500).send('Error fetching constant weather data');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
