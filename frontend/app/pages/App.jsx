import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import Scheduler from "../../src";
import EventModal from "../components/EventModal";
import EventDetailModal from "../components/EventDetailModal";
import ConfirmModal from "../components/ConfirmModal";
import { authHeaders, clearToken, getCurrentUser } from "../auth";
import { API_URL } from "../apiConfig";

const schedulerState = {
  options: {
    transitionMode: "zoom",
    startWeekOn: "mon",
    defaultMode: "month",
    minWidth: 540,
    maxWidth: 1024,
    minHeight: 540,
    maxHeight: 720,
  },
  alertProps: {
    open: false,
    color: "info",
    severity: "info",
    message: "",
    showActionButton: false,
    showNotification: false,
    delay: 1500,
  },
  toolbarProps: {
    showSearchBar: false,
    showSwitchModeButtons: false,
    showDatePicker: true,
  },
};

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function toLocalInputValue(value) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toDateOnly(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayList(start, end) {
  const days = [];
  
  // Extract date parts without timezone issues
  const startDate = new Date(start);
  const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  
  const endDate = new Date(end);
  const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const cursor = new Date(startDateOnly);
  const last = new Date(endDateOnly);

  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

export default function App() {
  const navigate = useNavigate();
  const [rawEvents, setRawEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [guestsByEvent, setGuestsByEvent] = useState({});
  const [guestsLoadingByEvent, setGuestsLoadingByEvent] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [inlineForm, setInlineForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadEvents();
    registerWebhook();
  }, []);

  async function loadEvents() {
    const response = await fetch(`${API_URL}/events`, {
      headers: authHeaders(),
    });

    if (response.status === 401) {
      clearToken();
      navigate("/login");
      return;
    }

    const data = await response.json();
    setRawEvents(data);
  }

  async function registerWebhook() {
    try {
      const response = await fetch(`${API_URL}/webhooks/register`, {
        method: "POST",
        headers: authHeaders(),
      });

      if (response.status === 401) {
        clearToken();
        navigate("/login");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("[WEBHOOK] Registration result:", data);
      }
    } catch (error) {
      console.error("[WEBHOOK] Registration error:", error);
    }
  }

  async function loadGuestsForEvent(eventId) {
    if (guestsLoadingByEvent[eventId]) return;

    setGuestsLoadingByEvent((prev) => ({ ...prev, [eventId]: true }));

    const response = await fetch(`${API_URL}/events/${eventId}/guests`, {
      headers: authHeaders(),
    });

    if (response.status === 401) {
      clearToken();
      navigate("/login");
      return;
    }

    const data = await response.json();
    setGuestsByEvent((prev) => ({
      ...prev,
      [eventId]: response.ok ? data : [],
    }));
    setGuestsLoadingByEvent((prev) => ({ ...prev, [eventId]: false }));
  }

  function openCreateModal() {
    setInlineEditingId(null);
    setEditingId(null);
    setForm({ name: "", start_date: "", end_date: "" });
    setModalOpen(true);
  }

  function openEditModal(eventId) {
    const event = rawEvents.find((item) => String(item.id) === String(eventId));
    if (!event) return;

    setInlineEditingId(null);
    setEditingId(event.id);
    setForm({
      name: event.name,
      start_date: toLocalInputValue(event.start_date),
      end_date: toLocalInputValue(event.end_date),
    });
    setModalOpen(true);
  }

  function openInlineEdit(event) {
    setEditingId(null);
    setInlineEditingId(event.id);
    setInlineForm({
      name: event.name,
      start_date: toLocalInputValue(event.start_date),
      end_date: toLocalInputValue(event.end_date),
    });
  }

  function openDeleteConfirm(event) {
    setDeletingEvent(event);
    setDeleteConfirmOpen(true);
  }

  function closeDeleteConfirm() {
    setDeleteConfirmOpen(false);
    setDeletingEvent(null);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function openDetailModal(event) {
    setSelectedEventForDetail(event);
    setDetailModalOpen(true);
    loadGuestsForEvent(event.id);
  }

  function closeDetailModal() {
    setDetailModalOpen(false);
    setSelectedEventForDetail(null);
  }

  function cancelInlineEdit() {
    setInlineEditingId(null);
    setInlineForm({ name: "", start_date: "", end_date: "" });
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateInlineForm(field, value) {
    setInlineForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveEvent(eventId, payload, method) {
    setError("");
    const response = await fetch(
      eventId ? `${API_URL}/events/${eventId}` : `${API_URL}/events`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      },
    );

    if (response.status === 401) {
      clearToken();
      navigate("/login");
      return;
    }

    if (!response.ok) {
      const data = await response.json();
      setError(data.detail || "An error occurred while saving the event");
      return;
    }

    await loadEvents();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    await saveEvent(
      editingId,
      {
        name: form.name,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
      },
      editingId ? "PUT" : "POST",
    );

    // Only close modal if there's no error
    if (!error) {
      closeModal();
    }
  }

  async function handleInlineUpdate(e) {
    e.preventDefault();

    await saveEvent(
      inlineEditingId,
      {
        name: inlineForm.name,
        start_date: new Date(inlineForm.start_date).toISOString(),
        end_date: new Date(inlineForm.end_date).toISOString(),
      },
      "PUT",
    );

    // Only cancel inline edit if there's no error
    if (!error) {
      cancelInlineEdit();
    }
  }

  async function handleDeleteEvent() {
    if (!deletingEvent) return;

    const response = await fetch(`${API_URL}/events/${deletingEvent.id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (response.status === 401) {
      clearToken();
      navigate("/login");
      return;
    }

    closeDeleteConfirm();
    await loadEvents();
  }

  const filteredRawEvents = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return rawEvents;
    return rawEvents.filter((event) =>
      event.name.toLowerCase().includes(value),
    );
  }, [rawEvents, query]);

  const schedulerEvents = useMemo(() => {
    return filteredRawEvents.flatMap((event, index) => {
      const start = new Date(event.start_date);
      const end = new Date(event.end_date);
      const days = getDayList(start, end);

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
        createdBy: "Backend",
      }));
    });
  }, [filteredRawEvents]);

  function handleTaskClick(eventOrE, task) {
    // Handle both single argument (scheduler) and two arguments (MonthModeView)
    const taskObj = task || eventOrE;
    const clickedId =
      taskObj?.eventId ?? taskObj?.id?.split("-")[0] ?? taskObj?.task?.id;
    if (clickedId) {
      const event = rawEvents.find((item) => String(item.id) === String(clickedId));
      if (event) openDetailModal(event);
    }
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={3}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        
        {/* Welcome Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ mb: 1, color: "text.primary"}}>
            Welcome back, {getCurrentUser()?.full_name || "User"}!
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, color: "text.primary" }}>
            You have {filteredRawEvents.length} event
            {filteredRawEvents.length !== 1 ? "s" : ""} in the system
          </Typography>
        </Paper>

        {/* Scheduler */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateModal}
              sx={{ borderRadius: 999 }}
            >
              Add Event
            </Button>
          </Box>

          <Box sx={{
            "& .MuiTableCell-root": {
              cursor: "default !important",
            },
          }}>
            <Scheduler
              key={schedulerEvents.map((e) => e.id).join("|")}
              locale="en"
              events={schedulerEvents}
              legacyStyle={false}
              options={schedulerState.options}
              alertProps={schedulerState.alertProps}
              toolbarProps={schedulerState.toolbarProps}
              onEventsChange={() => {}}
              onTaskClick={handleTaskClick}
              onAlertCloseButtonClicked={() => {}}
            />
          </Box>
        </Paper>

        {/* Events List */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            gap={2}
            flexWrap="wrap"
          >
            <Typography variant="h6" fontWeight={700}>
              All Events
            </Typography>

            <TextField
              size="small"
              placeholder="Search events..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{
                width: { xs: "100%", sm: 340 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  backgroundColor: "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  },
                  "&.Mui-focused": {
                    boxShadow: "0 4px 14px rgba(25, 118, 210, 0.15)",
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
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
              <>
                {/* Upcoming Events */}
                {filteredRawEvents.filter(e => new Date(e.end_date) >= new Date()).length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="text.secondary">
                      Upcoming Events
                    </Typography>
                    <Stack spacing={1.5}>
                      {filteredRawEvents
                        .filter(e => new Date(e.end_date) >= new Date())
                        .map((event) => {
                          const colorIndex = rawEvents.findIndex(e => e.id === event.id);
                          const colorOptions = [
                            "#1976d2",
                            "#9c27b0",
                            "#2e7d32",
                            "#ed6c02",
                          ];
                          const eventColor = colorOptions[colorIndex % 4];

                          return (
                            <Paper
                              key={event.id}
                              onClick={() => openDetailModal(event)}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: "3px solid",
                                borderColor: eventColor,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                },
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                spacing={2}
                              >
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={700}>
                                    {event.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDateTime(event.start_date)} →{" "}
                                    {formatDateTime(event.end_date)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Paper>
                          );
                        })}
                    </Stack>
                  </Box>
                )}

                {/* Past Events */}
                {filteredRawEvents.filter(e => new Date(e.end_date) < new Date()).length > 0 && (
                  <Box mt={3}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1.5} color="text.secondary">
                      Past Events
                    </Typography>
                    <Stack spacing={1.5}>
                      {filteredRawEvents
                        .filter(e => new Date(e.end_date) < new Date())
                        .map((event) => {
                          const colorIndex = rawEvents.findIndex(e => e.id === event.id);
                          const colorOptions = [
                            "#1976d2",
                            "#9c27b0",
                            "#2e7d32",
                            "#ed6c02",
                          ];
                          const eventColor = colorOptions[colorIndex % 4];

                          return (
                            <Paper
                              key={event.id}
                              onClick={() => openDetailModal(event)}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: "3px solid",
                                borderColor: eventColor,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                opacity: 0.6,
                                "&:hover": {
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                  opacity: 1,
                                },
                              }}
                            >
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                                spacing={2}
                              >
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={700}>
                                    {event.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDateTime(event.start_date)} →{" "}
                                    {formatDateTime(event.end_date)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Paper>
                          );
                        })}
                    </Stack>
                  </Box>
                )}
              </>
            )}
          </Stack>
        </Box>
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

      {selectedEventForDetail && (
        <EventDetailModal
          open={detailModalOpen}
          event={{
            ...selectedEventForDetail,
            formattedStart: formatDateTime(selectedEventForDetail.start_date),
            formattedEnd: formatDateTime(selectedEventForDetail.end_date),
          }}
          guestsByEvent={guestsByEvent}
          guestsLoadingByEvent={guestsLoadingByEvent}
          onClose={closeDetailModal}
          onEdit={() => {
            closeDetailModal();
            openEditModal(selectedEventForDetail.id);
          }}
          onDelete={() => {
            closeDetailModal();
            openDeleteConfirm(selectedEventForDetail);
          }}
          colorIndex={rawEvents.findIndex(
            (e) => e.id === selectedEventForDetail.id
          )}
        />
      )}

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
  );
}
