import { showFrame, hideAllSubFrames } from './partials/utils.js';
import { getUserName, getMainCompanyEmail, isUserLoggedIn2 } from './partials/auth.js';
import { mainMenu, showToast, callGetItem, sendRuntimeMessage, getUserEmail, getCurrentProject, listenerFirebaseData, removeFirebaseListener } from './frames.js';
import { isOnWebsite } from './globalVariables.js';

function showContactList() {
    document.getElementById("contacts-panel-outer").style.display = "flex";
    // document.getElementById("contacts-panel-chooser").style.display = "block";
    // document.getElementById("contacts-panel-messages").style.display = "none";
    document.getElementById("topics-panel").style.width = "50%";
}

async function setCurrentTopic(topic, type, overrideLabel) {
    currentTopic = topic;
    var headerText = "Current Topic: ";
    if (topic == "general") {
        document.getElementById("messaging-header-right").innerHTML = `${headerText}<b>General</b>`;
    }
    else if (type == "groqChats") {
        var companyEmail = await getMainCompanyEmail();
        var currentProject = await getCurrentProject();
        sendRuntimeMessage({
            action: "getFirebaseData",
            path: `Companies/${companyEmail}/projects/${currentProject}/${currentTopic.replace("-", "/")}/title`
        }, response => {
            if (response && response.success && response.data) {
                document.getElementById("messaging-header-right").innerHTML = `${headerText}<b>${response.data}</b>`;
            }
        });
    }
    else if (type == "manualLogs") {
        document.getElementById("messaging-header-right").innerHTML = `${headerText}<b>${overrideLabel}</b>`;
    }
}

// Helper function to format time in iMessage style
function formatTime(date) {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
        // Today - show time only
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        // Yesterday
        return 'Yesterday ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else {
        // Other days - show date and time
        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric'
        }) + ' ' + date.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
        });
    }
}

function createMessageElement(message, email) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    // Check if this comment is from the current user
    const isMyMessage = message.email === email;
    if (isMyMessage) {
        div.classList.add('my-comment');
    }

    const text = message.text;

    div.innerHTML = `
        <div class="comment-header">
            <span class="comment-author">${isMyMessage ? 'You' : message.name}</span>
            <span class="comment-time">${formatTime(new Date(message.timestamp))}</span>
        </div>
        <div class="comment-text">${text}</div>
    `;

    return div;
}

async function getEmailPair(otherEmail) {
    otherEmail = otherEmail.replace(".", ",");
    var userEmail = await getUserEmail();
    var emailPair = "";
    if (otherEmail == "everyone")
        emailPair = "everyone";
    else {
        if (userEmail < otherEmail)
            emailPair = userEmail + "-" + otherEmail;
        else
            emailPair = otherEmail + "-" + userEmail;
    }
    return emailPair;
}

async function postNewMessage(text) {
    try {
        if (currentlyChattingWith == "")
            return;

        var companyEmail = await getMainCompanyEmail();
        var userEmail = await getUserEmail();
        var userName = await getUserName();
        const message = {
            text: text,
            email: userEmail,
            name: userName,
            timestamp: new Date().toISOString()
        };

        // Save to Firebase through background script
        var companyEmail = await getMainCompanyEmail();
        var currentProject = await getCurrentProject();
        var emailPair = await getEmailPair(currentlyChattingWith);
        sendRuntimeMessage({
            action: "saveFirebaseData",
            path: `Companies/${companyEmail}/securedProjects/${currentProject}/messages/${currentTopic}/${emailPair}/${Date.now()}`,
            data: message
        }, async response => {
            if (!response || !response.success) {
                console.error('Error saving message:', response?.error);
                alert('Failed to post comment. Please try again.');
                return;
            }

            // Reload and resort all comments
            await loadMessages();
        });

    } catch (error) {
        console.error('Error posting message:', error);
        alert('Failed to post message. Please try again.');
    }
}

