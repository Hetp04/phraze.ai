// Import necessary Firebase functions
import { database, auth } from './firebase-init';
import { ref, get, set } from 'firebase/database';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, updateProfile } from 'firebase/auth';

// Add global username variable
export let currentUsername = "Guest";
export let currentCompanyEmail = "";
export let isLoggedIn = false;

// Function to generate a unique ID for shared chats
export function generateUniqueId(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
        result += chars[randomValues[i] % chars.length];
    }
    return result;
}

// Function to initialize and listen for username changes
export function initUsernameFetcher() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            isLoggedIn = true;
            try {
                // Get company email for the user
                const userEmail = user.email.replace(".", ",");
                currentCompanyEmail = await getFirebaseData(`emailToCompanyDirectory/${userEmail}`);

                if (currentCompanyEmail) {
                    // Fetch username from the company directory
                    const userData = await getFirebaseData(`Companies/${currentCompanyEmail}/users/${userEmail}`);
                    if (userData && userData.name) {
                        currentUsername = userData.name;
                    } else {
                        currentUsername = user.email.split('@')[0]; // Fallback to email prefix
                    }
                } else {
                    currentUsername = user.email.split('@')[0]; // Fallback to email prefix
                }
            } catch (error) {
                console.error("Error fetching username:", error);
                currentUsername = "User";
            }
        } else {
            currentUsername = "Guest";
            currentCompanyEmail = "";
            isLoggedIn = false;
        }
    });
}

export async function getFirebaseData(path) {
    // Create a reference to the specified path in the database
    const dbRef = ref(database, path);

    // Return a promise that resolves with the data at the specified path
    return get(dbRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                console.log(`No data available at path: ${path}`);
                return null;
            }
        })
        .catch((error) => {
            console.error(`Error getting data at path ${path}:`, error);
            throw error;
        });
}

export async function saveFirebaseData(path, data) {
    // Create a reference to the specified path in the database
    const dbRef = ref(database, path);

    // Use set() to write data to the specified path
    return new Promise((resolve) => {
        set(dbRef, data)
            .then(() => {
                console.log(`Data successfully saved at path: ${path}`);
                resolve(true);
            })
            .catch((error) => {
                console.error(`Error saving data at path ${path}:`, error);
                throw error;
            });
    });
}

export async function finishSignUp(user, username, email, companyEmail) {
    if (username)
        await updateProfile(user, {
            displayName: username
        });
    if (!email)
        email = user.email;
    if (!companyEmail)
        companyEmail = user.email;
    if (!username)
        username = email;

    console.log("User account created successfully:", user.uid);
    saveFirebaseData(`Companies/${companyEmail.replace(".", ",")}/users/${email.replace(".", ",")}`,
        {
            createdAt: new Date().toISOString(),
            email: email,
            name: username
        });
    let value = await getFirebaseData(`emailToCompanyDirectory/${email.replace(".", ",")}`);
    if (!value)
        saveFirebaseData(`emailToCompanyDirectory/${email.replace(".", ",")}`, companyEmail.replace(".", ","));
    var defaultProject = await getFirebaseData(`Companies/${companyEmail.replace(".", ",")}/projects/default`);
    if (!defaultProject) {
        saveFirebaseData(`Companies/${companyEmail.replace(".", ",")}/projects/default`, {
            name: "default",
            created: new Date().toISOString()
        });
    }
    window.location.href = '/';
    return user;
}

export async function firebaseCreateAccount(email, password, inviteCode, username) {
    var companyEmail = email;
    if (inviteCode && inviteCode != "") {
        var invitingCompany = await getFirebaseData(`inviteCodes/${inviteCode}/companyEmail`);
        if (invitingCompany && invitingCompany != "") {
            companyEmail = invitingCompany;
            saveFirebaseData(`inviteCodes/${inviteCode}`, null);
        }
        else {
            console.error("Invalid invite code");
            showToast("Invalid invite code", "error");
            throw new Error("Invalid invite code");
        }
    }
    // Create a new user account with email and password
    return createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {

            // User account created successfully
            const user = userCredential.user;
            return await finishSignUp(user, username, email, companyEmail);
        })
        .catch((error) => {
            // Handle errors
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(`Failed to create account: ${errorCode} - ${errorMessage}`);
            showToast(errorMessage, "error");
            throw error;
        });
}

export function firebaseLogin(email, password) {
    // Sign in a user with email and password
    return signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // User signed in successfully
            const user = userCredential.user;
            console.log("User signed in successfully:", user.uid);
            // Navigate to the home page after successful login
            window.location.href = '/';
            return user;
        })
        .catch((error) => {
            // Handle errors
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error(`Failed to sign in: ${errorCode} - ${errorMessage}`);
            showToast("Failed to sign in", "error");
            throw error;
        });
}

export function showToast(message, type, durationMs = 3000) {
    // Remove any existing GLOBAL toasts (do not remove scoped toasts inside overlays)
    const existingToast = document.querySelector('.toast:not(.toast--scoped)');
    if (existingToast) existingToast.remove();

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast with animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Hide and remove toast after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            try {
                // Notify listeners that a toast has fully ended
                window.dispatchEvent(new CustomEvent('toast:ended', { detail: { message, type } }));
            } catch (_) {}
            toast.remove();
        }, 300);
    }, durationMs);
}

