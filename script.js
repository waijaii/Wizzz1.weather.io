// script.js
const API_KEY = "31a717f83b904d0b1d03be7c9184f24c"; // Replace with your actual API key
const GEOCODING_API = "https://api.openweathermap.org/geo/1.0/direct";
const WEATHER_API = "https://api.openweathermap.org/data/2.5/weather";

const elements = {
  cityInput: document.getElementById("cityInput"),
  searchButton: document.getElementById("searchButton"),
  weatherResult: document.getElementById("weatherResult"),
  errorMessage: document.getElementById("errorMessage"),
  weatherElements: {
    cityName: document.getElementById("cityName"),
    temperature: document.getElementById("temperature"),
    weatherDescription: document.getElementById("weatherDescription"),
    humidity: document.getElementById("humidity"),
    windSpeed: document.getElementById("windSpeed"),
    feelsLike: document.getElementById("feelsLike"),
    clouds: document.getElementById("clouds"),
    weatherIcon: document.getElementById("weatherIcon"),
  },
};

async function getCoordinates(city) {
  try {
    const response = await fetch(
      `${GEOCODING_API}?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
    );

    if (!response.ok) throw new Error("Geocoding failed");

    const data = await response.json();
    if (!data.length) throw new Error("City not found");

    return {
      lat: data[0].lat,
      lon: data[0].lon,
      name: data[0].name,
      country: data[0].country,
    };
  } catch (error) {
    throw new Error(`Location error: ${error.message}`);
  }
}

async function getWeather(lat, lon) {
  try {
    const response = await fetch(
      `${WEATHER_API}?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Weather data unavailable");
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Weather error: ${error.message}`);
  }
}

function displayWeather(geoData, weatherData) {
  const { weatherElements } = elements;

  weatherElements.cityName.textContent = `${geoData.name}, ${geoData.country}`;
  weatherElements.temperature.textContent = `${Math.round(
    weatherData.main.temp
  )}°C`;
  weatherElements.weatherDescription.textContent =
    weatherData.weather[0].description;
  weatherElements.humidity.textContent = weatherData.main.humidity;
  weatherElements.windSpeed.textContent = weatherData.wind.speed;
  weatherElements.feelsLike.textContent = Math.round(
    weatherData.main.feels_like
  );
  weatherElements.clouds.textContent = weatherData.clouds.all;

  weatherElements.weatherIcon.src = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;
  elements.weatherResult.style.display = "block";
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = "block";
  elements.weatherResult.style.display = "none";
}

async function handleSearch() {
  const city = elements.cityInput.value.trim();
  if (!city) return;

  try {
    const geoData = await getCoordinates(city);
    const weatherData = await getWeather(geoData.lat, geoData.lon);
    displayWeather(geoData, weatherData);
    elements.errorMessage.style.display = "none";
  } catch (error) {
    showError(error.message);
  }

  elements.cityInput.value = "";
}

// Event Listeners
elements.searchButton.addEventListener("click", handleSearch);
elements.cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

// Initial load
handleSearch(); // Optional: Remove if you don't want initial load
