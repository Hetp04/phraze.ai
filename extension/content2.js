//Status : Need to fix debounce for highlighting->observer

// Add our styles to the document
const style = document.createElement('style');
style.textContent = `
    mark[id="PhrazeHighlight"] {
        background-color: yellow !important;
        color: black !important;
        border-radius: 3px !important;
        cursor: pointer !important;
        display: inline-block !important;
        position: relative !important;
        z-index: 1 !important;
        opacity: 1;
    }
    
    mark[id="PhrazeHighlight"]:hover {
        background-color: #ffeb3b !important;
    }

    /* Hide empty highlight elements */
    mark[id="PhrazeHighlight"]:empty {
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
        position: fixed; /* Changed from absolute to fixed for viewport-relative positioning */
        transform: translateX(-50%);
        display: flex;
        background-color: rgba(250, 250, 250, 0.95);
        border-radius: 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        border: 1px solid #e0e0e0;
        padding: 2px;
        z-index: 1000; /* Increased to ensure it's above other content */
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
        pointer-events: none; /* Initially disable pointer events */
    }

    /* Show toolbar on hover of container or toolbar itself */
    .phraze-highlight-container:hover .phraze-highlight-toolbar,
    .phraze-highlight-toolbar:hover {
        opacity: 1;
        visibility: visible;
        pointer-events: auto; /* Re-enable pointer events when visible */
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

    .PhrazeHighlight::after {
        content: attr(data-preview);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: rgb(250, 250, 250);
        color: black;
        padding: 0px 10px;
        border-radius: 10px;
        white-space: nowrap;
        font-size: 12px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
        outline: 1px solid black;
        margin-bottom: 4px;
        height: 17px;
        padding-bottom: 2px;
        /* Only display when data-preview is not empty */
        display: none;
    }
    
    /* Add the triangle pointing down from speech bubble */
    .PhrazeHighlight::before {
        content: "";
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid rgb(250, 250, 250);
        margin-bottom: 0px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
        filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 1));
        /* Only display when data-preview is not empty */
        display: none;
    }

    /* Show tooltip only when hovering and data-preview has content */
    .PhrazeHighlight[data-preview]:not([data-preview=""]):not([data-preview=" "]):hover::after,
    .PhrazeHighlight[data-preview]:not([data-preview=""]):not([data-preview=" "]):hover::before {
        opacity: 1;
        display: block;
    }

    /* Container for the highlight mark and button */
    .phraze-highlight-container {
        display: inline; /* Changed from inline-flex to avoid layout shifts */
        position: relative;
        vertical-align: middle; /* Align with surrounding text */
    }

    /* The highlight mark itself inside the container */
    .phraze-highlight-container mark[id="PhrazeHighlight"] {
        /* Inherit styles, reset potential container side effects if needed */
        vertical-align: baseline; /* Reset vertical alignment if needed */
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
        vertical-align: middle;
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
        bottom: calc(100% + 5px); /* Position above the button */
        left: 50%;
        transform: translateX(-50%);
        background-color: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        z-index: 10000; /* Ensure it's above page content */
        width: 200px; /* Adjust width as needed */
        display: none; /* Hidden by default */
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
         display: flex; /* Show when needed */
    }


    .phraze-note-dropdown input[type="text"] {
        flex-grow: 1; /* Allow input to take available space */
        width: auto; /* Override previous width */
        padding: 5px;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 13px;
        box-sizing: border-box; /* Include padding and border in width */
    }

    /* New '+' button style inside dropdown */
    .phraze-dropdown-add-btn {
        flex-shrink: 0; /* Prevent button from shrinking */
        padding: 3px 6px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        border: 1px solid #ccc;
        border-radius: 3px;
        background-color: #f0f0f0;
        line-height: 1; /* Adjust line height for better vertical alignment */
    }

    .phraze-dropdown-add-btn:hover {
        background-color: #e0e0e0;
    }

    /* List for notes */
    .phraze-note-list {
        list-style: disc;
        margin: 5px 0 0 20px; /* Add margin for list styling */
        padding: 0;
        max-height: 100px; /* Limit height and allow scrolling */
        overflow-y: auto;
        font-size: 12px;
        color: #333;
        list-style-position: inside; /* Keep bullets inside padding */
        padding-left: 5px; /* Add some padding */
    }

    .phraze-note-list li {
        /* Use flexbox for layout */
        display: flex;
        justify-content: space-between; /* Push text and button apart */
        align-items: center;
        margin-bottom: 4px; /* Increased spacing */
        padding: 2px 0; /* Add vertical padding */
    }

    /* Span for the note text itself */
    .phraze-note-text {
        flex-grow: 1; /* Allow text to take available space */
        margin-right: 5px; /* Space between text and delete button */
        word-break: break-word; /* Prevent long words from overflowing */
    }

    /* Delete button style */
    .phraze-note-delete-btn {
        flex-shrink: 0; /* Prevent button from shrinking */
        background: #eee;
        border: 1px solid #ccc;
        color: #777;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        font-size: 10px;
        line-height: 14px; /* Center 'x' vertically */
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
        align-self: flex-end; /* Align button to the right */
    }

    .phraze-note-dropdown button:hover {
        background-color: #e0e0e0;
    }

    .unselectable {
        user-select: none;
    }
`;
document.head.appendChild(style);

// Track last storage operation time
let lastStorageUpdate = 0;
const MIN_STORAGE_INTERVAL = 60000; // Minimum 1 minute between storage operations

console.warn('==========================================');
console.warn('CONTENT.JS LOADED - CHECK YOUR CONSOLE!');
console.warn('==========================================');

