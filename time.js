document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const openModalBtn = document.getElementById('openModalBtn');
    const playerModal = document.getElementById('playerModal');
    const closeModal = document.getElementById('closeModal');
    const nameSearch = document.getElementById('nameSearch');
    const searchResults = document.getElementById('searchResults');
    const selectedPlayerDetails = document.getElementById('selectedPlayerDetails');
    const playerInfoContainer = document.getElementById('playerInfoContainer');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');
    const nationalityFilter = document.getElementById('nationalityFilter');
    const positionFilter = document.getElementById('positionFilter');
    const clubFilter = document.getElementById('clubFilter');
    
    
    // Player card element to show selected player
    const playerCardContainer = document.getElementById('player-GK');
    const teamContainer = document.getElementById('team-container');

    document.querySelectorAll('.formation-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const formation = e.target.getAttribute('data-formation');
            
            // Update current formation
            currentFormation = formation;
            
            // Re-render the team with the new formation
            renderTeam();
        });
    });


    const formationSelect = document.createElement('select');
    formationSelect.id = 'formationSelect';
    formationSelect.innerHTML = `
        <option value="4-3-3">4-3-3</option>
        <option value="4-4-2">4-4-2</option>
    `;
    document.querySelector('.p-4.border-b').insertBefore(formationSelect, document.querySelector('#searchResults'));

    // Player positioning configuration
    const FORMATIONS = {
        '4-3-3': [
            { position: 'GK', row: 5, col: 3 },
            { position: 'CB', row: 4, col: 2 }, { position: 'CB', row: 4, col: 4 },
            { position: 'LB', row: 4, col: 1 }, { position: 'RB', row: 4, col: 5 },
            { position: 'CM', row: 3, col: 2 }, { position: 'CM', row: 3, col: 3 }, { position: 'CM', row: 3, col: 4 },
            { position: 'LW', row: 2, col: 1 }, { position: 'RW', row: 2, col: 5 },
            { position: 'ST', row: 2, col: 3 }
        ],
        '4-4-2': [
            { position: 'GK', row: 5, col: 3 },
            { position: 'CB', row: 4, col: 2 }, { position: 'CB', row: 4, col: 4 },
            { position: 'LB', row: 4, col: 1 }, { position: 'RB', row: 4, col: 5 },
            { position: 'LM', row: 3, col: 1 }, { position: 'CM', row: 3, col: 2 }, { position: 'CM', row: 3, col: 4 }, { position: 'RM', row: 3, col: 5 },
            { position: 'ST', row: 2, col: 2 }, { position: 'ST', row: 2, col: 4 }
        ]
    };

    // Player selection state
    let players = [];
    let selectedPlayers = [];
    const MAX_TEAM_SIZE = 11;
    let currentFormation = '4-3-3';

    // Fetch players data
    fetch('time.json')
        .then(response => response.json())
        .then(data => {
            players = data.players;
            populateFilters();
            renderSearchResults();
            loadSelectedTeam();
        })
        .catch(error => console.error('Error loading players:', error));

    // Formation selection event listener
    formationSelect.addEventListener('change', (e) => {
        currentFormation = e.target.value;
        renderTeam();
    });

    // Populate filter dropdowns
    function populateFilters() {
        // Unique nationalities
        const nationalities = [...new Set(players.map(p => p.nationality))].sort();
        nationalityFilter.innerHTML = `
            <option value="">All Nationalities</option>
            ${nationalities.map(nationality => `
                <option value="${nationality}">${nationality}</option>
            `).join('')}
        `;

        // Unique positions
        const positions = [...new Set(players.map(p => p.position))].sort();
        positionFilter.innerHTML = `
            <option value="">All Positions</option>
            ${positions.map(position => `
                <option value="${position}">${position}</option>
            `).join('')}
        `;

        // Unique clubs
        const clubs = [...new Set(players.map(p => p.club))].sort();
        clubFilter.innerHTML = `
            <option value="">All Clubs</option>
            ${clubs.map(club => `
                <option value="${club}">${club}</option>
            `).join('')}
        `;
    }

    // Open modal
    openModalBtn.addEventListener('click', () => {
        playerModal.classList.remove('hidden');
        selectedPlayerDetails.classList.add('hidden');
        searchResults.classList.remove('hidden');
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        playerModal.classList.add('hidden');
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        selectedPlayerDetails.classList.add('hidden');
        searchResults.classList.remove('hidden');
    });

    // Render search results with filters
    function renderSearchResults() {
        const nameQuery = nameSearch.value.toLowerCase();
        const selectedNationality = nationalityFilter.value;
        const selectedPosition = positionFilter.value;
        const selectedClub = clubFilter.value;

        const filteredPlayers = players.filter(player => 
            // Name search
            player.name.toLowerCase().includes(nameQuery) &&
            // Nationality filter
            (!selectedNationality || player.nationality === selectedNationality) &&
            // Position filter
            (!selectedPosition || player.position === selectedPosition) &&
            // Club filter
            (!selectedClub || player.club === selectedClub)
        );

        searchResults.innerHTML = filteredPlayers.map(player => `
            <div class="cursor-pointer hover:bg-gray-100 p-2 rounded player-item">
                <img 
                    src="${player.photo}" 
                    alt="${player.name}" 
                    class="w-full h-32 object-contain player-image"
                    data-player-id="${player.id}"
                >
                <p class="text-center mt-2 text-sm">${player.name}</p>
            </div>
        `).join('');

        // Add click event to player images
        document.querySelectorAll('.player-image').forEach(img => {
            img.addEventListener('click', selectPlayer);
        });
    }

    // Event listeners for filters and search
    nameSearch.addEventListener('input', renderSearchResults);
    nationalityFilter.addEventListener('change', renderSearchResults);
    positionFilter.addEventListener('change', renderSearchResults);
    clubFilter.addEventListener('change', renderSearchResults);

    // Select player with team management
    function selectPlayer(event) {
        const playerId = event.target.getAttribute('data-player-id');
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
            console.error('Player not found');
            return;
        }

        // Check if player is already in the team
        if (selectedPlayers.some(p => p.id === playerId)) {
            alert('This player is already in your team!');
            return;
        }

        // Get current formation configuration
        const formationConfig = FORMATIONS[currentFormation];

        // Find available position for this player's position
        const availablePositionConfig = formationConfig.positions.find(config => 
            config.position === player.position && 
            !selectedPlayers.some(p => 
                selectedPlayers.find(existing => 
                    existing.position === player.position && 
                    existing.row === config.row && 
                    existing.col === config.col
                )
            )
        );

        if (!availablePositionConfig) {
            alert(`No available position for ${player.position} in this formation!`);
            return;
        }

        // Add additional position information to the player
        const playerWithPosition = {
            ...player,
            row: availablePositionConfig.row,
            col: availablePositionConfig.col
        };

        // Add player to team
        selectedPlayers.push(playerWithPosition);
        saveSelectedTeam();
        renderTeam();
        
        // Update player info container and modal
        playerInfoContainer.innerHTML = createPlayerDetailsHTML(player);
        searchResults.classList.add('hidden');
        selectedPlayerDetails.classList.remove('hidden');
    }

    // Create team display
    function renderTeam() {
    // const teamContainer = document.getElementById('team-container');
    // teamContainer.innerHTML = ''; // Clear existing players

    // Create a grid container for precise positioning
    // const gridContainer = document.createElement('div');
    // gridContainer.style.display = 'grid';
    // gridContainer.style.gridTemplateColumns = 'repeat(5, 1fr)';
    // gridContainer.style.gridTemplateRows = 'repeat(5, 1fr)';
    // gridContainer.style.height = '100%';
    // gridContainer.style.width = '100%';
    // gridContainer.style.position = 'absolute';

    // Prepare positions based on current formation
    const formationPositions = FORMATIONS[currentFormation].positions;

    // formationPositions.forEach(posConfig => {
    //     const playerCard = document.createElement('div');
    //     playerCard.style.gridRow = posConfig.row;
    //     playerCard.style.gridColumn = posConfig.col;
    //     playerCard.style.display = 'flex';
    //     playerCard.style.justifyContent = 'center';
    //     playerCard.style.alignItems = 'center';

    //     // Find a player for this position
    //     const playerForPosition = selectedPlayers.find(p => 
    //         p.position === posConfig.position
    //     );

    //     if (playerForPosition) {
    //         playerCard.innerHTML = `
    //             <div class="btnCB relative w-[135px] h-[200px] bg-cover bg-center" style="background-image: url('./assets/img/card.png');">
    //                 <div class="relative flex px-1.5 text-[#e9cc74]">
    //                     <div class="absolute leading-[0.75rem] font-light uppercase py-16 overflow-hidden left-[15px] top-[-12px]">
    //                         <div class="text-xs player-rating">${playerForPosition.rating}</div>
    //                         <div class="text-[0.625rem] player-position"><span>${playerForPosition.position}</span></div>
    //                         <div class="block w-[0.6rem] h-[6px] my-0.5 player-nation">
    //                             <img src="${playerForPosition.flag}" alt="nationality" class="w-full h-full object-contain"/>
    //                         </div>
    //                         <div class="block w-[0.75rem] h-[12.5px] player-club">
    //                             <img src="${playerForPosition.logo}" alt="club" class="w-full h-full object-contain"/>
    //                         </div>
    //                     </div>
    //                     <div class="relative w-[70px] h-[70px] mx-auto overflow-hidden player-picture bottom-[-25px]">
    //                         <img src="${playerForPosition.photo}" alt="${playerForPosition.name}" class="w-full h-full object-contain relative "/>
    //                     </div>
    //                 </div>
    //                 <div class="relative bottom-[-31px]">
    //                     <div class="block px-0.5 text-[#e9cc74] w-[80%] mx-auto">
    //                         <div class="block text-center text-xs uppercase pb-0.5">${playerForPosition.name}</div>
    //                     </div>
    //                 </div>
    //                 <button class="delete-player absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6" data-id="${playerForPosition.id}">✖</button>
    //             </div>
    //         `;

    //         // Add delete event listener
    //         const deleteButton = playerCard.querySelector('.delete-player');
    //         deleteButton.addEventListener('click', () => {
    //             selectedPlayers = selectedPlayers.filter(p => p.id !== playerForPosition.id);
    //             saveSelectedTeam();
    //             renderTeam();
    //         });
    //     }

    //     gridContainer.appendChild(playerCard);
    // });

//     teamContainer.appendChild(gridContainer);
// }
    
// Render the team in the formation grid
function renderTeam() {
    // Assuming teamByPosition is now created based on the formation config
    const teamByPosition = FORMATIONS[currentFormation].map(posConfig => {
        const player = selectedPlayers.find(p => 
            p.gridRow === posConfig.row && 
            p.gridColumn === posConfig.col
        );

        return {
            position: posConfig.position,
            gridRow: posConfig.row,
            gridColumn: posConfig.col,
            player: player || null
        };
    });

    teamContainer.innerHTML = teamByPosition.map(positionData => {
        if (!positionData.player) return '';

        const player = positionData.player;
        return `
            <div class="player-team-card" style="
                grid-row: ${positionData.gridRow};
                grid-column: ${positionData.gridColumn};
                display: flex;
                justify-content: center;
                align-items: center;
            ">
                <!-- Rest of your player card HTML remains the same -->
            </div>
        `;
    }).join('');

    // Re-add delete player event listeners
    document.querySelectorAll('.delete-player').forEach(btn => {
        btn.addEventListener('click', deletePlayer);
    });
}
}


