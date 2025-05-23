$(document).ready(function() {
    setTimeout(function() {
        $('.alert').alert('close');
    }, 5000);
    
    $('#register-form').submit(function(e) {
        const password = $('#password').val();
        const confirmPassword = $('#confirm_password').val();
        
        if (password !== confirmPassword) {
            e.preventDefault();
            alert('Les mots de passe ne correspondent pas.');
        }
    });
    
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Ajouter des styles CSS pour les champs datetime-local désactivés
    const style = document.createElement('style');
    style.textContent = `
        input[type="datetime-local"]:disabled,
        input[type="datetime-local"].past-date {
            background-color: #e9ecef;
            cursor: not-allowed;
            opacity: 0.65;
        }
    `;
    document.head.appendChild(style);
    
    setupDateTimeFields();    
    setupCalendarEvents();
    setupDocumentUploader();
    setupAvailabilityVisualization();
});

function setupDateTimeFields() {
    const dateTimeFields = document.querySelectorAll('input[type="datetime-local"]');
    
    // Définir la date et l'heure minimales (maintenant)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Appliquer la restriction à tous les champs datetime-local
    dateTimeFields.forEach(field => {
        // Définir l'attribut min pour empêcher la sélection de dates passées
        field.setAttribute('min', minDateTime);
        
        // Ajouter une classe pour les styles CSS
        field.classList.add('future-only');
        
        // Vérifier si la valeur actuelle est dans le passé
        if (field.value && new Date(field.value) < now) {
            field.value = ''; // Effacer la valeur si elle est dans le passé
        }
        
        field.addEventListener('change', function() {
            const row = this.closest('.row');
            if (!row) return;
            
            const startField = row.querySelector('.timeslot-start');
            const endField = row.querySelector('.timeslot-end');
            
            // Vérifier si la date sélectionnée est dans le passé
            const selectedDate = new Date(this.value);
            if (selectedDate < now) {
                alert('Vous ne pouvez pas sélectionner une date et heure dans le passé');
                this.value = '';
                return;
            }
            
            if (startField && endField && startField.value && endField.value) {
                const startDate = new Date(startField.value);
                const endDate = new Date(endField.value);
                
                if (endDate <= startDate) {
                    alert('La date et heure de fin doit être après la date et heure de début');
                    this.value = '';
                }
            }
        });
    });
}

function setupCalendarEvents() {
    const calendarEvents = document.querySelectorAll('.calendar-event');
    
    calendarEvents.forEach(event => {
        event.addEventListener('click', function() {
            this.style.transform = 'scale(1.05)';
            
            setTimeout(() => {
                this.style.transform = '';
            }, 500);
        });
    });
}

function setupDocumentUploader() {
    const fileInput = document.getElementById('document');
    if (!fileInput) return;
    
    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Le fichier est trop volumineux. La taille maximale est de 5 MB.');
            this.value = '';
            return;
        }
        
        const fileNameDisplay = document.querySelector('.file-name-display');
        if (fileNameDisplay) {
            fileNameDisplay.textContent = file.name;
        }
    });
}

function setupAvailabilityVisualization() {
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const percentage = parseInt(bar.style.width);
        if (percentage >= 70) {
            bar.classList.add('bg-success');
        } else if (percentage >= 40) {
            bar.classList.add('bg-warning');
        } else {
            bar.classList.add('bg-danger');
        }
    });
}

function formatDate(date, options = {}) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const defaultOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    
    return date.toLocaleDateString(navigator.language || 'fr-FR', {...defaultOptions, ...options});
}

function formatTime(date, options = {}) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    
    const defaultOptions = {
        hour: '2-digit', 
        minute: '2-digit'
    };
    
    return date.toLocaleTimeString(navigator.language || 'fr-FR', {...defaultOptions, ...options});
}