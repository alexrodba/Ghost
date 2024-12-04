const linkRedirectionService = require('../../../link-redirection');
linkRedirectionService.init();
const linkClickTrackingService = require('../../').service;
linkClickTrackingService.init();

module.exports = async function createMemberLinkClickEvent({memberUuid, linkId}) {
    console.log(`createMemberLinkClickEvent: ${memberUuid} ${linkId}`);
    await linkClickTrackingService.createMemberLinkClickEvent(memberUuid, linkId);
};