function sendMessageToAllTabs(message) {
    chrome.tabs.query({}, function (tabs) {
        for (let tab of tabs) {
            chrome.tabs.sendMessage(tab.id, message);
        }
    });
}

function sendRuntimeMessage(message, response) {
    chrome.runtime.sendMessage(message, response);
}

//New handmade algorithm (AI was making faulty highlighting algorithms)
const style = document.createElement('style');
style.textContent = `
.PhrazeHighlight {
    background-color: yellow !important;
    color: black !important;
    border-radius: 3px !important;
    cursor: pointer !important;
    display: inline-block !important;
    position: relative !important;
    z-index: 1 !important;
    opacity: 1;
}

/* Hide empty highlight elements */
.PhrazeHighlight:empty {
    display: none !important;
}

.PhrazeHighlight {
    background-color: yellow !important;
    color: black !important;
    border-radius: 3px !important;
    cursor: pointer !important;
    display: inline !important;
    position: relative !important;
    z-index: 1 !important;
}

.PhrazeHighlight:hover {
    background-color: #ffeb3b !important;
}

/* Hide empty highlight elements */
.PhrazeHighlight:empty {
    display: none !important;
}

/* Profile picture for highlight */
/* Not used anymore - replaced by toolbar
.phraze-highlight-profile {
    position: absolute;
    top: -18px;
    right: -10px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid #ccc;
    z-index: 3;
    display: none; 
    object-fit: cover;
    background-color: white;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    pointer-events: none; 
}
*/

/* Highlight toolbar */
.phraze-highlight-toolbar {
    position: fixed;
    /* Changed from absolute to fixed for viewport-relative positioning */
    transform: translateX(-50%);
    display: flex;
    background-color: rgba(250, 250, 250, 0.95);
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    border: 1px solid #e0e0e0;
    padding: 2px;
    z-index: 1000;
    /* Increased to ensure it's above other content */
    opacity: 0;
    /* visibility: hidden; */
    transition: opacity 0.2s, visibility 0.2s;
    pointer-events: none;
    /* Initially disable pointer events */
}

/* Show toolbar on hover of container or toolbar itself */
.phraze-highlight-container:hover .phraze-highlight-toolbar,
.phraze-highlight-toolbar:hover {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    /* Re-enable pointer events when visible */
}

/* Ensure toolbar stays visible when interacting with it */
.phraze-highlight-toolbar.active {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
}

/* Toolbar buttons base style */
.phraze-toolbar-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid #ddd;
    margin: 0 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 12px;
    background-color: white;
}

/* Notes button (blue +) */
.phraze-toolbar-notes-btn {
    color: #2196F3;
    font-weight: bold;
}

.phraze-toolbar-notes-btn:hover {
    background-color: #e6f4ff;
}

/* Delete button (red X) */
.phraze-toolbar-delete-btn {
    color: #f44336;
    font-weight: bold;
}

.phraze-toolbar-delete-btn:hover {
    background-color: #ffeeee;
}

/* Profile button */
.phraze-toolbar-profile-btn {
    overflow: hidden;
    padding: 0;
}

.phraze-toolbar-profile-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Hide original buttons when toolbar is visible - no longer needed since we don't create them
.phraze-highlight-container:hover .phraze-delete-highlight-btn,
.phraze-highlight-container:hover .phraze-add-note-btn {
    display: none;
}
*/

/* Delete highlight button - Not used anymore, replaced by toolbar
.phraze-delete-highlight-btn {
    position: absolute;
    top: -8px;
    left: -8px;
    width: 16px;
    height: 16px;
    line-height: 14px;
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: white;
    background-color: red;
    border: 1px solid #cc0000;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
    z-index: 4;
    transition: background-color 0.2s, transform 0.2s;
    display: none;
}

.phraze-delete-highlight-btn:hover {
    background-color: #ff3333;
    transform: scale(1.1);
}

.phraze-delete-highlight-btn:active {
    background-color: #cc0000;
    transform: scale(0.95);
}
*/

.PhrazeHighlight-data-preview {
    position: absolute;
    background: rgb(250, 250, 250);
    color: black;
    padding: 0px 10px;
    border-radius: 10px;
    white-space: nowrap;
    font-size: 12px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s;
    border: 1px solid black;
    margin-bottom: 4px;
    padding-top: 5px;
    padding-bottom: 2px;
    transform: translateX(-50%);
}

/* Container for the highlight mark and button */
.phraze-highlight-container {
    display: inline;
    /* Changed from inline-flex to avoid layout shifts */
    position: relative;
    /* Align with surrounding text */
}

/* The highlight mark itself inside the container */
.phraze-highlight-container mark[id="PhrazeHighlight"] {
    /* Inherit styles, reset potential container side effects if needed */
    vertical-align: baseline;
    /* Reset vertical alignment if needed */
}


/* '+' Button Styles - Not used anymore, replaced by toolbar
.phraze-add-note-btn {
    display: inline-block;
    width: 16px;
    height: 16px;
    line-height: 14px;
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    color: #333;
    background-color: #eee;
    border: 1px solid #ccc;
    border-radius: 50%;
    cursor: pointer;
    margin-left: 3px;
    padding: 0;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    transition: background-color 0.2s, box-shadow 0.2s;
    position: relative;
    z-index: 2;
}

.phraze-add-note-btn:hover {
    background-color: #ddd;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}

.phraze-add-note-btn:active {
    background-color: #ccc;
    box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
}
*/

/* Dropdown UI Styles */
.phraze-note-dropdown {
    position: absolute;
    bottom: calc(100% + 5px);
    /* Position above the button */
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    /* Ensure it's above page content */
    width: 200px;
    /* Adjust width as needed */
    display: none;
    /* Hidden by default */
    flex-direction: column;
    gap: 5px;
}

/* Container for input and add button */
.phraze-note-input-container {
    display: flex;
    align-items: center;
    gap: 4px;
}

.phraze-note-dropdown.visible {
    display: flex;
    /* Show when needed */
}


.phraze-note-dropdown input[type="text"] {
    flex-grow: 1;
    /* Allow input to take available space */
    width: auto;
    /* Override previous width */
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 3px;
    font-size: 13px;
    box-sizing: border-box;
    /* Include padding and border in width */
}

/* New '+' button style inside dropdown */
.phraze-dropdown-add-btn {
    flex-shrink: 0;
    /* Prevent button from shrinking */
    padding: 3px 6px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 3px;
    background-color: #f0f0f0;
    line-height: 1;
    /* Adjust line height for better vertical alignment */
}

.phraze-dropdown-add-btn:hover {
    background-color: #e0e0e0;
}

/* List for notes */
.phraze-note-list {
    list-style: disc;
    margin: 5px 0 0 20px;
    /* Add margin for list styling */
    padding: 0;
    max-height: 100px;
    /* Limit height and allow scrolling */
    overflow-y: auto;
    font-size: 12px;
    color: #333;
    list-style-position: inside;
    /* Keep bullets inside padding */
    padding-left: 5px;
    /* Add some padding */
}

.phraze-note-list li {
    /* Use flexbox for layout */
    display: flex;
    justify-content: space-between;
    /* Push text and button apart */
    align-items: center;
    margin-bottom: 4px;
    /* Increased spacing */
    padding: 2px 0;
    /* Add vertical padding */
}

/* Span for the note text itself */
.phraze-note-text {
    flex-grow: 1;
    /* Allow text to take available space */
    margin-right: 5px;
    /* Space between text and delete button */
    word-break: break-word;
    /* Prevent long words from overflowing */
}

/* Delete button style */
.phraze-note-delete-btn {
    flex-shrink: 0;
    /* Prevent button from shrinking */
    background: #eee;
    border: 1px solid #ccc;
    color: #777;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    font-size: 10px;
    line-height: 14px;
    /* Center 'x' vertically */
    text-align: center;
    cursor: pointer;
    padding: 0;
    margin-left: 5px;
}

.phraze-note-delete-btn:hover {
    background: #ddd;
    color: #333;
}

.phraze-note-dropdown button {
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid #ccc;
    border-radius: 3px;
    background-color: #f0f0f0;
    align-self: flex-end;
    /* Align button to the right */
}

.phraze-note-dropdown button:hover {
    background-color: #e0e0e0;
}

.unselectable {
    user-select: none;
}

.selectable {
    user-select: initial;
}
`;
document.head.appendChild(style);

