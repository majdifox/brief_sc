document.addEventListener('DOMContentLoaded', () => {

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
    const teamContainer = document.getElementById('team-container');

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

    // Fetch players data from time.json
    fetch('time.json')
        .then(response => response.json())
        .then(data => {
            players = data.players;
            populateFilters();
            renderSearchResults();
            loadSelectedTeam();
        })
        .catch(error => console.error('Error loading players:', error));


   
    function populateFilters() {
        const nationalities = [...new Set(players.map(p => p.nationality))].sort();
        nationalityFilter.innerHTML = `
            <option value="">All Nationalities</option>
            ${nationalities.map(nationality => `
                <option value="${nationality}">${nationality}</option>
            `).join('')}
        `;
        console.log(nationalities)
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

        // click event to player images
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
        
        const isPositionTaken = (playerPosition) => {
            const specificPositionGroups = {
                'CM': ['CM1', 'CM2'],
                'CB': ['CB1', 'CB2']
            };
    
            // Find the base position group
            const basePosition = Object.keys(specificPositionGroups).find(base => 
                specificPositionGroups[base].includes(playerPosition)
            );
    
            if (basePosition) {
                const existingPlayersInGroup = selectedPlayers.filter(p => 
                    specificPositionGroups[basePosition].includes(p.position)
                );
    
                if (existingPlayersInGroup.length >= 2) {
                    return true;
                }
    
                if (existingPlayersInGroup.some(p => p.id === player.id)) {
                    return true;
                }
            }
    
            return selectedPlayers.some(p => 
                POSITION_MAPPING[p.position] && 
                POSITION_MAPPING[p.position].includes(playerPosition) &&
                p.id !== player.id  
            );
        };
    
        if (isPositionTaken(player.position)) {
            alert(`You cannot add this player to the specified position!`);
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
    
       
        teamContainer.innerHTML = "";
    
        teamContainer.className = 'grid grid-cols-4 grid-rows-5 h-full w-full';
    
        const positionMap = {
            'RW': ['RW', 'RWF', 'RM'],
            'RB': ['RB', 'RWB'],
            'CM1': ['CM', 'CM1'],
            'CM2': ['CM', 'CM2'],
            'CB1': ['CB', 'CB1'],
            'CB2': ['CB', 'CB2'],
            'ST': ['ST', 'CF'],
            'DM': ['CDM', 'DM'],
            'GK': ['GK'],
            'LW': ['LW', 'LWF', 'LM'],
            'LB': ['LB', 'LWB']
        };
    
        const positionToPlayerMap = {};
    
        fieldPositions.forEach((row, rowIndex) => {
            row.forEach((desiredPosition, colIndex) => {
                if (desiredPosition) {
                    const playerForPosition = selectedPlayers.find(player => {
                        const matchedPositions = positionMap[desiredPosition];
                        return matchedPositions.some(pos => 
                            player.position.toUpperCase() === pos.toUpperCase() &&
                            !positionToPlayerMap[desiredPosition]  
                        );
                    });
    
                    if (playerForPosition) {
                        positionToPlayerMap[desiredPosition] = playerForPosition;
                    }
                }
            });
        });
    
        fieldPositions.forEach((row, rowIndex) => {
            row.forEach((desiredPosition, colIndex) => {
                const cell = document.createElement('div');
                cell.className = 'flex justify-center items-center';
                
                if (desiredPosition) {
                    const playerForPosition = positionToPlayerMap[desiredPosition];
    
                    if (playerForPosition) {
                        const statsHtml = playerForPosition.position.toLowerCase() === 'gk' 
                            ? `
                                <span class="flex text-[0.3rem] uppercase">
                                    <div class="mr-0.5 font-bold">${playerForPosition.diving}</div>
                                    <div class="font-light">DIV</div>
                                </span>
                                <span class="flex text-[0.3rem] uppercase">
                                    <div class="mr-0.5 font-bold">${playerForPosition.handling}</div>
                                    <div class="font-light">HAN</div>
                                </span>
                                <span class="flex text-[0.3rem] uppercase">
                                    <div class="mr-0.5 font-bold">${playerForPosition.reflexes}</div>
                                    <div class="font-light">REF</div>
                                </span>
                            `
                            : `
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
                            `;
    
                        cell.innerHTML = `
                            
                            <div class="relative player-team-card w-[135px] h-[200px] bg-cover bg-center" 
                                style="background-image: url('./assets/img/card.png');">
                                <div class="relative flex py-4 px-1.5 text-white">
                                    
                                    <div class="absolute leading-[0.75rem] font-bold   uppercase py-16 overflow-hidden left-10 top-[-12px]">
                                    
                                        <div class="text-lg text-yellow flex justify-center player-rating ">${playerForPosition.rating}</div>
                                        
                                        <div class="text-[0.625rem] flex justify-center font-bold player-position"><span>${playerForPosition.position}</span></div>
                                        
                                        
                                        <div class="block w-10 h-10 my-0.5 player-nation">
                                        
                                            <img src="${playerForPosition.flag}" alt="nationality" class="w-full h-full object-contain"/>
                                        </div>
                                        <div class="block w-10 h-10 player-club">
                                            <img src="${playerForPosition.logo}" alt="club" class="w-full h-full object-contain"/>
                                        </div>
                                    </div>
                                    
                                    <div class="relative w-60 h-60 mx-auto overflow-hidden player-picture bottom-[-25px]">
                                    
                                        <img src="${playerForPosition.photo}" alt="${playerForPosition.name}" class="w-38 h-38 left-16 top-14 object-contain relative "/>
                                         <button class="delete-player absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6" data-id="${playerForPosition.id}">✖</button>

                                    </div>
                                    
                                </div>

                                <div class="relative  py-6   bottom-11">
                                        
                                    <div class="block px-0.5 text-white w-[80%] mx-auto">
                                        
                                        <div class="block text-center font-bold text-sm uppercase pb-0.5">${playerForPosition.name}</div>
                                        <div class="flex justify-center my-0.5 player-features">
                                            <div class="items-center border-r border-opacity-10 border-[#e9cc74] px-1">
                                                ${statsHtml}
                                            </div>
                                            <div class="items-center px-1">
                                                ${playerForPosition.position.toLowerCase() === 'gk' 
                                                    ? `
                                                    
                                                    <span class="flex text-[0.3rem] uppercase">
                                                        <div class="mr-0.5 text-[#e9cc74] font-bold">${playerForPosition.kicking}</div>
                                                        <div class="font-light">KIC</div>
                                                    </span>
                                                    <span class="flex text-[0.3rem] uppercase">
                                                        <div class="mr-0.5 font-bold">${playerForPosition.speed}</div>
                                                        <div class="font-light">SPD</div>
                                                    </span>
                                                    <span class="flex text-[0.3rem] uppercase">
                                                        <div class="mr-0.5 font-bold">${playerForPosition.positioning}</div>
                                                        <div class="font-light">POS</div>
                                                    </span>
                                                    
                                                    `
                                                    : `
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
                                                `}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                           

                        `;
                    }
                }
                
                teamContainer.appendChild(cell);       
            });
        });
    
        const requiredPositions = [
            'ST', 'LW', 'RW', 
            'CM1', 'CM2', 'DM', 
            'LB', 'RB', 'CB1', 'CB2', 'GK'
        ];
    
        const missingPositions = requiredPositions.filter(pos => !positionToPlayerMap[pos]);
        
        document.querySelectorAll('.delete-player').forEach(button => {
            button.addEventListener('click', deletePlayerFromTeam);
        });
    }

    // delete function
    function deletePlayerFromTeam(event) {
        const playerId = event.target.getAttribute('data-id');
        const position = event.target.getAttribute('data-position');
    
        const playerIndex = selectedPlayers.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            selectedPlayers.splice(playerIndex, 1);
        }
    
        saveSelectedTeam();
        renderTeam();
    }

    // Save the team to local storage
    function saveSelectedTeam() {
        localStorage.setItem('selectedTeam', JSON.stringify(selectedPlayers));
    }

    // Load the team from local storage
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

    // Load players from local storage after selection 
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
                    <div><strong>Rating:</strong> ${player.rating}</div>
                    <div><strong>Diving:</strong> ${player.diving}</div>
                    <div><strong>Handling:</strong> ${player.handling}</div>
                    <div><strong>Kicking:</strong> ${player.kicking}</div>
                    <div><strong>Reflexes:</strong> ${player.reflexes}</div>
                    <div><strong>Speed:</strong> ${player.speed}</div>
                    <div><strong>Positioning:</strong> ${player.positioning}</div>
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
                <div><strong>Rating:</strong> ${player.rating}</div>
                <div><strong>Pace:</strong> ${player.pace}</div>
                <div><strong>Shooting:</strong> ${player.shooting}</div>
                <div><strong>Passing:</strong> ${player.passing}</div>
                <div><strong>Dribbling:</strong> ${player.dribbling}</div>
                <div><strong>Defending:</strong> ${player.defending}</div>
                <div><strong>Physical:</strong> ${player.physical}</div>
            </div>
        </div>
    `;
}

function createPlayerCardHTML(player) {
    return `
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
                            <div class="font-light">DRI</div> function renderTeam()
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