var currentMessagesPath = "";
async function loadMessages() {
    if (currentlyChattingWith == "")
        return;
    if (currentTopic == "")
        return;

    var companyEmail = await getMainCompanyEmail();
    var currentProject = await getCurrentProject();
    var emailPair = await getEmailPair(currentlyChattingWith);
    var newPath = `Companies/${companyEmail}/securedProjects/${currentProject}/messages/${currentTopic}/${emailPair}`;
    let list = document.getElementById("messages-list");
    if (newPath == currentMessagesPath) {
        list.innerHTML = previousMessagesHTML; //Need to do this to get quick responsive messages, otherwise messages from another chat will appear for a half second in the newly opened chat
    }
    else {
        if (currentMessagesPath != "")
            removeFirebaseListener(currentMessagesPath);

        currentMessagesPath = newPath;

        listenerFirebaseData(currentMessagesPath, async (path, data) => {
            if (path === currentMessagesPath) {
                // loadMessages();
                var list = document.getElementById("messages-list");
                list.innerHTML = "";
                var userEmail = await getUserEmail();
                let messages = data ? Object.values(data) : [];
                for (var message of messages) {
                    list.appendChild(createMessageElement(message, userEmail));
                }
                // Find the new comment and scroll to it
                if (list && list.lastChild) {
                    list.lastChild.scrollIntoView({ behavior: 'smooth' });
                }

                if (messages.length == 0)
                    list.innerHTML = "<span class='messaging-header'>No messages found</span>";

                previousMessagesHTML = list.innerHTML;
            }
        });
    }

    document.getElementById("contact-img").src = currentImg;
    document.getElementById("contact-img-name").innerHTML = currentName;
}

var currentlyChattingWith = "";
var currentImg = "";
var currentName = "";
let previousMessagesHTML = "";
async function openChatWith(email, img, name) {
    let list = document.getElementById("messages-list");
    list.innerHTML = "";
    currentlyChattingWith = email.replace(".", ",");
    currentImg = img;
    currentName = name.replace(",", ".");
    document.getElementById("contacts-panel-chooser").style.display = "none";
    document.getElementById("contacts-panel-messages").style.display = "flex";
    await loadMessages();
}

// Render a contact button
function createContactButton(name, email, profileImage, message) {
    const btn = document.createElement('button');
    const tableStyle = "style='background-color: unset; border: unset;'";
    const imgSrc = profileImage || 'img/default-profile.png';
    btn.className = 'contact-btn';
    btn.innerHTML = `
        <img src="${imgSrc}" class="contact-avatar" />
        <table>
            <tr ${tableStyle}>
                <td ${tableStyle}><span class="contact-name">${name.replace(",", ".")}</span></td><td class='contact-footer' style='text-align: right;'>${formatTime(new Date(message.timestamp))}</td>
            </tr>
            <tr ${tableStyle}>
            <td ${tableStyle} class='contact-footer'>
            ${message.text}
            </td>
            </tr>
        </table>
    `;
    btn.onclick = () => openChatWith(email, imgSrc, name); // Implement this function
    return btn;
}

// Main function to load contacts
async function loadContactsPanel() {
    const contactsPanel = document.getElementById('contacts-panel');
    contactsPanel.innerHTML = '';

    // Add "Everyone" button

    let companyEmail = await getMainCompanyEmail();
    let currentProject = await getCurrentProject();
    let everyoneMessages = Object.values(await callGetItem(`Companies/${companyEmail}/securedProjects/${currentProject}/messages/${currentTopic}/everyone`, false) || []);
    if (everyoneMessages.length > 0)
        everyoneMessages = everyoneMessages[0];
    var message = { timestamp: Date.now(), text: "" };
    if (everyoneMessages != null) {
        var userMessages = Object.values(everyoneMessages);
        var length = userMessages.length;
        if (length > 0)
            message = userMessages[length - 1];
    }
    contactsPanel.appendChild(createContactButton("Everyone", "everyone", "img/default-group.png", message));

    // Get company email
    const userEmail1 = await getUserEmail();

    // Fetch all keys under Companies/companyEmail
    sendRuntimeMessage({
        action: "getFirebaseData",
        path: `Companies/${companyEmail}/users`
    }, response => {
        if (!response || !response.success || !response.data) {
            contactsPanel.innerHTML += '<div class="error">Failed to load contacts.</div>';
            return;
        }
        // Loop through keys and find users
        Object.entries(response.data).forEach(async ([key, value]) => {
            // Get user info (name, email, profileImage)
            let userEmail2 = value?.email || key;
            userEmail2 = userEmail2.replace(".", ",");
            const userName = value?.name || userEmail2;
            const profileImage = value?.profileImage;
            // Don't show yourself
            if (userEmail1 === userEmail2)
                return;
            var message = { timestamp: Date.now(), text: "" };
            var emailPair = await getEmailPair(userEmail2);
            let messages = Object.values(await callGetItem(`Companies/${companyEmail}/securedProjects/${currentProject}/messages/${currentTopic}/${emailPair}`, false) || []);
            if (messages.length > 0)
                messages = messages[0];
            if (messages != null) {
                var userMessages = Object.values(messages);
                var length = userMessages.length;
                if (length > 0)
                    message = userMessages[length - 1];
            }
            contactsPanel.appendChild(
                createContactButton(userName, userEmail2, profileImage, message)
            );
        });
    });
}