// Add a small indicator element to the page to visually confirm script execution
(function () {
    try {
        const indicator = document.createElement('div');
        indicator.style.position = 'fixed';
        indicator.style.top = '0';
        indicator.style.right = '0';
        indicator.style.backgroundColor = 'rgba(255,0,0,0.7)';
        indicator.style.color = 'white';
        indicator.style.padding = '5px';
        indicator.style.zIndex = '9999';
        indicator.style.fontSize = '12px';
        indicator.textContent = 'Label Adder Extension Active';
        indicator.id = 'label-adder-indicator';
        // Only add if it doesn't exist yet
        if (!document.getElementById('label-adder-indicator')) {
            document.body.appendChild(indicator);
            // Auto-remove after 5 seconds
            setTimeout(() => {
                indicator.remove();
            }, 5000);
        }
    } catch (e) {
        console.error('Error creating indicator:', e);
    }
})();


function getNodesFromHighlight(highlight) {
    var elements = document.getElementsByTagName(highlight.tag);
    var nodes = [];
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].textContent.includes(highlight.wholeText)) {
            nodes.push(elements[i]);
        }
    }
    return nodes;
}

/**
 * Get all nodes within a selection range
 * @param {Range} range - The selection range
 * @returns {Array<Node>} Array of nodes within the selection
 */
function getNodesInRange(range) {
    const nodes = [];

    // If the range is within a single text node, just return that node
    if (range.startContainer === range.endContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
        return [range.startContainer];
    }

    // Use document.body as root if commonAncestorContainer is #document
    const root = range.commonAncestorContainer.nodeType === Node.DOCUMENT_NODE ?
        document.body : range.commonAncestorContainer;

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,  // Only look at text nodes
        {
            acceptNode: function (node) {

                // Skip empty text nodes
                if (!node.textContent.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                // Always accept the start and end containers
                if (node === range.startContainer || node === range.endContainer) {
                    return NodeFilter.FILTER_ACCEPT;
                }

                // Check if this text node intersects with our range
                const nodeRange = document.createRange();
                nodeRange.selectNode(node);

                if (nodeRange.compareBoundaryPoints(Range.END_TO_START, range) <= 0 &&
                    nodeRange.compareBoundaryPoints(Range.START_TO_END, range) >= 0) {
                    return NodeFilter.FILTER_ACCEPT;
                }

                return NodeFilter.FILTER_REJECT;
            }
        }
    );

    let node;
    while (node = walker.nextNode()) {
        nodes.push(node);
    }
    return nodes;
}

/**
 * Check if an element is an inline element
 * @param {Element} element - The element to check
 * @returns {boolean} True if the element is inline
 */
function isInlineElement(element) {
    const inlineElements = [
        'a', 'abbr', 'acronym', 'b', 'bdo', 'big', 'br', 'button', 'cite', 'code',
        'dfn', 'em', 'i', 'img', 'input', 'kbd', 'label', 'map', 'object', 'q',
        'samp', 'script', 'select', 'small', 'span', 'strong', 'sub', 'sup',
        'textarea', 'time', 'tt', 'var'
    ];
    return inlineElements.includes(element.tagName.toLowerCase());
}

/**
 * Check if an element has block-level children
 * @param {Element} element - The element to check
 * @returns {boolean} True if the element has block-level children
 */
function hasBlockChildren(element) {
    const blockElements = [
        'address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div',
        'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main',
        'nav', 'noscript', 'ol', 'p', 'pre', 'section', 'table', 'tfoot',
        'ul', 'video'
    ];

    for (const child of element.children) {
        if (blockElements.includes(child.tagName.toLowerCase())) {
            return true;
        }
    }
    return false;
}

/**
 * Get the intersecting text between a range and a node
 * @param {Range} range - The selection range
 * @param {Node} node - The node to check
 * @returns {string} The intersecting text
 */
function getIntersectingText(range, node) {
    // Create a range that spans the node
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);

    // Get the intersection of the two ranges
    const intersection = {
        start: Math.max(0, range.startOffset - (range.startContainer === node ? 0 : nodeRange.startOffset)),
        end: Math.min(node.textContent.length, range.endOffset - (range.endContainer === node ? 0 : nodeRange.startOffset))
    };

    return node.textContent.substring(intersection.start, intersection.end);
}

/**
 * Process user highlights on a webpage
 */
function processHighlights(selectionInfo) {
    // Step 1: Create highlight objects for each selection
    const highlights = [];

    if (selectionInfo) {
        // Create a normalized range based on the selection's direction
        const normalizedRange = document.createRange();
        if (selectionInfo.isBackward) {
            // Backwards selection
            normalizedRange.setStart(selectionInfo.focusNode, selectionInfo.focusOffset);
            normalizedRange.setEnd(selectionInfo.anchorNode, selectionInfo.anchorOffset);
        } else {
            // Forward selection
            normalizedRange.setStart(selectionInfo.anchorNode, selectionInfo.anchorOffset);
            normalizedRange.setEnd(selectionInfo.focusNode, selectionInfo.focusOffset);
        }

        const nodes = getNodesInRange(normalizedRange);

        nodes.forEach(node => {
            // Skip nodes that aren't connected to the DOM
            if (!node.isConnected || !node.parentElement) {
                return;
            }

            // For text nodes, use parent element's tag
            const tag = node.nodeType === Node.TEXT_NODE ?
                node.parentElement.tagName.toLowerCase() :
                node.tagName.toLowerCase();

            const intersectingText = node.nodeType === Node.TEXT_NODE ?
                getIntersectingText(normalizedRange, node) :
                node.textContent;

            if (intersectingText.trim()) {
                // Find which instance of the text was selected
                const wholeText = node.textContent;
                const highlightedText = intersectingText.trim();
                let instance = 1;
                let lastIndex = 0;
                let found = false;

                // Get the offset where the selection starts in the node
                const nodeRange = document.createRange();
                nodeRange.selectNode(node);
                const selectionOffset = normalizedRange.startOffset - (node === normalizedRange.startContainer ? 0 : nodeRange.startOffset);

                // Count instances until we find the one that matches our selection
                while ((lastIndex = wholeText.indexOf(highlightedText, lastIndex)) !== -1) {
                    if (selectionOffset >= lastIndex && selectionOffset <= lastIndex + highlightedText.length) {
                        found = true;
                        break;
                    }
                    instance++;
                    lastIndex += 1;
                }

                // If we couldn't determine the instance, default to 1
                if (!found) {
                    instance = 1;
                }

                highlights.push({
                    tag: tag,
                    highlightedText: highlightedText,
                    wholeText: wholeText,
                    instance: instance
                });
            }
        });
    }

    return highlights;
}

