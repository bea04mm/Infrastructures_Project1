import React from "react"
import Scheduler from "../src"

const events = [
  {
    id: "event-1",
    label: "Medical consultation",
    groupLabel: "Dr Shaun Murphy",
    user: "Dr Shaun Murphy",
    color: "#f28f6a",
    startHour: "09:00 AM",
    endHour: "10:00 AM",
    date: "2026-03-19",
    createdAt: new Date(),
    createdBy: "Local Demo"
  },
  {
    id: "event-2",
    label: "Team sync",
    groupLabel: "Engineering",
    user: "Engineering",
    color: "#099ce5",
    startHour: "11:00 AM",
    endHour: "12:00 PM",
    date: "2026-03-20",
    createdAt: new Date(),
    createdBy: "Local Demo"
  }
]

const schedulerState = {
  options: {
    transitionMode: "zoom",
    startWeekOn: "mon",
    defaultMode: "month",
    minWidth: 540,
    maxWidth: 1024,
    minHeight: 540,
    maxHeight: 720
  },
  alertProps: {
    open: true,
    color: "info",
    severity: "info",
    message: "Local project1 demo is running.",
    showActionButton: true,
    showNotification: true,
    delay: 1500
  },
  toolbarProps: {
    showSearchBar: true,
    showSwitchModeButtons: true,
    showDatePicker: true
  }
}

export default function App() {
  return (
    <div className="page">
      <h1>react-mui-scheduler local demo</h1>
      <Scheduler
        locale="en"
        events={events}
        legacyStyle={false}
        options={schedulerState.options}
        alertProps={schedulerState.alertProps}
        toolbarProps={schedulerState.toolbarProps}
        onEventsChange={() => {}}
        onCellClick={() => {}}
        onTaskClick={() => {}}
        onAlertCloseButtonClicked={() => {}}
      />
    </div>
  )
}
