// script.js

document.addEventListener('DOMContentLoaded', () => {
    // Riferimenti DOM
    const imageInput = document.getElementById('imageInput');
    const imagePreviewDiv = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsArea = document.getElementById('resultsArea');
    const userPromptTextarea = document.getElementById('userPrompt'); // Se usi il prompt aggiuntivo

    // Placeholder iniziale per l'anteprima
    const placeholderHtml = `
        <i class="bi bi-plus-circle-dotted placeholder-icon"></i>
        <span class="placeholder-text">Select Image</span>`;
    imagePreviewDiv.innerHTML = placeholderHtml;


    // Event Listener per selezione file
    imageInput.addEventListener('change', handleImagePreview);

    // Event Listener per il pulsante Invia
    submitBtn.addEventListener('click', handleSubmit);

    // --- FUNZIONI ---

    function handleImagePreview() {
        const files = imageInput.files;
        if (files.length > 0) {
            const file = files[0];
            // Controlla tipo MIME se vuoi essere più sicuro (opzionale)
            // if (!file.type.startsWith('image/')){ continue }

            const reader = new FileReader();

            reader.onload = function(e) {
                // Crea elemento immagine e lo mostra
                imagePreviewDiv.innerHTML = ''; // Svuota il placeholder
                const img = document.createElement('img');
                img.src = e.target.result;
                imagePreviewDiv.appendChild(img);
            }
            reader.readAsDataURL(file); // Legge il file come Base64
        } else {
             // Se l'utente deseleziona, rimetti il placeholder
             imagePreviewDiv.innerHTML = placeholderHtml;
        }
    }

    async function handleSubmit() {
        const files = imageInput.files;
        if (files.length === 0) {
            alert('Per favore, seleziona un\'immagine prima di inviare.');
            return;
        }

        const file = files[0];
        const userPrompt = userPromptTextarea.value.trim(); // Leggi prompt aggiuntivo

        // Mostra loading, nascondi risultati precedenti
        loadingIndicator.style.display = 'block';
        resultsArea.style.display = 'none'; // Nascondi subito
        resultsArea.classList.remove('visible'); // Rimuovi classe per animazione al prossimo show
        resultsArea.innerHTML = ''; // Svuota risultati vecchi

        // Prepara FormData
        const formData = new FormData();
        formData.append('foodImage', file);
        if (userPrompt) { // Aggiungi prompt solo se non è vuoto
             formData.append('userPrompt', userPrompt);
        }


        try {
            // Chiamata al Backend (assicurati che 'upload.php' sia il percorso corretto)
            const response = await fetch('upload.php', {
                method: 'POST',
                body: formData
            });

            // Nascondi loading SEMPRE dopo la risposta
            loadingIndicator.style.display = 'none';

            if (!response.ok) {
                // Errore HTTP (es. 404, 500)
                const errorText = await response.text(); // Leggi testo errore se c'è
                console.error('Errore HTTP:', response.status, errorText);
                displayError(`Errore dal server: ${response.status}. Controlla la console per dettagli.`);
                return;
            }

            // Tenta di processare la risposta (JSON o XML? Decidiamo per JSON per ora)
            // Se scegliessi XML, qui dovresti usare response.text() e DOMParser
            try {
                 const data = await response.json();
                 // Controlla se la risposta del backend indica un errore applicativo
                 if (data.error) {
                     console.error('Errore applicativo:', data.error);
                     displayError(data.error); // Mostra l'errore inviato dal PHP
                 } else {
                     // Tutto ok, mostra i risultati
                     displayResults(data);
                 }
            } catch (parseError) {
                 // Errore nel parsing JSON (o XML se usi quello)
                 console.error('Errore nel parsing della risposta:', parseError);
                 displayError('La risposta dal server non è in un formato valido.');
            }


        } catch (networkError) {
            // Errore di rete (es. server non raggiungibile)
            console.error('Errore di rete:', networkError);
            loadingIndicator.style.display = 'none'; // Assicurati sia nascosto
            displayError('Errore di connessione. Impossibile raggiungere il server.');
        }
    }

    function displayResults(data) {
        resultsArea.innerHTML = ''; // Svuota per sicurezza

        // Supponiamo che 'data' sia l'oggetto con la chiave 'ricette' (un array)
        // o direttamente l'oggetto ricetta se ne genera una sola.
        // Adatta questa logica alla struttura ESATTA che il tuo PHP invierà.
        // Esempio se 'data' contiene un array 'ricette':

        if (data.ricette && data.ricette.length > 0) {
            data.ricette.forEach(ricetta => {
                const recipeElement = document.createElement('div');
                recipeElement.classList.add('result-item'); // Usa classe CSS

                // Controlla esistenza campi prima di usarli
                recipeElement.innerHTML = `
                    <h3>${ricetta.nomeRicetta || 'Ricetta Senza Nome'}</h3>
                    ${ricetta.origine ? `<p><strong>Origine:</strong> ${ricetta.origine}</p>` : ''}
                    ${ricetta.autore ? `<p><strong>Autore:</strong> ${ricetta.autore}</p>` : ''}

                    ${ricetta.ingredientiQuantita && ricetta.ingredientiQuantita.length > 0 ? `
                        <h5>Ingredienti:</h5>
                        <ul>
                            ${ricetta.ingredientiQuantita.map(ing => `<li>${ing}</li>`).join('')}
                        </ul>` : ''}

                    ${ricetta.processo && ricetta.processo.length > 0 ? `
                        <h5>Procedimento:</h5>
                        <ol>
                            ${ricetta.processo.map(step => `<li>${step}</li>`).join('')}
                        </ol>` : ''}
                `;
                resultsArea.appendChild(recipeElement);
            });

        } else {
            // Nessuna ricetta trovata o formato dati non previsto
             resultsArea.innerHTML = `<p class="text-center text-muted">Non sono state trovate ricette o il formato della risposta non è corretto.</p>`;
        }

        resultsArea.style.display = 'block'; // Rendi visibile il contenitore
        // Ritardo minimo per permettere al display:block di applicarsi prima della transizione
        setTimeout(() => {
             resultsArea.classList.add('visible'); // Aggiungi classe per animazione fade-in/slide-up
        }, 10);
    }

    function displayError(message) {
        resultsArea.innerHTML = `<div class="alert alert-danger" role="alert">${message}</div>`;
        resultsArea.style.display = 'block';
         // Ritardo minimo per permettere al display:block di applicarsi prima della transizione
         setTimeout(() => {
            resultsArea.classList.add('visible'); // Aggiungi classe per animazione fade-in/slide-up
        }, 10);
    }

}); // Fine DOMContentLoaded