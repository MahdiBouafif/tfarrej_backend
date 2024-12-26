const express = require("express");
const axios = require("axios");
const MovieHistory = require("../models/movieHistoryModel"); // Import the MovieHistory model
const router = express.Router();

// Import necessary functions and models
const {
  syncMovies,
  getMoviesByCategory,
  getAllMovies,
  updatePosters,
} = require("../src/movie/movieController");

const formatMovieResponse = require("../src/movie/formatMovieResponse");
console.log(formatMovieResponse); // This should log the function definition

const Movie = require("../src/movie/Movie");
require("dotenv").config(); // Load environment variables

// Route to sync movies with TMDB data
router.get("/sync", syncMovies);

// Route to fetch movies by category from TMDB

router.get("/:category", async (req, res) => {
  const { category } = req.params;

  try {
    const tmdbResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${category}`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: "en-US",
        },
      }
    );

    const tmdbMovies = tmdbResponse.data?.results || [];
    const moviesInDB = await Movie.find();
    const dbMovieMap = new Map(
      moviesInDB.map((movie) => [String(movie.tmdb_id), movie])
    );

    // Format movies using `formatMovieResponse`
    const formattedMovies = tmdbMovies
      .map((tmdbMovie) => {
        const movieFromDB = dbMovieMap.get(String(tmdbMovie.id));
        if (!movieFromDB) return null; // Skip if not in DB
        return formatMovieResponse(tmdbMovie, movieFromDB);
      })
      .filter((movie) => movie !== null); // Remove nulls

    res.json(formattedMovies);
  } catch (error) {
    console.error("Error in /movies/:category:", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Route to update movie posters
router.get("/update-posters", updatePosters);

// Endpoint to get a single movie by TMDB ID
router.get("/idmovie/:tmdb_id", async (req, res) => {
  const { tmdb_id } = req.params;

  try {
    const movie = await Movie.findOne({ tmdb_id });
    if (!movie) {
      return res
        .status(404)
        .json({ message: "Film non trouvé dans la base de données." });
    }

    // Fetch detailed movie data from TMDB API
    const tmdbResponse = await axios.get(
      `https://api.themoviedb.org/3/movie/${tmdb_id}`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: "en-US",
        },
      }
    );

    const tmdbData = tmdbResponse.data;
    const response = formatMovieResponse(tmdbData, movie);

    res.json(response);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// Route to fetch all movies
router.get("/", async (req, res) => {
  try {
    const moviesInDB = await Movie.find();

    const formattedMovies = moviesInDB
      .filter((movie) => movie.link) // Only include movies with a valid link
      .map((movie) => formatMovieResponse(null, movie)); // Pass `null` for `tmdbData`

    res.json(formattedMovies);
  } catch (error) {
    console.error("Error fetching all movies:", error.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// POST route to handle movie history
router.post("/history", async (req, res) => {
  console.log("POST /movies/history request received"); // Log when the route is hit
  try {
    const { email, movieId, date } = req.body;

    // Validate incoming data
    if (!email || !movieId || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Search for an existing record with the same email and movieId, but a different date
    const existingHistory = await MovieHistory.findOne({
      email: email,
      movieId: movieId,
    });

    // If a record is found, delete it
    if (existingHistory) {
      console.log("Found existing record, deleting it...");
      await MovieHistory.deleteOne({ _id: existingHistory._id }); // Delete the existing record
    }

    // Create and insert the new record
    const newHistory = new MovieHistory({
      email,
      movieId,
      date: new Date(date), // Ensure the date is in the correct format
    });

    await newHistory.save(); // Save the new record

    res
      .status(201)
      .json({
        message: "Movie history updated successfully",
        data: newHistory,
      });
  } catch (error) {
    console.error("Error saving movie history:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET route to load the movie history by email
router.get("/gethistory", async (req, res) => {
  const { email } = req.query;

  try {
    // Check if the email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Query the database for the movie history
    const history = await MovieHistory.find({ email: email });

    if (!history || history.length === 0) {
      return res
        .status(404)
        .json({ message: "No movie history found for this email" });
    }

    // Return the movie history
    res.json(history);
  } catch (error) {
    // Log the error to the console for more details
    console.error("Error in /movies/gethistory:", error);

    // Send back a detailed error message
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
