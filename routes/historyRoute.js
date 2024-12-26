const express = require("express");
const MovieHistory = require("../models/movieHistoryModel"); // Import the MovieHistory model
const router = express.Router();

// Route to fetch movie history by email
router.get("/gethistory", async (req, res) => {
  const { email } = req.query;

  try {
    // Check if the email is provided
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Query the database for the movie history
    const history = await MovieHistory.find({ email: email });

    if (!history || history.length === 0) {
      return res.status(404).json({ message: 'No movie history found for this email' });
    }

    // Return the movie history
    res.json(history);
  } catch (error) {
    // Log the error to the console for more details
    console.error("Error in /gethistory:", error);

    // Send back a detailed error message
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
