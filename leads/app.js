// Importer les fonctions nécessaires depuis Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js";

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyABC6xWO7T4qxgVfD5MK2U-ReEPHh0quik",
    authDomain: "leads-3892c.firebaseapp.com",
    projectId: "leads-3892c",
    storageBucket: "leads-3892c.appspot.com",
    messagingSenderId: "1086480345958",
    appId: "1:1086480345958:web:84bbb0fb5bd496edc836a7",
    databaseURL: "https://leads-3892c-default-rtdb.firebaseio.com"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

function displayFiles() {
    const fileList = document.getElementById('fileList');

    // Référence à la base de données Firebase Realtime Database
    const dbRef = ref(database, 'leads/');
    
    onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        fileList.innerHTML = ''; // Réinitialiser la liste

        if (data) {
            Object.keys(data).forEach(fileName => {
                const fileData = data[fileName];

                // Créer un élément de liste pour chaque fichier
                const fileItem = document.createElement('li');
                fileItem.className = 'file-item';

                // Obtenir l'URL de téléchargement du fichier PDF
                const fileRef = storageRef(storage, `leads/${fileName}`);
                getDownloadURL(fileRef)
                    .then((url) => {
                        fileItem.innerHTML = `
                            <a href="${url}" target="_blank">${fileData.name}</a>
                        `;
                        fileList.appendChild(fileItem);
                    })
                    .catch((error) => {
                        console.error('Erreur lors de la récupération de l\'URL :', error);
                    });
            });
        } else {
            fileList.innerHTML = '<p>Aucun fichier trouvé.</p>';
        }
    }, (error) => {
        console.error('Erreur lors de la récupération des données :', error);
    });
}

// Appeler la fonction pour afficher les fichiers au chargement de la page
document.addEventListener('DOMContentLoaded', displayFiles);
