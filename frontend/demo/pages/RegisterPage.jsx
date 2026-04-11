import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material"

const API_URL = "http://localhost:8000"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: "", email: "", password: "" })
  const [error, setError] = useState("")

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || "Register failed")
      return
    }

    navigate("/login")
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#f6f8fc" }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 4 }} elevation={3}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Register
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create your account.
              </Typography>
            </Box>

            <TextField
              label="Full name"
              value={form.full_name}
              onChange={(e) => updateForm("full_name", e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
              type="email"
              required
              fullWidth
            />
            <TextField
              label="Password"
              value={form.password}
              onChange={(e) => updateForm("password", e.target.value)}
              type="password"
              required
              fullWidth
            />

            {error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            ) : null}

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                Already have an account? <Link to="/login">Login</Link>
              </Typography>
              <Button type="submit" variant="contained">
                Register
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
