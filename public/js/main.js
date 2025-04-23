$(document).ready(function() {
    // Fermeture automatique des alertes après 5 secondes
    setTimeout(function() {
        $('.alert').alert('close');
    }, 5000);
    
    // Validation du formulaire d'inscription
    $('#register-form').submit(function(e) {
        const password = $('#password').val();
        const confirmPassword = $('#confirm_password').val();
        
        if (password !== confirmPassword) {
            e.preventDefault();
            alert('Les mots de passe ne correspondent pas.');
        }
    });
    
    // Initialisation des tooltips Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});