/**
 * Loads a profile picture for a highlight from Firebase
 * @param {HTMLImageElement} imgElement - The image element to set the profile picture
 * @param {string} userEmail - The email of the user who created the highlight
 * @param {string} companyEmail - The company email for the Firebase path
 */
async function loadHighlightProfilePicture(imgElement, userEmail, companyEmail) {
    if (!userEmail || !companyEmail || userEmail === 'local' || companyEmail === 'local') {
        return; // Skip if no valid email
    }

    const userEmailFormatted = userEmail.replace('.', ',');
    const firebasePath = `Companies/${companyEmail}/users/${userEmailFormatted}/profileImage`;

    sendRuntimeMessage({
        action: 'getFirebaseData',
        path: firebasePath
    }, (response) => {
        if (response && response.success && response.data) {
            // Set the image source and make it visible
            imgElement.src = response.data;
            imgElement.style.display = 'block';
        }
    });
}

async function getAnnotationHistory() {
    let data = await callGetItem("annotationHistory");
    if (data == null)
        data = {};
    var values = Object.values(data);
    if (values.length == 0)
        return [];
    if (values[0].length == 0)
        return [];
    return JSON.parse(values[0]);
}

async function getHighlightAnnotations(id) {
    let annotationHistory = await getAnnotationHistory();
    var annotations = [];
    for (var annotation of annotationHistory) {
        for (var property of annotation) {
            if (property.highlightID) {
                if (property.highlightID === id) {
                    annotations.push(annotation);
                }
            }
        }
    }
    return annotations;
}

async function getHighlightAnnotationsMap(highlights) {
    var highlightsToAnnotationsMap = {};
    if (highlights)
        for (let highlight of highlights) {
            highlightsToAnnotationsMap[highlight.id] = await getHighlightAnnotations(highlight.id);
        }
    return highlightsToAnnotationsMap;
}

async function getGlobalHighlightID() {
    return new Promise((resolve, reject) => {
        sendRuntimeMessage({ action: "getGlobalHighlightID" }, function (response) {
            if (response && response.success) {
                resolve(response.data);
            } else {
                console.error('Error getting global highlight ID:', response.error);
                return resolve(null);
            }
        });
    });
}

async function saveFunc(value) {
    const projectName = await getCurrentProject();
    if (await isUserLoggedIn()) {
        const companyEmail = await getMainCompanyEmail();
        if (!companyEmail) throw new Error('No company email found for logged-in user.');
        const path = `Companies/${companyEmail}/projects/${projectName}/highlights`;

        // Save to Firebase
        sendRuntimeMessage({
            action: "saveFirebaseData",
            path: path,
            data: value,
        });

    }
    else {
        // const url = sanitizeFirebasePath(window.location.href);
        // localStorage.setItem(url + "/highlights", JSON.stringify(value));
        chrome.storage.local.set({ [`${projectName}/highlights`]: value });
    }
}

async function loadFunc() {
    const projectName = await getCurrentProject();
    if (await isUserLoggedIn()) {
        const companyEmail = await getMainCompanyEmail();
        if (!companyEmail) throw new Error('No company email found for logged-in user.');
        const path = `Companies/${companyEmail}/projects/${projectName}/highlights`;
        const response = await new Promise((resolve) => {
            sendRuntimeMessage({ action: "getFirebaseData", path: path }, resolve);
        });
        return (response && response.success ? response.data : []) || [];
    }
    else {
        // const url = sanitizeFirebasePath(window.location.href);
        // return JSON.parse(localStorage.getItem(url + "/highlights"));
        return (await chrome.storage.local.get(`${projectName}/highlights`))[`${projectName}/highlights`] || [];
    }
}

async function getUserEmail() {
    return new Promise((resolve, reject) => {
        sendRuntimeMessage({ action: "getUserEmail" }, (response) => {
            if (response && response.success)
                resolve(response.result);
            else
                resolve("");
        });
    });
}

async function getMainCompanyEmail() {
    try {
        const email = await getUserEmail();
        if (!email) return null;

        console.log("emailToCompanyDirectory/" + email.replace(".", ","));
        return new Promise((resolve, reject) => {
            sendRuntimeMessage({
                action: "getFirebaseData",
                path: `emailToCompanyDirectory/${email.replace(".", ",")}`
            }, (response) => {
                if (response && response.success) {
                    resolve(response.data);
                } else {
                    console.error('Error getting company email:', response?.error || 'Unknown error');
                    resolve(null);
                }
            });
        });
    } catch (error) {
        console.error('Error getting company email:', error);
        return null;
    }
}


async function callGetItem(key, prefixProjectName = true) {
    console.warn(`-- callGetItem(key = ${key}) --`);

    var companyEmail = await getMainCompanyEmail();
    var projectName = await getCurrentProject();
    // firebase get
    if (await isUserLoggedIn()) {
        if (prefixProjectName)
            key = `Companies/${companyEmail}/projects/${projectName}/${key}`;
        // console.log(`${key} exists in firebaseKeyList`);
        // getUserDataDatabase(key);
        return new Promise(async (resolve, reject) => {
            sendRuntimeMessage({
                action: "getFirebaseData",
                path: key
            }, response => {
                if (response && response.success && response.data) {
                    let data = { [key]: response.data };
                    resolve(data);
                } else {
                    console.log(`${key} does not exist in firebaseKeyList`);
                    resolve(null);  // Use resolve instead of reject for missing data
                }
            });
        });
    } else {
        if (prefixProjectName)
            key = projectName + "/" + key;
        let data = await chrome.storage.local.get(key);
        return Promise.resolve(data);  // Wrap synchronous call in Promise
    }
}

