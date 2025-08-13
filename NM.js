  // Static sample data simulating entities and appointments
  const data = {
    branches: {
      1: 'Central Hospital',
      2: 'Northside Clinic'
    },
    departments: {
      1: [
        { id: 1, name: 'Cardiology' },
        { id: 2, name: 'Neurology' }
      ],
      2: [
        { id: 3, name: 'Pediatrics' },
        { id: 4, name: 'Orthopedics' }
      ]
    },
    doctors: {
      1: [
        { id: 1, name: 'Dr. Smith' },
        { id: 2, name: 'Dr. Johnson' }
      ],
      2: [
        { id: 3, name: 'Dr. Lee' },
        { id: 4, name: 'Dr. Patel' }
      ],
      3: [
        { id: 5, name: 'Dr. Gomez' }
      ],
      4: [
        { id: 6, name: 'Dr. Chen' },
        { id: 7, name: 'Dr. Kim' }
      ]
    },
    // Doctor schedules define availability (simplified for demo)
    doctorSchedules: {
      // doctorId: array of {start, end} ISO strings of working hours (1 hour blocks for demo)
      1: [{ start: '2025-07-01T09:00', end: '2025-07-01T17:00' }],
      2: [{ start: '2025-07-01T10:00', end: '2025-07-01T16:00' }],
      3: [{ start: '2025-07-01T08:00', end: '2025-07-01T14:00' }],
      4: [{ start: '2025-07-01T12:00', end: '2025-07-01T18:00' }],
      5: [{ start: '2025-07-01T09:00', end: '2025-07-01T15:00' }],
      6: [{ start: '2025-07-01T08:00', end: '2025-07-01T17:00' }],
      7: [{ start: '2025-07-01T13:00', end: '2025-07-01T19:00' }]
    },
    // Appointments: appointmentId -> appointment object
    appointments: {
      // Sample pre-existing appointments
      1001: {
        id: 1001,
        patientName: 'John Doe',
        doctorId: 1,
        branchId: 1,
        departmentId: 1,
        start: '2024-07-01T10:00',
        end: '2024-07-01T10:30',
        status: 'Scheduled',
        noShow: false
      },
      1002: {
        id: 1002,
        patientName: 'Jane Smith',
        doctorId: 2,
        branchId: 1,
        departmentId: 1,
        start: '2024-07-01T11:00',
        end: '2024-07-01T11:30',
        status: 'Completed',
        noShow: false
      }
    },
    nextAppointmentId: 1003
  };

  const branchSelect = document.getElementById('branch');
  const departmentSelect = document.getElementById('department');
  const doctorSelect = document.getElementById('doctor');
  const appointmentTimeInput = document.getElementById('appointmentTime');
  const messageDiv = document.getElementById('message');
  const form = document.getElementById('bookingForm');
  const patientNameInput = document.getElementById('patientName');
  const appointmentActionSelect = document.getElementById('appointmentAction');
  const existingAppointmentIdInput = document.getElementById('existingAppointmentId');
  const existingAppointmentLabel = document.getElementById('existingAppointmentLabel');
  const loadReportsBtn = document.getElementById('loadReportsBtn');
  const reportsDiv = document.getElementById('reports');

  // Populate Departments when Branch changes
  branchSelect.addEventListener('change', () => {
    const branchId = branchSelect.value;
    departmentSelect.innerHTML = '<option value="">Select Department</option>';
    doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
    doctorSelect.disabled = true;
    messageDiv.style.display = 'none';

    if (branchId) {
      const depts = data.departments[branchId] || [];
      depts.forEach(d => {
        const option = document.createElement('option');
        option.value = d.id;
        option.textContent = d.name;
        departmentSelect.appendChild(option);
      });
      departmentSelect.disabled = false;
    } else {
      departmentSelect.disabled = true;
    }
  });

  // Populate Doctors when Department changes
  departmentSelect.addEventListener('change', () => {
    const deptId = departmentSelect.value;
    doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
    messageDiv.style.display = 'none';

    if (deptId) {
      // For demo, map doctors to departments manually
      let doctorsList = Object.values(data.doctors).flat().filter(d => {
        if (deptId == 1) return [1,2].includes(d.id);
        if (deptId == 2) return false;
        if (deptId == 3) return [5].includes(d.id);
        if (deptId == 4) return [6,7].includes(d.id);
        return false;
      });

      doctorsList.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc.id;
        option.textContent = doc.name;
        doctorSelect.appendChild(option);
      });
      doctorSelect.disabled = false;
    } else {
      doctorSelect.disabled = true;
    }
  });

  // Show/hide existing appointment ID field based on action
  appointmentActionSelect.addEventListener('change', () => {
    const action = appointmentActionSelect.value;
    if (action === 'cancel' || action === 'reschedule') {
      existingAppointmentLabel.style.display = 'block';
      existingAppointmentIdInput.style.display = 'block';
      patientNameInput.required = action === 'book'; // patient name only required in booking
      appointmentTimeInput.required = action !== 'cancel'; // date/time required except for cancel
    } else {
      existingAppointmentLabel.style.display = 'none';
      existingAppointmentIdInput.style.display = 'none';
      patientNameInput.required = true;
      appointmentTimeInput.required = true;
    }
    messageDiv.style.display = 'none';
  });

  // Set minimum date/time to current datetime
  function setMinDateTime() {
    const now = new Date();
    const localISOTime = now.toISOString().slice(0,16);
    appointmentTimeInput.min = localISOTime;
  }
  setMinDateTime();

  // Helper: Check if requested time slot is within doctor's schedule
  function isWithinSchedule(doctorId, startDate, endDate) {
    const schedules = data.doctorSchedules[doctorId] || [];
    return schedules.some(s => {
      const sStart = new Date(s.start);
      const sEnd = new Date(s.end);
      return startDate >= sStart && endDate <= sEnd;
    });
  }

  // Helper: Check for appointment conflicts for a doctor (excluding an optional appointment ID)
  function hasConflict(doctorId, startDate, endDate, excludeAppointmentId = null) {
    return Object.values(data.appointments).some(appt => {
      if (appt.doctorId !== doctorId) return false;
      if (appt.status === 'Cancelled') return false;
      if (excludeAppointmentId !== null && appt.id === excludeAppointmentId) return false;
      const apptStart = new Date(appt.start);
      const apptEnd = new Date(appt.end);
      return (startDate < apptEnd && endDate > apptStart);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    messageDiv.style.display = 'none';

    const action = appointmentActionSelect.value;
    const patientName = patientNameInput.value.trim();
    const branchId = parseInt(branchSelect.value);
    const departmentId = parseInt(departmentSelect.value);
    const doctorId = parseInt(doctorSelect.value);
    const appointmentTime = appointmentTimeInput.value;
    const existingApptId = parseInt(existingAppointmentIdInput.value);

    if (!branchId || !departmentId || !doctorId) {
      showMessage('Please select branch, department and doctor.', 'error');
      return;
    }

    if (action === 'book') {
      if (!patientName) {
        showMessage('Please enter patient name.', 'error');
        return;
      }
      if (!appointmentTime) {
        showMessage('Please select appointment date and time.', 'error');
        return;
      }

      const start = new Date(appointmentTime);
      const end = new Date(start.getTime() + 30 * 60000); // fixed 30min appointment

      if (!isWithinSchedule(doctorId, start, end)) {
        showMessage('Selected time is outside the doctor\'s working hours.', 'error');
        return;
      }
      if (hasConflict(doctorId, start, end)) {
        showMessage('Selected time conflicts with another appointment.', 'error');
        return;
      }

      // Create new appointment
      const newId = data.nextAppointmentId++;
      data.appointments[newId] = {
        id: newId,
        patientName,
        doctorId,
        branchId,
        departmentId,
        start: appointmentTime,
        end: end.toISOString().slice(0,16),
        status: 'Scheduled',
        noShow: false
      };
      showMessage(`Appointment booked successfully! Appointment ID: ${newId}`, 'success');
    } else if (action === 'cancel') {
      if (!existingApptId || !data.appointments[existingApptId]) {
        showMessage('Invalid appointment ID for cancellation.', 'error');
        return;
      }

      const appt = data.appointments[existingApptId];
      if (appt.status === 'Cancelled') {
        showMessage('Appointment is already cancelled.', 'error');
        return;
      }

      appt.status = 'Cancelled';
      showMessage(`Appointment ID ${existingApptId} cancelled successfully.`, 'success');

    } else if (action === 'reschedule') {
      if (!existingApptId || !data.appointments[existingApptId]) {
        showMessage('Invalid appointment ID for rescheduling.', 'error');
        return;
      }
      if (!appointmentTime) {
        showMessage('Please select new appointment date and time.', 'error');
        return;
      }

      const appt = data.appointments[existingApptId];
      if (appt.status === 'Cancelled') {
        showMessage('Cannot reschedule a cancelled appointment.', 'error');
        return;
      }

      const start = new Date(appointmentTime);
      const end = new Date(start.getTime() + 30 * 60000);

      if (!isWithinSchedule(appt.doctorId, start, end)) {
        showMessage('Selected time is outside the doctor\'s working hours.', 'error');
        return;
      }
      if (hasConflict(appt.doctorId, start, end, existingApptId)) {
        showMessage('Selected time conflicts with another appointment.', 'error');
        return;
      }

      appt.start = appointmentTime;
      appt.end = end.toISOString().slice(0,16);
      appt.status = 'Scheduled';
      showMessage(`Appointment ID ${existingApptId} rescheduled successfully.`, 'success');
    }
  });

  function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
  }

  // Report generation: doctor workload and appointment trends (sample)
  loadReportsBtn.addEventListener('click', () => {
    reportsDiv.innerHTML = '<p>Loading reports...</p>';

    // Aggregate appointments by doctor and status
    const appointments = Object.values(data.appointments);

    const workload = {};
    appointments.forEach(appt => {
      if (appt.status === 'Cancelled') return;
      if (!workload[appt.doctorId]) {
        workload[appt.doctorId] = { Scheduled: 0, Completed: 0, NoShow: 0 };
      }
      if (appt.status === 'Scheduled') workload[appt.doctorId].Scheduled++;
      else if (appt.status === 'Completed') workload[appt.doctorId].Completed++;
      else if (appt.noShow) workload[appt.doctorId].NoShow++;
    });

    let html = `<h4>Doctor Workload</h4>`;
    html += `<table><thead><tr><th>Doctor</th><th>Scheduled</th><th>Completed</th><th>No Shows</th></tr></thead><tbody>`;
    for (const [doctorId, counts] of Object.entries(workload)) {
      const doctorName = Object.values(data.doctors).flat().find(d => d.id == doctorId)?.name || 'Unknown';
      html += `<tr><td>${doctorName}</td><td>${counts.Scheduled}</td><td>${counts.Completed}</td><td>${counts.NoShow}</td></tr>`;
    }
    html += `</tbody></table>`;

    // Appointment Trends: count appointments per department
    const trends = {};
    appointments.forEach(appt => {
      if (appt.status === 'Cancelled') return;
      if (!trends[appt.departmentId]) trends[appt.departmentId] = 0;
      trends[appt.departmentId]++;
    });

    html += `<h4>Appointment Trends by Department</h4>`;
    html += `<table><thead><tr><th>Department</th><th>Appointment Count</th></tr></thead><tbody>`;
    for (const [deptId, count] of Object.entries(trends)) {
      // find department name
      let deptName = 'Unknown';
      for (const depts of Object.values(data.departments)) {
        const d = depts.find(dept => dept.id == deptId);
        if (d) {
          deptName = d.name;
          break;
        }
      }
      html += `<tr><td>${deptName}</td><td>${count}</td></tr>`;
    }
    html += `</tbody></table>`;

    reportsDiv.innerHTML = html;
  });


  /*
    Compatibility & Scalability Notes (for backend implementation):

    - Use standard SQL data types: INT, VARCHAR, DATETIME/TIMESTAMP.
    - Auto-increment PKs: MySQL (AUTO_INCREMENT), Oracle (SEQUENCE + trigger or IDENTITY).
    - Use ANSI compliant JOINs and avoid vendor-specific functions.
    - Implement conflict detection with indexed queries on (DoctorID, StartTime, EndTime).
    - Use transaction isolation (SERIALIZABLE or REPEATABLE READ) to handle concurrent bookings.
    - Optimize with indexes on foreign keys and time fields.
    - Apply partitioning and caching strategies for high traffic environments.
    - Validate business rules both client-side (this UI) and server-side (database & API).
  */

