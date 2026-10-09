const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  course: { type: String, required: true, trim: true },
  age: { type: Number, required: true, min: 1 },
});

module.exports = mongoose.model("Student", studentSchema);