async function isUserLoggedIn() {
    return new Promise(async (resolve, reject) => {
        sendRuntimeMessage({
            action: "isUserLoggedIn"
        }, response => {
            if (response && response.success) {
                resolve(response.result);
            } else {
                resolve(false);
            }
        });
    });
}

function getCurrentProject() {
    let result = localStorage.getItem('currentProject');
    return result || 'default';
}

function sanitizeFirebasePath(url) {
    // Replace characters that are not allowed in Firebase paths
    return url.replace(/[.#$\/\[\]]/g, '_');
}
/**
 * Updates the toolbar position to be above the highlight
 * @param {HTMLElement} toolbar - The toolbar element
 * @param {HTMLElement} container - The highlight container element
 */
function updateFloaterPosition(toolbar, container, yOffset = 0) {
    // Get the mark element
    const mark = container.querySelector('mark[id="PhrazeHighlight"]');
    if (!mark) return;

    // Find the first text node inside the mark
    let textNode = null;
    for (let node of mark.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            textNode = node;
            break;
        }
    }
    if (!textNode) return;

    const text = textNode.textContent;
    const newlineIdx = text.indexOf('\n');
    const endIdx = newlineIdx === -1 ? text.length : newlineIdx;

    // Create a range for the text before the first newline
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, endIdx);
    const rect = range.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    // Update toolbar position
    toolbar.style.left = `${rect.x + rect.width / 2}px`;
    toolbar.style.top = `${(rect.y + window.scrollY) - (toolbarRect.height - 1) + yOffset}px`;
}

/**
 * Delete a highlight from storage (Firebase or local).
 * @param {string} url - The sanitized URL key.
 * @param {string} id - The id of the highlight to delete
 */
async function deleteHighlightFromStorage(id) {
    // First delete the highlight
    const highlights_data = await loadFunc("highlights");
    // Filter out the highlight to delete
    const updated_highlights = highlights_data.filter(h => h.id !== id);
    saveFunc(updated_highlights);

    if (await isUserLoggedIn()) {

        // 2. Delete related annotation history entries
        const projectName = await getCurrentProject();
        var companyEmail = await getMainCompanyEmail();
        const annotationPath = `Companies/${companyEmail}/projects/${projectName}/annotationHistory`;

        // Get current annotation history
        const annotationResponse = await new Promise((resolve) => {
            sendRuntimeMessage({ action: "getFirebaseData", path: annotationPath }, resolve);
        });

        if (annotationResponse && annotationResponse.success && annotationResponse.data) {
            // Make sure annotationHistory is an array
            let annotationHistory = annotationResponse.data;

            // If it's a string (JSON), parse it
            if (typeof annotationHistory === 'string') {
                try {
                    annotationHistory = JSON.parse(annotationHistory);
                } catch (e) {
                    console.error('Error parsing annotation history:', e);
                }
            }

            // Ensure it's an array before filtering
            if (Array.isArray(annotationHistory)) {
                // Filter out annotations with matching userText
                const updatedHistory = annotationHistory.filter(annotationEntry => {
                    // Find the userText object in the array
                    const userTextObj = annotationEntry.find(item => item.highlightID !== undefined);
                    // Only keep entries where userText doesn't match the deleted highlight
                    return !userTextObj || userTextObj.highlightID !== id;
                });

                // Save the updated annotation history back to Firebase
                await new Promise((resolve) => {
                    sendRuntimeMessage({
                        action: "saveFirebaseData",
                        path: annotationPath,
                        data: JSON.stringify(updatedHistory)
                    }, resolve);
                });

                console.log(`Deleted ${annotationHistory.length - updatedHistory.length} annotation entries for highlight: "${id}"`);
            } else {
                console.warn('Annotation history is not an array:', annotationHistory);
            }
        }
    } else {
        // 2. Delete related annotation history entries
        const projectName = await getCurrentProject();
        const historyData = await callGetItem("annotationHistory");

        if (historyData && historyData[`${projectName}/annotationHistory`]) {
            // Get the annotation history
            let annotationHistory;
            try {
                // Try to parse as JSON string
                annotationHistory = JSON.parse(historyData[`${projectName}/annotationHistory`]);
            } catch (e) {
                // If parsing fails, use as is
                console.error('Error parsing annotation history:', e);
                annotationHistory = historyData[`${projectName}/annotationHistory`];
            }

            // Ensure it's an array before filtering
            if (Array.isArray(annotationHistory)) {
                // Filter out annotations with matching userText
                const updatedHistory = annotationHistory.filter(annotationEntry => {
                    // Find the userText object in the array
                    const userTextObj = annotationEntry.find(item => item.highlightID !== undefined);
                    // Only keep entries where userText doesn't match the deleted highlight
                    return !userTextObj || userTextObj.highlightID !== id;
                });

                // Save the updated annotation history back to local storage
                let project = await getCurrentProject();
                chrome.storage.local.set({ [project + "/annotationHistory"]: JSON.stringify(updatedHistory) });

                console.log(`Deleted ${annotationHistory.length - updatedHistory.length} annotation entries for highlight: "${id}"`);
            } else {
                console.warn('Annotation history is not an array:', annotationHistory);
            }
        }
        loadHighlights();
    }
}

// Add this new async function to handle saving the note
/**
 * Adds a note to the correct highlight in storage (Firebase or local).
 * @param {string} highlightedText - The text content of the highlight to find.
 * @param {string} noteText - The text of the note to add.
 */
async function addNoteToStorage(id, noteText) {
    if (await isUserLoggedIn()) {
        // --- Firebase Logic ---
        const highlights_data = await loadFunc();

        // Find the highlight and add the note
        let updated = false;
        const updated_highlights = highlights_data.map(h => {
            // Using includes might be safer if whitespace is an issue, but exact match is simpler first
            if (h.id === id) {
                if (!h.notes) h.notes = []; // Ensure notes array exists
                h.notes.push(noteText);
                updated = true;
            }
            return h;
        });

        if (!updated) throw new Error(`Highlight with id "${id}" not found.`);

        saveFunc(updated_highlights);

    } else {
        // --- Local Storage Logic --- 
        var all_highlights = await loadFunc("highlights");

        // if (!all_highlights[url]) {
        //     throw new Error(`No highlights found for URL ${url} in local storage.`);
        // }

        let updated = false;

        all_highlights = all_highlights.map(h => {
            // Using includes might be safer if whitespace is an issue, but exact match is simpler first
            if (h.id === id) {
                if (!h.notes) h.notes = []; // Ensure notes array exists
                h.notes.push(noteText);
                updated = true;
            }
            return h;
        });

        if (!updated) throw new Error(`Highlight with id "${id}" not found locally.`);
        await saveFunc(all_highlights);
    }
}