function selectPlayer(event) {
    const playerId = event.target.getAttribute('data-player-id');
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
        console.error('Player not found');
        return;
    }

    // Check if player is already in the team
    if (selectedPlayers.some(p => p.id === playerId)) {
        alert('This player is already in your team!');
        return;
    }

    // Get current formation configuration
    const formationConfig = FORMATIONS[currentFormation];

    // Check if there's an available position for this player in the current formation
    const availablePositions = formationConfig.filter(posConfig => 
        posConfig.position === player.position && 
        !selectedPlayers.some(selectedPlayer => 
            selectedPlayer.position === player.position && 
            selectedPlayer.gridRow === posConfig.row && 
            selectedPlayer.gridColumn === posConfig.col
        )
    );

    if (availablePositions.length === 0) {
        alert(`No available ${player.position} position in this formation!`);
        return;
    }

    // Select the first available position
    const selectedPosition = availablePositions[0];

    // Add player to team with grid position
    const playerWithGridPos = {
        ...player,
        gridRow: selectedPosition.row,
        gridColumn: selectedPosition.col
    };

    selectedPlayers.push(playerWithGridPos);
    saveSelectedTeam();
    renderTeam();
    
    // Update player info container and modal
    playerInfoContainer.innerHTML = createPlayerDetailsHTML(player);
    searchResults.classList.add('hidden');
    selectedPlayerDetails.classList.remove('hidden');
}

 // Modify local storage saving to include grid position
 function saveSelectedTeam() {
    localStorage.setItem('selectedTeam', JSON.stringify(selectedPlayers));
}

