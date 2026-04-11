import React, { useEffect, useState } from "react"
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Checkbox,
  TextField,
  Typography
} from "@mui/material"

const API_URL = "http://localhost:8000"

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value))
}

export default function CaptivePortalPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    event_id: "",
    name: "",
    email: "",
    accept_terms: false
  })

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    setError("")

    const response = await fetch(`${API_URL}/events/public`)
    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || "Failed to load events")
      setLoading(false)
      return
    }

    setEvents(data)
    setLoading(false)
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage("")
    setError("")

    const response = await fetch(`${API_URL}/portal/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: Number(form.event_id),
        name: form.name,
        email: form.email,
        accept_terms: form.accept_terms
      })
    })

    const data = await response.json()

    if (!response.ok) {
      setError(data.detail || "Could not submit request")
      return
    }

    setMessage("You have successfully requested access to the network.")
    setForm({ event_id: "", name: "", email: "", accept_terms: false })
  }

  return (
    <Box sx={{ display: "grid", placeItems: "center" }}>
      <Paper sx={{ width: "100%", maxWidth: 620, p: 4, borderRadius: 4 }} elevation={2}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Web Captive Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select your event and fill in your details to join the network.
            </Typography>
          </Box>

          {message ? <Alert severity="success">{message}</Alert> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <FormControl fullWidth required>
                <InputLabel id="event-select-label">Event</InputLabel>
                <Select
                  labelId="event-select-label"
                  label="Event"
                  value={form.event_id}
                  onChange={(e) => updateForm("event_id", e.target.value)}
                  disabled={loading}
                >
                  {events.map((event) => (
                    <MenuItem key={event.id} value={String(event.id)}>
                      {event.name} ({formatDate(event.start_date)} - {formatDate(event.end_date)})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Full name"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                required
                fullWidth
              />

              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                required
                fullWidth
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.accept_terms}
                    onChange={(e) => updateForm("accept_terms", e.target.checked)}
                  />
                }
                label="I accept the terms and conditions to join the network"
              />

              <Button type="submit" variant="contained" size="large">
                Join network
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  )
}