/**
 * Removes a note from the correct highlight in storage (Firebase or local).
 * @param {string} id - The id of the highlight to find
 * @param {string} noteText - The text of the note to remove.
 */
async function removeNoteFromStorage(id, noteText) {
    if (await isUserLoggedIn()) {
        // --- Firebase Logic --- 

        const highlights_data = await loadFunc();
        let updated = false;

        const updated_highlights = highlights_data.map(h => {
            if (h.id === id && h.notes) {
                const noteIndex = h.notes.indexOf(noteText);
                if (noteIndex > -1) {
                    h.notes.splice(noteIndex, 1);
                    updated = true;
                }
            }
            return h;
        });

        if (!updated) throw new Error(`Note "${noteText}" for highlight "${id}" not found.`);

        saveFunc(highlights_data);

    } else {
        // --- Local Storage Logic --- 
        var all_highlights = await loadFunc("highlights");

        let updated = false;

        all_highlights = all_highlights.map(h => {
            if (h.id === id && h.notes) {
                const noteIndex = h.notes.indexOf(noteText);
                if (noteIndex > -1) {
                    h.notes.splice(noteIndex, 1);
                    updated = true;
                }
            }
            return h;
        });

        if (!updated) throw new Error(`Note "${noteText}" for highlight "${id}" not found locally.`);

        await saveFunc(all_highlights);
    }
}


/**
 * Helper function to create the note input dropdown.
 * @param {object} highlight - The highlight data object associated with this dropdown.
 * @returns {HTMLDivElement} The created dropdown div element.
 */
function createNoteDropdown(highlight) {
    const dropdown = document.createElement('div');
    dropdown.className = 'phraze-note-dropdown PhrazeMark';
    dropdown.dataset.highlightId = highlight.id;
    dropdown.style.zIndex = 1000000000;
    if (visibleDropdowns.has(highlight.id + "")) {
        dropdown.classList.add("visible");
    }

    // Create container for input and add button
    const inputContainer = document.createElement('div');
    inputContainer.className = 'phraze-note-input-container PhrazeMark';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Add a note...';
    inputContainer.appendChild(input);

    // Create the new '+' button for adding notes to the list
    const addNoteToListButton = document.createElement('button');
    addNoteToListButton.textContent = '+';
    addNoteToListButton.className = 'phraze-dropdown-add-btn PhrazeMark';
    addNoteToListButton.title = 'Add note to list';
    inputContainer.appendChild(addNoteToListButton);

    // Add the input container to the dropdown
    dropdown.appendChild(inputContainer);

    // Create the unordered list for displaying notes
    const notesList = document.createElement('ul');
    notesList.className = 'phraze-note-list PhrazeMark';
    dropdown.appendChild(notesList);

    // Helper function to create a list item with text and delete button
    const createListItem = (noteText) => {
        const listItem = document.createElement('li');

        const textSpan = document.createElement('span');
        textSpan.className = 'phraze-note-text PhrazeMark';
        textSpan.textContent = noteText;
        listItem.appendChild(textSpan);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'phraze-note-delete-btn PhrazeMark';
        deleteButton.innerHTML = '&times;'; // Use HTML entity for 'x'
        deleteButton.title = 'Delete note';
        listItem.appendChild(deleteButton);

        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            // Try to remove from storage first
            try {
                await removeNoteFromStorage(highlight.id, noteText);
                // If successful, remove from UI
                listItem.remove();
                // Also remove from the highlight.notes array in closure
                const noteIndex = highlight.notes.indexOf(noteText);
                if (noteIndex > -1) {
                    highlight.notes.splice(noteIndex, 1);
                }
                console.log('Note deleted successfully');
            } catch (error) {
                console.error('Failed to delete note:', error);
                alert(`Failed to delete note: ${error.message}`); // Simple alert for now
            }
        });

        return listItem;
    };

    // Populate the list with existing notes from the highlight object
    if (highlight.notes && Array.isArray(highlight.notes)) {
        highlight.notes.forEach(noteText => {
            notesList.appendChild(createListItem(noteText)); // Use helper function
        });
    }

    // Event listener for the new '+' button
    addNoteToListButton.addEventListener('click', async (e) => { // Make listener async
        e.preventDefault(); // Prevent any default button behavior
        e.stopPropagation(); // Stop the event from bubbling further

        const noteText = input.value.trim();
        if (noteText) {
            // Create list item but don't append immediately
            const listItem = document.createElement('li');
            listItem.textContent = noteText;

            // Try to save the note first
            try {
                await addNoteToStorage(highlight.id, noteText);
                console.log('Note saved successfully to storage');

                // IF save is successful, THEN update UI and internal state
                notesList.appendChild(createListItem(noteText)); // Use helper function
                // Also update the notes array in the closure scope for this dropdown instance
                if (!highlight.notes) highlight.notes = [];
                highlight.notes.push(noteText);

                input.value = ''; // Clear the input field
                // input.focus(); // Temporarily remove focus to prevent potential side-effects
            } catch (error) {
                console.error('Failed to save note:', error);
                // Show error to user (e.g., temporary message, change input border)
                alert(`Failed to save note: ${error.message}`); // Simple alert for now
            }
        }
    });

    // Optional: Allow adding note by pressing Enter in the input field
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if applicable
            addNoteToListButton.click(); // Simulate click on the add button
        }
    });

    return dropdown;
}

/**
 * Toggles the visibility of the note dropdown.
 * @param {HTMLDivElement} dropdown The dropdown element to toggle.
 */
function toggleNoteDropdown(dropdown) {
    if (dropdown.classList.contains('visible')) {
        dropdown.classList.remove('visible');
        // Optional: Add closing animation class
    } else {
        // Close any other open dropdowns first
        closeAllNoteDropdowns();
        dropdown.classList.add('visible');
        // Optional: Add opening animation class
        // Focus the input field when opened
        const input = dropdown.querySelector('input[type="text"]');
        if (input) {
            input.focus();
        }
    }
}

/**
 * Closes all open note dropdowns on the page.
 */
function closeAllNoteDropdowns() {
    document.querySelectorAll('.phraze-note-dropdown.visible').forEach(dropdown => {
        dropdown.classList.remove('visible');
    });
}