async function getHighlightAnnotationsMap(highlights) {
    var highlightsToAnnotationsMap = {};
    if (highlights)
        for (let highlight of highlights) {
            highlightsToAnnotationsMap[highlight.highlightedText] = await getHighlightAnnotations(highlight.highlightedText);
        }
    return highlightsToAnnotationsMap;
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

    chrome.runtime.sendMessage({
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

function applyHighlights(highlights, highlightsToAnnotationsMap) {
    // Step 4: Remove all existing highlight marks and containers
    const existingContainers = document.querySelectorAll('span.phraze-highlight-container');
    existingContainers.forEach(container => {
        const parent = container.parentNode;
        if (parent) {
            // Unwrap the original text content from the mark inside the container
            const mark = container.querySelector('mark[id="PhrazeHighlight"]');
            if (mark) {
                parent.insertBefore(document.createTextNode(mark.textContent), container);
            }
            container.remove();
            parent.normalize(); // Merge adjacent text nodes
        }
    });

    if (!highlights) {
        return;
    }

    // Step 5 & 6: Loop through highlights and find matching elements
    highlights.forEach(highlight => {

        // Function to recursively search through nodes
        function searchNodes(node, currentTag) {
            // Skip if node is null or not an element
            if (!node) {
                return;
            }

            // Check if this node matches our criteria
            if (node.childNodes.length == 0 &&
                currentTag &&
                currentTag.toLowerCase() === highlight.tag
                // && node.textContent.includes(highlight.wholeText)
                && node.textContent.includes(highlight.highlightedText)
            ) {
                // Process the matching node
                if (node.parentNode) {
                    var parent = node.parentNode;

                    //Build the string for the speech bubble
                    // var annotations = await getHighlightAnnotations(highlight.highlightedText);
                    var annotations = highlightsToAnnotationsMap[highlight.highlightedText];
                    console.log("highlightsToAnnotationsMap", highlightsToAnnotationsMap);
                    console.log("Highlighted text |" + highlight.highlightedText + "|");
                    console.log("Annotations 2|", annotations);
                    var labels = "";
                    var codes = "";
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
                                codes = "Labels: ";
                            else
                                codes += " | ";
                            codes += options.join(', ');
                        }
                    }

                    if (node.textContent != highlight.highlightedText) { //Only a portion of the element was selected by the user
                        // Create text nodes for before and after the highlighted portion
                        const text = node.textContent;
                        const highlightedText = highlight.highlightedText;
                        const startIndex = text.indexOf(highlightedText);

                        const beforeText = text.substring(0, startIndex);
                        const afterText = text.substring(startIndex + highlightedText.length);

                        // Create container span
                        const containerSpan = document.createElement('span');
                        containerSpan.className = 'phraze-highlight-container';

                        // Create the highlight mark
                        const mark = document.createElement('mark');
                        mark.id = "PhrazeHighlight";
                        mark.className = "PhrazeHighlight";
                        mark.textContent = highlightedText;
                        mark.setAttribute('data-preview', labels + " " + codes);
                        containerSpan.appendChild(mark);

                        // Create the note dropdown, passing the highlight data
                        const dropdown = createNoteDropdown(highlight);
                        containerSpan.appendChild(dropdown);

                        // Create the toolbar with all buttons
                        const toolbar = createHighlightToolbar(highlight, dropdown);
                        containerSpan.appendChild(toolbar);

                        // Add mouseenter event listener to update toolbar position and show toolbar
                        containerSpan.addEventListener('mouseenter', () => {
                            requestAnimationFrame(() => {
                                updateToolbarPosition(toolbar, containerSpan);
                            });
                        });

                        // Add mouseleave event listener to hide toolbar
                        containerSpan.addEventListener('mouseleave', (e) => {
                            // Only hide if we're not entering the toolbar
                            if (!toolbar.contains(e.relatedTarget)) {
                                toolbar.classList.remove('active');
                            }
                        });

                        // Insert elements into the DOM
                        if (beforeText) {
                            parent.insertBefore(document.createTextNode(beforeText), node);
                        }
                        parent.replaceChild(containerSpan, node);
                        if (afterText) {
                            parent.insertBefore(document.createTextNode(afterText), containerSpan.nextSibling);
                        }

                        // Ensure parent is normalized after complex DOM changes
                        parent.normalize();

                    } else { // The entire node content matches the highlighted text
                        // Create container span
                        const containerSpan = document.createElement('span');
                        containerSpan.className = 'phraze-highlight-container';

                        // Create the highlight mark
                        const mark = document.createElement('mark');
                        mark.id = "PhrazeHighlight";
                        mark.className = "PhrazeHighlight";
                        mark.setAttribute('data-preview', labels + " " + codes);
                        // Move the original node content into the mark
                        mark.appendChild(node.cloneNode(true));
                        containerSpan.appendChild(mark);

                        // Create the note dropdown, passing the highlight data
                        const dropdown = createNoteDropdown(highlight);
                        containerSpan.appendChild(dropdown);

                        // Create the toolbar with all buttons
                        const toolbar = createHighlightToolbar(highlight, dropdown);
                        containerSpan.appendChild(toolbar);

                        // Add mouseenter event listener to update toolbar position and show toolbar
                        containerSpan.addEventListener('mouseenter', () => {
                            requestAnimationFrame(() => {
                                updateToolbarPosition(toolbar, containerSpan);
                            });
                        });

                        // Add mouseleave event listener to hide toolbar
                        containerSpan.addEventListener('mouseleave', (e) => {
                            // Only hide if we're not entering the toolbar
                            if (!toolbar.contains(e.relatedTarget)) {
                                toolbar.classList.remove('active');
                            }
                        });

                        // Insert elements into the DOM
                        parent.replaceChild(containerSpan, node);
                        // Normalize parent after replacement
                        parent.normalize();
                    }
                    // The return true was commented out, keeping it that way
                }
            }

            // If this node contains our text but isn't a match itself, search its children
            if (node.textContent.includes(highlight.wholeText)) {
                // Search through child nodes
                for (let child of node.childNodes) {
                    var newTag = currentTag;
                    if (child.tagName != null)
                        newTag = child.tagName
                    if (searchNodes(child, newTag)) {
                        // return true; // If a child was processed, we can stop searching
                    }
                }
            }

            return false; // No match found in this branch
        }

        // Start the recursive search from the body
        searchNodes(document.body, "BODY");
    });
}


/**
 * Helper function to create the '+' button for adding notes.
 * No longer used - replaced by toolbar.
 * @returns {HTMLButtonElement} The created button element.
 */
/*
function createAddNoteButton() {
    const button = document.createElement('button');
    button.className = 'phraze-add-note-btn';
    button.textContent = '+';
    button.title = 'Add note';
    return button;
}
*/

/**
 * Helper function to create the note input dropdown.
 * @param {object} highlight - The highlight data object associated with this dropdown.
 * @returns {HTMLDivElement} The created dropdown div element.
 */
function createNoteDropdown(highlight) {
    const dropdown = document.createElement('div');
    dropdown.className = 'phraze-note-dropdown';

    // Create container for input and add button
    const inputContainer = document.createElement('div');
    inputContainer.className = 'phraze-note-input-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Add a note...';
    inputContainer.appendChild(input);

    // Create the new '+' button for adding notes to the list
    const addNoteToListButton = document.createElement('button');
    addNoteToListButton.textContent = '+';
    addNoteToListButton.className = 'phraze-dropdown-add-btn';
    addNoteToListButton.title = 'Add note to list';
    inputContainer.appendChild(addNoteToListButton);

    // Add the input container to the dropdown
    dropdown.appendChild(inputContainer);

    // Create the unordered list for displaying notes
    const notesList = document.createElement('ul');
    notesList.className = 'phraze-note-list';
    dropdown.appendChild(notesList);

    // Helper function to create a list item with text and delete button
    const createListItem = (noteText) => {
        const listItem = document.createElement('li');

        const textSpan = document.createElement('span');
        textSpan.className = 'phraze-note-text';
        textSpan.textContent = noteText;
        listItem.appendChild(textSpan);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'phraze-note-delete-btn';
        deleteButton.innerHTML = '&times;'; // Use HTML entity for 'x'
        deleteButton.title = 'Delete note';
        listItem.appendChild(deleteButton);

        deleteButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            // Try to remove from storage first
            try {
                await removeNoteFromStorage(highlight.highlightedText, noteText);
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
                await addNoteToStorage(highlight.highlightedText, noteText);
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

    /* // Remove or comment out the old Save button logic
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Save clicked. Note:', input.value); // Keep console log for now if needed
        toggleNoteDropdown(dropdown);
    });
    dropdown.appendChild(saveButton);
    */

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

/**
 * Helper function to create the delete highlight button.
 * No longer used - replaced by toolbar.
 * @param {object} highlight - The highlight data object associated with this button.
 * @returns {HTMLButtonElement} The created delete button element.
 */
/*
function createDeleteHighlightButton(highlight) {
    const button = document.createElement('button');
    button.className = 'phraze-delete-highlight-btn';
    button.textContent = '×';
    button.title = 'Delete highlight';
    
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Find the parent container
        const container = button.closest('.phraze-highlight-container');
        if (!container) return;
        
        try {
            // Get the highlighted text from the mark element
            const mark = container.querySelector('mark[id="PhrazeHighlight"]');
            if (!mark) return;
            
            const highlightedText = mark.textContent;
            const url = sanitizeFirebasePath(window.location.href);
            
            // Delete the highlight from storage
            await deleteHighlightFromStorage(url, highlightedText);
            
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
    
    return button;
}
*/

/**
 * Updates the toolbar position to be above the highlight
 * @param {HTMLElement} toolbar - The toolbar element
 * @param {HTMLElement} container - The highlight container element
 */
function updateToolbarPosition(toolbar, container) {
    // Get the mark element
    const mark = container.querySelector('mark[id="PhrazeHighlight"]');
    if (!mark) return;

    // Get the client rect of the first line of the highlight
    const range = document.createRange();
    const textNode = mark.firstChild;
    if (!textNode) return;

    // Create a range for just the first line
    range.setStart(textNode, 0);
    range.setEnd(textNode, textNode.length);
    const rects = range.getClientRects();
    if (rects.length === 0) return;

    // Use the first rect (first line)
    const firstRect = rects[0];

    // Calculate toolbar position
    const toolbarRect = toolbar.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Position toolbar closer to the highlight (4px gap instead of 8px)
    const left = scrollX + firstRect.left + (firstRect.width / 2);
    const top = scrollY + firstRect.top - toolbarRect.height + 1;

    // Update toolbar position
    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
}

/**
 * Creates a toolbar with buttons for a highlight
 * @param {Object} highlight - The highlight data object
 * @param {HTMLElement} dropdown - The note dropdown element to toggle
 * @returns {HTMLElement} The toolbar element with all buttons
 */
function createHighlightToolbar(highlight, dropdown) {
    // Create the toolbar container
    const toolbar = document.createElement('div');
    toolbar.className = 'phraze-highlight-toolbar';

    // Add mouseenter/mouseleave handlers for the toolbar itself
    toolbar.addEventListener('mouseenter', () => {
        toolbar.classList.add('active');
    });

    toolbar.addEventListener('mouseleave', (e) => {
        // Check if we're still within the highlight container
        const container = toolbar.closest('.phraze-highlight-container');
        if (!container.contains(e.relatedTarget)) {
            toolbar.classList.remove('active');
        }
    });

    // Create the notes button (blue +)
    const notesButton = document.createElement('button');
    notesButton.className = 'phraze-toolbar-btn phraze-toolbar-notes-btn';
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
    deleteButton.className = 'phraze-toolbar-btn phraze-toolbar-delete-btn';
    deleteButton.innerHTML = '&#10005;'; // X symbol
    deleteButton.title = 'Delete highlight';

    // Delete button click listener
    deleteButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Find the parent container
        const container = deleteButton.closest('.phraze-highlight-container');
        if (!container) return;

        try {
            // Get the highlighted text from the mark element
            const mark = container.querySelector('mark[id="PhrazeHighlight"]');
            if (!mark) return;

            const highlightedText = mark.textContent;
            const url = sanitizeFirebasePath(window.location.href);

            // Delete the highlight from storage
            await deleteHighlightFromStorage(url, highlightedText);

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
    profileButton.className = 'phraze-toolbar-btn phraze-toolbar-profile-btn';
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
                updateToolbarPosition(toolbar, actualContainer);
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

/**
 * Delete a highlight from storage (Firebase or local).
 * @param {string} url - The sanitized URL key.
 * @param {string} highlightedText - The text content of the highlight to delete.
 */
async function deleteHighlightFromStorage(url, highlightedText) {
    // First delete the highlight
    if (await isUserLoggedIn()) {
        // Delete from Firebase if user is logged in
        const companyEmail = await getMainCompanyEmail();
        if (!companyEmail) {
            throw new Error('No company email found');
        }

        // 1. Delete the highlight from the highlights collection
        const highlightsPath = `Companies/${companyEmail}/highlights/${url}`;

        // Get current highlights
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "getFirebaseData", path: highlightsPath }, resolve);
        });

        if (!response || !response.success) {
            throw new Error(`Failed to get Firebase data: ${response?.error || 'Unknown error'}`);
        }

        const highlights_data = response.data || [];

        // Filter out the highlight to delete
        const updated_highlights = highlights_data.filter(h => h.highlightedText !== highlightedText);

        // Save the updated list back to Firebase
        const saveResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: "saveFirebaseData",
                path: highlightsPath,
                data: updated_highlights
            }, resolve);
        });

        if (!saveResponse || !saveResponse.success) {
            throw new Error(`Failed to save updated highlights to Firebase: ${saveResponse?.error || 'Unknown error'}`);
        }

        // 2. Delete related annotation history entries
        const projectName = await getCurrentProject();
        const annotationPath = `Companies/${companyEmail}/projects/${projectName}/annotationHistory`;

        // Get current annotation history
        const annotationResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "getFirebaseData", path: annotationPath }, resolve);
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
                    const userTextObj = annotationEntry.find(item => item.userText !== undefined);
                    // Only keep entries where userText doesn't match the deleted highlight
                    return !userTextObj || userTextObj.userText !== highlightedText;
                });

                // Save the updated annotation history back to Firebase
                await new Promise((resolve) => {
                    chrome.runtime.sendMessage({
                        action: "saveFirebaseData",
                        path: annotationPath,
                        data: updatedHistory
                    }, resolve);
                });

                console.log(`Deleted ${annotationHistory.length - updatedHistory.length} annotation entries for highlight: "${highlightedText}"`);
            } else {
                console.warn('Annotation history is not an array:', annotationHistory);
            }
        }
    } else {
        // Delete from local storage if not logged in

        // 1. Delete the highlight from highlights collection
        const data = await loadFunc("highlights");
        const all_highlights = data.highlights;

        if (!all_highlights[url]) {
            throw new Error(`No highlights found for URL ${url} in local storage.`);
        }

        all_highlights[url] = all_highlights[url].filter(h => h.highlightedText !== highlightedText);
        await new Promise((resolve) => chrome.storage.local.set({ highlights: all_highlights }, resolve));

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
                    const userTextObj = annotationEntry.find(item => item.userText !== undefined);
                    // Only keep entries where userText doesn't match the deleted highlight
                    return !userTextObj || userTextObj.userText !== highlightedText;
                });

                // Save the updated annotation history back to local storage
                await callSetItem("annotationHistory", JSON.stringify(updatedHistory));

                console.log(`Deleted ${annotationHistory.length - updatedHistory.length} annotation entries for highlight: "${highlightedText}"`);
            } else {
                console.warn('Annotation history is not an array:', annotationHistory);
            }
        }
    }
}

