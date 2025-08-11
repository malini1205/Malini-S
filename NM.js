
  // Mock data for doctors per branch
  const doctorsByBranch = {
    BranchA: [
      { id: 'doc1', name: 'Dr. Alice Smith' },
      { id: 'doc2', name: 'Dr. Bob Johnson' }
    ],
    BranchB: [
      { id: 'doc3', name: 'Dr. Carol White' },
      { id: 'doc4', name: 'Dr. David Martin' }
    ],
    BranchC: [
      { id: 'doc5', name: 'Dr. Emily Davis' }
    ]
  };

  // Mock existing appointments to check conflicts
  let appointments = [];

  const branchSelect = document.getElementById('branch');
  const doctorSelect = document.getElementById('doctor');
  const appointmentTimeInput = document.getElementById('appointmentTime');
  const availabilityDiv = document.getElementById('availability');
  const submitButton = document.querySelector('button[type="submit"]');
  const appointmentsTableBody = document.getElementById('appointmentsTableBody');

  function populateDoctors(branch) {
    doctorSelect.innerHTML = '<option value="" disabled selected>Select doctor</option>';
    if (!branch || !doctorsByBranch[branch]) return;
    doctorsByBranch[branch].forEach(doc => {
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = doc.name;
      doctorSelect.appendChild(option);
    });
  }

  function checkAvailability(branch, doctorId, datetime) {
    if (!branch || !doctorId || !datetime) {
      availabilityDiv.textContent = '';
      submitButton.disabled = true;
      return;
    }

    // Check for appointment conflicts: same doctor, overlapping time +/- 30 mins
    const apptTime = new Date(datetime);
    const conflict = appointments.some(appt => {
      if (appt.branch !== branch) return false;
      if (appt.doctorId !== doctorId) return false;
      const existing = new Date(appt.datetime);
      const diff = Math.abs(existing - apptTime);
      return diff < 30 * 60 * 1000; // 30 minutes overlap
    });

    if (conflict) {
      availabilityDiv.textContent = '❌ Appointment conflict detected. Please choose another time.';
      availabilityDiv.style.color = 'red';
      submitButton.disabled = true;
    } else {
      availabilityDiv.textContent = '✅ Time slot is available.';
      availabilityDiv.style.color = 'green';
      submitButton.disabled = false;
    }
  }

  function updateMinDateTime() {
    // Set minimum datetime to current datetime (rounded to nearest minute)
    const now = new Date();
    now.setSeconds(0, 0);
    const localISOTime = now.toISOString().slice(0,16);
    appointmentTimeInput.min = localISOTime;
  }

  function renderAppointmentsReport() {
    if (appointments.length === 0) {
      appointmentsTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#7f8c8d;">No appointments booked yet.</td></tr>';
      return;
    }

    appointmentsTableBody.innerHTML = '';
    appointments.forEach(appt => {
      const row = document.createElement('tr');
      const branchCell = document.createElement('td');
      branchCell.textContent = appt.branch;
      const doctorCell = document.createElement('td');
      // Find doctor name by id
      const doctor = Object.values(doctorsByBranch).flat().find(d => d.id === appt.doctorId);
      doctorCell.textContent = doctor ? doctor.name : appt.doctorId;
      const timeCell = document.createElement('td');
      timeCell.textContent = new Date(appt.datetime).toLocaleString();

      row.appendChild(branchCell);
      row.appendChild(doctorCell);
      row.appendChild(timeCell);
      appointmentsTableBody.appendChild(row);
    });
  }

  branchSelect.addEventListener('change', () => {
    const selectedBranch = branchSelect.value;
    populateDoctors(selectedBranch);
    availabilityDiv.textContent = '';
    submitButton.disabled = true;
  });

  doctorSelect.addEventListener('change', () => {
    availabilityDiv.textContent = '';
    submitButton.disabled = true;
  });

  appointmentTimeInput.addEventListener('input', () => {
    const branch = branchSelect.value;
    const doctorId = doctorSelect.value;
    const datetime = appointmentTimeInput.value;
    checkAvailability(branch, doctorId, datetime);
  });

  document.getElementById('appointmentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const branch = branchSelect.value;
    const doctorId = doctorSelect.value;
    const datetime = appointmentTimeInput.value;

    if (!branch || !doctorId || !datetime) return;

    // Save appointment (in-memory)
    appointments.push({ branch, doctorId, datetime });

    alert('Appointment booked successfully!');
    renderAppointmentsReport();

    // Reset form
    e.target.reset();
    doctorSelect.innerHTML = '<option value="" disabled selected>Select doctor</option>';
    availabilityDiv.textContent = '';
    submitButton.disabled = true;
  });

  updateMinDateTime();
  renderAppointmentsReport();
