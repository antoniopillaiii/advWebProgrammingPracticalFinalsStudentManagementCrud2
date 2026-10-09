import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/students`;
const emptyForm = { name: "", course: "", age: "" };

function errorText(err, fallback) {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.request) return "Cannot reach the server. Is `node server.js` running?";
  return fallback;
}

export default function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); 

  // READ
  const fetchStudents = async () => {
    try {
      const res = await axios.get(API_URL);
      setStudents(res.data);
    } catch (err) {
      setNotice({ type: "error", text: errorText(err, "Failed to load students.") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const validate = () => {
    const age = Number(form.age);
    if (!form.name.trim()) return "Name is required.";
    if (!form.course.trim()) return "Course is required.";
    if (form.age.toString().trim() === "" || !Number.isFinite(age) || age < 1 || age > 120)
      return "Age must be a number between 1 and 120.";
    return null;
  };

  // CREATE and UPDATE 
  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setNotice({ type: "error", text: problem });

    const payload = { name: form.name.trim(), course: form.course.trim(), age: Number(form.age) };
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload);
        setNotice({ type: "success", text: "Student updated." });
      } else {
        await axios.post(API_URL, payload);
        setNotice({ type: "success", text: "Student added." });
      }
      resetForm();
      await fetchStudents(); 
    } catch (err) {
      setNotice({ type: "error", text: errorText(err, "Could not save the student.") });
    } finally {
      setSaving(false);
    }
  };

  // EDIT
  const handleEdit = (student) => {
    setEditingId(student._id);
    setForm({ name: student.name, course: student.course, age: String(student.age) });
    setNotice(null);
  };

  // DELETE
  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_URL}/${student._id}`);
      if (editingId === student._id) resetForm();
      setNotice({ type: "success", text: "Student deleted." });
      await fetchStudents();
    } catch (err) {
      setNotice({ type: "error", text: errorText(err, "Could not delete the student.") });
    }
  };

  return (
    <div className="page">
      <h1>Student Management System</h1>
      <p className="sub">MERN CRUD: React, Axios, Express, Mongoose, MongoDB Atlas</p>

      {notice && <div className={`notice ${notice.type}`} role="status">{notice.text}</div>}

      <section className="panel">
        <h2>{editingId ? "Edit student" : "Add student"}</h2>
        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Juan Dela Cruz" />
          </div>
          <div className="field">
            <label htmlFor="course">Course</label>
            <input id="course" name="course" value={form.course} onChange={handleChange} placeholder="BSIT" />
          </div>
          <div className="field">
            <label htmlFor="age">Age</label>
            <input id="age" name="age" type="number" min="1" max="120" value={form.age} onChange={handleChange} placeholder="20" />
          </div>
          <div className="actions">
            <button className="btn" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update Student" : "Add Student"}
            </button>
            {editingId && (
              <button className="btn secondary" type="button" onClick={resetForm} disabled={saving}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Students ({students.length})</h2>
        {loading ? (
          <p className="empty">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="empty">No students yet. Add one using the form above.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Course</th><th>Age</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} className={editingId === student._id ? "editing" : ""}>
                  <td data-label="Name">{student.name}</td>
                  <td data-label="Course">{student.course}</td>
                  <td data-label="Age">{student.age}</td>
                  <td className="row-actions">
                    <button className="btn small" onClick={() => handleEdit(student)}>Edit</button>
                    <button className="btn small danger" onClick={() => handleDelete(student)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
