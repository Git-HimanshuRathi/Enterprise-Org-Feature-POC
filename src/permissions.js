export const ROLES = ["owner", "admin", "mentor", "member"];

export const ROLE_LEVELS = {
    owner: 3,
    admin: 2,
    mentor: 1,
    member: 0,
};

export const ACTIONS = [
    { key: "viewDashboard", label: "View Dashboard" },
    { key: "viewMembers", label: "View Members" },
    { key: "inviteMember", label: "Invite Member" },
    { key: "removeMember", label: "Remove Member" },
    { key: "changeRole", label: "Change Role" },
    { key: "createGroup", label: "Create Group" },
    { key: "editGroup", label: "Edit Group" },
    { key: "deleteGroup", label: "Delete Group" },
    { key: "viewSettings", label: "View Settings" },
    { key: "editSettings", label: "Edit Settings" },
    { key: "manageSso", label: "Manage SSO" },
    { key: "transferOwnership", label: "Transfer Ownership" },
    { key: "deleteOrganization", label: "Delete Organization" },
];

const rules = {
    viewDashboard: (role) => ({
        allowed: true,
        reason: "All members can view the dashboard",
    }),

    viewMembers: (role) => ({
        allowed: true,
        reason: "All members can view the member list",
    }),

    inviteMember: (role) => ({
        allowed: ROLE_LEVELS[role] >= ROLE_LEVELS.admin,
        reason: ROLE_LEVELS[role] >= ROLE_LEVELS.admin
            ? "Admins and above can invite members"
            : "Only admins and above can invite members",
    }),

    removeMember: (role, ctx) => {
        if (ROLE_LEVELS[role] < ROLE_LEVELS.admin) {
            return { allowed: false, reason: "Only admins and above can remove members" };
        }
        if (ctx && ctx.targetRole) {
            if (ROLE_LEVELS[ctx.targetRole] >= ROLE_LEVELS[role]) {
                return { allowed: false, reason: "Cannot remove a member with equal or higher role" };
            }
        }
        return { allowed: true, reason: "You can remove this member" };
    },

    changeRole: (role, ctx) => {
        if (ROLE_LEVELS[role] < ROLE_LEVELS.admin) {
            return { allowed: false, reason: "Only admins and above can change roles" };
        }
        if (ctx && ctx.targetRole) {
            if (ROLE_LEVELS[ctx.targetRole] >= ROLE_LEVELS[role]) {
                return { allowed: false, reason: "Cannot change role of a member with equal or higher role" };
            }
        }
        if (ctx && ctx.newRole === "owner" && role !== "owner") {
            return { allowed: false, reason: "Only the owner can promote someone to owner" };
        }
        return { allowed: true, reason: "You can change this member's role" };
    },

    createGroup: (role) => ({
        allowed: ROLE_LEVELS[role] >= ROLE_LEVELS.mentor,
        reason: ROLE_LEVELS[role] >= ROLE_LEVELS.mentor
            ? "Mentors and above can create groups"
            : "Only mentors and above can create groups",
    }),

    editGroup: (role, ctx) => {
        if (ROLE_LEVELS[role] >= ROLE_LEVELS.admin) {
            return { allowed: true, reason: "Admins and above can edit any group" };
        }
        if (role === "mentor" && ctx && ctx.groupMentorId === ctx.actorId) {
            return { allowed: true, reason: "You can edit your own group" };
        }
        return { allowed: false, reason: "You can only edit groups you mentor" };
    },

    deleteGroup: (role) => ({
        allowed: ROLE_LEVELS[role] >= ROLE_LEVELS.admin,
        reason: ROLE_LEVELS[role] >= ROLE_LEVELS.admin
            ? "Admins and above can delete groups"
            : "Only admins and above can delete groups",
    }),

    viewSettings: (role) => ({
        allowed: ROLE_LEVELS[role] >= ROLE_LEVELS.admin,
        reason: ROLE_LEVELS[role] >= ROLE_LEVELS.admin
            ? "Admins and above can view settings"
            : "Only admins and above can view settings",
    }),

    editSettings: (role) => ({
        allowed: role === "owner",
        reason: role === "owner"
            ? "Owner can edit organization settings"
            : "Only the owner can edit settings",
    }),

    manageSso: (role) => ({
        allowed: role === "owner",
        reason: role === "owner"
            ? "Owner can manage SSO configuration"
            : "Only the owner can manage SSO",
    }),

    transferOwnership: (role) => ({
        allowed: role === "owner",
        reason: role === "owner"
            ? "Owner can transfer ownership"
            : "Only the owner can transfer ownership",
    }),

    deleteOrganization: (role) => ({
        allowed: role === "owner",
        reason: role === "owner"
            ? "Owner can delete the organization"
            : "Only the owner can delete the organization",
    }),
};

export function canPerform(action, role, context) {
    const rule = rules[action];
    if (!rule) return { allowed: false, reason: "Unknown action" };
    return rule(role, context);
}

export function getPermissionMatrix() {
    const matrix = [];
    for (const action of ACTIONS) {
        const row = { action: action.label };
        for (const role of ROLES) {
            row[role] = canPerform(action.key, role);
        }
        matrix.push(row);
    }
    return matrix;
}
