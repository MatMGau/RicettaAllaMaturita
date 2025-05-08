document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('appSidebar');
    // const mainContent = document.querySelector('.app-main-content'); // Per l'overlay opzionale

    if (hamburgerBtn && sidebar) {
        hamburgerBtn.addEventListener('click', () => {
            console.log("Hamburger cliccato!"); // Aggiungi per debug
            sidebar.classList.toggle('is-visible');
            // Aggiorna ARIA attribute per accessibilità
            const isExpanded = sidebar.classList.contains('is-visible');
            hamburgerBtn.setAttribute('aria-expanded', isExpanded);

            // Cambia icona hamburger (opzionale)
            const icon = hamburgerBtn.querySelector('i');
            if (isExpanded) {
                icon.classList.remove('bi-list');
                icon.classList.add('bi-x-lg'); // Icona X
            } else {
                icon.classList.remove('bi-x-lg');
                icon.classList.add('bi-list');
            }

            // Opzionale: per l'overlay sul contenuto principale
            // if (mainContent) {
            //    mainContent.classList.toggle('sidebar-open-overlay', isExpanded);
            // }
        });
    }

    // --- Il resto del tuo JavaScript per la logica dell'app (upload, risultati etc.) ---
    const imageInput = document.getElementById('imageInput');
    const imagePreviewDiv = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsArea = document.getElementById('resultsArea');
    const userPromptTextarea = document.getElementById('userPrompt');

    const placeholderHtml = `
        <i class="bi bi-plus-circle-dotted placeholder-icon"></i>
        <span class="placeholder-text">Select Image</span>`;
    if(imagePreviewDiv) imagePreviewDiv.innerHTML = placeholderHtml;

    if(imageInput) imageInput.addEventListener('change', handleImagePreview);
    if(submitBtn) submitBtn.addEventListener('click', handleSubmit);

    function handleImagePreview() {
        // ... (come prima)
        const files = imageInput.files;
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreviewDiv.innerHTML = '';
                const img = document.createElement('img');
                img.src = e.target.result;
                imagePreviewDiv.appendChild(img);
            }
            reader.readAsDataURL(file);
        } else {
             imagePreviewDiv.innerHTML = placeholderHtml;
        }
    }

    async function handleSubmit() {
        // ... (come prima, con la gestione di loadingIndicator, resultsArea, ecc.)
        // Assicurati che la logica di displayResults e displayError
        // aggiunga e rimuova la classe 'visible' da resultsArea per l'animazione.
        const files = imageInput.files;
        if (files.length === 0 && imageInput) { // Aggiunto controllo imageInput per evitare errori se non presente
            alert('Per favore, seleziona un\'immagine prima di inviare.');
            return;
        }

        const file = files[0];
        const userPrompt = userPromptTextarea ? userPromptTextarea.value.trim() : '';

        if(loadingIndicator) loadingIndicator.style.display = 'block';
        if(resultsArea) {
            resultsArea.style.display = 'none';
            resultsArea.classList.remove('visible');
            resultsArea.innerHTML = '';
        }

        const formData = new FormData();
        formData.append('foodImage', file);
        if (userPrompt) {
             formData.append('userPrompt', userPrompt);
        }

        try {
            const response = await fetch('upload.php', { method: 'POST', body: formData });
            if(loadingIndicator) loadingIndicator.style.display = 'none';

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Errore HTTP:', response.status, errorText);
                displayError(`Errore dal server: ${response.status}. Dettagli: ${errorText}`);
                return;
            }
            try {
                 const data = await response.json();
                 if (data.error) {
                     displayError(data.error);
                 } else {
                     displayResults(data);
                 }
            } catch (parseError) {
                 displayError('Risposta dal server non valida (JSON atteso).');
            }
        } catch (networkError) {
            if(loadingIndicator) loadingIndicator.style.display = 'none';
            displayError('Errore di connessione al server.');
        }
    }

    function displayResults(data) {
        // ... (come prima, assicurati di aggiungere/rimuovere .visible)
        if (!resultsArea) return;
        resultsArea.innerHTML = '';
        if (data.ricette && data.ricette.length > 0) {
            data.ricette.forEach(ricetta => {
                const recipeElement = document.createElement('div');
                recipeElement.classList.add('result-item');
                recipeElement.innerHTML = `<h3>${ricetta.nomeRicetta || 'N/D'}</h3> ... (resto HTML ricetta) ... `;
                resultsArea.appendChild(recipeElement);
            });
        } else {
            resultsArea.innerHTML = `<p>Nessuna ricetta trovata.</p>`;
        }
        resultsArea.style.display = 'block';
        setTimeout(() => resultsArea.classList.add('visible'), 10);
    }

    function displayError(message) {
        // ... (come prima, assicurati di aggiungere/rimuovere .visible)
        if (!resultsArea) return;
        resultsArea.innerHTML = `<div class="alert alert-danger">${message}</div>`;
        resultsArea.style.display = 'block';
        setTimeout(() => resultsArea.classList.add('visible'), 10);
    }
});