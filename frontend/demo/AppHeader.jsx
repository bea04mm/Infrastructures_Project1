import React from "react"
import { AppBar, Box, IconButton, Toolbar as MuiToolbar, Typography } from "@mui/material"
import LogoutIcon from "@mui/icons-material/Logout"
import { getToken } from "./auth"

export default function AppHeader({ onLogout }) {
  const isLoggedIn = Boolean(getToken())

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "divider"
      }}
    >
      <MuiToolbar sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" fontWeight={800}>
            Captive Portal Scheduler
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your events from one place.
          </Typography>
        </Box>
        {isLoggedIn ? (
          <IconButton color="inherit" onClick={onLogout} aria-label="logout">
            <LogoutIcon />
          </IconButton>
        ) : null}
      </MuiToolbar>
    </AppBar>
  )
}