// Scoped toast that appears within a specific container instead of window bottom
export function showToastScoped(parentElement, message, type, durationMs = 1800) {
    if (!parentElement) {
        // Fallback to global toast if no container provided
        return showToast(message, type);
    }

    // Remove any existing scoped toasts in this container
    const existing = parentElement.querySelector('.toast.toast--scoped');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast--scoped`;
    toast.textContent = message;
    parentElement.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            try {
                // Also emit an event for scoped toasts in case consumers care
                window.dispatchEvent(new CustomEvent('toast:ended', { detail: { message, type, scope: 'scoped' } }));
            } catch (_) {}
            toast.remove();
        }, 300);
    }, durationMs);
}


var listenerFuncs = new Map();
export async function firebaseListener(path, id, func) {
    const firebaseDb = await import('firebase/database');
    const { ref, onValue, off } = firebaseDb;
    const { database } = await import('./firebase-init'); // Get database instance
    let listenerRef = ref(database, path);

    let mapKey = path + " " + id;
    if (listenerFuncs.has(mapKey)) {
        off(listenerRef, 'value', listenerFuncs.get(mapKey));
    }
    
    
    // Define the callback for onValue
    const handleValueChange = (snapshot) => {
        func(path, snapshot.val());
    };
    listenerFuncs.set(mapKey, handleValueChange);
    // Attach the listener
    onValue(listenerRef, handleValueChange);
}

export async function getMainCompanyEmail() {
    let user = auth.currentUser;
    if (user) {
        return await getFirebaseData(`emailToCompanyDirectory/${user.email.replace(".", ",")}`);
    } else {
        return null;
    }
}

export async function updateProfilePicture(func, id) {
    let user = auth.currentUser;
    if (user) {
        let companyEmail = await getMainCompanyEmail();
        firebaseListener(`Companies/${companyEmail}/users/${user.email.replace(".", ",")}/profileImage`, id, function (path, data) {
            func(data);
        });
    }
}

export async function fetchGoogleProfilePicture() {
    try {
        const user = auth.currentUser;






        if (!user) {
            console.log('No user logged in');
            return null;
        }

        // Check if user has Google provider
        const googleProvider = user.providerData.find(provider => provider.providerId === 'google.com');
        if (!googleProvider) {
            console.log('User is not signed in with Google');
            return null;
        }

        // Get the Google OAuth access token
        const accessToken = await user.getIdTokenResult();
        if (!accessToken || !accessToken.token) {
            console.log('No access token available');
            return null;
        }

        console.log('Fetching Google profile picture...');
        
        // Make request to Google People API
        const response = await fetch('https://people.googleapis.com/v1/people/me?personFields=photos,names', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json'
            }
        });

        
       // const companyEmail = await getMainCompanyEmail();
      //  let currentImage = await getFirebaseData(`Companies/${companyEmail}/users/${user.email.replace('.', ',')}/profileImage`);
      //  console.log('currentImage', currentImage);
      //  if (currentImage) {
      //      return currentImage;
     //   }

        if (!response.ok) {
            console.log(`Google API response status: ${response.status}`);
            // If we can't access Google API, try to get the photo URL from the user's provider data
            if (googleProvider.photoURL) {
                console.log('Using photo URL from provider data:', googleProvider.photoURL);
                
                // Store profile picture URL in Firebase
                const companyEmail = await getMainCompanyEmail();
                if (companyEmail) {
                    const userEmail = user.email.replace('.', ',');
                    await saveFirebaseData(`Companies/${companyEmail}/users/${userEmail}/profileImage`, googleProvider.photoURL);
                }
                
                return googleProvider.photoURL;
            }
            return null;
        }

        const userData = await response.json();
        console.log('Google People API response:', userData);
        

     

        // Extract profile picture URL
        if (userData.photos && userData.photos.length > 0) {
            const profilePicUrl = userData.photos[0].url;
            console.log('Profile picture URL:', profilePicUrl);
            
            // Store profile picture URL in Firebase
           // const companyEmail = await getMainCompanyEmail();
            if (companyEmail) {
                const userEmail = user.email.replace('.', ',');
                await saveFirebaseData(`Companies/${companyEmail}/users/${userEmail}/profileImage`, profilePicUrl);
            }
            
            return profilePicUrl;
        } else {
            console.log('No profile picture found');
            return null;
        }
        
    } catch (error) {
        console.error('Error fetching Google profile picture:', error);
        
        // Fallback: try to get photo URL from provider data
        try {
            const user = auth.currentUser;
            if (user) {
                const googleProvider = user.providerData.find(provider => provider.providerId === 'google.com');
                if (googleProvider && googleProvider.photoURL) {
                    console.log('Using fallback photo URL from provider data:', googleProvider.photoURL);
                    
                    // Store profile picture URL in Firebase
                    const companyEmail = await getMainCompanyEmail();
                    if (companyEmail) {
                        const userEmail = user.email.replace('.', ',');
                        await saveFirebaseData(`Companies/${companyEmail}/users/${userEmail}/profileImage`, googleProvider.photoURL);
                    }
                    
                    return googleProvider.photoURL;
                }
            }
        } catch (fallbackError) {
            console.error('Fallback error:', fallbackError);
        }
        
        return null;
    }
}