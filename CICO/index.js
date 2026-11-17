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

app.get('/', async function (req, res) {
    const searchTerm = (req.query.search || '').trim();
    const sql = `SELECT food_entries.id, dateTime, foodName, calories,
    servingSize, unit, meals.name as 'meal',
    group_concat(tags.name) as 'selected_tags' FROM food_entries
    LEFT JOIN meals ON food_entries.meal_id = meals.id
    LEFT JOIN food_entries_tags ON food_entries_tags.food_entry_id = food_entries.id
    LEFT JOIN tags ON food_entries_tags.tag_id = tags.id
    WHERE food_entries.foodName LIKE ?
    GROUP BY food_entries.id, dateTime, foodName, calories, servingSize, unit, meal`;

    const [rows] = await dbConnection.execute(sql, [`%${searchTerm}%`]);

    res.render('index', {
        pageTitle: 'Food Entries',
        foodEntries: rows,
        searchTerm: searchTerm
    });
});

app.get("/food-entry/create", async function (req, res) {
    const [meals] = await dbConnection.execute("SELECT * FROM meals");
    const [tags] = await dbConnection.execute("SELECT * FROM tags");
    res.render('create-food-entry', {
        pageTitle: 'Add Food Entry',
        meals,
        tags,

    });
});

app.post('/food-entry/create', async function (req, res, next) {
    const connection = await dbConnection.getConnection();
    try {
        await connection.beginTransaction();
        const { dateTime, foodName, calories, servingSize, meal, unit } = req.body;
        const sql = `INSERT INTO food_entries (dateTime, foodName, calories, meal_id,
        servingSize, unit) VALUES(?, ?, ?, ?, ?, ?);`

        const values = [dateTime, foodName, calories, meal || '1', servingSize, unit];

        const [results] = await connection.execute(sql, values);
        const newFoodEntryID = results.insertId;

        const tags = [...new Set(req.body.tags || [])];
        for (let t of tags) {
            const sql = `INSERT INTO food_entries_tags (food_entry_id, tag_id) VALUE (?, ?)`;
            await connection.execute(sql, [newFoodEntryID, t]);
        }
        await connection.commit();
        res.redirect('/');

    } catch (e) {

        await connection.rollback();
        console.error(e);
        next(e);
    } finally {
        connection.release();
    }

});

app.get('/food-entry/:id/edit', async function (req, res) {
    const foodRecordID = req.params.id;
    const [foodEntries] = await dbConnection.execute(`
    SELECT * FROM food_entries WHERE id = ?`,
        [foodRecordID]);
    const foodEntry = foodEntries[0];

    const [foodEntryTags] = await dbConnection.execute(`SELECT * FROM
    food_entries_tags WHERE food_entry_id = ?`, [foodRecordID]);

    const [meals] = await dbConnection.execute("SELECT * FROM meals");

    const [tags] = await dbConnection.execute("SELECT * FROM tags");
    res.render('edit-food-entry', {
        pageTitle: 'Edit Food Entry',
        foodEntry,
        meals: meals,
        tags: tags,
        relatedTags: foodEntryTags.map(t => t.tag_id)
    })
});

app.post('/food-entry/:id/edit', async function (req, res, next) {
    const connection = await dbConnection.getConnection();
    try {
        await connection.beginTransaction();
        const foodEntryID = req.params.id;
        const sql = `UPDATE food_entries SET dateTime=?,
        foodName=?,
        calories=?,
        meal_id=?,
        servingSize=?,
        unit=?
        WHERE id =?;`
        const bindings = [
            req.body.dateTime,
            req.body.foodName,
            req.body.calories,
            req.body.meal || '1',
            req.body.servingSize,
            req.body.unit,
            foodEntryID
        ];

        // delete all existing tags from the food record
        await connection.execute(`DELETE FROM food_entries_tags WHERE
        food_entry_id = ?`, [foodEntryID]);

        // re-add all the relationships
        const tags = [...new Set(req.body.tags || [])];
        for (let t of tags) {
            const sql = `INSERT INTO food_entries_tags (food_entry_id, tag_id)
            VALUE (?, ?)`;
            await connection.execute(sql, [foodEntryID, t]);
        }

        const results = await connection.execute(sql, bindings)
        await connection.commit();
        res.redirect('/')
    } catch (e) {
        console.error(e);
        await connection.rollback();
        next(e);
    } finally {
        await connection.release();
    }

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