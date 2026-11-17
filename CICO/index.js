const express = require("express");
const mysql2 = require("mysql2/promise");
const ejs = require("ejs");
const expressLayouts = require('express-ejs-layouts');
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = 3000;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true,
    port: process.env.DB_PORT
}

const dbConnection = mysql2.createPool(dbConfig);

app.set("view engine", "ejs");
app.set("views", "./views");

app.set('layout', 'layout');
app.locals.pageTitle = 'Food Entries';
app.use(expressLayouts);
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    const [rows] = await dbConnection.execute("SELECT * FROM food_entries");
    res.render("index", { pageTitle: 'Food Entries', foodEntries: rows });
})

app.get("/food-entry/create", function(req,res){
    res.render('create-food-entry', { pageTitle: 'Add Food Entry' });
});

// app.post('/food-entry/create', async (req, res) => {
//     const { dateTime, foodName, calories, servingSize, unit } = req.body;
//     console.log(dateTime, foodName, calories, servingSize, unit);
//     res.send("Food entry added successfully");
// })

app.post('/food-entry/create', async (req, res) => {
    const { dateTime, foodName, calories, servingSize, unit } = req.body;

    const query = `INSERT INTO food_entries
    (dateTime, foodName, calories, servingSize, unit)
    VALUES (?, ?, ?, ?, ?)`;
    const values = [dateTime, foodName, calories, servingSize, unit];
    await dbConnection.execute(query, values);
    res.redirect("/");
});

app.get("/food-entry/:id/edit", async (req, res) => {
    const [rows] = await dbConnection.execute("SELECT * FROM food_entries WHERE  id = ?", [req.params.id]);
    const foodEntry = rows[0];
    res.render("edit-food-entry", { pageTitle: 'Edit Food Entry', foodEntry });
});

app.post("/food-entry/:id/edit", async (req, res) => {
    const { dateTime, foodName, calories, servingSize, unit } = req.body;

    const query = `UPDATE food_entries SET dateTime = ?, foodName = ?,
    calories = ?, servingSize = ?, unit = ? WHERE id = ?`;
    const values = [dateTime, foodName, calories, servingSize, unit,
        req.params.id];
    await dbConnection.execute(query, values);
    res.redirect("/");
});

app.get("/food-entry/:id/delete", async (req, res) => {
    const [rows] = await dbConnection.execute("SELECT * FROM food_entries WHERE id = ?",
    [req.params.id]);
    res.render("delete-food-entry", { pageTitle: 'Delete Food Entry', foodEntry: rows[0] });
});

app.post("/food-entry/:id/delete", async (req, res) => {
    await dbConnection.execute("DELETE FROM food_entries WHERE id = ?", [req.params.id]);

    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});