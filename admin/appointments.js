// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyABC6xWO7T4qxgVfD5MK2U-ReEPHh0quik",
    authDomain: "leads-3892c.firebaseapp.com",
    databaseURL: "https://leads-3892c-default-rtdb.firebaseio.com",
    projectId: "leads-3892c",
    storageBucket: "leads-3892c.appspot.com",
    messagingSenderId: "1086480345958",
    appId: "1:1086480345958:web:84bbb0fb5bd496edc836a7"
  };
  
  // Initialiser Firebase avec votre configuration
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
  const leadsRef = database.ref('contactForm');
  
  // Sélection des éléments
  const leadsTableBody = document.getElementById('leadsTableBody');
  const createModal = document.getElementById('createModal');
  const closeCreateModal = document.getElementById('closeCreateModal');
  const createForm = document.getElementById('createForm');
  const leadSelect = document.getElementById('leadSelect');
  const openCreateModal = document.getElementById('openCreateModal');
  const editModal = document.getElementById('editModal');
  const closeEditModal = document.getElementById('closeEditModal');
  const editForm = document.getElementById('editForm');
  const historyModal = document.getElementById('historyModal');
  const closeHistoryModal = document.getElementById('closeHistoryModal');
  const historyContent = document.getElementById('historyContent');
  
  // Fonction pour formater les dates
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return date.toLocaleDateString('fr-FR', options);
  }
  
  // Fonction pour vérifier si une date est un dimanche
  function isSunday(dateString) {
    const date = new Date(dateString);
    return date.getDay() === 0; // 0 représente dimanche
  }
  
  // Fonction pour vérifier si l'heure est en dehors des heures de travail
  function isOutsideWorkingHours(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours < 9 || hours >= 18 || (hours === 17 && minutes > 0); // 17:00 est la dernière heure valable
  }
  
// Fonction pour vérifier les conflits d'horaires
async function hasTimeConflict(date, time) {
  const newAppointmentTime = new Date(`${date}T${time}`);
  const endOfNewAppointment = new Date(newAppointmentTime.getTime() + 30 * 60000); // Ajouter 30 minutes

  const snapshot = await leadsRef.orderByChild('date').equalTo(date).once('value');
  let hasConflict = false;

  snapshot.forEach(childSnapshot => {
    const leadData = childSnapshot.val();
    if (leadData.time && leadData.date) {
      const existingTime = new Date(`${date}T${leadData.time}`);
      const endOfExistingAppointment = new Date(existingTime.getTime() + 30 * 60000); // Ajouter 30 minutes

      // Vérifier les chevauchements
      if ((newAppointmentTime < endOfExistingAppointment && endOfNewAppointment > existingTime) ||
          (existingTime < endOfNewAppointment && endOfExistingAppointment > newAppointmentTime)) {
        hasConflict = true;
      }
    }
  });

  return hasConflict;
}

  
  // Fonction pour mettre à jour l'historique
  function updateHistory(leadKey, action) {
    leadsRef.child(leadKey).once('value').then(function(snapshot) {
      const leadData = snapshot.val();
      const history = leadData.history || [];
      history.push({
        action: action,
        timestamp: new Date().toISOString()
      });
      leadsRef.child(leadKey).update({ history: history });
    });
  }
  
 
 // Fonction pour supprimer un rendez-vous
function deleteAppointment(leadKey) {
  if (confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      updateHistory(leadKey, 'Annulé');
      leadsRef.child(leadKey).update({ 
          status: 'Annulé', 
          date: null,   // Supprimer la date
          time: null,   // Supprimer l'heure
          hasAppointment: false 
      }).then(() => {
          renderAppointments(); // Met à jour le tableau
          populateLeadSelect(); // Réintègre le lead annulé dans le menu déroulant
      });
  }
}


  
  // Fonction pour confirmer un rendez-vous
  function confirmAppointment(leadKey) {
    updateHistory(leadKey, 'Confirmé');
    leadsRef.child(leadKey).update({ status: 'Confirmé' });
  }
  
  // Fonction pour afficher l'historique
  function showHistory(leadKey) {
    leadsRef.child(leadKey).once('value').then(function(snapshot) {
      const leadData = snapshot.val();
      const history = leadData.history || [];
      historyContent.innerHTML = '';
      history.forEach(record => {
        const p = document.createElement('p');
        p.textContent = `${record.action} le ${formatDate(record.timestamp)}`;
        historyContent.appendChild(p);
      });
      historyModal.style.display = 'block';
    });
  }
  
  
// Fonction pour remplir le menu déroulant avec les leads disponibles
function populateLeadSelect() {
  leadSelect.innerHTML = '<option value="" disabled selected>Choisissez un lead</option>'; // Réinitialiser les options

  leadsRef.once('value').then(snapshot => {
      snapshot.forEach(childSnapshot => {
          const leadKey = childSnapshot.key;
          const leadData = childSnapshot.val();

          // Afficher les leads qui n'ont pas de date de rendez-vous
          if (!leadData.date) {
              const option = document.createElement('option');
              option.value = leadKey;
              option.textContent = leadData.emailid; // Vous pouvez ajouter plus d'informations si nécessaire
              leadSelect.appendChild(option);
          }
      });
  }).catch(error => {
      console.error("Erreur lors du chargement des leads : ", error);
  });
}

  
 // Fonction pour afficher les rendez-vous dans le tableau
