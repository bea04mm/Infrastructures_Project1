import React from "react"
import {
  Modal,
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Chip,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 600,
  bgcolor: "background.paper",
  borderRadius: 3,
  boxShadow: 24,
  p: 3,
  maxHeight: "90vh",
  overflow: "auto",
}

export default function EventDetailModal({
  open,
  event,
  guestsByEvent,
  guestsLoadingByEvent,
  onClose,
  onEdit,
  onDelete,
  colorIndex,
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 3,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} mb={1}>
              {event?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {event?.formattedStart} → {event?.formattedEnd}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ ml: 2 }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={2}>
          {/* Guests Section */}
          <Accordion
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 40 }}
            >
              <Typography variant="body2" fontWeight={600}>
                Guests ({(guestsByEvent[event?.id] || []).length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {guestsLoadingByEvent[event?.id] ? (
                <Typography variant="body2" color="text.secondary">
                  Loading guests...
                </Typography>
              ) : (guestsByEvent[event?.id] || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No guests registered.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {(guestsByEvent[event?.id] || []).map((guest) => (
                    <Paper
                      key={guest.id}
                      variant="outlined"
                      sx={{
                        px: 1.5,
                        py: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {guest.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {guest.email}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          bgcolor: guest.is_connected
                            ? "#2e7d32"
                            : "#d32f2f",
                          flexShrink: 0,
                        }}
                        title={
                          guest.is_connected
                            ? "Connected"
                            : "Disconnected"
                        }
                      />
                    </Paper>
                  ))}
                </Stack>
              )}
            </AccordionDetails>
          </Accordion>

          {/* Action Buttons */}
          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                onClose()
                onDelete()
              }}
            >
              Delete
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => {
                onClose()
                onEdit()
              }}
            >
              Edit
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  )
}
