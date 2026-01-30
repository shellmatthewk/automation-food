/**
 * Timer and reminder logic for scheduled orders
 */

const Scheduler = {
    intervalId: null,
    CHECK_INTERVAL: 30000, // 30 seconds
    snoozedSchedules: new Map(), // Map of scheduleId -> snooze end time

    /**
     * Initialize scheduler
     */
    init() {
        this.startPolling();
        this.setupVisibilityHandler();
        this.checkMissedReminders();
    },

    /**
     * Start the polling interval
     */
    startPolling() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.intervalId = setInterval(() => {
            this.checkSchedules();
        }, this.CHECK_INTERVAL);

        // Also check immediately
        this.checkSchedules();
    },

    /**
     * Stop the polling interval
     */
    stopPolling() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    /**
     * Check for due schedules
     */
    checkSchedules() {
        const dueSchedules = SchedulesModel.getDueSchedules();

        dueSchedules.forEach(schedule => {
            // Check if snoozed
            const snoozeEnd = this.snoozedSchedules.get(schedule.id);
            if (snoozeEnd && Date.now() < snoozeEnd) {
                return; // Still snoozed
            }

            this.snoozedSchedules.delete(schedule.id);
            this.triggerSchedule(schedule);
        });
    },

    /**
     * Check for missed reminders when tab becomes visible
     */
    checkMissedReminders() {
        const schedules = SchedulesModel.getAll();
        const now = Date.now();
        const missedWindow = 5 * 60 * 1000; // 5 minutes

        schedules.forEach(schedule => {
            if (!schedule.settings.enabled || !schedule.metadata.nextTriggerAt) {
                return;
            }

            const triggerTime = new Date(schedule.metadata.nextTriggerAt).getTime();
            const lastTriggered = schedule.metadata.lastTriggeredAt
                ? new Date(schedule.metadata.lastTriggeredAt).getTime()
                : 0;

            // If trigger time was in the past (but within missed window) and hasn't been triggered
            if (triggerTime < now && triggerTime > now - missedWindow && lastTriggered < triggerTime) {
                this.triggerSchedule(schedule, true);
            }
        });
    },

    /**
     * Setup visibility API handler
     */
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkMissedReminders();
                this.checkSchedules();
            }
        });
    },

    /**
     * Trigger a schedule (show notification)
     * @param {object} schedule - Schedule to trigger
     * @param {boolean} missed - Whether this is a missed reminder
     */
    triggerSchedule(schedule, missed = false) {
        const favorite = FavoritesModel.getById(schedule.favoriteId);
        if (!favorite) {
            console.warn('Favorite not found for schedule:', schedule.id);
            return;
        }

        // Mark as triggered
        SchedulesModel.markTriggered(schedule.id);

        // Show browser notification
        this.showBrowserNotification(schedule, favorite, missed);

        // Show in-app banner
        UI.showNotificationBanner(schedule, favorite);

        // Auto-open if enabled
        if (schedule.settings.autoOpen) {
            DoorDash.triggerOrder(favorite);
        }

        // Refresh UI
        UI.renderSchedules();
    },

    /**
     * Show browser notification
     * @param {object} schedule - Schedule data
     * @param {object} favorite - Favorite data
     * @param {boolean} missed - Whether this is a missed reminder
     */
    showBrowserNotification(schedule, favorite, missed = false) {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        const title = missed ? 'Missed Reminder' : 'Time to Order!';
        const body = `${schedule.name}\n${favorite.name} from ${favorite.restaurant.name}`;

        const notification = new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: schedule.id,
            requireInteraction: true
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    },

    /**
     * Request notification permission
     * @returns {Promise<string>} Permission status
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            return 'not-supported';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission === 'denied') {
            return 'denied';
        }

        const permission = await Notification.requestPermission();
        return permission;
    },

    /**
     * Snooze a schedule
     * @param {string} scheduleId - Schedule ID
     * @param {number} minutes - Minutes to snooze
     */
    snooze(scheduleId, minutes = 5) {
        const snoozeEnd = Date.now() + (minutes * 60 * 1000);
        this.snoozedSchedules.set(scheduleId, snoozeEnd);
        UI.hideNotificationBanner();
        UI.showToast(`Snoozed for ${minutes} minutes`, 'info');
    },

    /**
     * Manually trigger a schedule (from UI)
     * @param {string} scheduleId - Schedule ID
     */
    manualTrigger(scheduleId) {
        const schedule = SchedulesModel.getById(scheduleId);
        if (!schedule) {
            UI.showToast('Schedule not found', 'error');
            return;
        }

        const favorite = FavoritesModel.getById(schedule.favoriteId);
        if (!favorite) {
            UI.showToast('Favorite not found', 'error');
            return;
        }

        // Trigger the order
        DoorDash.triggerOrder(favorite);
    }
};
