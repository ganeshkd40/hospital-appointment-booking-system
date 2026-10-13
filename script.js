const doctors = [
  {
    id: "d1",
    name: "Dr. Ananya Rao",
    specialization: "Cardiology",
    experience: 12,
    fee: 700,
    icon: "♥",
  },
  {
    id: "d2",
    name: "Dr. Rahul Varma",
    specialization: "Dermatology",
    experience: 8,
    fee: 500,
    icon: "✦",
  },
  {
    id: "d3",
    name: "Dr. Priya Sharma",
    specialization: "Pediatrics",
    experience: 10,
    fee: 600,
    icon: "☼",
  },
  {
    id: "d4",
    name: "Dr. Kiran Reddy",
    specialization: "Orthopedics",
    experience: 15,
    fee: 800,
    icon: "✚",
  },
  {
    id: "d5",
    name: "Dr. Meera Nair",
    specialization: "Neurology",
    experience: 9,
    fee: 750,
    icon: "◉",
  },
  {
    id: "d6",
    name: "Dr. Arjun Kumar",
    specialization: "General Medicine",
    experience: 7,
    fee: 400,
    icon: "＋",
  },
];

const STORAGE_KEY = "carepointAppointments";
const slots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];
const doctorList = document.getElementById("doctorList");
const specializationFilter = document.getElementById("specializationFilter");
const doctorSelect = document.getElementById("doctorSelect");
const dateInput = document.getElementById("appointmentDate");
const timeSelect = document.getElementById("appointmentTime");
const bookingForm = document.getElementById("bookingForm");
const bookingMessage = document.getElementById("bookingMessage");
const patientSection = document.getElementById("patientSection");
const adminSection = document.getElementById("adminSection");

function getAppointments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveAppointments(appointments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}
function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
dateInput.min = localDateString();

