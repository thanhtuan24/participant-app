import { PartiItem } from "@dts";

export interface ProcessedParticipant extends PartiItem {
    numberRegistered: number;
    timestamp: number;
}

/**
 * Processes a list of participants to find distinct users, count their registrations,
 * and sort them based on membership status, registration status, and timestamp.
 * 
 * @param listParticipant The raw list of participants from the API
 * @param today The target date (formatted string)
 * @returns Sorted list of processed participants
 */
export const processAndSortParticipants = (
    listParticipant: PartiItem[],
    today: string
): ProcessedParticipant[] => {
    const participantsMap = new Map<string, ProcessedParticipant>();

    // 1. Aggregate data: count registrations and get today's status/timestamp
    for (const p of listParticipant) {
        if (!participantsMap.has(p.userID)) {
            participantsMap.set(p.userID, {
                ...p,
                numberRegistered: 0,
                status: '',
                timestamp: Infinity,
            });
        }

        const userData = participantsMap.get(p.userID)!;

        // Increment registration count if they registered 'yes' on a different day
        if (p.status === 'yes' && p.participantDate !== today) {
            userData.numberRegistered += 1;
        }

        // Capture data for today's session
        if (p.participantDate === today) {
            userData.status = p.status;
            userData.timestamp = p.timestamp;
        }
    }

    // 2. Sort according to business rules
    return Array.from(participantsMap.values()).sort((a, b) => {
        const getPriority = (item: ProcessedParticipant) => {
            // Member with 'yes' status = Highest Priority (1)
            if (item.isMember && item.status === 'yes') return 1;
            // Member with 'no' status = Priority (2)
            if (item.isMember && item.status === 'no') return 2;
            // Non-member with 'yes' status = Priority (3)
            if (!item.isMember && item.status === 'yes') return 3;
            // Other members = Priority (4)
            if (item.isMember) return 4;
            // Others = Lowest Priority (5)
            return 5;
        };

        const priorityA = getPriority(a);
        const priorityB = getPriority(b);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // If same priority, sort by registration timestamp (first come first served)
        if (priorityA === 1 || priorityA === 3) {
            return a.timestamp - b.timestamp;
        }

        return 0;
    });
};
