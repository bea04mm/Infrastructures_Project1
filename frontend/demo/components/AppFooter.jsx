import React from "react"
import { Box, Typography } from "@mui/material"

export default function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        textAlign: "center",
        color: "text.secondary",
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper"
      }}
    >
      <Typography variant="body2">Captive Portal Scheduler</Typography>
    </Box>
  )
}
