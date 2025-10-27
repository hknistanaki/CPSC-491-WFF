let map;
let markers = [];
let geocoder;
let currentUser = null;
let fountains = [];
let selectedFountainId = null;
let contextMenuPosition = null;
let autocomplete;

// initialize the map
function initMap() {
    // default location (California State University, Fullerton)
    const defaultLocation = { lat: 33.8826, lng: -117.8850 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });
    
    geocoder = new google.maps.Geocoder();
    
    // initialize autocomplete for search bar
    const searchInput = document.getElementById('map-search');
    if (searchInput) {
        autocomplete = new google.maps.places.Autocomplete(searchInput);
        autocomplete.bindTo('bounds', map);
        
        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            if (!place.geometry) {
                return;
            }
            
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            } else {
                map.setCenter(place.geometry.location);
                map.setZoom(15);
            }
        });
    }
    
    // load current user
    loadCurrentUser();
    
    // load fountains from API
    loadFountains();
    
    // add map click listener
    map.addListener('click', function(event) {
        hideContextMenus();
        
        // only show "Add Fountain" menu if user is logged in
        if (currentUser) {
            showAddFountainMenu(event);
        }
    });
    
    // setup event listeners
    setupEventListeners();
}

// load current user
async function loadCurrentUser() {
    const token = getAuthToken();
    
    if (!token) {
        currentUser = null;
        updateAuthLink();
        return;
    }
    
    try {
        const data = await authAPI.getCurrentUser();
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('sessionUser', JSON.stringify(currentUser));
        }
    } catch (error) {
        console.error('Error loading user:', error);
        currentUser = null;
        removeAuthToken();
    }
    
    updateAuthLink();
}

// update auth link based on login status
function updateAuthLink() {
    const authLink = document.getElementById('auth-link');
    if (authLink) {
        if (currentUser) {
            authLink.textContent = 'Log Out';
            authLink.href = 'logout.html';
        } else {
            authLink.textContent = 'Log In';
            authLink.href = 'login.html';
        }
    }
}

// load fountains from api
async function loadFountains() {
    try {
        const data = await fountainAPI.getAll();
        
        if (data.success) {
            fountains = data.fountains;
            
            // create markers for all fountains
            fountains.forEach(fountain => {
                createMarker(fountain);
            });
            
            // render fountains list
            renderFountainsList();
        }
    } catch (error) {
        console.error('Error loading fountains:', error);
        alert('Could not load fountains. Please make sure the backend server is running.');
    }
}

// create a marker on the map
function createMarker(fountain) {
    const marker = new google.maps.Marker({
        position: { lat: fountain.lat, lng: fountain.lng },
        map: map,
        title: fountain.name,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#e74c3c',
            fillOpacity: 1,
            strokeColor: '#c0392b',
            strokeWeight: 2
        }
    });
    
    marker.addListener('click', function(event) {
        hideContextMenus();
        showFountainMenu(event, fountain._id);
    });
    
    markers.push({ id: fountain._id, marker: marker });
}

// show add fountain context menu
function showAddFountainMenu(event) {
    const menu = document.getElementById('map-context-menu');
    const x = event.domEvent.clientX;
    const y = event.domEvent.clientY;
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block';
    
    contextMenuPosition = event.latLng;
}

// show fountain context menu
function showFountainMenu(event, fountainId) {
    const menu = document.getElementById('fountain-context-menu');
    const x = event.domEvent.clientX;
    const y = event.domEvent.clientY;
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block';
    
    selectedFountainId = fountainId;
}

// hide all context menus
function hideContextMenus() {
    document.getElementById('map-context-menu').style.display = 'none';
    document.getElementById('fountain-context-menu').style.display = 'none';
}

