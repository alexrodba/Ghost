/* eslint-disable */
const labsService = require('../../../shared/labs');
const DomainEvents = require('@tryghost/domain-events');
const events = require('../../lib/common/events');
const settingsCache = require('../../../shared/settings-cache');
const members = require('../members');
const logging = require('@tryghost/logging');
const {MemberLinkClickEvent} = require('@tryghost/member-events');
const JobManager = require('../jobs/job-service');
const path = require('path');
class MembersEventsServiceWrapper {
    init() {
        if (this.eventStorage) {
            return;
        }

        // Wire up all the dependencies
        const {EventStorage, LastSeenAtUpdater, LastSeenAtCache} = require('@tryghost/members-events-service');
        const models = require('../../models');

        this.eventStorage = new EventStorage({
            models: {
                MemberCreatedEvent: models.MemberCreatedEvent,
                SubscriptionCreatedEvent: models.SubscriptionCreatedEvent
            },
            labsService
        });

        const db = require('../../data/db');

        this.lastSeenAtCache = new LastSeenAtCache({
            services: {
                settingsCache
            }
        });

        this.lastSeenAtUpdater = new LastSeenAtUpdater({
            services: {
                settingsCache
            },
            getMembersApi() {
                return members.api;
            },
            db,
            events,
            lastSeenAtCache: this.lastSeenAtCache
        });

        // Subscribe to domain events
        this.eventStorage.subscribe(DomainEvents);
        this.lastSeenAtUpdater.subscribe(DomainEvents);
        
        this._subscribeToEvents();
    }

    _subscribeToEvents() {
        // this subscription is a core part of the service, so it feels awkward to have it hoisted to the wrapper such that it can be properly used by core
        //  with the current architecture it would probably make the most sense to have an intermediate event that the service emits that core subscribes to
        //  for now, the pattern of having core handle all job queue submissions is the what we want
        DomainEvents.subscribe(MemberLinkClickEvent, async (event) => {
            try {
                JobManager.addQueuedJob({
                    name: `update-member-last-seen-at-${event.data.memberId}`,
                    metadata: {
                        job: path.resolve(__dirname, path.join('jobs', 'update-member-last-seen-at')),
                        name: 'update-member-last-seen-at',
                        data: {
                            memberId: event.data.memberId,
                            memberLastSeenAt: event.data.memberLastSeenAt,
                            timestamp: event.timestamp
                        }
                    }
                });
            } catch (err) {
                logging.error(`Error in LastSeenAtUpdater.MemberLinkClickEvent listener for member ${event.data.memberId}`);
                logging.error(err);
            }
        });
    }

    // Clear the last seen at cache
    // Utility used for testing purposes
    clearLastSeenAtCache() {
        if (this.lastSeenAtCache) {
            this.lastSeenAtCache.clear();
        }
    }
}

module.exports = new MembersEventsServiceWrapper();