// Modify load team to work with new player object structure
function loadSelectedTeam() {
    const savedTeam = localStorage.getItem('selectedTeam');
    if (savedTeam) {
        selectedPlayers = JSON.parse(savedTeam);
        renderTeam();
    }
}

    // Update player card with selected player info
    function updatePlayerCard(player) {
        playerCardContainer.innerHTML = `
          <div class="btnCB relative top-[385px] w-[135px] h-[200px] bg-cover bg-center bg-none p-2 z-[2] transition ease-in duration-200"
    style="background-image: url('./assets/img/card.png');"
    id="player-GK">
    <div class="relative flex px-1.5 text-[#e9cc74]">
        <div class="absolute leading-[0.75rem] font-light uppercase py-16 overflow-hidden left-[15px] top-[-12px]">
            <div class="text-xs player-rating">${player.rating}</div>
            <div class="text-[0.625rem] player-position"><span>${player.position}</span></div>
            <div class="block w-[0.6rem] h-[6px] my-0.5 player-nation">
                <img src="${player.flag}" alt="nationality" class="w-full h-full object-contain"/>
            </div>
            <div class="block w-[0.75rem] h-[12.5px] player-club">
                <img src="${player.logo}" alt="club" class="w-full h-full object-contain"/>
            </div>
        </div>
        <div class="relative w-[70px] h-[70px] mx-auto overflow-hidden player-picture bottom-[-25px]">
            <img src="${player.photo}" alt="${player.name}" class="w-full h-full object-contain relative "/>
        </div>
    </div>
    <div class="relative bottom-[-31px]">
    <div class="block px-0.5 text-[#e9cc74] w-[80%] mx-auto">
        <div class="block text-center text-xs uppercase pb-0.5">${player.name}</div>
        <div class="flex justify-center my-0.5 player-features">
            <div class="items-center border-r border-opacity-10 border-[#e9cc74] px-1">
                <span class="flex text-[0.3rem] uppercase">
                    <div class="mr-0.5 font-bold">${player.pace}</div>
                    <div class="font-light">PAC</div>
                </span>
                <span class="flex text-[0.3rem] uppercase">
                    <div class="mr-0.5 font-bold">${player.shooting}</div>
                    <div class="font-light">SHO</div>
                </span>
                <span class="flex text-[0.3rem] uppercase">
                    <div class="mr-0.5 font-bold">${player.passing}</div>
                    <div class="font-light">PAS</div>
                </span>
            </div>
            <div class="items-center px-1">
                <span class="flex text-[0.3rem] uppercase">
                    <div class="mr-0.5 font-bold">${player.dribbling}</div>
                    <div class="font-light">DRI</div>
                </span>
                <span class="flex text-[0.3rem] uppercase">
                    <div class="mr-0.5 font-bold">${player.defending}</div>
                    <div class="font-light">DEF</div>
                </span>
                <span class="flex text-[0.3rem] uppercase">
                    <div class="mr-0.5 font-bold">${player.physical}</div>
                    <div class="font-light">PHY</div>
                </span>
            </div>
        </div>
    </div>
</div>
</div>
        `;
    }

    // Load selected player from local storage
    function loadSelectedPlayer() {
        const savedPlayer = localStorage.getItem('selectedPlayer');
        if (savedPlayer) {
            const player = JSON.parse(savedPlayer);
            updatePlayerCard(player);
        }
    }

    // Create stat bar helper function
    function createStatBar(label, value) {
        return `
            <div>
                <div class="flex justify-between mb-1">
                    <span class="text-xs">${label}</span>
                    <span class="text-xs font-bold">${value}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full" style="width: ${value}%"></div>
                </div>
            </div>
        `;
    }

    // Create player details HTML function
    function createPlayerDetailsHTML(player) {
        return `
            <div class="flex flex-col items-center mb-4">
                <img src="${player.photo}" alt="${player.name}" class="w-32 h-32 object-contain mb-2">
                <h2 class="text-xl font-bold">${player.name}</h2>
                <div class="flex items-center mb-2">
                    <img src="${player.flag}" alt="${player.nationality}" class="w-8 h-6 mr-2">
                    <span>${player.nationality}</span>
                </div>
                <div class="flex items-center mb-4">
                    <img src="${player.logo}" alt="${player.club}" class="w-8 h-8 mr-2">
                    <span>${player.club} - ${player.position}</span>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
                ${createStatBar('Rating', player.rating)}
                ${createStatBar('Pace', player.pace)}
                ${createStatBar('Shooting', player.shooting)}
                ${createStatBar('Passing', player.passing)}
                ${createStatBar('Dribbling', player.dribbling)}
                ${createStatBar('Defending', player.defending)}
                ${createStatBar('Physical', player.physical)}
            </div>
        `;
}

// Confirmation button 
confirmBtn.addEventListener('click', () => {
    if (selectedPlayers.length > 0) {
        alert(`Team of ${selectedPlayers.length} players created!`);
        playerModal.classList.add('hidden');
    } else {
        alert('Please select at least one player.');
    }
});
})