// setup event listeners
function setupEventListeners() {
    // add fountain button
    const addFountainBtn = document.getElementById('add-fountain-btn');
    if (addFountainBtn) {
        addFountainBtn.addEventListener('click', addFountain);
    }
    
    // view fountain button
    const viewFountainBtn = document.getElementById('view-fountain-btn');
    if (viewFountainBtn) {
        viewFountainBtn.addEventListener('click', viewFountain);
    }
    
    // report fountain button
    const reportFountainBtn = document.getElementById('report-fountain-btn');
    if (reportFountainBtn) {
        reportFountainBtn.addEventListener('click', reportFountain);
    }
    
    // back to list button
    const backToListBtn = document.getElementById('back-to-list');
    if (backToListBtn) {
        backToListBtn.addEventListener('click', function() {
            document.getElementById('fountain-detail-view').style.display = 'none';
            document.getElementById('fountains-list-view').style.display = 'block';
        });
    }
    
    // add review button
    const addReviewBtn = document.getElementById('add-review-btn');
    if (addReviewBtn) {
        addReviewBtn.addEventListener('click', function() {
            if (!currentUser) {
                alert('Please log in to add a review.');
                window.location.href = 'login.html';
                return;
            }
            document.getElementById('add-review-form').style.display = 'block';
            addReviewBtn.style.display = 'none';
        });
    }
    
    // submit review button
    const submitReviewBtn = document.getElementById('submit-review-btn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', submitReview);
    }
    
    // cancel review button
    const cancelReviewBtn = document.getElementById('cancel-review-btn');
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', function() {
            document.getElementById('add-review-form').style.display = 'none';
            document.getElementById('add-review-btn').style.display = 'block';
            document.getElementById('review-text').value = '';
        });
    }
    
    // character count for review
    const reviewText = document.getElementById('review-text');
    if (reviewText) {
        reviewText.addEventListener('input', function() {
            document.getElementById('char-count').textContent = this.value.length;
        });
    }
    
    // hide context menus when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.context-menu') && !event.target.closest('#map')) {
            hideContextMenus();
        }
    });
}

// add a new fountain
async function addFountain() {
    if (!contextMenuPosition) return;
    
    const lat = contextMenuPosition.lat();
    const lng = contextMenuPosition.lng();
    
    try {
        // get address from coordinates
        const results = await new Promise((resolve, reject) => {
            geocoder.geocode({ location: contextMenuPosition }, function(results, status) {
                if (status === 'OK' && results[0]) {
                    resolve(results[0]);
                } else {
                    reject(new Error('Geocoding failed'));
                }
            });
        });
        
        const address = results.formatted_address;
        
        // generate fountain name
        const baseName = generateFountainName(results);
        const name = getUniqueFountainName(baseName);
        
        // create fountain via api
        const data = await fountainAPI.create(name, address, lat, lng);
        
        if (data.success) {
            const fountain = data.fountain;
            fountains.push(fountain);
            
            // create marker
            createMarker(fountain);
            
            // update list
            renderFountainsList();
            
            hideContextMenus();
        }
    } catch (error) {
        console.error('Error adding fountain:', error);
        alert('Could not add fountain. ' + error.message);
    }
}

// generate fountain name from address
function generateFountainName(result) {
    let name = 'Water Fountain';
    
    // try to get street name
    for (const component of result.address_components) {
        if (component.types.includes('route')) {
            name = component.long_name + ' Fountain';
            break;
        } else if (component.types.includes('locality')) {
            name = component.long_name + ' Fountain';
            break;
        } else if (component.types.includes('neighborhood')) {
            name = component.long_name + ' Fountain';
            break;
        }
    }
    
    return name;
}

// get unique fountain name
function getUniqueFountainName(baseName) {
    const existingNames = fountains.map(f => f.name);
    let name = baseName;
    let counter = 1;
    
    while (existingNames.includes(name)) {
        counter++;
        name = baseName + ' ' + counter;
    }
    
    return name;
}

// view fountain details
function viewFountain() {
    const fountain = fountains.find(f => f._id === selectedFountainId);
    if (!fountain) return;
    
    // show detail view
    document.getElementById('fountains-list-view').style.display = 'none';
    document.getElementById('fountain-detail-view').style.display = 'block';
    
    // update detail view
    document.getElementById('fountain-detail-name').textContent = fountain.name;
    document.getElementById('fountain-detail-address').textContent = fountain.address;
    
    // calculate and display status
    updateFountainStatus(fountain);
    
    // display reviews
    renderReviews(fountain);
    
    hideContextMenus();
}

