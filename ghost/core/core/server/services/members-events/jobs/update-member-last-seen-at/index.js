const MembersEventsService = require('../../');
MembersEventsService.init(); // attempt to init in case it hasn't already been initialized
const lastSeenAtUpdater = MembersEventsService.lastSeenAtUpdater;

module.exports = async function updateMemberLastSeenAt({memberId, memberLastSeenAt, timestamp}) {
    await lastSeenAtUpdater.cachedUpdateLastSeenAt(memberId, memberLastSeenAt, timestamp);
};