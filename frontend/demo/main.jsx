import React from "react"
import ReactDOM from "react-dom"
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom"
import App from "./App"
import LoginPage from "./LoginPage"
import RegisterPage from "./RegisterPage"
import AppHeader from "./AppHeader"
import AppFooter from "./AppFooter"
import { clearToken, getToken } from "./auth"
import { Box, Container } from "@mui/material"
import "./styles.css"

function RequireAuth() {
	return getToken() ? <Outlet /> : <Navigate to="/login" replace />
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
			<Route path="/register" element={<RegisterPage />} />
			<Route element={<RequireAuth />}>
				<Route element={<AppLayout />}>
					<Route path="/*" element={<App />} />
				</Route>
			</Route>
		</Routes>
	</BrowserRouter>,
	document.getElementById("root")
)