var currentChatId = null;
var currentTopic = "";
setCurrentTopic("general");
document.addEventListener('DOMContentLoaded', async function () {
    setTimeout(function () {
        loadContactsPanel();
    }, 3000);
    const messagingButton = document.getElementById('Messaging');
    const backButton = document.getElementById('Back-messaging');
    const GroqChats_button = document.getElementById("topics-Groq Chats");
    // const VideoAnnotations_button = document.getElementById("topics-Video Annotations");
    // const VoiceAnnotations_button = document.getElementById("topics-Voice Annotations");
    const ManualLogs_button = document.getElementById("topics-Manual Logs");
    const ManualLogs_back_button = document.getElementById("topic-Manual Logs-back");

    const GroqChats_back_button = document.getElementById("topic-Groq Chats-back");

    messagingButton.addEventListener('click', async function () {
        if (await isUserLoggedIn2()) {
            hideAllSubFrames();
            showFrame("messaging-sub-frame-label");
            showFrame("messaging-sub-frame");
        }
        else {
            showToast("You must be logged in to use messaging", 'error')
        }
    });

    backButton?.addEventListener('click', function () {
        console.log("Showing main menu from messaging back");
        mainMenu();
    });

    function hideTopics() {
        document.getElementById("choose-topic").style.display = "none";
        document.getElementById("topic-Groq Chats-div").style.display = "none";
        // document.getElementById("topic-Video Annotations-div").style.display = "none";
        // document.getElementById("topic-Voice Annotations-div").style.display = "none";
        document.getElementById("topic-Manual Logs-div").style.display = "none";
        // hideContactList();
    }

    // function showTopics() {
    //     document.getElementById("choose-topic").style.display = "none";
    //     document.getElementById("topic-Groq Chats-div").style.display = "none";
    //     document.getElementById("topic-Video Annotations-div").style.display = "none";
    //     document.getElementById("topic-Voice Annotations-div").style.display = "none";
    //     document.getElementById("topic-Manual Logs-div").style.display = "none";
    // }

    // var openContactsButton = document.getElementById("openContactsButton");
    // var closeContactsButton = document.getElementById("closeContactsButton");
    // // Hide both buttons by default
    // openContactsButton.style.display = "none";
    // closeContactsButton.style.display = "none";

    // // Helper to hide both
    // function hideContactsPanelButtons() {
    //     openContactsButton.style.display = "none";
    //     closeContactsButton.style.display = "none";
    // }
    // // Helper to show open button only
    // function showOpenContactsButton() {
    //     openContactsButton.style.display = "block";
    //     closeContactsButton.style.display = "none";
    // }

    GroqChats_button.addEventListener('click', async function () {
        hideTopics();
        document.getElementById("topic-Groq Chats-div").style.display = "block";
        var currentProject = await getCurrentProject();
        setTimeout(function () {
            var iframe = document.getElementById("groq-iframe");
            iframe.contentWindow.postMessage({ action: "Inside Extension", currentProject: currentProject }, "*");
        }, 0);
        // Show open contacts button for Groq Chats
        // showOpenContactsButton();
        // loadGroqChatsList();
    });

    GroqChats_back_button.addEventListener('click', function () {
        setCurrentTopic("general");
        loadContactsPanel();
        loadMessages();
        var iframe = document.getElementById("groq-iframe");
        iframe.contentWindow.postMessage({ action: "Show Sidebar" }, "*");
        hideTopics();
        document.getElementById("choose-topic").style.display = "block";
        // Hide both contacts panel buttons when leaving Groq Chats
        // hideContactsPanelButtons();
    });

    // VideoAnnotations_button.addEventListener('click', function () {
    // hideTopics();
    // });
    // VoiceAnnotations_button.addEventListener('click', function () {
    // hideTopics();
    // });
    ManualLogs_button.addEventListener('click', async function () {
        hideTopics();
        document.getElementById("topic-Manual Logs-div").style.display = "block";
        var manualLogCategoriesDiv = document.getElementById("topic-Manual Logs-categories");
        var manualLogsDiv = document.getElementById("topic-Manual Logs-logs");
        manualLogCategoriesDiv.style.display = "block";
        manualLogCategoriesDiv.innerHTML = "";
        manualLogsDiv.style.display = "none";
        var categories = Object.values(await callGetItem("categoriesImages") || []);
        if (categories.length > 0)
            categories = Object.keys(categories[0]);
        else
            manualLogCategoriesDiv.innerHTML = "<div>No categories found</div>";
        for (let category of categories) {
            let categoryButton = document.createElement('div');
            categoryButton.className = "category-item";
            categoryButton.style.cursor = 'pointer';
            let categoryKey = category;
            categoryButton.innerHTML = `<span class="category-name">${categoryKey}</span>`;
            categoryButton.addEventListener('click', async function () {
                manualLogCategoriesDiv.style.display = "none";
                manualLogsDiv.style.display = "block";
                manualLogsDiv.innerHTML = "";

                var logs = Object.values(await callGetItem(`categoriesImages/${categoryKey}/images`) || []);
                if (logs.length > 0)
                    logs = Object.values(logs[0]);
                for (let log of logs) {
                    let logButton = document.createElement('div');
                    logButton.style.borderRadius = "10px";
                    let timestamp = formatTime(new Date(log.timestamp));
                    logButton.innerHTML = `
                    <div class="catalog-card"><img src="${log.data}" alt="contact.png" style="padding-bottom: 20px;">
                    <div class="catalog-note-preview">Selected Text: ${log.selectedText}<br>${log.note}</div><div class="catalog-card-bottom"><div class="catalog-timestamp">${timestamp}</div>
                    </div></div>
                    `;
                    logButton.addEventListener('click', async function () {
                        var topicText = log.selectedText + " " + timestamp;
                        // if (log.selectedText.trim() != "") {
                        //     topicText = log.selectedText;
                        // }
                        // if (log.note.trim() != "") {
                        //     if (topicText != "")
                        //         topicText += "<br>";
                        //     topicText += log.note;
                        // }
                        setCurrentTopic(`categoriesImages-images-${log.imageId}`, "manualLogs", topicText);
                        loadContactsPanel();
                        loadMessages();
                        for (let otherButton of manualLogsDiv.childNodes) {
                            otherButton.style.border = "";
                        }
                        logButton.style.border = "solid 4px gray";
                    });

                    manualLogsDiv.appendChild(logButton);
                }
                // setCurrentTopic(`categoriesImages/${categoryKey}`)
            });
            manualLogCategoriesDiv.appendChild(categoryButton);
        }
    });

    ManualLogs_back_button.addEventListener('click', function () {
        var manualLogCategoriesDiv = document.getElementById("topic-Manual Logs-categories");
        setCurrentTopic("general");
        loadContactsPanel();
        loadMessages();
        hideTopics();
        document.getElementById("choose-topic").style.display = "block";
        if (manualLogCategoriesDiv.style.display == "none") {
            ManualLogs_button.click(); //Allows user to go back to the categories from the logs list, instead of skipping back to the main topics menu
        }
        // Hide both contacts panel buttons when leaving Manual Logs
        // hideContactsPanelButtons();
    });

    const addMessageButton = document.getElementById('add-message');
    const newMessageInput = document.getElementById('new-message');

    // Auto-resize functionality for textarea
    if (newMessageInput) {
        newMessageInput.addEventListener('input', function () {
            // Reset height to auto to get the correct scrollHeight
            this.style.height = 'auto';
            // Set the height to match content (plus a little extra padding)
            this.style.height = (this.scrollHeight) + 'px';
        });

        // Add keyboard event handling for Enter key
        newMessageInput.addEventListener('keydown', function (e) {
            // Shift+Enter allows for new line
            if (e.key === 'Enter' && e.shiftKey) {
                // Default behavior will insert a new line, no need to do anything
                return;
            }
            // Regular Enter should submit the comment
            else if (e.key === 'Enter') {
                e.preventDefault();
                const text = this.value.trim();
                if (text) {
                    postNewMessage(text);
                    this.value = ''; // Clear input after posting
                    this.style.height = 'auto'; // Reset height
                }
            }
        });
    }

    // Add event listener for posting new comments
    addMessageButton?.addEventListener('click', function () {
        const text = newMessageInput.value.trim();
        if (text) {
            postNewMessage(text);
            newMessageInput.value = ''; // Clear input after posting
            newMessageInput.style.height = 'auto'; // Reset height
        }
    });

    document.getElementById("messages-back").addEventListener('click', function () {
        loadContactsPanel();
        document.getElementById("contacts-panel-chooser").style.display = "block";
        document.getElementById("contacts-panel-messages").style.display = "none";
        // showContactList();
    });

    // openContactsButton.addEventListener('click', function () {
    //     showContactList();
    //     openContactsButton.style.display = "none";
    //     closeContactsButton.style.display = "block";
    // });
    // closeContactsButton.addEventListener('click', function () {
    //     hideContactList();
    //     closeContactsButton.style.display = "none";
    //     openContactsButton.style.display = "block";
    // });



    window.addEventListener('message', async function (event) {
        if (event.data.action === "activeChat") {
            currentChatId = event.data.id;
            setCurrentTopic("groqChats-" + currentChatId, "groqChats");
            loadContactsPanel();
            loadMessages();
            var iframe = document.getElementById("groq-iframe");
            var companyEmail = await getMainCompanyEmail();
            iframe.contentWindow.postMessage({ action: "Show Highlights", companyEmail: companyEmail }, "*");
        }
    });

    showContactList();
    const resizer = document.getElementById('messaging-resizer');
    const topicsPanel = document.getElementById('topics-panel');
    const contactsPanelOuter = document.getElementById('contacts-panel-outer');
    const container = document.getElementById('messaging-sub-frame'); // The parent container
    //Overlay is needed because resizing event does not fire when mouse is over the iframe
    const overlay = document.getElementById('iframe-overlay');

    let isResizing = false;

    resizer.addEventListener('mousedown', function (e) {
        isResizing = true;
        // Add event listeners to the document to capture mouse movements globally
        overlay.style.display = 'block';
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResizing);
    });

    function resize(e) {
        console.log(isResizing);
        if (!isResizing) return;

        const containerRect = container.getBoundingClientRect();
        const newTopicsWidth = e.clientX - containerRect.left;
        const totalWidth = containerRect.width;

        // Calculate new widths, ensuring minimum width and not exceeding total width
        // Adjust minWidth as needed
        const minWidth = 238;

        let topicsPanelWidth = Math.max(minWidth, newTopicsWidth);
        topicsPanelWidth = Math.min(topicsPanelWidth, totalWidth - minWidth);
        const contactsPanelWidth = totalWidth - topicsPanelWidth;

        // Update the styles
        topicsPanel.style.width = topicsPanelWidth + 'px';
        contactsPanelOuter.style.width = contactsPanelWidth + 'px';
    }

    function stopResizing() {
        isResizing = false;
        // Remove the event listeners
        overlay.style.display = 'none';
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResizing);
    }
});

//Manual logging images path:
// categoriesImages
// ABC
// images
// img_1748371264492_au3i9s1na
// data
// :
// "data:image/png;base64,iVBORw0KGgoAAAA
// imageId
// :
// "img_1748371264492_au3i9s1na"
// name
// :
// "contactButtons.png"
// note
// :
// "Note goes here"
// selectedText
// :
// "help"
// size
// :
// 274424
// timestamp
// :
// "2025-05-27T18:41:04.482Z"
// type
// :
// "image/png"

//Manual logging categories path:
// manualLoggingCategories
// ABC
// createdAt
// :
// "2025-05-27T18:40:55.603Z"
// name
// :
// "ABC"
