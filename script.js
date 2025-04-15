// Initialize with default city
window.onload = function() {
  // Check if there's a saved city in localStorage
  const savedCity = localStorage.getItem('weatherCity') || 'Mumbai';
  document.getElementById('city-input').value = savedCity;
  getWeather();
};

async function getWeather() {
  const cityInput = document.getElementById('city-input');
  const city = cityInput.value.trim() || 'Mumbai';
  const apiKey = '85fceacef90a9310ebccaf2bea6e48ac';
  const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  
  // Save city to localStorage
  localStorage.setItem('weatherCity', city);

  // Show loading state
  document.getElementById('temperature').textContent = '...';
  document.getElementById('city-name').textContent = 'Loading...';
  document.getElementById('description').textContent = '';
  document.getElementById('error-message').style.display = 'none';
  document.querySelector('.forecast').innerHTML = '';

  try {
    // First check network connection
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }

    const response = await fetch(currentWeatherUrl);
    
    // Check for HTTP errors
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch weather data');
    }

    const data = await response.json();

    // Check for API errors
    if (data.cod && data.cod !== 200) {
      throw new Error(data.message || 'City not found');
    }

    // Update current weather
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const cityName = data.name;
    const iconCode = data.weather[0].icon;

    document.getElementById('temperature').textContent = `${temperature}°C`;
    document.getElementById('city-name').textContent = cityName;
    document.getElementById('description').textContent = description;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    // Try to load forecast (but don't fail if this doesn't work)
    try {
      await updateForecast(city, apiKey);
    } catch (forecastError) {
      console.warn("Forecast failed:", forecastError);
      document.querySelector('.forecast').innerHTML = '<div class="forecast-error">Hourly forecast unavailable</div>';
    }

    // Set background based on weather
    setBackgroundVideo(description);

  } catch (error) {
    console.error("Weather fetch error:", error);
    showError(error.message);
  }
}

async function updateForecast(city, apiKey) {
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&cnt=4`;
  const response = await fetch(forecastUrl);
  
  if (!response.ok) {
    throw new Error('Forecast not available');
  }

  const data = await response.json();

  if (data.cod !== "200") {
    throw new Error(data.message || 'Forecast error');
  }

  const forecastContainer = document.querySelector('.forecast');
  forecastContainer.innerHTML = '';

  data.list.forEach(item => {
    const time = new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit' });
    const temp = Math.round(item.main.temp);
    const iconCode = item.weather[0].icon;

    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.innerHTML = `
      <p>${time}</p>
      <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="">
      <p>${temp}°C</p>
    `;
    forecastContainer.appendChild(forecastItem);
  });
}

function setBackgroundVideo(weatherCondition) {
  const bgVideo = document.getElementById("bgVideo");
  let videoSource = "default.mp4";

  // Set video based on weather condition
  if (weatherCondition.includes("clear")) {
    videoSource = "sunny.mp4";
  } else if (weatherCondition.includes("cloud")) {
    videoSource = "cloudy.mp4";
  } else if (weatherCondition.includes("rain") || weatherCondition.includes("drizzle")) {
    videoSource = "rainy.mp4";
  } else if (weatherCondition.includes("snow")) {
    videoSource = "snow.mp4";
  } else if (weatherCondition.includes("thunder") || weatherCondition.includes("storm")) {
    videoSource = "storm.mp4";
  }

  // Only change source if different
  if (!bgVideo.src.includes(videoSource)) {
    bgVideo.src = `assets/videos/${videoSource}`;
    bgVideo.load();
    bgVideo.play().catch(e => console.log("Video play error:", e));
  }
}

function showError(message) {
  const errorElement = document.getElementById('error-message');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  document.getElementById('temperature').textContent = '--°C';
  document.getElementById('city-name').textContent = 'Error';
  document.getElementById('description').textContent = '';
  document.getElementById('weather-icon').src = 'https://openweathermap.org/img/wn/01d@2x.png';
  
  // Show error for 5 seconds then reset
  setTimeout(() => {
    if (document.getElementById('city-name').textContent === 'Error') {
      document.getElementById('city-name').textContent = 'Weather App';
      document.getElementById('description').textContent = 'Search for a city';
      errorElement.style.display = 'none';
    }
  }, 5000);
}

// Add event listener for Enter key
document.getElementById('city-input').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    getWeather();
  }
});