//Returns a map of node->[[text node index, start, end], [...], ...]
function getHighlightedTextNodeRanges() {
    const selection = window.getSelection();
    const result = new Map();

    if (!selection.rangeCount) return result;

    const range = selection.getRangeAt(0);

    const treeWalker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ALL,  // Only look at text nodes
        {
            acceptNode: function (node) {
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let node = treeWalker.currentNode;
    while (node) {
        if (node.nodeType != Node.TEXT_NODE && !isNodeAHighlight(node)) {
            let collectedText = [];
            var lastWasPhrazeHighlight = false;
            var currentTextNodeIndex = 0;
            var currentLength = 0;
            var lastWasTextNode = false;

            //If a text node is found, add it to the array
            //If a phraze mark is found, should add it to the last item in the array or make a new item
            //If something else is found, increment the textNodeIndex
            for (const child2 of node.childNodes) {
                var child = child2;
                if (isNodeAHighlight(child))
                    child = child.childNodes[0]; //Redirect to mark element in highlight span
                // Direct text nodes
                if (
                    isNodeAHighlight(child) &&
                    range.intersectsNode(child)
                ) {
                    lastWasPhrazeHighlight = true;
                    for (let textNode of child.childNodes) {
                        const subRange = range.cloneRange();
                        subRange.selectNodeContents(textNode);
                        if (textNode === range.startContainer) subRange.setStart(textNode, range.startOffset);
                        if (textNode === range.endContainer) subRange.setEnd(textNode, range.endOffset);
                        if (currentLength > 0 && collectedText.length > 0)
                            collectedText[collectedText.length - 1][2] += subRange.toString().length;
                        else
                            collectedText.push([currentTextNodeIndex, currentLength + subRange.startOffset, currentLength + subRange.endOffset]);
                    }
                }
                else if (child.nodeType === Node.TEXT_NODE && range.intersectsNode(child)) {
                    const subRange = range.cloneRange();
                    subRange.selectNodeContents(child);
                    if (child === range.startContainer) subRange.setStart(child, range.startOffset);
                    if (child === range.endContainer) subRange.setEnd(child, range.endOffset);
                    if (lastWasPhrazeHighlight)
                        collectedText[collectedText.length - 1][2] += subRange.toString().length;
                    else
                        collectedText.push([currentTextNodeIndex, currentLength + subRange.startOffset, currentLength + subRange.endOffset]);
                    // collectedText.push(subRange.toString());
                    lastWasPhrazeHighlight = false;
                }

                if (child.nodeType === Node.TEXT_NODE || isNodeAHighlight(child)) {
                    currentLength += child.textContent.length;
                    lastWasTextNode = true;
                } else {
                    if (lastWasTextNode) {
                        lastWasPhrazeHighlight = false;
                        currentTextNodeIndex += 1;
                        currentLength = 0;
                        lastWasTextNode = false;
                    }
                }

            }

            if (collectedText.length > 0) {
                result.set(node, collectedText);
            }

        }
        node = treeWalker.nextNode();
    }
    return result;
}

function getImmediateTextInNode(node) {
    var text = "";
    for (var child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent;
        }
        else if (isNodeAHighlight(child) && child.tagName === "SPAN") {
            text += child.childNodes[0].textContent; //Get text from <mark> inside the span container
        }
    }
    return text;
}

function getFilteredTextContent(node) {
    var text = "";
    for (var child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            text += child.textContent;
        }
        else if (isNodeAHighlight(child) && child.tagName === "SPAN") {
            text += child.childNodes[0].textContent; //Get text from <mark> inside the span container
        }
        else {
            text += getFilteredTextContent(child);
        }
    }
    return text;
}

async function saveHighlight() {
    console.log("Saving highlight", window.location.href);
    var collectedRanges = getHighlightedTextNodeRanges();
    var globalHighlightID = await getGlobalHighlightID();
    var highlight = {
        id: globalHighlightID,
        userEmail: await getUserEmail(),
        companyEmail: await getMainCompanyEmail(),
        textNodes: [],
        url: window.location.href
    };
    for (const [node, ranges] of collectedRanges) {
        var parentText = "";
        if (node.parentNode) {
            parentText = getFilteredTextContent(node.parentNode);
        }
        highlight.textNodes.push(
            {
                parentText: parentText,
                wholeText: getImmediateTextInNode(node),
                highlightedRanges: ranges,
                elementTag: node.tagName
            }
        )
    }
    if (!highlight.textNodes || highlight.textNodes.length == 0)
        return;

    var highlights = await loadFunc("highlights") || [];
    highlights.push(highlight);
    await saveFunc(highlights);

    if (!(await isUserLoggedIn())) {
        loadHighlights();
    }
}

function clearHighlights() {
    const marks = document.querySelectorAll('.phraze-highlight-container');
    marks.forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.childNodes[0].textContent), mark);
        parent.normalize();
    });

    const toolbars = document.querySelectorAll('.phraze-highlight-toolbar');
    toolbars.forEach(toolbar => {
        toolbar.remove();
    });

    const dataPreviews = document.querySelectorAll('.PhrazeHighlight-data-preview');
    dataPreviews.forEach(dataPreview => {
        dataPreview.remove();
    });
}

function createDataPreview(containerSpan, content) {
    const dataPreview = document.createElement('div');
    dataPreview.className = 'PhrazeHighlight-data-preview';
    dataPreview.innerHTML = content;
    const arrow = document.createElement('img');
    arrow.src = chrome.runtime.getURL("img/data-preview-arrow.png");
    arrow.style.width = "10px";
    arrow.style.height = "10px";
    arrow.style.position = "absolute";
    arrow.style.left = "50%";
    arrow.style.bottom = "-10px";
    arrow.style.transform = "translateX(-50%)";
    dataPreview.appendChild(arrow);

    function showDataPreview() {
        if (dataPreview.textContent.trim() != "")
            dataPreview.style.opacity = 1;
    }

    function hideDataPreview() {
        dataPreview.style.opacity = 0;
    }

    containerSpan.addEventListener('mouseenter', showDataPreview);
    containerSpan.addEventListener('mouseleave', hideDataPreview);
    return dataPreview;
}

/**
 * Creates a toolbar with buttons for a highlight
 * @param {Object} highlight - The highlight data object
 * @param {HTMLElement} dropdown - The note dropdown element to toggle
 * @returns {HTMLElement} The toolbar element with all buttons
 */
