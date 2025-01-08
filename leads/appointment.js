const firebaseConfig = {
    apiKey: "AIzaSyABC6xWO7T4qxgVfD5MK2U-ReEPHh0quik",
    authDomain: "leads-3892c.firebaseapp.com",
    databaseURL: "https://leads-3892c-default-rtdb.firebaseio.com",
    projectId: "leads-3892c",
    storageBucket: "leads-3892c.appspot.com",
    messagingSenderId: "1086480345958",
    appId: "1:1086480345958:web:84bbb0fb5bd496edc836a7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference your database
var contactFormDB = firebase.database().ref("contactForm");

// Initialize Flatpickr
flatpickr("#appointmentDate", {
    minDate: "today",
    disable: [
        function(date) {
            return (date.getDay() === 0 || date.getDay() === 6);
        }
    ],
    onChange: function(selectedDates, dateStr, instance) {
        validateTimeSlots();
    }
});

document.getElementById("appointmentForm").addEventListener("submit", submitAppointmentForm);

function submitAppointmentForm(e) {
    e.preventDefault();

    var appointmentDate = getElementVal("appointmentDate");
    var appointmentTime = getElementVal("appointmentTime");
    var appointmentDetails = getElementVal("appointmentDetails");

    if (isValidTime(appointmentDate, appointmentTime)) {
        const urlParams = new URLSearchParams(window.location.search);
        const uniqueId = urlParams.get('id');

        if (uniqueId) {
            saveAppointment(uniqueId, appointmentDate, appointmentTime, appointmentDetails);
            alert('Rendez-vous enregistré avec succès!');
            document.getElementById("appointmentForm").reset();
        } else {
            alert('ID unique non trouvé dans l\'URL.');
        }
    } else {
        alert('Le créneau horaire sélectionné n\'est pas disponible.');
    }
}

const saveAppointment = (id, date, time, details) => {
    var data = {
        date: date,
        time: time,
        appointmentDetails: details, // Renommé de 'details' à 'appointmentDetails'
    };

    // Enregistrer les détails du rendez-vous sous le même ID que les messages de contact
    contactFormDB.child(id).update(data);
};

const getElementVal = (id) => {
    return document.getElementById(id).value;
};

const isValidTime = (date, time) => {
    const dayOfWeek = new Date(date).getDay();
    const hour = parseInt(time.split(':')[0], 10);

    if (dayOfWeek === 5) {
        return hour >= 9 && hour < 12;
    }

    return (hour >= 9 && hour < 12) || (hour >= 14 && hour < 16);
};

function validateTimeSlots() {
    const dateInput = document.getElementById("appointmentDate");
    const timeInput = document.getElementById("appointmentTime");

    const date = new Date(dateInput.value);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 5) {
        timeInput.setAttribute('min', '09:00');
        timeInput.setAttribute('max', '12:00');
    } else {
        timeInput.setAttribute('min', '09:00');
        timeInput.setAttribute('max', '16:00');
    }
}
