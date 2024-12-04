/* eslint-disable */
const LinkClickRepository = require('./LinkClickRepository');
const PostLinkRepository = require('./PostLinkRepository');
const errors = require('@tryghost/errors');
const urlUtils = require('../../../shared/url-utils');
const JobManager = require('../../services/jobs/job-service');
const DomainEvents = require('@tryghost/domain-events');
const {RedirectEvent} = require('@tryghost/link-redirects');
const logging = require('@tryghost/logging');
const path = require('path');
class LinkTrackingServiceWrapper {
    async init() {
        console.log(`LinkTrackingServiceWrapper init`);
        if (this.service) {
            // Already done
            console.log(`>>LinkTrackingServiceWrapper already done`);
            return;
        }

        const linkRedirection = require('../link-redirection');
        if (!linkRedirection.service) {
            throw new errors.InternalServerError({message: 'LinkRedirectionService should be initialised before LinkTrackingService'});
        }

        // Wire up all the dependencies
        const models = require('../../models');
        const {MemberLinkClickEvent} = require('@tryghost/member-events');
        const {LinkClickTrackingService} = require('@tryghost/link-tracking');

        const postLinkRepository = new PostLinkRepository({
            LinkRedirect: models.Redirect,
            linkRedirectRepository: linkRedirection.linkRedirectRepository
        });

        this.linkClickRepository = new LinkClickRepository({
            MemberLinkClickEventModel: models.MemberClickEvent,
            Member: models.Member,
            MemberLinkClickEvent: MemberLinkClickEvent,
            DomainEvents
        });

        // Expose the service
        this.service = new LinkClickTrackingService({
            linkRedirectService: linkRedirection.service,
            linkClickRepository: this.linkClickRepository,
            postLinkRepository,
            DomainEvents,
            urlUtils
        });
        await this.service.init();
        
        this._subscribeToEvents();
    }

    _subscribeToEvents() {
        DomainEvents.subscribe(RedirectEvent, async (event) => {
            console.log(`RedirectEvent: ${event.data.url.searchParams.get('m')} ${event.data.link.link_id}`);
            const uuid = event.data.url.searchParams.get('m');
            if (!uuid) {
                return;
            }

            const linkId = event.data.link.link_id;

            try {
                JobManager.addQueuedJob({
                    name: `link-click-${uuid}-${linkId}`,
                    metadata: {
                        job: path.resolve(__dirname, path.join('jobs', 'create-member-link-click-event')),
                        name: 'create-member-link-click-event',
                        data: {
                            memberUuid: uuid,
                            linkId: linkId
                        }
                    }
                });
            } catch (error) {
                logging.error(`Failed to add queued job for link click ${uuid}:`, error);
            }
        });
    }
}

module.exports = new LinkTrackingServiceWrapper();
