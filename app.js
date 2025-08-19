document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const cardsContainer = document.getElementById('cardsContainer');

    let allCardsData = []; // To store all combined card data

    // Function to fetch JSON data
    async function fetchCardsData() {
        try {
            const [devResponse, analyticsResponse] = await Promise.all([
                fetch('cards_dev.json'),
                fetch('cards_analytics.json')
            ]);

            if (!devResponse.ok) throw new Error(`HTTP error! status: ${devResponse.status} from cards_dev.json`);
            if (!analyticsResponse.ok) throw new Error(`HTTP error! status: ${analyticsResponse.status} from cards_analytics.json`);

            const devData = await devResponse.json();
            const analyticsData = await analyticsResponse.json();

            allCardsData = [...devData, ...analyticsData];
            renderCards(allCardsData);

        } catch (error) {
            console.error("Error fetching card data:", error);
            cardsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: red; font-size: 1.2em; margin-top: 50px;">Failed to load cards. Please check the JSON files and ensure they are in the same directory as app.js.</p>';
        }
    }

    // Function to create a single card element
    function createCardElement(cardData) {
        const card = document.createElement('div');
        card.classList.add('card', cardData.type);

        const cardHeader = document.createElement('div');
        cardHeader.classList.add('card-header');
        cardHeader.innerHTML = `
            <h2>${cardData['Query/Job']}</h2>
            <span class="card-toggle-icon">&#9660;</span> <!-- Down arrow unicode -->
        `;
        card.appendChild(cardHeader);

        const cardContent = document.createElement('div');
        cardContent.classList.add('card-content');

        // Description
        const descriptionP = document.createElement('p');
        descriptionP.innerHTML = `<strong>Description:</strong><br>${cardData.Description.replace(/\n/g, '<br>')}`;
        cardContent.appendChild(descriptionP);

        // Filters or Business Rules
        const filtersP = document.createElement('p');
        filtersP.innerHTML = `<strong>Filters or Business Rules:</strong><br>${cardData['Filters or Business Rules'].replace(/\n/g, '<br>')}`;
        cardContent.appendChild(filtersP);

        // Embedded HTML Section
        const embeddedHtmlSection = document.createElement('div');
        embeddedHtmlSection.classList.add('embedded-html-section');

        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Show Code';
        embeddedHtmlSection.appendChild(toggleButton);

        const embeddedHtmlWrapper = document.createElement('div');
        embeddedHtmlWrapper.classList.add('embedded-html-wrapper');
        // Initial content for the wrapper before HTML is loaded
        embeddedHtmlWrapper.innerHTML = '<p style="text-align: center; color: #999;">Content will load here...</p>';
        embeddedHtmlSection.appendChild(embeddedHtmlWrapper);

        cardContent.appendChild(embeddedHtmlSection);
        card.appendChild(cardContent);

        // Store the HTML file path directly on the wrapper for easy access
        embeddedHtmlWrapper.dataset.htmlPath = cardData['Embeded HTML'];
        // Use a flag to track if content has been loaded
        embeddedHtmlWrapper.dataset.contentLoaded = 'false';


        // Event listener for collapsing/expanding card
        cardHeader.addEventListener('click', () => {
            card.classList.toggle('expanded');
        });

        // Event listener for showing/hiding embedded HTML
        toggleButton.addEventListener('click', async () => {
            const isVisible = embeddedHtmlWrapper.classList.contains('visible');
            const htmlPath = embeddedHtmlWrapper.dataset.htmlPath;
            const contentLoaded = embeddedHtmlWrapper.dataset.contentLoaded === 'true';

            if (isVisible) {
                // If currently visible, hide it
                embeddedHtmlWrapper.classList.remove('visible');
                toggleButton.textContent = 'Show Code';
            } else {
                // If currently hidden, show it
                if (!contentLoaded) {
                    toggleButton.textContent = 'Loading...'; // Show loading state
                    embeddedHtmlWrapper.innerHTML = '<p style="text-align: center; color: #999;">Loading embedded HTML...</p>';
                    try {
                        const response = await fetch(htmlPath);
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status} while fetching ${htmlPath}`);
                        }
                        const htmlContent = await response.text();
                        embeddedHtmlWrapper.innerHTML = htmlContent; // Inject the fetched HTML
                        embeddedHtmlWrapper.dataset.contentLoaded = 'true'; // Mark as loaded
                    } catch (error) {
                        console.error(`Error loading embedded HTML from ${htmlPath}:`, error);
                        embeddedHtmlWrapper.innerHTML = `<p style="text-align: center; color: red;">Failed to load content from ${htmlPath}.</p>`;
                    }
                }
                embeddedHtmlWrapper.classList.add('visible');
                toggleButton.textContent = 'Hide Code';
            }
        });

        return card;
    }

    // Function to render cards based on filtered data
    function renderCards(cardsToDisplay) {
        cardsContainer.innerHTML = ''; // Clear existing cards
        if (cardsToDisplay.length === 0) {
            cardsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: #666; font-size: 1.1em; margin-top: 50px;">No matching cards found.</p>';
            return;
        }
        cardsToDisplay.forEach(cardData => {
            const cardElement = createCardElement(cardData);
            cardsContainer.appendChild(cardElement);
        });
    }

    // Call the function to fetch data when the DOM is loaded
    fetchCardsData();

    // Search functionality
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredCards = allCardsData.filter(card => {
            const queryJob = card['Query/Job'] ? card['Query/Job'].toLowerCase() : '';
            const description = card.Description ? card.Description.toLowerCase() : '';
            return queryJob.includes(searchTerm) || description.includes(searchTerm);
        });
        renderCards(filteredCards);
    });
});