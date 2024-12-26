const express = require("express");
const path = require("path");

const router = express.Router();

// Route to serve movie files
router.get("/:name_movie", (req, res) => {
  const movieName = req.params.name_movie;
  const moviePath = path.join(
    __dirname,
    "../assets/movies", // Ensure this path is correct
    `${movieName}`
  );

  console.log("Requested movie path:", moviePath); // Debugging log

  // Send the file, with proper error handling
  res.sendFile(moviePath, (err) => {
    if (err) {
      // If the file cannot be sent, handle the error properly
      console.error(`Error sending file: ${err.message}`);

      // Only send a response if the headers haven't been sent yet
      if (!res.headersSent) {
        res
          .status(err.code === "ENOENT" ? 404 : 500)
          .send("Movie not found or cannot be accessed.");
      }
    }
  });
});

module.exports = router;