// Add a global click listener to close dropdowns when clicking outside
document.addEventListener('click', (event) => {
    // Check if the click was outside any highlight container
    if (!event.target.closest('.phraze-highlight-container')) {
        closeAllNoteDropdowns();
    }
});

/**
 * Find all elements containing the specified text
 * @param {string} searchText - Text to search for
 * @returns {Array<Element>} Array of elements containing the text
 */
function findElementsWithText(searchText) {
    const elements = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode: function (node) {
                return node.textContent.includes(searchText) ?
                    NodeFilter.FILTER_ACCEPT :
                    NodeFilter.FILTER_SKIP;
            }
        }
    );

    let node;
    while (node = walker.nextNode()) {
        if (node.children.length === 0) { // Only get leaf nodes
            elements.push(node);
        }
    }

    return elements;
}

/**
 * Escape special characters for use in regex
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeFirebasePath(url) {
    // Replace characters that are not allowed in Firebase paths
    return url.replace(/[.#$\/\[\]]/g, '_');
}

// Store highlights in chrome.storage.local, was using chrome.storage.sync, but that has a limit of 8KB, local has 5MB
async function saveHighlight(highlights) {
    const now = Date.now();

    const url = sanitizeFirebasePath(window.location.href);

    // Get user and company email
    const userEmail = await getUserEmail(); // Potentially null if not logged in
    const companyEmail = await getMainCompanyEmail(); // Potentially null

    // Prepare highlights with the notes array initialized and add emails
    const highlightsWithNotes = highlights.map(h => ({
        ...h,
        notes: h.notes || [],
        userEmail: userEmail || 'local', // Use 'local' or similar if not logged in
        companyEmail: companyEmail || 'local' // Use 'local' or similar if not logged in/no company
    }));

    if (await isUserLoggedIn() && companyEmail) { // Ensure companyEmail is available for Firebase path
        // Save to Firebase if user is logged in
        // const companyEmail = await getMainCompanyEmail(); // Already fetched above
        // if (!companyEmail) {
        //     console.error('No company email found');
        //     return;
        // }

        // Get existing highlights first
        chrome.runtime.sendMessage({
            action: "getFirebaseData",
            path: `Companies/${companyEmail}/highlights/${url}`
        }, (response) => {
            const highlights_data = response?.success && response?.data ? response.data : [];

            // Push the new highlights (with notes array) to the existing data
            for (const highlight of highlightsWithNotes) {
                highlights_data.push(highlight);
            }

            // Save back to Firebase
            chrome.runtime.sendMessage({
                action: "saveFirebaseData",
                path: `Companies/${companyEmail}/highlights/${url}`,
                data: highlights_data
            }, (response) => {
                if (response?.success) {
                    lastStorageUpdate = now;
                } else {
                    console.error('Failed to save highlights to Firebase:', response?.error);
                }
                loadStoredHighlights();
            });
        });
    } else {
        // Fallback to chrome.storage if not logged in
        chrome.storage.local.get({ highlights: {} }, (data) => {
            const highlights_data = data.highlights;
            if (!highlights_data[url]) {
                highlights_data[url] = [];
            }

            // Push the new highlights (with notes array) to the existing data
            for (const highlight of highlightsWithNotes) {
                highlights_data[url].push(highlight);
            }

            chrome.storage.local.set({ highlights: highlights_data }, () => {
                lastStorageUpdate = now;
                console.log("Applying", highlights_data);
                loadStoredHighlights();
            });
        });
    }
}

// Load and apply stored highlights
async function loadStoredHighlights() {
    const url = sanitizeFirebasePath(window.location.href);

    if (await isUserLoggedIn()) {
        // Load from Firebase if user is logged in
        const companyEmail = await getMainCompanyEmail();
        if (!companyEmail) {
            console.error('No company email found');
            return;
        }

        chrome.runtime.sendMessage({
            action: "getFirebaseData",
            path: `Companies/${companyEmail}/highlights/${url}`
        }, async (response) => {
            const urlHighlights = response.data;
            applyHighlights(urlHighlights, await getHighlightAnnotationsMap(urlHighlights));
        });
    } else {
        // Fallback to chrome.storage if not logged in
        chrome.storage.local.get({ highlights: {} }, async (data) => {
            const urlHighlights = data.highlights[url] || [];
            applyHighlights(urlHighlights, await getHighlightAnnotationsMap(urlHighlights));
        });
    }
}

// Handle highlight creation
function handleHighlight() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return;
    }

    // Immediately capture the selection points before they can change
    const selectionInfo = {
        anchorNode: selection.anchorNode,
        anchorOffset: selection.anchorOffset,
        focusNode: selection.focusNode,
        focusOffset: selection.focusOffset,
        isBackward: selection.anchorOffset > selection.focusOffset
    };

    const highlights = processHighlights(selectionInfo);
    console.log("Can save", canSave);
    if (canSave) {
        console.log("Saving");
        saveHighlight(highlights);
    }
}

// Clear all highlights
async function clearAllHighlights() {
    const existingMarks = document.querySelectorAll('mark[id="PhrazeHighlight"]');
    existingMarks.forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
    });

    const url = sanitizeFirebasePath(window.location.href);

    if (await isUserLoggedIn()) {
        // Clear from Firebase if user is logged in
        const companyEmail = await getMainCompanyEmail();
        if (!companyEmail) {
            console.error('No company email found');
            return;
        }

        chrome.runtime.sendMessage({
            action: "saveFirebaseData",
            path: `Companies/${companyEmail}/highlights/${url}`,
            data: null
        }, (response) => {
            if (!response?.success) {
                console.error('Failed to clear highlights from Firebase:', response?.error);
            }
        });
    } else {
        // Clear from chrome.storage if not logged in
        chrome.storage.local.get({ highlights: {} }, (data) => {
            const highlights = data.highlights;
            if (highlights[url]) {
                delete highlights[url];
                chrome.storage.local.set({ highlights });
            }
        });
    }
}

// Clear specific highlight
async function clearHighlight(url, text) {
    const marks = document.querySelectorAll('mark[id="PhrazeHighlight"]');
    marks.forEach(mark => {
        if (mark.textContent === text) {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
        }
    });

    if (await isUserLoggedIn()) {
        // Clear from Firebase if user is logged in
        const companyEmail = await getMainCompanyEmail();
        if (!companyEmail) {
            console.error('No company email found');
            return;
        }

        chrome.runtime.sendMessage({
            action: "getFirebaseData",
            path: `Companies/${companyEmail}/highlights/${url}`
        }, (response) => {
            if (response?.success && response?.data) {
                const highlights = response.data.filter(h => h.text !== text);

                chrome.runtime.sendMessage({
                    action: "saveFirebaseData",
                    path: `Companies/${companyEmail}/highlights/${url}`,
                    data: highlights
                }, (saveResponse) => {
                    if (!saveResponse?.success) {
                        console.error('Failed to update highlights in Firebase:', saveResponse?.error);
                    }
                });
            }
        });
    } else {
        // Clear from chrome.storage if not logged in
        chrome.storage.local.get({ highlights: {} }, (data) => {
            if (data.highlights[url]) {
                data.highlights[url] = data.highlights[url].filter(h => h.text !== text);
                chrome.storage.local.set({ highlights: data.highlights });
            }
        });
    }
}

(async function () {
    const url = sanitizeFirebasePath(window.location.href);
    // Set up Firebase data listener
    var companyEmail = await getMainCompanyEmail();
    chrome.runtime.sendMessage({
        action: "listenerFirebaseData",
        path: `Companies/${companyEmail}/highlights/${url}`
    }, response => {
        if (response && response.success) {
            console.log("Firebase listener set up successfully");
        } else {
            console.error("Failed to set up Firebase listener");
        }
    });
})();

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    switch (request.action) {
        case 'highlight':
            canSave = true;
            handleHighlight(request.text, request.color);
            break;
        case 'clearHighlights':
            clearAllHighlights();
            break;
        case 'clearSpecificHighlight':
            clearHighlight(request.url, request.text);
            sendResponse({ status: "Highlight cleared", receivedText: request.text });
            break;
        case 'reloadHighlights':
            loadStoredHighlights();
            break;
        case "firebaseDataChanged":
            const url = sanitizeFirebasePath(window.location.href);
            var companyEmail = await getMainCompanyEmail();
            if (request.path === `Companies/${companyEmail}/highlights/${url}`) {
                loadStoredHighlights();
            }
            break;
        default:
            console.log('Invalid action:', request.action);
    }
});

var canSave = false;

// Load stored highlights when the page loads
setTimeout(loadStoredHighlights, 500);

// Clean up empty highlight elements
function cleanupEmptyHighlights() {
    const emptyHighlights = document.querySelectorAll('mark[id="PhrazeHighlight"]:empty');
    emptyHighlights.forEach(el => el.remove());
}

async function isUserLoggedIn() {
    try {
        const result = await chrome.storage.local.get('authInfo');
        return !!(result.authInfo && result.authInfo.uid);
    } catch (error) {
        console.error('Error checking login status:', error);
        return false;
    }
}

async function getMainCompanyEmail() {
    try {
        const email = await getUserEmail();
        if (!email) return null;

        console.log("emailToCompanyDirectory/" + email.replace(".", ","));
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
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

async function getUserEmail() {
    try {
        const result = await chrome.storage.local.get('authInfo');
        if (result.authInfo && result.authInfo.email) {
            return result.authInfo.email.replace('.', ',');
        }
        return null;
    } catch (error) {
        console.error('Error getting user email:', error);
        return null;
    }
}

async function getAnnotationHistory() {
    let data = await callGetItem("annotationHistory");
    if (data == null)
        data = {};
    var values = Object.values(data);
    if (values.length == 0) {
        return [];
    }
    return JSON.parse(values[0]);
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
            chrome.runtime.sendMessage({
                action: "getFirebaseData",
                path: `Companies/${companyEmail}/projects/${projectName}/${key}`
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

async function getHighlightAnnotations(highlightText) {
    let annotationHistory = await getAnnotationHistory();
    var annotations = [];
    for (var annotation of annotationHistory) {
        for (var property of annotation) {
            if (property.userText) {
                if (property.userText.replace(" ", "") == highlightText.replace(" ", "")) {
                    annotations.push(annotation);
                }
            }
        }
    }
    return annotations;
}

// Create a MutationObserver to watch for DOM changes
const observer = new MutationObserver(async (mutations) => {
    let ignoreMutation = false;

    for (const mutation of mutations) {
        // Ignore mutations if nodes with our specific IDs/classes are added or removed
        const isOurElement = (node) =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.id === "PhrazeHighlight" ||
                node.classList.contains('phraze-highlight-container') ||
                node.classList.contains('phraze-add-note-btn') ||
                node.classList.contains('phraze-note-dropdown'));

        if (Array.from(mutation.addedNodes).some(isOurElement) ||
            Array.from(mutation.removedNodes).some(isOurElement)) {
            ignoreMutation = true;
            break;
        }

        // Original check for text selection changes (might need refinement)
        if (mutation.type === 'characterData' && mutation.target && window.getSelection() && window.getSelection().anchorNode &&
            mutation.target.parentNode === window.getSelection().anchorNode.parentNode &&
            window.getSelection().toString() !== '') {
            // This condition might be too broad. Let's comment it out for now
            // to prevent it from interfering with normal typing/editing.
            // We might need a more specific check if text selection should be ignored.
            // ignoreMutation = true;
            // break;
        }
    }

    // If none of the mutations should be ignored, reload highlights
    if (!ignoreMutation) {
        console.log('MutationObserver detected relevant DOM change, reloading highlights.');
        loadStoredHighlights(); // Refresh highlights when relevant content changes
    } else {
        // console.log('MutationObserver ignored self-inflicted mutation.');
    }
});

// Configure the observer to watch for changes
const observerConfig = {
    childList: true,     // Watch for changes to child elements
    subtree: true,       // Watch all descendants, not just direct children
    characterData: true, // Watch for text content changes
};

// Start observing the document
observer.observe(document.body, observerConfig);

// Add this new async function to handle saving the note
/**
 * Adds a note to the correct highlight in storage (Firebase or local).
 * @param {string} highlightedText - The text content of the highlight to find.
 * @param {string} noteText - The text of the note to add.
 */
