import ReactDOM from "react-dom"
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom"
import App from "./pages/App"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import UsersManagementPage from "./pages/UsersManagementPage"
import EventLogsPage from "./pages/EventLogsPage"
import PresentationPage from "../pages/PresentationPage"
import AppHeader from "./components/AppHeader"
import AppFooter from "./components/AppFooter"
import { clearToken, getToken, isAdmin } from "./auth"
import { Box, Container } from "@mui/material"
import "./styles.css"
import EventKioskPage from "./pages/EventKioskPage"

function RequireAuth() {
	return getToken() ? <Outlet /> : <Navigate to="/login" replace />
}

function RequireAdmin() {
	return getToken() && isAdmin() ? <Outlet /> : <Navigate to="/login" replace />
}

function AppLayout() {
	return (
		<Box sx={{ minHeight: "100vh", bgcolor: "#f6f8fc" }}>
			<AppHeader
				onLogout={() => {
					clearToken()
					window.location.assign("/login")
				}}
			/>
			<Container maxWidth="xl" sx={{ py: 3 }}>
				<Outlet />
			</Container>
			<AppFooter />
		</Box>
	)
}

ReactDOM.render(
	<BrowserRouter>
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/presentation" element={<PresentationPage />} />
			<Route element={<AppLayout />}>
				<Route path="/kiosk" element={<EventKioskPage />} />
				<Route element={<RequireAuth />}>
					<Route path="/*" element={<App />} />
					<Route path="/users" element={<UsersManagementPage />} />
					<Route path="/event-logs" element={<EventLogsPage />} />
				</Route>
				<Route element={<RequireAdmin />}>
					<Route path="/register" element={<RegisterPage />} />
				</Route>
			</Route>
		</Routes>
	</BrowserRouter>,
	document.getElementById("root")
)
