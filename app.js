const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
app.use(express.json());
let db = null;

initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  const details = request.body;
  const { username, name, password, gender, location } = details;
  const hashedPassword = await bcrypt.hash(password, 10);
  const dbQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbResponse = await db.get(dbQuery);
  if (dbResponse !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else if (dbResponse === undefined && password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const dbQuery = `
        INSERT INTO user(username,name,password,gender,location) 
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
            );`;
    await db.run(dbQuery);
    response.send("User created successfully");
  }
});

app.post("/login", async (request, response) => {
  const userDetails = request.body;
  const { username, password } = userDetails;
  const dbQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbResponse = await db.get(dbQuery);
  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordSame = await bcrypt.compare(password, dbResponse.password);
    if (isPasswordSame === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const userDetails = request.body;
  const { username, oldPassword, newPassword } = userDetails;
  const dbQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbResponse = await db.get(dbQuery);
  const isPasswordSame = await bcrypt.compare(oldPassword, dbResponse.password);
  if (isPasswordSame === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const dbQuery = `
            UPDATE 
                user 
            SET 
                password='${hashedPassword}' 
            WHERE 
                username='${username}';`;
      await db.run(dbQuery);
      response.send("Password updated");
    }
  }
});

module.exports = app;
