require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Student = require("./models/Student");

const app = express();
const PORT = process.env.PORT || 5000;

// << MIDDLEWARE >>
app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json()); // reads req.body

// << MongoDB >>
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// << HELPERS >>
function validateStudent(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const course = typeof body.course === "string" ? body.course.trim() : "";
  const age = Number(body.age);

  if (!name) return { error: "Name is required." };
  if (!course) return { error: "Course is required." };
  if (body.age === "" || body.age === null || body.age === undefined || !Number.isFinite(age) || age < 1 || age > 120) {
    return { error: "Age must be a number between 1 and 120." };
  }
  return { data: { name, course, age } };
}

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

// << ROUTES >>

// READ 
app.get("/students", async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to retrieve students.", detail: err.message });
  }
});

// CREATE 
app.post("/students", async (req, res) => {
  const { error, data } = validateStudent(req.body || {});
  if (error) return res.status(400).json({ message: error });

  try {
    const student = new Student(data);
    const saved = await student.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to add student.", detail: err.message });
  }
});

// UPDATE 
app.put("/students/:id", async (req, res) => {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ message: "Invalid student ID." });

  const { error, data } = validateStudent(req.body || {});
  if (error) return res.status(400).json({ message: error });

  try {
    const updated = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Student not found." });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update student.", detail: err.message });
  }
});

// DELETE
app.delete("/students/:id", async (req, res) => {
  const { id } = req.params;
  if (!validId(id)) return res.status(400).json({ message: "Invalid student ID." });

  try {
    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Student not found." });
    res.json({ message: "Student deleted.", id });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete student.", detail: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
