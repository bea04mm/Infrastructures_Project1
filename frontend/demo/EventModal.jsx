import React from "react"
import { Modal, Box, Typography, TextField, Button, Stack } from "@mui/material"

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 440,
  bgcolor: "background.paper",
  borderRadius: 3,
  boxShadow: 24,
  p: 3
}

export default function EventModal({
  open,
  title,
  submitLabel,
  form,
  onChange,
  onClose,
  onSubmit
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style} component="form" onSubmit={onSubmit}>
        <Typography variant="h6" mb={2} fontWeight={700}>
          {title}
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Event title"
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Start date"
            type="datetime-local"
            value={form.start_date}
            onChange={(e) => onChange("start_date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            fullWidth
          />

          <TextField
            label="End date"
            type="datetime-local"
            value={form.end_date}
            onChange={(e) => onChange("end_date", e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            fullWidth
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {submitLabel}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  )
}