// update fountain status based on reviews
function updateFountainStatus(fountain) {
    const statusDisplay = document.getElementById('status-display');
    
    if (!fountain.reviews || fountain.reviews.length === 0) {
        statusDisplay.className = 'status-circle yellow';
        return;
    }
    
    // use the currentStatus virtual from backend / calculate
    if (fountain.currentStatus) {
        statusDisplay.className = 'status-circle ' + fountain.currentStatus;
    } else {
        const statusCounts = { red: 0, yellow: 0, green: 0 };
        fountain.reviews.forEach(review => {
            statusCounts[review.status]++;
        });
        
        let maxCount = 0;
        let majorityStatus = 'yellow';
        for (const [status, count] of Object.entries(statusCounts)) {
            if (count > maxCount) {
                maxCount = count;
                majorityStatus = status;
            }
        }
        
        statusDisplay.className = 'status-circle ' + majorityStatus;
    }
}

// render reviews
function renderReviews(fountain) {
    const reviewsList = document.getElementById('reviews-list');
    reviewsList.innerHTML = '';
    
    if (!fountain.reviews || fountain.reviews.length === 0) {
        reviewsList.innerHTML = '<p style="color: #6c757d;">No reviews yet.</p>';
        return;
    }
    
    fountain.reviews.forEach(review => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <div class="review-status">
                <span class="status-circle ${review.status}"></span>
            </div>
            <div class="review-text">${escapeHtml(review.text)}</div>
        `;
        reviewsList.appendChild(reviewItem);
    });
}

// submit a review
async function submitReview() {
    const statusRadios = document.getElementsByName('status');
    let selectedStatus = null;
    
    for (const radio of statusRadios) {
        if (radio.checked) {
            selectedStatus = radio.value;
            break;
        }
    }
    
    if (!selectedStatus) {
        alert('Please select a status.');
        return;
    }
    
    const reviewText = document.getElementById('review-text').value.trim();
    
    if (!reviewText) {
        alert('Please write a review.');
        return;
    }
    
    if (reviewText.length > 140) {
        alert('Review must be 140 characters or less.');
        return;
    }
    
    try {
        // submit review via api
        const data = await fountainAPI.addReview(selectedFountainId, selectedStatus, reviewText);
        
        if (data.success) {
            // update local fountain object
            const fountainIndex = fountains.findIndex(f => f._id === selectedFountainId);
            if (fountainIndex !== -1) {
                fountains[fountainIndex] = data.fountain;
            }
            
            const fountain = data.fountain;
            
            // update display
            updateFountainStatus(fountain);
            renderReviews(fountain);
            
            // hide form
            document.getElementById('add-review-form').style.display = 'none';
            document.getElementById('add-review-btn').style.display = 'block';
            document.getElementById('review-text').value = '';
            
            // uncheck buttons
            for (const radio of statusRadios) {
                radio.checked = false;
            }
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Could not submit review. ' + error.message);
    }
}

// report fountain
async function reportFountain() {
    try {
        const data = await fountainAPI.report(selectedFountainId);
        
        if (data.success) {
            alert('Fountain has been reported. Thank you for helping keep our data accurate.');
        }
    } catch (error) {
        console.error('Error reporting fountain:', error);
        alert('Could not report fountain. ' + error.message);
    }
    
    hideContextMenus();
}

// render fountains list
function renderFountainsList() {
    const listContainer = document.getElementById('fountains-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    if (fountains.length === 0) {
        listContainer.innerHTML = '<p style="color: #6c757d;">No fountains added yet.</p>';
        return;
    }
    
    fountains.forEach(fountain => {
        const fountainItem = document.createElement('div');
        fountainItem.className = 'fountain-item';
        fountainItem.innerHTML = `
            <h3>${escapeHtml(fountain.name)}</h3>
            <p>${escapeHtml(fountain.address)}</p>
        `;
        
        fountainItem.addEventListener('click', function() {
            selectedFountainId = fountain._id;
            viewFountain();
        });
        
        listContainer.appendChild(fountainItem);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
