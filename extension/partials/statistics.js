import { callGetItem, callSetItem } from "../frames.js";

// Statistics management module
export class StatisticsManager {
    constructor() {
        this.stats = {
            todayAnnotations: 0,
            totalLabels: 0,
            totalCodes: 0,
            lastAnnotation: null
        };
        this.initializeEventListeners();
        // Initial load of statistics
        this.updateStatsFromHistory();
    }

    initializeEventListeners() {
        // Listen for any annotation updates
        document.addEventListener('annotationUpdated', () => {
            this.updateStatsFromHistory();
        });

        // Listen for user login/logout
        document.addEventListener('userLoggedIn', async (event) => {
            if (event.detail && event.detail.isNewUser) {
                // await this.migrateGuestData(event.detail.userEmail);
            }
            this.updateStatsFromHistory();
        });

        document.addEventListener('userLoggedOut', () => {
            this.updateStatsFromHistory(); // Update instead of reset for anonymous mode
        });

        // Add storage event listener for cross-tab synchronization
        window.addEventListener('storage', (e) => {
            if (e.key === 'annotationHistory') {
                this.updateStatsFromHistory();
            }
        });
    }

    // async migrateGuestData(userEmail) {
    //     try {
    //         // Get all temporary data from localStorage
    //         const tempData = {
    //             annotationHistory: await callGetItem('annotationHistory'),
    //             voiceSavedNotes: await callGetItem('voiceSavedNotes'),
    //             videoSavedNotes: await callGetItem('videoSavedNotes'),
    //             savedNotes: await callGetItem('savedNotes')
    //         };

    //         // If there's any temporary data
    //         if (Object.values(tempData).some(data => data !== null)) {
    //             // Send data to background script to save to Firebase
    //             chrome.runtime.sendMessage({
    //                 action: 'migrateGuestData',
    //                 userEmail: userEmail,
    //                 tempData: tempData
    //             }, (response) => {
    //                 if (response.success) {
    //                     console.log('Guest data migrated successfully');
    //                     // Clear temporary data after successful migration
    //                     Object.keys(tempData).forEach(key => {
    //                         localStorage.removeItem(key);
    //                     });
    //                 } else {
    //                     console.error('Failed to migrate guest data:', response.error);
    //                 }
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Error migrating guest data:', error);
    //     }
    // }

    async updateStatsFromHistory() {
        try {
            let annotationHistory = Object.values(await callGetItem('annotationHistory') || []);
            if(annotationHistory.length > 0)
                annotationHistory = JSON.parse(annotationHistory[0]);

            const history = annotationHistory ? annotationHistory : [];

            const now = new Date();
            const today = now.toDateString();

            let todayCount = 0;
            let totalLabelsCount = 0;
            let totalCodesCount = 0;
            let lastAnnotationTime = null;

            if (Array.isArray(history)) {
                history.forEach(annotationGroup => {
                    const typeObj = annotationGroup.find(item => item.type);
                    const optionsObj = annotationGroup.find(item => item.options);
                    const timestampObj = annotationGroup.find(item => item.timestamp);

                    if (typeObj && optionsObj) {
                        const annotationType = typeObj.type.toLowerCase();
                        const options = Array.isArray(optionsObj.options) ? optionsObj.options : [optionsObj.options];
                        const timestamp = timestampObj ? new Date(timestampObj.timestamp) : new Date();

                        // Count today's annotations
                        if (timestamp.toDateString() === today) {
                            todayCount += options.length;
                        }

                        // Count by type
                        if (annotationType === 'label') {
                            totalLabelsCount += options.length;
                        } else if (annotationType === 'code') {
                            totalCodesCount += options.length;
                        }

                        // Track last annotation time
                        if (!lastAnnotationTime || timestamp > lastAnnotationTime) {
                            lastAnnotationTime = timestamp;
                        }
                    }
                });
            }

            this.stats = {
                todayAnnotations: todayCount,
                totalLabels: totalLabelsCount,
                totalCodes: totalCodesCount,
                lastAnnotation: lastAnnotationTime
            };

            this.updateDisplay();
        } catch (error) {
            console.error('Error updating statistics:', error);
            this.resetStats();
        }
    }

    formatTimeSince(date) {
        if (!date) return 'Never';

        const now = new Date();
        const diff = Math.floor((now - date) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    updateDisplay() {
        const elements = {
            'today-annotations': this.stats.todayAnnotations,
            'total-labels': this.stats.totalLabels,
            'total-codes': this.stats.totalCodes,
            'last-annotation': this.formatTimeSince(this.stats.lastAnnotation)
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    resetStats() {
        this.stats = {
            todayAnnotations: 0,
            totalLabels: 0,
            totalCodes: 0,
            lastAnnotation: null
        };
        this.updateDisplay();
    }
}

// Create and export a single instance
export const statisticsManager = new StatisticsManager(); 