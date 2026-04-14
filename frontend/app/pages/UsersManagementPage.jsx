import React, { useState, useEffect } from "react"
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Modal
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import { authHeaders, clearToken } from "../auth"
import { useNavigate } from "react-router-dom"

const API_URL = "http://localhost:8000"

export default function UsersManagementPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [openForm, setOpenForm] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState(null)
  const [editingUserId, setEditingUserId] = useState(null)
  const [form, setForm] = useState({ full_name: "", email: "", password: "" })

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: authHeaders()
      })

      if (response.status === 401) {
        clearToken()
        navigate("/login")
        return
      }

      if (response.status === 403) {
        setError("You do not have permission to access this page")
        return
      }

      if (!response.ok) {
        setError("Failed to load users")
        return
      }

      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError("An error occurred while loading users")
    } finally {
      setLoading(false)
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function openCreateForm() {
    setEditingUserId(null)
    setForm({ full_name: "", email: "", password: "" })
    setOpenForm(true)
  }

  function openEditForm(user) {
    setEditingUserId(user.id)
    setForm({ full_name: user.full_name, email: user.email, password: "" })
    setOpenForm(true)
  }

  async function handleSubmit() {
    setError("")
    setSuccess("")

    if (!form.full_name || !form.email) {
      setError("Full name and email are required")
      return
    }

    if (editingUserId === null && !form.password) {
      setError("Password is required for new users")
      return
    }

    try {
      const endpoint = editingUserId 
        ? `${API_URL}/admin/users/${editingUserId}`
        : `${API_URL}/auth/register`
      
      const method = editingUserId ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      })

      if (response.status === 401) {
        clearToken()
        navigate("/login")
        return
      }

      if (response.status === 403) {
        setError("You do not have permission to perform this action")
        return
      }

      if (!response.ok) {
        const data = await response.json()
        setError(data.detail || "Failed to save user")
        return
      }

      setOpenForm(false)
      setForm({ full_name: "", email: "", password: "" })
      setSuccess(editingUserId ? "User updated successfully" : "User created successfully")
      loadUsers()

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("An error occurred while saving user")
    }
  }

  function openDeleteConfirm(userId) {
    setDeletingUserId(userId)
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    setError("")
    try {
      const response = await fetch(`${API_URL}/admin/users/${deletingUserId}`, {
        method: "DELETE",
        headers: authHeaders()
      })

      if (response.status === 401) {
        clearToken()
        navigate("/login")
        return
      }

      if (response.status === 403) {
        setError("You do not have permission to delete this user")
        setDeleteConfirmOpen(false)
        return
      }

      if (!response.ok) {
        const data = await response.json()
        setError(data.detail || "Failed to delete user")
        setDeleteConfirmOpen(false)
        return
      }

      setDeleteConfirmOpen(false)
      setDeletingUserId(null)
      setSuccess("User deleted successfully")
      loadUsers()

      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("An error occurred while deleting user")
    }
  }

  if (error === "You do not have permission to access this page") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          You do not have permission to access this page. Only administrators can manage users.
        </Alert>
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create, edit, and delete application users
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateForm}
          sx={{ alignSelf: "flex-start" }}
        >
          Create New User
        </Button>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.full_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.is_admin ? (
                          <Chip label="Admin" size="small" color="primary" variant="outlined" />
                        ) : (
                          <Chip label="User" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => openEditForm(user)}
                          title="Edit user"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => openDeleteConfirm(user.id)}
                          title="Delete user"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      {/* Form Modal */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUserId ? "Edit User" : "Create New User"}
          <IconButton
            onClick={() => setOpenForm(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Full Name"
              value={form.full_name}
              onChange={(e) => updateForm("full_name", e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => updateForm("password", e.target.value)}
              fullWidth
              required={editingUserId === null}
              placeholder={editingUserId ? "Leave empty to keep current password" : ""}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUserId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
