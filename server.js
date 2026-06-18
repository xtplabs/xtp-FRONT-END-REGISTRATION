const express = require("express");
const app = express();
const db = require("better-sqlite3")("app.db");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.set("view engine", "ejs");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    gmail TEXT UNIQUE,
    gender TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

app.get("/", (req, res) => {
    res.render("homepage", {
        errors: [],
        formData: {}
    });
});

app.post("/register", (req, res) => {
    try {

        let errors = [];

        if (!req.body.name || !req.body.name.trim()) {
            errors.push("Full name must be filled");
        }

        if (!req.body.number || !req.body.number.trim()) {
            errors.push("Phone number must be filled");
        }

        if (!req.body.gender) {
            errors.push("You must select a gender");
        }

        if (errors.length > 0) {
            return res.render("homepage", {
                errors,
                formData: req.body
            });
        }

        const insertion = db.prepare(`
            INSERT INTO users
            (name, phone, gmail, gender)
            VALUES (?, ?, ?, ?)
        `).run(
            req.body.name,
            req.body.number,
            req.body.email || null,
            req.body.gender
        );

        const user = db.prepare(`
            SELECT *
            FROM users
            WHERE id = ?
        `).get(insertion.lastInsertRowid);

        const registrationId = `XTP-${String(user.id).padStart(4, "0")}`;

        const discountEligible = user.id <= 10;

        res.render("dashboard", {
            user,
            registrationId,
            discountEligible
        });

    } catch (error) {

        if (error.message.includes("UNIQUE")) {
            return res.render("homepage", {
                errors: [
                    "Phone number or email already exists."
                ],
                formData: req.body
            });
        }

        console.log(error);
        res.status(500).send("Server Error");
    }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});