async function addNoteToStorage(highlightedText, noteText) {
    const url = sanitizeFirebasePath(window.location.href);

    if (await isUserLoggedIn()) {
        // --- Firebase Logic --- 
        const companyEmail = await getMainCompanyEmail();
        if (!companyEmail) throw new Error('No company email found for logged-in user.');
        const path = `Companies/${companyEmail}/highlights/${url}`;

        // Get current highlights
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "getFirebaseData", path: path }, resolve);
        });

        if (!response || !response.success) {
            throw new Error(`Failed to get Firebase data: ${response?.error || 'Unknown error'}`);
        }

        const highlights_data = response.data || [];

        // Find the highlight and add the note
        let updated = false;
        const updated_highlights = highlights_data.map(h => {
            // Using includes might be safer if whitespace is an issue, but exact match is simpler first
            if (h.highlightedText === highlightedText) {
                if (!h.notes) h.notes = []; // Ensure notes array exists
                h.notes.push(noteText);
                updated = true;
            }
            return h;
        });

        if (!updated) throw new Error(`Highlight with text "${highlightedText}" not found.`);

        // Save back to Firebase
        const saveResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "saveFirebaseData", path: path, data: updated_highlights }, resolve);
        });

        if (!saveResponse || !saveResponse.success) {
            throw new Error(`Failed to save updated highlights to Firebase: ${saveResponse?.error || 'Unknown error'}`);
        }

    } else {
        // --- Local Storage Logic --- 
        const data = await new Promise((resolve) => chrome.storage.local.get({ highlights: {} }, resolve));
        const all_highlights = data.highlights;

        if (!all_highlights[url]) {
            throw new Error(`No highlights found for URL ${url} in local storage.`);
        }

        let urlHighlights = all_highlights[url];
        let updated = false;

        urlHighlights = urlHighlights.map(h => {
            // Using includes might be safer if whitespace is an issue, but exact match is simpler first
            if (h.highlightedText === highlightedText) {
                if (!h.notes) h.notes = []; // Ensure notes array exists
                h.notes.push(noteText);
                updated = true;
            }
            return h;
        });

        if (!updated) throw new Error(`Highlight with text "${highlightedText}" not found locally.`);

        all_highlights[url] = urlHighlights;
        await new Promise((resolve) => chrome.storage.local.set({ highlights: all_highlights }, resolve));
    }
}

