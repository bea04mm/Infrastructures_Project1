import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Box, Button, Container, Paper, Stack, TextField, Typography, Alert } from "@mui/material"
import { setToken, setCurrentUser, authHeaders } from "../auth"

const API_URL = "http://localhost:8000"

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || "Login failed")
        setLoading(false)
        return
      }

      setToken(data.access_token)
      
      // Fetch current user info
      const userResponse = await fetch(`${API_URL}/auth/me`, {
        headers: authHeaders()
      })
      
      if (userResponse.ok) {
        const user = await userResponse.json()
        setCurrentUser(user)
      }
      
      navigate("/")
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#f6f8fc" }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, borderRadius: 4 }} elevation={3}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Event Kiosk
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to manage events.
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
              type="email"
              required
              fullWidth
              disabled={loading}
            />
            <TextField
              label="Password"
              value={form.password}
              onChange={(e) => updateForm("password", e.target.value)}
              type="password"
              required
              fullWidth
              disabled={loading}
            />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Default: admin@gmail.com / admin
              </Typography>
            </Stack>

            <Button type="submit" variant="contained" fullWidth disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
