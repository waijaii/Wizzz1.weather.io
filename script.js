const API_KEY = "31a717f83b904d0b1d03be7c9184f24c";
const GEOCODING_API = "https://api.openweathermap.org/geo/1.0/direct";
const WEATHER_API = "https://api.openweathermap.org/data/2.5/weather";

const elements = {
  cityInput: document.getElementById("cityInput"),
  searchButton: document.getElementById("searchButton"),
  weatherResult: document.getElementById("weatherResult"),
  errorMessage: document.getElementById("errorMessage"),
  autocomplete: document.getElementById("autocomplete"),
  loading: document.querySelector(".loading"),
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

function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

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

// Autocomplete functions
async function fetchSuggestions(query) {
  try {
    elements.loading.style.display = "block";
    const response = await fetch(
      `${GEOCODING_API}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
    );
    if (!response.ok) throw new Error("Suggestions unavailable");
    return await response.json();
  } finally {
    elements.loading.style.display = "none";
  }
}

function showSuggestions(suggestions) {
  const items = suggestions
    .map(
      (city) => `
        <div class="autocomplete-item" data-name="${city.name}, ${city.country}">
            ${city.name}, ${city.country}
        </div>
    `
    )
    .join("");
  elements.autocomplete.innerHTML = `<div class="autocomplete-items">${items}</div>`;
}

function clearSuggestions() {
  elements.autocomplete.innerHTML = "";
}

const handleInput = debounce(async (query) => {
  if (query.length < 2) {
    clearSuggestions();
    return;
  }
  try {
    const suggestions = await fetchSuggestions(query);
    suggestions.length > 0 ? showSuggestions(suggestions) : clearSuggestions();
  } catch {
    clearSuggestions();
  }
}, 300);

// Event Listeners
elements.searchButton.addEventListener("click", handleSearch);
elements.cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

elements.cityInput.addEventListener("input", (e) => {
  handleInput(e.target.value.trim());
});

elements.autocomplete.addEventListener("click", (e) => {
  if (e.target.classList.contains("autocomplete-item")) {
    elements.cityInput.value = e.target.dataset.name;
    handleSearch();
    clearSuggestions();
  }
});

document.addEventListener("click", (e) => {
  if (!elements.autocomplete.contains(e.target)) {
    clearSuggestions();
  }
});

// Initial Hong Kong weather load
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const hongKongCoords = await getCoordinates("Hong Kong");
    const weatherData = await getWeather(
      hongKongCoords.lat,
      hongKongCoords.lon
    );
    displayWeather(hongKongCoords, weatherData);
  } catch {
    showError("Failed to load initial weather data");
  }
});
