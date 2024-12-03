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

    // Player selection state
    let players = [];
    let selectedPlayers = [];
    const MAX_TEAM_SIZE = 11;

    const fieldPositions = [
        [null, null, 'ST', null, null],
        ['LW', 'CM1', null, 'CM2', 'RW'], 
        [null, null, 'DM', null, null], 
        ['LB', 'CB1', null, 'CB2', 'RB'], 
        [null, null, 'GK', null, null]
        ];
    const POSITION_MAPPING = {
        'GK': ['GK'],
        'CDM': ['DM', 'CDM'],
        'CM': ['CM', 'CM1', 'CM2'],
        'CB': ['CB', 'CB1', 'CB2'],
        'ST': ['ST'],
        'RW': ['RW', 'RWF', 'RM'],
        'LW': ['LW', 'LWF', 'LM'],
        'RB': ['RB', 'RWB'],
        'LB': ['LB', 'LWB']
    };
    // Modify the position mapping to be more flexible
    // const POSITION_MAPPING = {
    //     'CDM': ['DM', 'CM'],
    //     'CM1': ['CM1', 'CM'],
    //     'CM2': ['CM2', 'CM'],
    //     'CB1': ['CB1', 'CB'],
    //     'CB2': ['CB2', 'CB'],
    //     'GK': 'GK',
    //     'ST': ['ST'],
    //     'RW': ['RW'],
    //     'LW': ['LW'],
    //     'RB': ['RB'],
    //     'LB': ['LB'],
    //     'DM': ['DM', 'CDM']
    // };

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

    // Populate filter dropdowns
    function populateFilters() {
        const nationalities = [...new Set(players.map(p => p.nationality))].sort();
        nationalityFilter.innerHTML = `
            <option value="">All Nationalities</option>
            ${nationalities.map(nationality => `
                <option value="${nationality}">${nationality}</option>
            `).join('')}
        `;

        const positions = [...new Set(players.map(p => p.position))].sort();
        positionFilter.innerHTML = `
            <option value="">All Positions</option>
            ${positions.map(position => `
                <option value="${position}">${position}</option>
            `).join('')}
        `;

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

    function selectPlayer(event) {
        const playerId = event.target.getAttribute('data-player-id');
        const player = players.find(p => p.id === playerId);
        
        if (!player) {
            console.error('Player not found');
            return;
        }
    
        // Advanced position conflict check
        const isPositionTaken = (playerPosition) => {
            const basePosition = Object.keys(POSITION_MAPPING).find(base => 
                POSITION_MAPPING[base].includes(playerPosition)
            );
    
            const specificPositionGroups = {
                'CB': ['CB1', 'CB2'],
                'CM': ['CM1', 'CM2']
            };
    
            // Check for specific position groups
            if (basePosition && specificPositionGroups[basePosition]) {
                const existingPlayersInGroup = selectedPlayers.filter(p => 
                    specificPositionGroups[basePosition].includes(p.position) ||
                    p.position === basePosition
                );
                return existingPlayersInGroup.length >= 2;
            }
    
            // Check for direct conflicts in other positions
            return selectedPlayers.some(p => 
                POSITION_MAPPING[p.position] && 
                POSITION_MAPPING[p.position].includes(playerPosition)
            );
        };
    
        // Check if a player of this position already exists
        if (isPositionTaken(player.position)) {
            alert(`You already have a player in a similar position to ${player.position}!`);
            return;
        }
    
        // Check team size limit
        if (selectedPlayers.length >= MAX_TEAM_SIZE) {
            alert(`You can only select ${MAX_TEAM_SIZE} players!`);
            return;
        }
    
        // Add player to team
        selectedPlayers.push(player);
        saveSelectedTeam();
        renderTeam();
        
        // Update player info container and modal
        playerInfoContainer.innerHTML = createPlayerDetailsHTML(player);
        searchResults.classList.add('hidden');
        selectedPlayerDetails.classList.remove('hidden');
    }


    // Create team display
    function renderTeam() {
        if (!teamContainer) {
            console.error('Team container not found');
            return;
        }
    
        // Clear existing team
        teamContainer.innerHTML = "";
    
        // Precise grid layout with exact position requirements
        const precisedFieldPositions = [
            [null, 'RW', null, null, 'RB', null, null],
            [null, null, 'CM1', null, null, 'CB1', null],
            ['ST', null, null, 'DM', null, null, 'GK'],
            [null, null, 'CM2', null, null, 'CB2', null],
            [null, 'LW', null, null, 'LB', null, null]
        ];
    
        // Mapping of desired positions to their variations
        const POSITION_MAPPING = {
            'GK': ['GK'],
            'CDM': ['DM', 'CDM'],
            'CM': ['CM'],
            'CM1': ['CM1'],
            'CM2': ['CM2'],
            'CB': ['CB'],
            'CB1': ['CB1'],
            'CB2': ['CB2'],
            'ST': ['ST', 'CF'],
            'RW': ['RW', 'RWF', 'RM'],
            'LW': ['LW', 'LWF', 'LM'],
            'RB': ['RB', 'RWB'],
            'LB': ['LB', 'LWB']
        };
    
        // Create a mapping of exact positions to players
        const positionToPlayerMap = {};
    
        // First, assign players to their exact positions
        precisedFieldPositions.forEach((row, rowIndex) => {
            row.forEach((desiredPosition, colIndex) => {
                if (desiredPosition) {
                    const playerForPosition = selectedPlayers.find(player => {
                        const matchedPositions = positionMap[desiredPosition];
                        return matchedPositions.some(pos => 
                            player.position.toUpperCase() === pos.toUpperCase() &&
                            !positionToPlayerMap[desiredPosition]  // Ensure no duplicate assignments
                        );
                    });
    
                    if (playerForPosition) {
                        positionToPlayerMap[desiredPosition] = playerForPosition;
                    }
                }
            });
        });
    
        // Render the grid
        precisedFieldPositions.forEach((row, rowIndex) => {
            row.forEach((desiredPosition, colIndex) => {
                const cell = document.createElement('div');
                cell.className = 'flex justify-center items-center';
                
                if (desiredPosition) {
                    const playerForPosition = positionToPlayerMap[desiredPosition];
    
                    if (playerForPosition) {
                        cell.innerHTML = `
                            <div class="relative player-team-card w-[135px] h-[200px] bg-cover bg-center" 
                                 style="background-image: url('./assets/img/card.png');">
                                <div class="relative flex px-1.5 text-[#e9cc74]">
                                    <div class="absolute leading-[0.75rem] font-light uppercase py-16 overflow-hidden left-[15px] top-[-12px]">
                                        <div class="text-xs player-rating">${playerForPosition.rating}</div>
                                        <div class="text-[0.625rem] player-position"><span>${playerForPosition.position}</span></div>
                                        <div class="block w-[0.6rem] h-[6px] my-0.5 player-nation">
                                            <img src="${playerForPosition.flag}" alt="nationality" class="w-full h-full object-contain"/>
                                        </div>
                                        <div class="block w-[0.75rem] h-[12.5px] player-club">
                                            <img src="${playerForPosition.logo}" alt="club" class="w-full h-full object-contain"/>
                                        </div>
                                    </div>
                                    <div class="relative w-[70px] h-[70px] mx-auto overflow-hidden player-picture bottom-[-25px]">
                                        <img src="${playerForPosition.photo}" alt="${playerForPosition.name}" class="w-full h-full object-contain relative "/>
                                    </div>
                                </div>
                                <div class="relative bottom-[-31px]">
                                    <div class="block px-0.5 text-[#e9cc74] w-[80%] mx-auto">
                                        <div class="block text-center text-xs uppercase pb-0.5">${playerForPosition.name}</div>
                                        <div class="flex justify-center my-0.5 player-features">
                                            <div class="items-center border-r border-opacity-10 border-[#e9cc74] px-1">
                                                <span class="flex text-[0.3rem] uppercase">
                                                    <div class="mr-0.5 font-bold">${playerForPosition.pace}</div>
                                                    <div class="font-light">PAC</div>
                                                </span>
                                                <span class="flex text-[0.3rem] uppercase">
                                                    <div class="mr-0.5 font-bold">${playerForPosition.shooting}</div>
                                                    <div class="font-light">SHO</div>
                                                </span>
                                                <span class="flex text-[0.3rem] uppercase">
                                                    <div class="mr-0.5 font-bold">${playerForPosition.passing}</div>
                                                    <div class="font-light">PAS</div>
                                                </span>
                                            </div>
                                            <div class="items-center px-1">
                                                <span class="flex text-[0.3rem] uppercase">
                                                    <div class="mr-0.5 font-bold">${playerForPosition.dribbling}</div>
                                                    <div class="font-light">DRI</div>
                                                </span>
                                                <span class="flex text-[0.3rem] uppercase">
                                                    <div class="mr-0.5 font-bold">${playerForPosition.defending}</div>
                                                    <div class="font-light">DEF</div>
                                                </span>
                                                <span class="flex text-[0.3rem] uppercase">
                                                    <div class="mr-0.5 font-bold">${playerForPosition.physical}</div>
                                                    <div class="font-light">PHY</div>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }
                
                // Add the cell to the team container
                teamContainer.appendChild(cell);       
            });
        });
    
        // Optional: Validation to ensure specific positions are filled
        const requiredPositions = [
            'RW', 'RB', 'CM1', 'CB1', 
            'ST', 'DM', 'GK', 
            'CM2', 'CB2', 'LW', 'LB'
        ];
    
        const missingPositions = requiredPositions.filter(pos => !positionToPlayerMap[pos]);
    

    }

    // Delete player from team
    function deletePlayer(event) {
        const index = event.target.getAttribute('data-index');
        selectedPlayers.splice(index, 1);
        saveSelectedTeam();
        renderTeam();
    }

    // Save team to local storage
    function saveSelectedTeam() {
        localStorage.setItem('selectedTeam', JSON.stringify(selectedPlayers));
    }

    // Load team from local storage
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

    // For goalkeepers, modify the player details HTML to show goalkeeper-specific stats
 // Comprehensive player details HTML creator
 function createPlayerDetailsHTML(player) {
    // Check if goalkeeper
    if (player.position.toLowerCase() === 'gk') {
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
                <div class="grid grid-cols-2 gap-4 w-full max-w-md">
                    <div>
                        <strong>Rating:</strong> ${player.rating}
                    </div>
                    <div>
                        <strong>Diving:</strong> ${player.diving}
                    </div>
                    <div>
                        <strong>Handling:</strong> ${player.handling}
                    </div>
                    <div>
                        <strong>Kicking:</strong> ${player.kicking}
                    </div>
                    <div>
                        <strong>Reflexes:</strong> ${player.reflexes}
                    </div>
                    <div>
                        <strong>Speed:</strong> ${player.speed}
                    </div>
                    <div>
                        <strong>Positioning:</strong> ${player.positioning}
                    </div>
                </div>
            </div>
        `;
    }

    // Regular player details
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
            <div class="grid grid-cols-2 gap-4 w-full max-w-md">
                <div>
                    <strong>Rating:</strong> ${player.rating}
                </div>
                <div>
                    <strong>Pace:</strong> ${player.pace}
                </div>
                <div>
                    <strong>Shooting:</strong> ${player.shooting}
                </div>
                <div>
                    <strong>Passing:</strong> ${player.passing}
                </div>
                <div>
                    <strong>Dribbling:</strong> ${player.dribbling}
                </div>
                <div>
                    <strong>Defending:</strong> ${player.defending}
                </div>
                <div>
                    <strong>Physical:</strong> ${player.physical}
                </div>
            </div>
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