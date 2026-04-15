import React, { useState, useEffect } from "react"
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material"
import OpenInNewIcon from "@mui/icons-material/OpenInNew"
import { authHeaders, clearToken } from "../auth"
import { useNavigate } from "react-router-dom"

const API_URL = "http://localhost:8000"

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getConnectionStatus(guest) {
  if (guest.is_connected) {
    return <Chip label="Connected" color="success" size="small" variant="outlined" />
  }
  return <Chip label="Disconnected" color="default" size="small" variant="outlined" />
}

export default function EventLogsPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_URL}/events`, {
        headers: authHeaders(),
      })

      if (response.status === 401) {
        clearToken()
        navigate("/login")
        return
      }

      if (!response.ok) {
        setError("Failed to load events")
        return
      }

      const data = await response.json()
      setEvents(data)
    } catch (err) {
      setError("An error occurred while loading events")
    } finally {
      setLoading(false)
    }
  }

  async function loadGuestLogs(eventId) {
    setSelectedEventId(eventId)
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_URL}/events/${eventId}/guests`, {
        headers: authHeaders(),
      })

      if (response.status === 401) {
        clearToken()
        navigate("/login")
        return
      }

      if (!response.ok) {
        setError("Failed to load event logs")
        return
      }

      const data = await response.json()
      setGuests(data)
      
      // Find and set the selected event details
      const event = events.find(e => e.id === eventId)
      setSelectedEvent(event)
    } catch (err) {
      setError("An error occurred while loading logs")
    } finally {
      setLoading(false)
    }
  }

  function handleEventChange(event) {
    const eventId = event.target.value
    if (eventId) {
      loadGuestLogs(eventId)
    } else {
      setSelectedEventId(null)
      setGuests([])
      setSelectedEvent(null)
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Attendance Logs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          View the attendance history of participants in your events
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select an event</InputLabel>
            <Select
              value={selectedEventId || ""}
              onChange={handleEventChange}
              label="Select an event"
            >
              <MenuItem value="">
                <em>-- Select an event --</em>
              </MenuItem>
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.name} ({formatDateTime(event.start_date)})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {selectedEvent && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: "white" }}>
            <Stack spacing={1}>
              <Typography variant="h6" fontWeight={600}>
                {selectedEvent.name}
              </Typography>
              <Typography variant="body2">
                {formatDateTime(selectedEvent.start_date)} to{" "}
                {formatDateTime(selectedEvent.end_date)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total registered participants: <strong>{guests.length}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Currently connected: <strong>
                  {guests.filter(g => g.is_connected).length}
                </strong>
              </Typography>
            </Stack>
          </Paper>
        )}

        {selectedEvent && (
          <TableContainer component={Paper}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            ) : guests.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No participants registered for this event
                </Typography>
              </Box>
            ) : (
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "black", fontWeight: 600 }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ color: "black", fontWeight: 600 }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ color: "black", fontWeight: 600 }}>
                      Join Time
                    </TableCell>
                    <TableCell sx={{ color: "black", fontWeight: 600 }} align="center">
                      Status
                    </TableCell>
                    <TableCell sx={{ color: "black", fontWeight: 600 }}>
                      Last Activity
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guests.map((guest) => (
                    <TableRow
                      key={guest.id}
                      hover
                      sx={{
                        bgcolor: guest.is_connected ? "success.light" : "grey.50",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {guest.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{guest.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(guest.joined_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {getConnectionStatus(guest)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {guest.last_activity_at
                            ? formatDateTime(guest.last_activity_at)
                            : "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}
      </Box>
    </Container>
  )
}