function createHighlightToolbar(highlight, dropdown, containerSpan) {
    // Create the toolbar container
    const toolbar = document.createElement('div');
    toolbar.className = 'phraze-highlight-toolbar PhrazeMark ';
    toolbar.style.position = 'absolute';

    // Create the notes button (blue +)
    const notesButton = document.createElement('button');
    notesButton.className = 'phraze-toolbar-btn phraze-toolbar-notes-btn PhrazeMark';
    notesButton.innerHTML = '&#43;'; // Plus symbol
    notesButton.title = 'Add notes';

    // Notes button click listener
    notesButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleNoteDropdown(dropdown);
    });

    // Create the delete button (red X)
    const deleteButton = document.createElement('button');
    deleteButton.className = 'phraze-toolbar-btn phraze-toolbar-delete-btn PhrazeMark';
    deleteButton.innerHTML = '&#10005;'; // X symbol
    deleteButton.title = 'Delete highlight';

    // Delete button click listener
    deleteButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Find the parent container
        const container = containerSpan;
        if (!container) return;

        try {
            // Get the highlighted text from the mark element
            const mark = container.querySelector('mark[id="PhrazeHighlight"]');
            if (!mark) return;

            // const url = sanitizeFirebasePath(window.location.href);

            // Delete the highlight from storage
            // Replace the container with the original text
            if (container.parentNode) {
                var parentNode = container.parentNode;
                container.parentNode.insertBefore(document.createTextNode(mark.textContent), container);
                container.remove();
                // Normalize parent to combine adjacent text nodes
                parentNode.normalize();
            }
            toolbar.remove();
            await deleteHighlightFromStorage(highlight.id);

        } catch (error) {
            console.error('Error deleting highlight:', error);
        }
    });

    // Create the profile button
    const profileButton = document.createElement('button');
    profileButton.className = 'phraze-toolbar-btn phraze-toolbar-profile-btn PhrazeMark';
    profileButton.title = 'Profile';

    // Create profile image
    const profileImg = document.createElement('img');
    profileImg.alt = '';
    profileButton.appendChild(profileImg);

    // If user and company email exist, load profile image
    if (highlight.userEmail && highlight.companyEmail) {
        loadHighlightProfilePicture(profileImg, highlight.userEmail, highlight.companyEmail);
    } else {
        // Use a simplified default avatar
        profileImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999999"><circle cx="12" cy="9" r="5"/><path d="M3,18c0-3,6-4,9-4s9,1,9,4v2H3V18z"/></svg>';
    }

    // Add buttons to toolbar
    toolbar.appendChild(notesButton);
    toolbar.appendChild(deleteButton);
    toolbar.appendChild(profileButton);

    // Set up event listeners for positioning
    const container = document.createElement('div'); // Temporary container for type checking
    const updatePosition = () => {
        requestAnimationFrame(() => {
            const actualContainer = toolbar.closest('.phraze-highlight-container');
            if (actualContainer) {
                updateFloaterPosition(toolbar, actualContainer);
            }
        });
    };



    // Update position when hovering over the highlight
    container.addEventListener('mouseenter', updatePosition);
    // Update position on scroll and resize
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return toolbar;
}


function isNodeAHighlight(node) {
    return node && node.classList && node.classList.contains("PhrazeMark");
}