function renderAppointments() {
  leadsRef.on('value', function(snapshot) {
      console.log('Données récupérées:', snapshot.val()); // Afficher toutes les données
      leadsTableBody.innerHTML = ''; // Effacer le contenu précédent

      snapshot.forEach(function(childSnapshot) {
          const leadKey = childSnapshot.key;
          const leadData = childSnapshot.val();

          console.log('Clé:', leadKey); // Afficher la clé du lead
          console.log('Données du lead:', leadData); // Afficher les données du lead

          // Vérifier si le lead a une date de rendez-vous
          if (leadData.date) {
              const leadRow = document.createElement('tr');
              leadRow.innerHTML = `
                  <td>${leadData.emailid || ''}</td>
                  <td>${leadData.time || ''}</td>
                  <td>${leadData.date || ''}</td>
                  <td>${leadData.status || 'Non confirmé'}</td>
                  <td>
                      <button class="btn btn-history btn-info" onclick="showHistory('${leadKey}')">Historique</button>
                      <button class="btn btn-edit btn-primary" onclick="editAppointment('${leadKey}')">Modifier</button>
                      ${leadData.status === 'Confirmé' ? 
                          '' :
                          `<button class="btn btn-confirm btn-success" onclick="confirmAppointment('${leadKey}')">Confirmer</button>
                           <button class="btn btn-cancel btn-danger" onclick="deleteAppointment('${leadKey}')">Annuler</button>`
                      }
                  </td>
              `;
              leadsTableBody.appendChild(leadRow);
          }
      });
  });
}

  
  
  // Fonction pour ouvrir la modale de création
  openCreateModal.addEventListener('click', function() {
    populateLeadSelect();
    createModal.style.display = 'block';
  
    // Définir la date minimale pour le champ de date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('createDate').setAttribute('min', today);
  });
  
  // Fonction pour fermer la modale de création
  closeCreateModal.addEventListener('click', function() {
    createModal.style.display = 'none';
  });
  
 
 // Fonction pour soumettre le formulaire de création
createForm.addEventListener('submit', async function(event) {
  event.preventDefault();
  const leadKey = leadSelect.value;
  const time = document.getElementById('createTime').value;
  const date = document.getElementById('createDate').value;
  const status = document.getElementById('createStatus').value;

  // Vérifications
  if (isSunday(date)) {
    alert('Les rendez-vous ne sont pas autorisés le dimanche.');
    return;
  }

  // Vérifier les conflits d'horaires
  const hasConflict = await hasTimeConflict(date, time);
  if (hasConflict) {
    alert('Il y a un conflit d\'horaire avec un autre rendez-vous. Assurez-vous qu\'il y a un décalage de 30 minutes.');
    return;
  }

  // Ajouter le rendez-vous
  leadsRef.child(leadKey).update({ time, date, status });
  updateHistory(leadKey, 'Rendez-vous créé');
  createModal.style.display = 'none';
});

  
  // Fonction pour ouvrir la modale d'édition
  function editAppointment(leadKey) {
    leadsRef.child(leadKey).once('value').then(function(snapshot) {
      const leadData = snapshot.val();
      document.getElementById('editLeadKey').value = leadKey;
      document.getElementById('editEmail').value = leadData.emailid;
      document.getElementById('editTime').value = leadData.time || '';
      document.getElementById('editDate').value = leadData.date || '';
      document.getElementById('editStatus').value = leadData.status || '';
  
      editModal.style.display = 'block';
    });
  }
  
  // Fonction pour fermer la modale d'édition
  closeEditModal.addEventListener('click', function() {
    editModal.style.display = 'none';
  });
  
  // Fonction pour soumettre le formulaire d'édition
  editForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const leadKey = document.getElementById('editLeadKey').value;
    const emailid = document.getElementById('editEmail').value;
    const time = document.getElementById('editTime').value;
    const date = document.getElementById('editDate').value;
    const status = document.getElementById('editStatus').value;
  
    // Vérifications
    if (isSunday(date)) {
      alert('Les rendez-vous ne sont pas autorisés le dimanche.');
      return;
    }
    if (isOutsideWorkingHours(time)) {
      alert('Les heures de rendez-vous doivent être entre 9h et 18h.');
      return;
    }
    const hasConflict = await hasTimeConflict(date, time);
    if (hasConflict) {
      alert('Il y a un conflit d\'horaire avec un autre rendez-vous. Assurez-vous qu\'il y a un décalage de 30 minutes.');
      return;
    }
  
    leadsRef.child(leadKey).update({ emailid, time, date, status });
    updateHistory(leadKey, 'Rendez-vous modifié');
    editModal.style.display = 'none';
  });
  
  // Fonction pour fermer la modale d'historique
  closeHistoryModal.addEventListener('click', function() {
    historyModal.style.display = 'none';
  });
  
  // Initialiser le tableau des rendez-vous
  renderAppointments();
  

  // Fonction de recherche
  function filterLeads() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const leadsRows = document.querySelectorAll('#leadsTableBody tr');
  
    leadsRows.forEach(row => {
      const cells = row.getElementsByTagName('td');
      if (cells.length > 0) {
        const email = cells[0].textContent.toLowerCase();      // Email
        const time = cells[1].textContent.toLowerCase();       // Heure
        const date = cells[2].textContent.toLowerCase();       // Date
        const status = cells[3].textContent.toLowerCase();     // Statut
  
        // Affichage des valeurs pour débogage
        console.log(`Recherche: ${searchValue}`);
        console.log(`Email: ${email}, Heure: ${time}, Date: ${date}, Statut: ${status}`);
  
        if (email.includes(searchValue) || time.includes(searchValue) || date.includes(searchValue) || status.includes(searchValue)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      }
    });
  }
  

// Ajouter un écouteur d'événement sur le champ de recherche
document.getElementById('searchInput').addEventListener('input', filterLeads);


// Appel initial pour vérifier le fonctionnement dès le chargement
filterLeads();
