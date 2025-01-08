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

document.getElementById("contactForm").addEventListener("submit", submitForm);

function submitForm(e) {
  e.preventDefault();

  var firstName = getElementVal("firstName");
  var lastName = getElementVal("lastName");
  var emailid = getElementVal("emailid");
  var phone = getElementVal("phone");
  var source = getElementVal("source");
  var status = "en attente";
  var msgContent = getElementVal("msgContent");

  const uniqueId = Date.now().toString(); // Générer un ID unique

  saveMessages(uniqueId, firstName, lastName, emailid, phone, source, status, msgContent);

  // Rediriger vers la page de rendez-vous avec l'ID unique
  setTimeout(() => {
      window.location.href = `appointment.html?id=${uniqueId}`;
  }, 3000);

  // Réinitialiser le formulaire
  document.getElementById("contactForm").reset();
}

const saveMessages = (uniqueId, firstName, lastName, emailid, phone, source, status, msgContent) => {
  var data = {
      firstName: firstName,
      lastName: lastName,
      emailid: emailid,
      phone: phone,
      source: source,
      status: status,
      msgContent: msgContent,
  };

  // Enregistrer le message de contact avec l'ID unique
  contactFormDB.child(uniqueId).set(data);
};

const getElementVal = (id) => {
  return document.getElementById(id).value;
};
