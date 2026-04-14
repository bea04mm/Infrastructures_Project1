import React, { useState } from "react"
import { AppBar, Box, IconButton, Toolbar as MuiToolbar, Typography, Menu, MenuItem, Divider } from "@mui/material"
import LogoutIcon from "@mui/icons-material/Logout"
import MenuIcon from "@mui/icons-material/Menu"
import AccountCircleIcon from "@mui/icons-material/AccountCircle"
import { getToken, isAdmin, getCurrentUser } from "../auth"
import { useNavigate } from "react-router-dom"

export default function AppHeader({ onLogout }) {
  const navigate = useNavigate()
  const isLoggedIn = Boolean(getToken())
  const [anchorEl, setAnchorEl] = useState(null)
  const user = getCurrentUser()

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleMenuClose()
    onLogout()
  }

  const handleNavigate = (path) => {
    handleMenuClose()
    navigate(path)
  }

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
        <Box sx={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          <Typography variant="h6" fontWeight={800}>
            Event Kiosk
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your events from one place
          </Typography>
        </Box>
        
        {isLoggedIn ? (
          <Box>
            <IconButton
              onClick={handleMenuOpen}
              color="inherit"
              aria-label="user menu"
              size="large"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem disabled>
                <AccountCircleIcon sx={{ mr: 1, fontSize: 18 }} />
                <Typography variant="body2">
                  {user?.full_name || "User"}
                </Typography>
              </MenuItem>
              <Divider />
              {isAdmin() && (
                <>
                  <MenuItem onClick={() => handleNavigate("/users")}>
                    Manage Users
                  </MenuItem>
                  <MenuItem onClick={() => handleNavigate("/register")}>
                    Create User
                  </MenuItem>
                  <Divider />
                </>
              )}
              <MenuItem onClick={() => handleNavigate("/presentation")}>
                View Presentation
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : null}
      </MuiToolbar>
    </AppBar>
  )
}
