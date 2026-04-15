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

export default function EventKioskPage() {
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

    // Filter out events that have already ended
    const now = new Date()
    const activeEvents = data.filter(event => new Date(event.end_date) >= now)
    
    setEvents(activeEvents)
    setLoading(false)
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage("")
    setError("")

    // Check if selected event has ended
    const selectedEvent = events.find(event => String(event.id) === form.event_id)
    if (!selectedEvent || new Date(selectedEvent.end_date) < new Date()) {
      setError("This event has ended and registrations are no longer available")
      return
    }

    const response = await fetch(`${API_URL}/kiosk/join`, {
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

    setMessage("You have successfully requested access to the network. Your login credentials have been sent to your email address.")
    setForm({ event_id: "", name: "", email: "", accept_terms: false })
  }

  return (
    <Box sx={{ display: "grid", placeItems: "center" }}>
      <Paper sx={{ width: "100%", maxWidth: 620, p: 4, borderRadius: 4 }} elevation={2}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Web Event Kiosk
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select your event and fill in your details to join the network.
            </Typography>
          </Box>

          <Alert severity="info">
            After registration, your network credentials will be sent to your email address.
          </Alert>

          {message ? <Alert severity="success">{message}</Alert> : null}
          {error ? <Alert severity="error">{error}</Alert> : null}

          {loading ? (
            <Alert severity="info">Loading events...</Alert>
          ) : events.length === 0 ? (
            <Alert severity="warning">No active events available for registration.</Alert>
          ) : null}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <FormControl fullWidth required disabled={loading || events.length === 0}>
                <InputLabel id="event-select-label">Event</InputLabel>
                <Select
                  labelId="event-select-label"
                  label="Event"
                  value={form.event_id}
                  onChange={(e) => updateForm("event_id", e.target.value)}
                  disabled={loading || events.length === 0}
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
                disabled={events.length === 0}
              />

              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                required
                fullWidth
                disabled={events.length === 0}
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.accept_terms}
                    onChange={(e) => updateForm("accept_terms", e.target.checked)}
                    disabled={events.length === 0}
                  />
                }
                label="I accept the terms and conditions to join the network"
              />

              <Button 
                type="submit" 
                variant="contained" 
                size="large"
                disabled={loading || events.length === 0 || !form.event_id || !form.name || !form.email || !form.accept_terms}
              >
                Join network
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  )
}
