const express = require('express')
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json())

// AUTH
app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'TODO: create new user' })
})

app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'TODO: log in user' })
})

// TODOS
app.get('/api/todos', (req, res) => {
  res.json({ message: 'TODO: return todos' })
})

app.post('/api/todos', (req, res) => {
  res.json({ message: 'TODO: create new todo' })
})

app.put('/api/todos/:id', (req, res) => {
  res.json({ message: 'TODO: update todo' })
})

app.delete('/api/todos/:id', (req, res) => {
  res.json({ message: 'TODO: delete todo' })
})

// TIMER / SESSIONS
app.get('/api/sessions', (req, res) => {
  res.json({ message: 'TODO: return past sessions' })
})

app.post('/api/sessions', (req, res) => {
  res.json({ message: 'TODO: save new session' })
})

// ANALYTICS
app.get('/api/analytics', (req, res) => {
  res.json({ message: 'TODO: return analytics stats' })
})

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));