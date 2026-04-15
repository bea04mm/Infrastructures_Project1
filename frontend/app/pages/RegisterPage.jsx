import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Container, Paper, Stack, TextField, Typography, Alert, CircularProgress } from "@mui/material"
import { authHeaders, clearToken } from "../auth"
import { API_URL } from "../apiConfig"

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: "", email: "", password: "" })
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")

    if (form.password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (response.status === 401) {
        clearToken()
        navigate("/login")
        return
      }

      if (!response.ok) {
        setError(data.detail || "Registration failed")
        setLoading(false)
        return
      }

      navigate("/users")
    } catch (err) {
      setError("An error occurred during registration")
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
                Create New User
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add a new user to the application
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Full Name"
              value={form.full_name}
              onChange={(e) => updateForm("full_name", e.target.value)}
              required
              fullWidth
              disabled={loading}
            />
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
              helperText="Minimum 6 characters"
            />
            <TextField
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              required
              fullWidth
              disabled={loading}
            />

            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Button 
                onClick={() => navigate("/users")} 
                variant="text"
                disabled={loading}
              >
                Back to Users
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : "Create User"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  )
}
