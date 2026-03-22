export const ROLES = ["org_admin", "instructor", "member"];

export const ROLE_LEVELS = {
    org_admin: 2,
    instructor: 1,
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
        allowed: role === "org_admin",
        reason: role === "org_admin"
            ? "Org admins can invite members"
            : "Only org admins can invite members",
    }),

    removeMember: (role, ctx) => {
        if (role !== "org_admin") {
            return { allowed: false, reason: "Only org admins can remove members" };
        }
        if (ctx && ctx.targetRole) {
            if (ROLE_LEVELS[ctx.targetRole] >= ROLE_LEVELS[role]) {
                return { allowed: false, reason: "Cannot remove a member with equal or higher role" };
            }
        }
        return { allowed: true, reason: "You can remove this member" };
    },

    changeRole: (role, ctx) => {
        if (role !== "org_admin") {
            return { allowed: false, reason: "Only org admins can change roles" };
        }
        if (ctx && ctx.targetRole) {
            if (ROLE_LEVELS[ctx.targetRole] >= ROLE_LEVELS[role]) {
                return { allowed: false, reason: "Cannot change role of a member with equal or higher role" };
            }
        }
        return { allowed: true, reason: "You can change this member's role" };
    },

    createGroup: (role) => ({
        allowed: ROLE_LEVELS[role] >= ROLE_LEVELS.instructor,
        reason: ROLE_LEVELS[role] >= ROLE_LEVELS.instructor
            ? "Instructors and org admins can create groups"
            : "Only instructors and org admins can create groups",
    }),

    editGroup: (role, ctx) => {
        if (role === "org_admin") {
            return { allowed: true, reason: "Org admins can edit any group" };
        }
        if (role === "instructor" && ctx && ctx.groupMentorId === ctx.actorId) {
            return { allowed: true, reason: "You can edit your own group" };
        }
        return { allowed: false, reason: "You can only edit groups you teach" };
    },

    deleteGroup: (role) => ({
        allowed: role === "org_admin",
        reason: role === "org_admin"
            ? "Org admins can delete groups"
            : "Only org admins can delete groups",
    }),

    viewSettings: (role) => ({
        allowed: role === "org_admin",
        reason: role === "org_admin"
            ? "Org admins can view settings"
            : "Only org admins can view settings",
    }),

    editSettings: (role) => ({
        allowed: role === "org_admin",
        reason: role === "org_admin"
            ? "Org admins can edit organization settings"
            : "Only org admins can edit settings",
    }),

    manageSso: (role) => ({
        allowed: role === "org_admin",
        reason: role === "org_admin"
            ? "Org admins can manage SSO configuration"
            : "Only org admins can manage SSO",
    }),

    deleteOrganization: (role) => ({
        allowed: role === "org_admin",
        reason: role === "org_admin"
            ? "Org admins can delete the organization"
            : "Only org admins can delete the organization",
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