let visibleDropdowns = null;
async function loadHighlights() {
    var dropdowns = document.querySelectorAll(".phraze-note-dropdown");
    visibleDropdowns = new Set();
    for (let dropdown of dropdowns) {
        if (dropdown.classList.contains("visible")) {
            visibleDropdowns.add(dropdown.dataset.highlightId);
        }
    }

    var highlights = await loadFunc("highlights") || [];
    highlights = highlights.filter(highlight => highlight.url == window.location.href);
    const treeWalker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ALL,  // Only look at text nodes
        {
            acceptNode: function (node) {
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );
    let highlightsToAnnotationsMap = await getHighlightAnnotationsMap(highlights);
    //Important to clear highlights AFTER all awaits have completed
    clearHighlights();

    //Temporarily remove any highlights that are completely covered by other larger highlights, otherwise the larger one won't have the 2nd half show up
    for (var highlight1 of highlights) {
        for (var highlight2 of highlights) {
            if (highlight1 == highlight2)
                continue;
            if (!highlight1.textNodes || !highlight2.textNodes)
                continue;
            var inc2 = 0;
            while (inc2 < highlight2.textNodes.length) {
                var inc1 = 0;
                while (inc1 < highlight1.textNodes.length) {
                    var textNode1 = highlight1.textNodes[inc1];
                    var textNode2 = highlight2.textNodes[inc2];
                    if (
                        textNode1.parentText == textNode2.parentText &&
                        textNode1.wholeText == textNode2.wholeText &&
                        textNode1.elementTag == textNode2.elementTag
                    ) {
                        for (var range2 of textNode2.highlightedRanges) {
                            var break1 = false;
                            for (var range1 of textNode1.highlightedRanges) {
                                //Highlight2 is totally overlapping highlight1
                                //Delete it for now, better solution may come later
                                if (range2[0] == range1[0] && range2[1] <= range1[1] && range2[2] >= range1[2]) {
                                    highlight1.textNodes.splice(inc1, 1);
                                    inc1 -= 1;
                                    break1 = true;
                                    break;
                                }
                            }
                            if (break1)
                                break;
                        }
                    }
                    inc1 += 1;
                }
                inc2 += 1;
            }
        }
    }

    var finalNodes = new Map();
    let node = treeWalker.currentNode;
    while (node) {
        if (node.nodeType != Node.TEXT_NODE) {
            for (const highlight of highlights) {
                for (const textNode of highlight.textNodes) {
                    var text = getImmediateTextInNode(node);
                    var parentText = "";
                    if (node.parentNode)
                        parentText = node.parentNode.textContent;
                    if (node.tagName == textNode.elementTag && text == textNode.wholeText && parentText == textNode.parentText) {
                        for (let highlightedRange of textNode.highlightedRanges) { //Temporarily packing in the highlight so that we can link each range to the highlight it came from
                            if (highlightedRange.length == 3)
                                highlightedRange.push(highlight)
                        }

                        if (finalNodes.has(node))
                            finalNodes.set(node, finalNodes.get(node).concat(textNode.highlightedRanges));
                        else
                            finalNodes.set(node, textNode.highlightedRanges);
                    }
                }
            }
        }
        node = treeWalker.nextNode();
    }

    function getTextNode(node, index) {
        var index2 = 0;
        for (const child of node.childNodes) {
            if (child.nodeType == Node.TEXT_NODE) {
                if (index2 == index)
                    return child;
                index2 += 1;
            }
        }
        return null;
    }

    for (const [node, ranges2] of finalNodes) {
        var ranges = ranges2.sort((a, b) => ((b[0] - a[0]) * 1000000000 + (b[1] - a[1])));
        var lastRange = null;
        for (const range of ranges) {
            var textNodeIndex = range[0];
            var start = range[1];
            var end = range[2];
            var highlight = range[3]; //Temporarily packed in from above so that we can link each range to the highlight it came from

            if (lastRange) {
                var lastTextNodeIndex = lastRange[0];
                var lastStart = lastRange[1];
                // var lastEnd = lastRange[2];
                if (lastTextNodeIndex == textNodeIndex && lastStart < end) { //Need to truncate the highlight
                    end = lastStart;
                    if (end <= start)
                        continue;
                }
            }

            var textNode = getTextNode(node, textNodeIndex);
            if (textNode) {
                var highlightedSegment = textNode;
                if (end < textNode.textContent.length)
                    textNode.splitText(end);
                if (start > 0) {
                    if (start >= textNode.textContent.length)
                        return;
                    highlightedSegment = textNode.splitText(start);
                }
                if (highlightedSegment.textContent.length > 0) {

                    // Create container span
                    const containerSpan = document.createElement('span');
                    containerSpan.className = 'phraze-highlight-container PhrazeMark unselectable';

                    // Create the highlight mark
                    const mark = document.createElement('mark');
                    mark.id = "PhrazeHighlight";
                    mark.className = "PhrazeHighlight PhrazeMark selectable";


                    var annotations = highlightsToAnnotationsMap[highlight.id];
                    var labels = "";
                    var codes = "";
                    var notes = "";
                    if (annotations)
                        for (var annotation of annotations) {
                            const type = annotation.find(item => item.type)?.type || '';
                            const options = annotation.find(item => item.options)?.options || [];
                            if (type.toLowerCase() == "label") {
                                if (labels == "")
                                    labels = "Labels: ";
                                else
                                    labels += " | ";
                                labels += options.join(', ');
                            }
                            else if (type.toLowerCase() == "code") {
                                if (codes == "")
                                    codes = "Codes: ";
                                else
                                    codes += " | ";
                                codes += options.join(', ');
                            }
                        }

                    if (highlight.notes) {
                        if (labels != "" || codes != "")
                            notes += "<br>";
                        for (let i = 0; i < highlight.notes.length; ++i) {
                            if (i != 0)
                                notes += "<br>";
                            notes += `-${highlight.notes[i]}`;
                        }
                    }
                    // mark.textContent = highlightedText;
                    // mark.setAttribute('data-preview', `${labels}${labels != "" ? '\n' : ''}${codes}`);
                    containerSpan.appendChild(mark);

                    // // Create the note dropdown, passing the highlight data
                    const dropdown = createNoteDropdown(highlight);
                    // containerSpan.appendChild(dropdown);

                    // // Create the toolbar with all buttons
                    const toolbar = createHighlightToolbar(highlight, dropdown, containerSpan);
                    const dataPreview = createDataPreview(containerSpan, `${labels}${labels != "" && codes != "" ? '<br>' : ''}${codes}${notes}`);
                    // containerSpan.appendChild(toolbar);

                    // Add mouseenter event listener to update toolbar position and show toolbar
                    containerSpan.addEventListener('mouseenter', () => {
                        requestAnimationFrame(() => {
                            updateFloaterPosition(toolbar, containerSpan);
                            updateFloaterPosition(dataPreview, containerSpan, -30);
                        });
                    });

                    containerSpan.addEventListener('click', () => {
                        if (toolbar.style.opacity == 0) {
                            toolbar.classList.add('active');
                            toolbar.style.opacity = 1;
                            toolbar.style.pointerEvents = "auto";
                        }
                        else {
                            toolbar.classList.remove('active');
                            toolbar.style.opacity = 0;
                            toolbar.style.pointerEvents = "none";
                        }
                    });

                    const range = document.createRange();
                    range.selectNode(highlightedSegment);
                    range.surroundContents(mark);
                    range.selectNode(mark);
                    range.surroundContents(containerSpan);
                    containerSpan.appendChild(dropdown);
                    // containerSpan.appendChild(toolbar);
                    document.body.appendChild(toolbar);
                    document.body.appendChild(dataPreview);
                }
            }
            lastRange = range;
        }
    }
    window.getSelection().empty();
}

// Get page dimensions
function getPageInfo() {
    let deepestWindow = findDeepestScrollable(document.body);
    let totalHeight, viewportHeight;
    totalHeight = Math.max(
        deepestWindow.clientHeight,
        deepestWindow.scrollHeight,
        deepestWindow.offsetHeight
    );
    viewportHeight = window.innerHeight;

    return { totalHeight, viewportHeight };
}

async function loadImageInContentScript(dataurl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.onerror = () => {
            console.error("Failed to load image");
            resolve(null);
        };
        img.src = dataurl;
    });
}

async function stitchScreenshotsTogether(screenshots) {
    // Create stitched image
    const firstImg = await loadImageInContentScript(screenshots[0].dataUrl);
    let { totalHeight, viewportHeight } = getPageInfo();
    const canvas = new OffscreenCanvas(firstImg.width, totalHeight);
    const ctx = canvas.getContext("2d");

    for (let i = screenshots.length - 1; i >= 0; --i) {
        const shot = screenshots[i];
        const img = await loadImageInContentScript(shot.dataUrl);
        let finalY = shot.y;
        //Prevent the last image from only showing the top part, it should show the bottom
        if (shot.y + img.height > totalHeight)
            finalY = totalHeight - img.height;
        ctx.drawImage(img, 0, finalY);
    }

    // const finalBlob = await canvas.convertToBlob();
    // const url = URL.createObjectURL(finalBlob);
    const blob = await canvas.convertToBlob();
    const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
    sendRuntimeMessage({ action: "downloadFullPageScreenshot", dataUrl: url });
    // sendRuntimeMessage({
    //     action: "downloadFile",
    //     url: url,
    //     filename: "fullpage-screenshot.png"
    // });
}

