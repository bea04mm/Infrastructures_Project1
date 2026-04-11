import React, { useEffect, useMemo, useState } from "react"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import AddIcon from "@mui/icons-material/Add"
import { useNavigate } from "react-router-dom"
import Scheduler from "../src"
import EventModal from "./EventModal"
import ConfirmModal from "./ConfirmModal"
import { authHeaders, clearToken } from "./auth"

const API_URL = "http://localhost:8000"

const schedulerState = {
  options: {
    transitionMode: "zoom",
    startWeekOn: "mon",
    defaultMode: "month",
    minWidth: 540,
    maxWidth: 1024,
    minHeight: 540,
    maxHeight: 720
  },
  alertProps: {
    open: false,
    color: "info",
    severity: "info",
    message: "",
    showActionButton: false,
    showNotification: false,
    delay: 1500
  },
  toolbarProps: {
    showSearchBar: false,
    showSwitchModeButtons: true,
    showDatePicker: true
  }
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value))
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value))
}

function toLocalInputValue(value) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toDateOnly(value) {
  return new Date(value).toISOString().split("T")[0]
}

function getDayList(start, end) {
  const days = []
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)

  const last = new Date(end)
  last.setHours(0, 0, 0, 0)

  while (cursor <= last) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export default function App() {
  const navigate = useNavigate()
  const [rawEvents, setRawEvents] = useState([])
  const [query, setQuery] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [inlineEditingId, setInlineEditingId] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState(null)
  const [inlineForm, setInlineForm] = useState({
    name: "",
    start_date: "",
    end_date: ""
  })
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: ""
  })

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    const response = await fetch(`${API_URL}/events`, {
      headers: authHeaders()
    })

    if (response.status === 401) {
      clearToken()
      navigate("/login")
      return
    }

    const data = await response.json()
    setRawEvents(data)
  }

  function openCreateModal() {
    setInlineEditingId(null)
    setEditingId(null)
    setForm({ name: "", start_date: "", end_date: "" })
    setModalOpen(true)
  }

  function openEditModal(eventId) {
    const event = rawEvents.find((item) => String(item.id) === String(eventId))
    if (!event) return

    setInlineEditingId(null)
    setEditingId(event.id)
    setForm({
      name: event.name,
      start_date: toLocalInputValue(event.start_date),
      end_date: toLocalInputValue(event.end_date)
    })
    setModalOpen(true)
  }

  function openInlineEdit(event) {
    setEditingId(null)
    setInlineEditingId(event.id)
    setInlineForm({
      name: event.name,
      start_date: toLocalInputValue(event.start_date),
      end_date: toLocalInputValue(event.end_date)
    })
  }

  function openDeleteConfirm(event) {
    setDeletingEvent(event)
    setDeleteConfirmOpen(true)
  }

  function closeDeleteConfirm() {
    setDeleteConfirmOpen(false)
    setDeletingEvent(null)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function cancelInlineEdit() {
    setInlineEditingId(null)
    setInlineForm({ name: "", start_date: "", end_date: "" })
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateInlineForm(field, value) {
    setInlineForm((prev) => ({ ...prev, [field]: value }))
  }

  async function saveEvent(eventId, payload, method) {
    const response = await fetch(eventId ? `${API_URL}/events/${eventId}` : `${API_URL}/events`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders()
      },
      body: JSON.stringify(payload)
    })

    if (response.status === 401) {
      clearToken()
      navigate("/login")
      return
    }

    await loadEvents()
  }

  async function handleSubmit(e) {
    e.preventDefault()

    await saveEvent(
      editingId,
      {
        name: form.name,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString()
      },
      editingId ? "PUT" : "POST"
    )

    closeModal()
  }

  async function handleInlineUpdate(e) {
    e.preventDefault()

    await saveEvent(
      inlineEditingId,
      {
        name: inlineForm.name,
        start_date: new Date(inlineForm.start_date).toISOString(),
        end_date: new Date(inlineForm.end_date).toISOString()
      },
      "PUT"
    )

    cancelInlineEdit()
  }

  async function handleDeleteEvent() {
    if (!deletingEvent) return

    const response = await fetch(`${API_URL}/events/${deletingEvent.id}`, {
      method: "DELETE",
      headers: authHeaders()
    })

    if (response.status === 401) {
      clearToken()
      navigate("/login")
      return
    }

    closeDeleteConfirm()
    await loadEvents()
  }

  const filteredRawEvents = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return rawEvents
    return rawEvents.filter((event) => event.name.toLowerCase().includes(value))
  }, [rawEvents, query])

  const schedulerEvents = useMemo(() => {
    return filteredRawEvents.flatMap((event, index) => {
      const start = new Date(event.start_date)
      const end = new Date(event.end_date)
      const days = getDayList(start, end)

      return days.map((day, dayIndex) => ({
        id: `${event.id}-${toDateOnly(day)}`,
        eventId: event.id,
        label: event.name,
        groupLabel: "Event",
        user: "Event",
        color: ["#1976d2", "#9c27b0", "#2e7d32", "#ed6c02"][index % 4],
        startHour: dayIndex === 0 ? formatTime(start) : "00:00",
        endHour: dayIndex === days.length - 1 ? formatTime(end) : "23:59",
        date: toDateOnly(day),
        createdAt: new Date(),
        createdBy: "Backend"
      }))
    })
  }, [filteredRawEvents])

  function handleTaskClick(task) {
    const clickedId = task?.eventId ?? task?.id?.split("-")[0] ?? task?.task?.id
    if (clickedId) openEditModal(clickedId)
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal} sx={{ m: 2, borderRadius: 999 }}>
            Add
          </Button>
        </Box>

        {schedulerEvents.length > 0 && (
          <Scheduler
            key={schedulerEvents.map((e) => e.id).join("|")}
            locale="en"
            events={schedulerEvents}
            legacyStyle={false}
            options={schedulerState.options}
            alertProps={schedulerState.alertProps}
            toolbarProps={schedulerState.toolbarProps}
            onEventsChange={() => {}}
            onCellClick={() => {}}
            onTaskClick={handleTaskClick}
            onAlertCloseButtonClicked={() => {}}
          />
        )}
      </Paper>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={2} flexWrap="wrap">
        <Typography variant="h6" fontWeight={700}>
          Events
        </Typography>

        <TextField
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{
            width: 340,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: "background.paper",
              transition: "all 0.2s ease",
              "&:hover": {
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
              },
              "&.Mui-focused": {
                boxShadow: "0 4px 14px rgba(25, 118, 210, 0.15)"
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
        />
      </Stack>

      <Stack spacing={1.5}>
        {filteredRawEvents.length === 0 ? (
          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No events found.
            </Typography>
          </Paper>
        ) : (
          filteredRawEvents.map((event, index) => {
            const isEditing = inlineEditingId === event.id

            return (
              <Accordion
                key={event.id}
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                  "&:before": { display: "none" },
                  "&.Mui-expanded": { margin: 0 }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: "grey.50" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ width: "100%" }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {event.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(event.start_date)} → {formatDateTime(event.end_date)}
                      </Typography>
                    </Box>

                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        label="Event"
                        size="small"
                        sx={{
                          bgcolor: ["primary.main", "secondary.main", "success.main", "warning.main"][index % 4],
                          color: "common.white",
                          fontWeight: 600
                        }}
                      />

                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          openInlineEdit(event)
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteConfirm(event)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </AccordionSummary>

                <AccordionDetails sx={{ backgroundColor: "background.paper" }}>
                  {!isEditing ? (
                    <Stack spacing={1.5}>
                      <Typography variant="body2">
                        <strong>Start:</strong> {formatDateTime(event.start_date)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>End:</strong> {formatDateTime(event.end_date)}
                      </Typography>
                    </Stack>
                  ) : (
                    <Box component="form" onSubmit={handleInlineUpdate}>
                      <Stack spacing={2}>
                        <TextField
                          label="Event title"
                          value={inlineForm.name}
                          onChange={(e) => updateInlineForm("name", e.target.value)}
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="Start date"
                          type="datetime-local"
                          value={inlineForm.start_date}
                          onChange={(e) => updateInlineForm("start_date", e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="End date"
                          type="datetime-local"
                          value={inlineForm.end_date}
                          onChange={(e) => updateInlineForm("end_date", e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          size="small"
                        />

                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button onClick={cancelInlineEdit}>Cancel</Button>
                          <Button type="submit" variant="contained">
                            Update
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            )
          })
        )}
      </Stack>

      <EventModal
        open={modalOpen}
        title={editingId ? "Edit event" : "New event"}
        submitLabel={editingId ? "Update" : "Save"}
        form={form}
        onChange={updateForm}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={deleteConfirmOpen}
        title="Delete event"
        description={
          deletingEvent
            ? `Are you sure you want to delete "${deletingEvent.name}"? This action cannot be undone.`
            : "Are you sure you want to delete this event?"
        }
        confirmLabel="Delete"
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteEvent}
      />
    </Box>
  )
}