/**
 * Removes a note from the correct highlight in storage (Firebase or local).
 * @param {string} highlightedText - The text content of the highlight to find.
 * @param {string} noteText - The text of the note to remove.
 */
async function removeNoteFromStorage(highlightedText, noteText) {
    const url = sanitizeFirebasePath(window.location.href);

    if (await isUserLoggedIn()) {
        // --- Firebase Logic --- 
        const companyEmail = await getMainCompanyEmail();
        if (!companyEmail) throw new Error('No company email found for logged-in user.');
        const path = `Companies/${companyEmail}/highlights/${url}`;

        // Get current highlights
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "getFirebaseData", path: path }, resolve);
        });

        if (!response || !response.success) {
            throw new Error(`Failed to get Firebase data: ${response?.error || 'Unknown error'}`);
        }

        const highlights_data = response.data || [];
        let updated = false;

        const updated_highlights = highlights_data.map(h => {
            if (h.highlightedText === highlightedText && h.notes) {
                const noteIndex = h.notes.indexOf(noteText);
                if (noteIndex > -1) {
                    h.notes.splice(noteIndex, 1);
                    updated = true;
                }
            }
            return h;
        });

        if (!updated) throw new Error(`Note "${noteText}" for highlight "${highlightedText}" not found.`);

        // Save back to Firebase
        const saveResponse = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: "saveFirebaseData", path: path, data: updated_highlights }, resolve);
        });

        if (!saveResponse || !saveResponse.success) {
            throw new Error(`Failed to save updated highlights (delete) to Firebase: ${saveResponse?.error || 'Unknown error'}`);
        }

    } else {
        // --- Local Storage Logic --- 
        const data = await new Promise((resolve) => chrome.storage.local.get({ highlights: {} }, resolve));
        const all_highlights = data.highlights;

        if (!all_highlights[url]) {
            throw new Error(`No highlights found for URL ${url} in local storage.`);
        }

        let urlHighlights = all_highlights[url];
        let updated = false;

        urlHighlights = urlHighlights.map(h => {
            if (h.highlightedText === highlightedText && h.notes) {
                const noteIndex = h.notes.indexOf(noteText);
                if (noteIndex > -1) {
                    h.notes.splice(noteIndex, 1);
                    updated = true;
                }
            }
            return h;
        });

        if (!updated) throw new Error(`Note "${noteText}" for highlight "${highlightedText}" not found locally.`);

        all_highlights[url] = urlHighlights;
        await new Promise((resolve) => chrome.storage.local.set({ highlights: all_highlights }, resolve));
    }
}


