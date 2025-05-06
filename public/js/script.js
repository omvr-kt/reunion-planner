console.log('Script UI chargé!');
document.addEventListener('DOMContentLoaded', function() {
  console.log('Document chargé, vérification des boutons modaux');
  document.querySelectorAll('button[onclick*="Modal"]').forEach(button => {
    console.log('Bouton modal trouvé:', button.id || button.textContent.trim());
    button.addEventListener('click', function() {
      console.log('Clic sur le bouton:', this.id || this.textContent.trim());
    });
  });
});

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    console.log('Ouverture du modal:', modalId);
    setTimeout(() => {
      if (modal.style.display !== 'flex') {
        console.warn('Le modal ne semble pas s\'afficher correctement, nouvelle tentative');
        modal.style.cssText = 'display: flex !important; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; overflow-y: auto; padding: 1rem;';
      }
    }, 50);
  } else {
    console.error('Modal non trouvé:', modalId);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    console.log('Fermeture du modal:', modalId);
  } else {
    console.error('Modal non trouvé:', modalId);
  }
}

function toggleDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    console.log('Toggle du dropdown:', dropdownId, 'vers:', dropdown.style.display);
  } else {
    console.error('Dropdown non trouvé:', dropdownId);
  }
}

document.addEventListener('click', function(event) {
  const dropdowns = document.querySelectorAll('.dropdown-menu');
  dropdowns.forEach(dropdown => {
    if (dropdown.style.display === 'block' && 
       !dropdown.contains(event.target) && 
       !event.target.closest(`[onclick*="${dropdown.id}"]`)) {
      dropdown.style.display = 'none';
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  console.log('Script d\'interface utilisateur chargé');
  
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });
  
  const hash = window.location.hash;
  if (hash && hash.startsWith('#modal-')) {
    const modalId = hash.substring(7); 
    openModal(modalId);
  }
});