import { saveFirebaseData, getFirebaseData } from "../funcs.js"

//New handmade algorithm (AI was making faulty highlighting algorithms)

//----------------------------Webpage edits--------------------------------
async function isUserLoggedIn() {
  return true;
}

function getUserEmail() {
  var user = JSON.parse(localStorage.getItem("currentUser"));
  return user.email.replace('.', ',');
}

var mainCompanyEmail = "";
export function getMainCompanyEmail() {
 // if (mainCompanyEmail)
  //  return mainCompanyEmail;
  return localStorage.getItem("companyEmail");
}

export function setMainCompanyEmail(email) {
  mainCompanyEmail = email;
}

function getCurrentProject() {
  var project = localStorage.getItem("currentProject");
  if (project)
    return project;
  return 'default';
}

async function saveFunc(value) {
  const companyEmail = getMainCompanyEmail();
  const projectName = getCurrentProject();
  const path = `Companies/${companyEmail}/projects/${projectName}/highlights`;
  saveFirebaseData(path, value)
}
//----------------------------END Webpage edits--------------------------------

async function loadFunc() {
  const companyEmail = await getMainCompanyEmail();
  if (!companyEmail) throw new Error('No company email found for logged-in user.');
  const projectName = await getCurrentProject();
  const path = `Companies/${companyEmail}/projects/${projectName}/highlights`;
  return await getFirebaseData(path);
}

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
  var data = await getFirebaseData(firebasePath);
  if (data) {
    imgElement.src = data;
    imgElement.style.display = 'block';
  }
}

async function getAnnotationHistory() {
  let data = await callGetItem("annotationHistory");
  if (data == null)
    data = {};
  var values = Object.values(data);
  if (values.length == 0)
    return [];
  if (!values[0])
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

function getGlobalHighlightID() {
  return localStorage.getItem("globalHighlightID");
}


async function callGetItem(key, prefixProjectName = true) {
  console.warn(`-- callGetItem(key = ${key}) --`);

  var companyEmail = await getMainCompanyEmail();
  var projectName = await getCurrentProject();
  var path = `Companies/${companyEmail}/projects/${projectName}/${key}`;
  var data1 = await getFirebaseData(path);
  if (prefixProjectName)
    key = projectName + "/" + key;
  let data2 = { [key]: data1 };
  return data2;
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
  toolbar.style.top = `${rect.y - (toolbarRect.height - 1) + yOffset}px`;
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
    var data = await getFirebaseData(annotationPath);

    if (data) {
      // Make sure annotationHistory is an array
      let annotationHistory = data;

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
        saveFirebaseData(annotationPath, JSON.stringify(updatedHistory));

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
  const url = sanitizeFirebasePath(window.location.href);

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
  dropdown.classList.add('phraze-note-dropdown');
  dropdown.classList.add('PhrazeMark');
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
    visibleDropdowns.remove(dropdown.dataset.highlightId);
    // Optional: Add closing animation class
  } else {
    // Close any other open dropdowns first
    closeAllNoteDropdowns();
    dropdown.classList.add('visible');
    visibleDropdowns.add(dropdown.dataset.highlightId);
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

export async function saveHighlight() {
  console.log("Saving highlight", window.location.href);
  var collectedRanges = getHighlightedTextNodeRanges();
  var globalHighlightID = getGlobalHighlightID();
  var highlight = {
    id: globalHighlightID,
    userEmail: getUserEmail(),
    companyEmail: getMainCompanyEmail(),
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

function createDataPreview(containerSpan, content, showAllLabelsAndCodes = false) {
  const dataPreview = document.createElement('div');
  if (showAllLabelsAndCodes && content.trim() != "")
    dataPreview.style.opacity = 1;
  dataPreview.className = 'PhrazeHighlight-data-preview';
  dataPreview.innerHTML = content;
  const arrow = document.createElement('img');
  arrow.src = "src/images/data-preview-arrow.png";
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

      toolbar.remove();
      // Delete the highlight from storage
      await deleteHighlightFromStorage(highlight.id);

      // Replace the container with the original text
      if (container.parentNode) {
        var parentNode = container.parentNode;
        container.parentNode.insertBefore(document.createTextNode(mark.textContent), container);
        container.remove();
        // Normalize parent to combine adjacent text nodes
        parentNode.normalize();
      }
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

let visibleDropdowns = new Set();
export async function loadHighlights(showAllLabelsAndCodes = false) {
  clearHighlights();
  var highlights = await loadFunc() || [];
  const treeWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ALL,  // Only look at text nodes
    {
      acceptNode: function (node) {
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  //Temporarily remove any highlights that are completely covered by other larger highlights, otherwise the larger one won't have the 2nd half show up
  for (var highlight1 of highlights) {
    for (var highlight2 of highlights) {
      if (highlight1 == highlight2)
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

  let highlightsToAnnotationsMap = await getHighlightAnnotationsMap(highlights);
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
        if (start > 0)
          highlightedSegment = textNode.splitText(start);
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
          mark.setAttribute('data-preview', labels + " " + codes);
          containerSpan.appendChild(mark);

          // // Create the note dropdown, passing the highlight data
          const dropdown = createNoteDropdown(highlight);
          // containerSpan.appendChild(dropdown);

          // // Create the toolbar with all buttons
          const toolbar = createHighlightToolbar(highlight, dropdown, containerSpan);
          const dataPreview = createDataPreview(containerSpan, `${labels}${labels != "" && codes != "" ? '<br>' : ''}${codes}${notes}`, showAllLabelsAndCodes);
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

          if (showAllLabelsAndCodes)
            updateFloaterPosition(dataPreview, containerSpan, -8);
        }
      }
      lastRange = range;
    }
  }
  window.getSelection().empty();
}

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