// Requirements:


// 1. Handle highlights over multiple elements
// 2. Don't allow multiple words to get highlighted from 1 highlight
// 3. Assumes text won't change in the elements with page is reloaded

// highlight:
// id: "78569587718948"
// highlights: [{
//     wholetext = all text in the element
//     highlightedRanges = [[0, 2, 5] or [1, 10, 20] etc...] (text node index, start, end)
//     elementTag = p or div etc...
// }]

// Saving the highlight:
// 1. Generate a map of nodes to immediate child text by finding phraze marks in elements and adding that text to it's text nodes contents
// 2. Use window.getSelection() to find selected elements
// 3. For each selected element, go up to it's parent if it's a phraze mark
// 4. Add the text to a map of selected text elements:
// node -> text selected inside node(string), append if already exists
// 5. for each node in selected texts map:
//     - Create a highlight object
//     - Set whole text(the whole text of that node from the child map)
//     - Set highlightedTexts(selected texts map)
//     - Set highlightedRanges(the ranges of text highlighted in that node)
//     - Set elementTag(the current tag of the element)
//     - Add highlight object to final highlight object array


// Loading the highlight:

// 1.
// Generate a map of tag + innertext -> node of all elements in the DOM
// For each highlight:
//    For each highlight object:
//     - Check if the highlight matches the element(by looking up node map)
//     - If yes, add it to a map of node -> [highlight objects]

// 2.
// For each node, [highlight objects] in map:
// - Sort the array of highlight objects by the most to least highlighted range index->start value([text node index, start, end])
// - For each highlight object in array:
//     -If highlight intersects with most recent highlight:
//          -Modify temporary variables to set end maximum to most recent start
//     - Save text node index and start as the most recent highlight
//     - Add a mark element in the element and split the text content into 3 parts
//     - let newTextNode = textNode.splitText(offset);