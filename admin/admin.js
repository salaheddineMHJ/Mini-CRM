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

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const leadsRef = database.ref('contactForm');
const teamRef = database.ref('teamMembers');

const leadsTableBody = document.getElementById('leadsTableBody');
const leadForm = document.getElementById('leadForm');
const formTitle = document.getElementById('formTitle');
const form = document.getElementById('form');
const leadIdInput = document.getElementById('leadId');
const teamMemberButtons = document.getElementById('teamMemberButtons');
const statisticsModal = $('#statisticsModal');

function createTeamMemberButtons(members) {
  teamMemberButtons.innerHTML = '';
  members.forEach(member => {
    if (member.email === 'admin@gmail.com') return; // Éviter d'afficher l'admin
    const button = document.createElement('button');
    button.className = 'btn btn-warning btn-sm mr-2';
    button.textContent = `${member.name} `; // Affiche le nom et l'email
    button.onclick = () => selectTeamMember(member.name);
    teamMemberButtons.appendChild(button);
  });
}

function selectTeamMember(memberName) {
  document.getElementById('selectedMember').value = memberName;
}

// Lire les membres de l'équipe depuis Firebase
teamRef.once('value')
  .then(snapshot => {
    const members = [];
    snapshot.forEach(childSnapshot => {
      const memberData = childSnapshot.val();
      members.push(memberData);
    });
    createTeamMemberButtons(members);
  })
  .catch(error => console.error('Erreur lors de la récupération des membres de l\'équipe:', error));

  function loadLeads() {
    leadsRef.once('value')
      .then(snapshot => {
        leadsTableBody.innerHTML = '';
        snapshot.forEach(childSnapshot => {
          const lead = childSnapshot.val();
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${lead.firstName || ''}</td>
            <td>${lead.lastName || ''}</td>
            <td>${lead.emailid || ''}</td>
            <td>${lead.phone || ''}</td>
            <td>${lead.source || ''}</td>
            <td>${lead.status || ''}</td>
            <td>${lead.msgContent || ''}</td>
            <td>${lead.assignedMember || ''}</td>
            <td>${lead.date || ''}</td>
            <td>${lead.time || ''}</td>
            <td>
              <button class="btn btn-warning btn-sm" onclick="editLead('${childSnapshot.key}')">Modifier</button>
              <button class="btn btn-danger btn-sm" onclick="deleteLead('${childSnapshot.key}')">Supprimer</button>
            </td>
          `;
          leadsTableBody.appendChild(row);
          countLeads(); // Appeler la fonction de comptage des leads
        });
      })
      .catch(error => console.error('Erreur lors du chargement des leads:', error));
  }

function editLead(leadId) {
  leadsRef.child(leadId).once('value')
    .then(snapshot => {
      const lead = snapshot.val();
      leadIdInput.value = leadId;
      document.getElementById('firstName').value = lead.firstName || '';
      document.getElementById('lastName').value = lead.lastName || '';
      document.getElementById('email').value = lead.emailid || '';
      document.getElementById('phone').value = lead.phone || '';
      document.getElementById('source').value = lead.source || '';
      document.getElementById('status').value = lead.status || '';
      document.getElementById('msgContent').value = lead.msgContent || '';
      document.getElementById('date').value = lead.date || '';
      document.getElementById('time').value = lead.time || '';
      document.getElementById('selectedMember').value = lead.assignedMember || '';
      formTitle.textContent = 'Modifier le Lead';
      leadForm.style.display = 'block';
    })
    .catch(error => console.error('Erreur lors de la récupération du lead:', error));
}

function deleteLead(leadId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce lead ?')) {
    leadsRef.child(leadId).remove()
      .then(() => loadLeads())
      .catch(error => console.error('Erreur lors de la suppression du lead:', error));
  }
}


// Fonction pour gérer la soumission du formulaire
document.getElementById('form').addEventListener('submit', function(event) {
  event.preventDefault();

  const leadId = leadIdInput.value;
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const emailid = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const source = document.getElementById('source').value;
  const status = document.getElementById('status').value;
  const msgContent = document.getElementById('msgContent').value;
  const assignedMember = document.getElementById('selectedMember').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;

  if (!firstName || !lastName || !emailid || !date || !time) {
    alert('Veuillez remplir tous les champs requis.');
    return;
  }

  const appointmentDateTime = new Date(`${date}T${time}`);
  const now = new Date();

  // Vérifier si la date est dans le passé
  if (appointmentDateTime < now) {
    alert('La date et l\'heure du rendez-vous ne peuvent pas être dans le passé.');
    return;
  }

  // Vérifier si le rendez-vous est un dimanche
  if (appointmentDateTime.getDay() === 0) {
    alert('Les rendez-vous ne peuvent pas être planifiés le dimanche.');
    return;
  }

  // Vérifier si l'heure du rendez-vous est en dehors de la plage horaire autorisée
  const appointmentHour = appointmentDateTime.getHours();
  if (appointmentHour < 9 || appointmentHour >= 18) {
    alert('Les rendez-vous doivent être planifiés entre 9h et 18h.');
    return;
  }

  // Vérifier le chevauchement avec les rendez-vous existants
  checkAppointmentConflict(date, time)
    .then(hasConflict => {
      if (hasConflict) {
        alert('Il y a un conflit avec un autre rendez-vous. Les rendez-vous doivent être espacés d\'au moins 30 minutes.');
        return;
      }

      // Vérifier si l'email existe déjà
      checkEmailExists(emailid)
        .then(emailExists => {
          if (emailExists && !leadId) {
            alert('Un lead avec cet email existe déjà.');
            return;
          }

          // Ajouter ou mettre à jour le lead si toutes les vérifications sont passées
          const leadData = {
            firstName,
            lastName,
            emailid,
            phone,
            source,
            status,
            msgContent,
            assignedMember,
            date,
            time
          };

          if (leadId) {
            leadsRef.child(leadId).update(leadData)
              .then(() => {
                alert('Lead mis à jour');
                leadForm.style.display = 'none';
                loadLeads();
                resetForm();
              })
              .catch(error => {
                console.error('Erreur lors de la mise à jour du lead:', error);
                alert('Erreur lors de la mise à jour du lead.');
              });
          } else {
            leadsRef.push(leadData)
              .then(() => {
                alert('Lead ajouté');
                leadForm.style.display = 'none';
                loadLeads();
                resetForm();
              })
              .catch(error => {
                console.error('Erreur lors de l\'ajout du lead:', error);
                alert('Erreur lors de l\'ajout du lead.');
              });
          }
        })
        .catch(error => console.error('Erreur lors de la vérification de l\'email:', error));
    })
    .catch(error => console.error('Erreur lors de la vérification des conflits de rendez-vous:', error));
});



document.getElementById('addLeadButton').addEventListener('click', function() {
  leadIdInput.value = '';
  document.getElementById('formTitle').textContent = 'Ajouter un Lead';
  leadForm.style.display = 'block';
});

document.getElementById('cancelButton').addEventListener('click', function() {
  leadForm.style.display = 'none';
});

document.getElementById('exportCsvButton').addEventListener('click', function() {
  const csvRows = [];
  const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Source', 'Statut', 'Message', 'Membre Assigné', 'Date', 'Heure'];
  csvRows.push(headers.join(','));

  leadsRef.once('value')
    .then(snapshot => {
      snapshot.forEach(childSnapshot => {
        const lead = childSnapshot.val();
        const row = [
          lead.firstName || '',
          lead.lastName || '',
          lead.emailid || '',
          lead.phone || '',
          lead.source || '',
          lead.status || '',
          lead.msgContent || '',
          lead.assignedMember || '',
          lead.date || '',
          lead.time || ''
        ];
        csvRows.push(row.join(','));
      });

      const csvFile = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(csvFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads.csv';
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Erreur lors de l\'exportation CSV:', error));
});

document.getElementById('exportExcelButton').addEventListener('click', function() {
  const workbook = XLSX.utils.book_new();
  const csvRows = [];
  const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Source', 'Statut', 'Message', 'Membre Assigné', 'Date', 'Heure'];
  csvRows.push(headers);

  leadsRef.once('value')
    .then(snapshot => {
      snapshot.forEach(childSnapshot => {
        const lead = childSnapshot.val();
        const row = [
          lead.firstName || '',
          lead.lastName || '',
          lead.emailid || '',
          lead.phone || '',
          lead.source || '',
          lead.status || '',
          lead.msgContent || '',
          lead.assignedMember || '',
          lead.date || '',
          lead.time || ''
        ];
        csvRows.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(csvRows);
      XLSX.utils.book_append_sheet(workbook, ws, 'Leads');
      XLSX.writeFile(workbook, 'leads.xlsx');
    })
    .catch(error => console.error('Erreur lors de l\'exportation Excel:', error));
});

document.getElementById('importExcelButton').addEventListener('click', function() {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      rows.slice(1).forEach(row => {
        const [firstName, lastName, emailid, phone, source, status, msgContent, assignedMember, date, time] = row;
        if (emailid) {
          leadsRef.push({
            firstName,
            lastName,
            emailid,
            phone,
            source,
            status,
            msgContent,
            assignedMember,
            date,
            time
          });
        }
      });

      loadLeads();
    };
    reader.readAsArrayBuffer(file);
  }
});

document.getElementById('statisticsButton').addEventListener('click', function() {
  leadsRef.once('value')
    .then(snapshot => {
      let pendingCount = 0;
      let confirmedCount = 0;
      let resolvedCount = 0;

      snapshot.forEach(childSnapshot => {
        const lead = childSnapshot.val();
        switch (lead.status) {
          case 'en attente':
            pendingCount++;
            break;
          case 'Confirmé':
            confirmedCount++;
            break;
          case 'Annulé':
            resolvedCount++;
            break;
        }
      });

      document.getElementById('pendingCount').textContent = `En attente: ${pendingCount}`;
      document.getElementById('confirmedCount').textContent = `Confirmé: ${confirmedCount}`;
      document.getElementById('resolvedCount').textContent = `Annulé: ${resolvedCount}`;

      statisticsModal.modal('show');
    })
    .catch(error => console.error('Erreur lors de la récupération des statistiques:', error));
});

// Fonction pour réinitialiser le formulaire
function resetForm() {
  leadIdInput.value = '';
  document.getElementById('firstName').value = '';
  document.getElementById('lastName').value = '';
  document.getElementById('email').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('source').value = '';
  document.getElementById('status').value = '';
  document.getElementById('msgContent').value = '';
  document.getElementById('date').value = '';
  document.getElementById('time').value = '';
  document.getElementById('selectedMember').value = '';
}

loadLeads();


function checkAppointmentConflict(date, time) {
  const appointmentDateTime = new Date(`${date}T${time}`);
  return leadsRef.once('value')
    .then(snapshot => {
      let hasConflict = false;
      snapshot.forEach(childSnapshot => {
        const lead = childSnapshot.val();
        if (lead.date && lead.time) {
          const existingAppointmentDateTime = new Date(`${lead.date}T${lead.time}`);
          if (Math.abs(existingAppointmentDateTime - appointmentDateTime) < 30 * 60 * 1000) { // 30 minutes
            hasConflict = true;
          }
        }
      });
      return hasConflict;
    });
}

function checkEmailExists(emailid) {
  return leadsRef.once('value')
    .then(snapshot => {
      let emailExists = false;
      snapshot.forEach(childSnapshot => {
        const lead = childSnapshot.val();
        if (lead.emailid === emailid) {
          emailExists = true;
        }
      });
      return emailExists;
    });
}


// Déclarez les nouveaux éléments
const searchButton = document.getElementById('searchButton');
const filterContainer = document.getElementById('filterContainer');
const backButton = document.getElementById('backButton');
const filterPendingButton = document.getElementById('filterPendingButton');
const filterConfirmedButton = document.getElementById('filterConfirmedButton');
const filterCancelledButton = document.getElementById('filterCancelledButton');

// Fonction pour afficher ou masquer les boutons de filtrage
searchButton.addEventListener('click', () => {
  filterContainer.classList.toggle('d-none');
});

// Fonction pour masquer le conteneur des boutons de filtrage
backButton.addEventListener('click', () => {
  filterContainer.classList.add('d-none');
  loadLeads(); // Charger tous les leads lorsque le bouton retour est cliqué
});


// Fonction pour charger les leads avec un statut spécifique
function loadLeadsByStatus(status) {
  leadsRef.once('value')
    .then(snapshot => {
      leadsTableBody.innerHTML = '';
      snapshot.forEach(childSnapshot => {
        const lead = childSnapshot.val();
        if (status === 'all' || lead.status === status) {
          const row = document.createElement('tr');
          row.innerHTML = `
          <td>${lead.firstName || ''}</td>
          <td>${lead.lastName || ''}</td>
          <td>${lead.emailid || ''}</td>
          <td>${lead.phone || ''}</td>
          <td>${lead.source || ''}</td>
          <td>${lead.status || ''}</td>
          <td>${lead.msgContent || ''}</td>
          <td>${lead.assignedMember || ''}</td>
          <td>${lead.date || ''}</td>
          <td>${lead.time || ''}</td>
          <td class="d-flex align-items-center">
            <button class="btn btn-warning btn-sm mr-2" onclick="editLead('${childSnapshot.key}')">Modifier</button>
            <button class="btn btn-danger btn-sm" onclick="deleteLead('${childSnapshot.key}')">Supprimer</button>
          </td>
        `;
        
          leadsTableBody.appendChild(row);
        }
      });
    })
    .catch(error => console.error('Erreur lors du chargement des leads:', error));
}

// Attachez les événements de clic aux boutons de filtrage
filterPendingButton.addEventListener('click', () => loadLeadsByStatus('en attente'));
filterConfirmedButton.addEventListener('click', () => loadLeadsByStatus('Confirmé'));
filterCancelledButton.addEventListener('click', () => loadLeadsByStatus('Annulé'));

// Optionnel : Charge tous les leads au démarrage
loadLeads();



 // Fonction pour afficher les boutons supplémentaires
 document.getElementById('initialButton').addEventListener('click', () => {
  const additionalButtons = document.getElementById('additionalButtons');
  additionalButtons.classList.toggle('hidden');
});
  
/****conter le le nombre des leads   */
function countLeads() {
  leadsRef.once('value', snapshot => {
    const totalLeads = snapshot.numChildren();
    document.getElementById('lead-count').textContent = `Nombre de leads: ${totalLeads}`;
  });
}


