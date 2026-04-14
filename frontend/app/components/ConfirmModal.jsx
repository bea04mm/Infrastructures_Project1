import React from "react"
import {
  Modal,
  Box,
  Typography,
  Button,
  Stack
} from "@mui/material"

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: 400,
  bgcolor: "background.paper",
  borderRadius: 3,
  boxShadow: 24,
  p: 3,
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onClose,
  onConfirm
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" mb={2} fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {description}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button onClick={onClose}>{cancelLabel}</Button>
          <Button onClick={onConfirm} color="error" variant="contained">
            {confirmLabel}
          </Button>
        </Stack>
      </Box>
    </Modal>
  )
}