// Helper to find the deepest scrollable element
function findDeepestScrollable(element) {
    let deepest = element;
    let maxDepth = -1;

    function dfs(node, depth) {
        if (node.nodeType !== 1) return; // Only element nodes
        const style = window.getComputedStyle(node);
        const isScrollable = (
            (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') &&
            node.scrollHeight > node.clientHeight + 2
        );
        if (isScrollable && depth > maxDepth) {
            deepest = node;
            maxDepth = depth;
        }
        for (let child of node.children) {
            dfs(child, depth + 1);
        }
    }

    dfs(document.body, 0);
    return deepest;
}

function innerMostWindowScrollTo(y) {
    const deepestScrollable = findDeepestScrollable(document.body);
    if (deepestScrollable) {
        deepestScrollable.scrollTop = y;
    } else {
        window.scrollTo(0, y);
    }

    //Manually call mouse enter on each container to update the message bubble location
    var containers = document.getElementsByClassName("phraze-highlight-container");
    for (let container of containers) {
        const event = new MouseEvent("mouseenter", {
            bubbles: false, // must be false for mouseenter
            cancelable: true,
            view: window
        });
        container.dispatchEvent(event);
    }
}

var canSave = false;
// Listen for messages from the extension
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log("Content script receieved message: ", request);
    switch (request.action) {
        case 'highlight':
            canSave = true;
            saveHighlight();
            break;
        case 'clearHighlights':
            clearHighlights();
            break;
        case 'reloadHighlights':
            loadHighlights();
            break;
        case "firebaseDataChanged":
            // const url = sanitizeFirebasePath(window.location.href);
            var companyEmail = await getMainCompanyEmail();
            var currentProject = await getCurrentProject();
            if (request.path === `Companies/${companyEmail}/projects/${currentProject}/highlights`) {
                loadHighlights();
            }
            break;
        case "showAllLabelsCodes":
            var eles = document.getElementsByClassName("PhrazeHighlight-data-preview");
            for (let ele of eles) {
                if (ele.childNodes && ele.childNodes[0].textContent.trim() != "")
                    ele.style.opacity = 1;
            }
            break;
        case "getPageInfo":
            const pageInfo = getPageInfo();
            sendResponse(pageInfo);
            break;
        case "scrollTo":
            innerMostWindowScrollTo(request.y);
            sendResponse({ success: true });
            break;
        case "stitchScreenshots":
            stitchScreenshotsTogether(request.screenshots);
            var eles = document.getElementsByClassName("PhrazeHighlight-data-preview");
            for (let ele of eles)
                ele.style.opacity = 0;
            break;
        default:
            console.log('Invalid action:', request.action);
    }
});

var focusElement = null;
// Create a MutationObserver to watch for DOM changes
var lastPressedTime = 0;

function isVisible(elem) {
    return !!(elem.offsetWidth || elem.offsetHeight || (elem.getClientRects && elem.getClientRects().length));
}

var testInc = 0;
const observer = new MutationObserver(async (mutations) => {
    if (lastPressedTime != 0) {
        if (Date.now() - lastPressedTime < 750)
            return;
    }

    var shouldApplyHighlights = false;
    var successMutation = null;

    const shouldIgnoreMutation = (mutation) =>
        (mutation.target && mutation.target.classList && mutation.target.classList.contains("PhrazeMark")) ||
        (mutation.target && (mutation.target.tagName == "TEXTAREA" || mutation.target.tagName == "INPUT"));

    const shouldIgnoreNode = (node) =>
        !isVisible(node) ||
        node.textContent.trim() == "" ||
        (node && node.classList && (node.classList.contains("PhrazeMark") || node.classList.contains("PhrazeHighlight-data-preview"))) ||
        (node && (node.tagName == "TEXTAREA" || node.tagName == "INPUT"));

    for (const mutation of mutations) {
        if (shouldIgnoreMutation(mutation)) {
            continue;
        }

        if (mutation.addedNodes.length == 0) {
            continue;
        }
        if (Array.from(mutation.addedNodes).some(shouldIgnoreNode)) {
            continue;
        }
        shouldApplyHighlights = true;
        successMutation = mutation;
        break;
        // if (Array.from(mutation.removedNodes).some(shouldIgnoreNode))
        //     return;
    }

    if (!shouldApplyHighlights)
        return;

    console.log("Mutation observer reloading highlights");
    // console.log(successMutation);
    // ++testInc;
    // if (testInc > 3)
    //     return;
    loadHighlights()


    // let ignoreMutation = false;
    // for (const mutation of mutations) {
    //     // Ignore mutations if nodes with our specific IDs/classes are added or removed

    //     // const shouldIgnoreRemovedNode = (node) =>
    //     //     node.tagName === "TEXT";

    //     // if (Array.from(mutation.addedNodes).length == 0 && Array.from(mutation.removedNodes).length > 0 && Array.from(mutation.removedNodes).some(shouldIgnoreRemovedNode)) {
    //     //     console.log("Ignoring removed nodes mutation");
    //     //     ignoreMutation = true;
    //     //     break;
    //     // }

    //     const shouldIgnoreAddedNode = (node) =>
    //         (node.nodeType === Node.ELEMENT_NODE &&
    //             (node.classList.contains("PhrazeHighlight") ||
    //                 node.classList.contains('phraze-highlight-container') ||
    //                 node.classList.contains('phraze-add-note-btn') ||
    //                 node.classList.contains('phraze-note-dropdown'))) ||
    //         (node.parentNode && (node.parentNode.tagName == "TEXTAREA" || node.parentNode.tagName == "INPUT"));

    //     if (Array.from(mutation.addedNodes).some(shouldIgnoreAddedNode)
    //     ) {
    //         ignoreMutation = true;
    //         break;
    //     }



    //     // Original check for text selection changes (might need refinement)
    //     if (mutation.type === 'characterData' && mutation.target && window.getSelection() && window.getSelection().anchorNode &&
    //         mutation.target.parentNode === window.getSelection().anchorNode.parentNode &&
    //         window.getSelection().toString() !== '') {
    //         // This condition might be too broad. Let's comment it out for now
    //         // to prevent it from interfering with normal typing/editing.
    //         // We might need a more specific check if text selection should be ignored.
    //         // ignoreMutation = true;
    //         // break;
    //     }
    // }

    // // If none of the mutations should be ignored, reload highlights
    // if (!ignoreMutation) {
    //     console.log('MutationObserver detected relevant DOM change, reloading highlights.');
    //     loadHighlights(); // Refresh highlights when relevant content changes
    // } else {
    //     // console.log('MutationObserver ignored self-inflicted mutation.');
    // }
});

// Configure the observer to watch for changes
const observerConfig = {
    childList: true,     // Watch for changes to child elements
    subtree: true,       // Watch all descendants, not just direct children
    characterData: true, // Watch for text content changes
};

// Start observing the document
observer.observe(document.body, observerConfig);

document.addEventListener("keydown", function (event) {
    lastPressedTime = Date.now();
});

document.addEventListener("click", function (event) {
    // Only close dropdowns if the click was NOT inside a .phraze-note-dropdown
    let el = event.target;
    while (el) {
        if (el.classList && el.classList.contains("phraze-note-dropdown")) {
            return; // Click was inside a note dropdown, do nothing
        }
        el = el.parentElement;
    }
    closeAllNoteDropdowns();
});
// loadHighlights();

async function initializeFirebaseListener() {
    var companyEmail = await getMainCompanyEmail();
    var currentProject = await getCurrentProject();
    sendRuntimeMessage({
        action: "listenerFirebaseData",
        path: `Companies/${companyEmail}/projects/${currentProject}/highlights`
    }, response => {
        if (response && response.success) {
            // console.log("Firebase listener set up successfully for highlights");
        } else {
            console.error("Failed to set up Firebase listener");
        }
    });
}
initializeFirebaseListener();