function fillDoctorOptions() {
  doctors.forEach((doctor) => {
    const option = document.createElement("option");
    option.value = doctor.id;
    option.textContent = `${doctor.name} — ${doctor.specialization}`;
    doctorSelect.appendChild(option);
  });
  [...new Set(doctors.map((d) => d.specialization))]
    .sort()
    .forEach((specialty) => {
      const option = document.createElement("option");
      option.value = specialty;
      option.textContent = specialty;
      specializationFilter.appendChild(option);
    });
}
function renderDoctors() {
  const filter = specializationFilter.value;
  const visibleDoctors = doctors.filter(
    (d) => filter === "All" || d.specialization === filter,
  );
  doctorList.innerHTML = "";
  visibleDoctors.forEach((doctor) => {
    const column = document.createElement("div");
    column.className = "col-md-6 col-lg-4";
    column.innerHTML = `
      <article class="doctor-card">
        <div class="doctor-top">
          <div class="doctor-avatar" aria-hidden="true">${doctor.icon}</div>
          <div><div class="doctor-name">${doctor.name}</div><div class="doctor-specialty">${doctor.specialization}</div></div>
        </div>
        <span class="tag">${doctor.experience}+ years experience</span>
        <div class="doctor-meta"><span>Consultation fee</span><strong>₹${doctor.fee}</strong></div>
        <button type="button" class="btn btn-outline-primary" data-doctor="${doctor.id}">Book appointment</button>
      </article>`;
    column.querySelector("button").addEventListener("click", () => {
      doctorSelect.value = doctor.id;
      refreshSlots();
      document
        .getElementById("bookingPanel")
        .scrollIntoView({ behavior: "smooth", block: "start" });
    });
    doctorList.appendChild(column);
  });
}
function refreshSlots() {
  const doctorId = doctorSelect.value;
  const date = dateInput.value;
  timeSelect.innerHTML = "";
  if (!doctorId || !date) {
    timeSelect.disabled = true;
    timeSelect.add(new Option("Choose a doctor and date first", ""));
    return;
  }
  timeSelect.disabled = false;
  const appointments = getAppointments();
  const now = new Date();
  const isToday = date === localDateString();
  let availableCount = 0;
  timeSelect.add(new Option("Select an available time", ""));
  slots.forEach((slot) => {
    const booked = appointments.some(
      (a) =>
        a.doctorId === doctorId &&
        a.date === date &&
        a.time === slot &&
        a.status !== "Cancelled",
    );
    const hourMinute = slot.match(/(\d+):(\d+) (AM|PM)/);
    let hour = Number(hourMinute[1]) % 12;
    if (hourMinute[3] === "PM") hour += 12;
    const slotDate = new Date(
      `${date}T${String(hour).padStart(2, "0")}:${hourMinute[2]}:00`,
    );
    const past = isToday && slotDate <= now;
    if (!booked && !past) {
      timeSelect.add(new Option(slot, slot));
      availableCount++;
    }
  });
  if (!availableCount)
    timeSelect.add(new Option("No slots available for this date", ""));
}
function showMessage(message, type) {
  bookingMessage.textContent = message;
  bookingMessage.className = `alert alert-${type}`;
  bookingMessage.scrollIntoView({ behavior: "smooth", block: "center" });
}
function resetValidation() {
  bookingForm
    .querySelectorAll(".is-invalid")
    .forEach((el) => el.classList.remove("is-invalid"));
}
function renderAdmin() {
  const appointments = getAppointments().sort((a, b) =>
    `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
  );
  const today = localDateString();
  document.getElementById("totalCount").textContent = appointments.filter(
    (a) => a.status !== "Cancelled",
  ).length;
  document.getElementById("upcomingCount").textContent = appointments.filter(
    (a) => a.status !== "Cancelled" && a.date >= today,
  ).length;
  document.getElementById("doctorCount").textContent = doctors.length;
  const tbody = document.getElementById("appointmentRows");
  tbody.innerHTML = "";
  document
    .getElementById("emptyAppointments")
    .classList.toggle("d-none", appointments.length > 0);
  appointments.forEach((appointment) => {
    const doctor = doctors.find((d) => d.id === appointment.doctorId);
    const tr = document.createElement("tr");
    const cells = [
      `${appointment.patientName}`,
      doctor ? doctor.name : "Unknown doctor",
      doctor ? doctor.specialization : "—",
      appointment.date,
      appointment.time,
      appointment.phone,
    ];
    cells.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    const actionCell = document.createElement("td");
    if (appointment.status === "Cancelled") {
      const cancelled = document.createElement("span");
      cancelled.className = "text-secondary small";
      cancelled.textContent = "Cancelled";
      actionCell.appendChild(cancelled);
    } else {
      const status = document.createElement("span");
      status.className = "status-pill";
      status.textContent = "Booked";
      actionCell.appendChild(status);
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn btn-sm btn-outline-danger ms-2";
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", () => {
        const updated = getAppointments().map((a) =>
          a.id === appointment.id ? { ...a, status: "Cancelled" } : a,
        );
        saveAppointments(updated);
        renderAdmin();
        refreshSlots();
      });
      actionCell.appendChild(cancelBtn);
    }
    tr.appendChild(actionCell);
    tbody.appendChild(tr);
  });
}
function showView(view) {
  const isAdmin = view === "admin";
  patientSection.classList.toggle("d-none", isAdmin);
  adminSection.classList.toggle("d-none", !isAdmin);
  document
    .getElementById("adminViewBtn")
    .classList.toggle("btn-light", !isAdmin);
  document
    .getElementById("adminViewBtn")
    .classList.toggle("btn-outline-light", isAdmin);
  document
    .getElementById("patientViewBtn")
    .classList.toggle("btn-light", isAdmin);
  document
    .getElementById("patientViewBtn")
    .classList.toggle("btn-outline-light", !isAdmin);
  if (isAdmin) renderAdmin();
}
function exportCSV() {
  const appointments = getAppointments();
  if (!appointments.length) {
    alert("There are no appointments to export.");
    return;
  }
  const header = [
    "Patient",
    "Email",
    "Phone",
    "Doctor",
    "Specialization",
    "Date",
    "Time",
    "Reason",
    "Status",
  ];
  const rows = appointments.map((a) => {
    const d = doctors.find((item) => item.id === a.doctorId) || {};
    return [
      a.patientName,
      a.patientEmail,
      a.phone,
      d.name || "",
      d.specialization || "",
      a.date,
      a.time,
      a.reason || "",
      a.status,
    ];
  });
  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [header, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "carepoint-appointments.csv";
  link.click();
  URL.revokeObjectURL(url);
}

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  resetValidation();
  bookingMessage.className = "alert d-none";
  const fields = [
    ...bookingForm.querySelectorAll("input[required], select[required]"),
  ];
  let valid = true;
  fields.forEach((field) => {
    if (!field.checkValidity()) {
      field.classList.add("is-invalid");
      valid = false;
    }
  });
  if (dateInput.value && dateInput.value < localDateString()) {
    dateInput.classList.add("is-invalid");
    valid = false;
  }
  if (!valid) {
    showMessage(
      "Please correct the highlighted fields and try again.",
      "danger",
    );
    return;
  }
  const appointment = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    patientName: document.getElementById("patientName").value.trim(),
    patientEmail: document.getElementById("patientEmail").value.trim(),
    phone: document.getElementById("patientPhone").value.trim(),
    doctorId: doctorSelect.value,
    date: dateInput.value,
    time: timeSelect.value,
    reason: document.getElementById("reason").value.trim(),
    status: "Booked",
    createdAt: new Date().toISOString(),
  };
  if (
    appointment.patientName.length < 2 ||
    !appointment.patientEmail ||
    !/^[0-9]{10}$/.test(appointment.phone)
  ) {
    showMessage(
      "Please enter a valid name, email, and 10-digit phone number.",
      "danger",
    );
    return;
  }
  const appointments = getAppointments();
  const conflict = appointments.some(
    (a) =>
      a.doctorId === appointment.doctorId &&
      a.date === appointment.date &&
      a.time === appointment.time &&
      a.status !== "Cancelled",
  );
  if (conflict) {
    refreshSlots();
    showMessage(
      "That time slot was just booked. Please choose another available time.",
      "warning",
    );
    return;
  }
  appointments.push(appointment);
  saveAppointments(appointments);
  bookingForm.reset();
  dateInput.min = localDateString();
  refreshSlots();
  showMessage(
    `Appointment confirmed for ${appointment.patientName} on ${appointment.date} at ${appointment.time}.`,
    "success",
  );
});

specializationFilter.addEventListener("change", renderDoctors);
doctorSelect.addEventListener("change", refreshSlots);
dateInput.addEventListener("change", refreshSlots);
document
  .getElementById("adminViewBtn")
  .addEventListener("click", () => showView("admin"));
document
  .getElementById("patientViewBtn")
  .addEventListener("click", () => showView("patient"));
document.getElementById("exportBtn").addEventListener("click", exportCSV);

fillDoctorOptions();
renderDoctors();
refreshSlots();
