export const AppState = {
    // starts empty — user must create an organization first
    organization: null,

    users: [
        { id: 1, name: "Dr. Sarah Chen", email: "sarah@stanford.edu" },
        { id: 2, name: "Prof. James Miller", email: "james@stanford.edu" },
        { id: 3, name: "Prof. Lisa Wang", email: "lisa@stanford.edu" },
        { id: 4, name: "Alice Johnson", email: "alice@stanford.edu" },
    ],

    // memberships start empty — populated when org is created
    memberships: [],
    groups: [],

    currentUserId: 1,
    _nextGroupId: 1,
};

export function getCurrentUser() {
    return AppState.users.find(u => u.id === AppState.currentUserId);
}

export function getCurrentRole() {
    const m = AppState.memberships.find(m => m.userId === AppState.currentUserId);
    return m ? m.role : null;
}

export function getUserRole(userId) {
    const m = AppState.memberships.find(m => m.userId === userId);
    return m ? m.role : null;
}

export function getUserById(id) {
    return AppState.users.find(u => u.id === id);
}

// --- Create Organization ---
// Any logged-in user can create an org. The creator becomes org_admin.
export function createOrganization(name) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "");
    AppState.organization = { name, slug };

    // creator automatically gets org_admin role
    AppState.memberships = [
        { userId: AppState.currentUserId, role: "org_admin" },
    ];

    AppState.groups = [];
    AppState._nextGroupId = 1;

    return AppState.organization;
}

// --- Load demo with prefilled Stanford data ---
export function loadDemoData() {
    AppState.organization = {
        name: "Stanford University",
        slug: "stanford-circuits",
    };

    AppState.memberships = [
        { userId: 1, role: "org_admin" },
        { userId: 2, role: "instructor" },
        { userId: 3, role: "instructor" },
        { userId: 4, role: "member" },
    ];

    AppState.groups = [
        { id: 1, name: "EE 101 — Intro to Digital Logic", mentorId: 2, memberIds: [4] },
        { id: 2, name: "EE 271 — Advanced Circuit Design", mentorId: 3, memberIds: [4] },
    ];

    AppState._nextGroupId = 3;
    AppState.currentUserId = 1;
}

// --- Delete Organization ---
export function deleteOrganization() {
    AppState.organization = null;
    AppState.memberships = [];
    AppState.groups = [];
}

// --- Group operations ---
export function addGroup(name, mentorId) {
    const group = {
        id: AppState._nextGroupId++,
        name,
        mentorId: Number(mentorId),
        memberIds: [],
    };
    AppState.groups.push(group);
    return group;
}

export function removeGroup(groupId) {
    AppState.groups = AppState.groups.filter(g => g.id !== groupId);
}

// --- Member operations ---
export function addMember(userId, role) {
    // don't add duplicates
    if (AppState.memberships.find(m => m.userId === userId)) return false;
    AppState.memberships.push({ userId, role });
    return true;
}

export function removeMember(userId) {
    AppState.memberships = AppState.memberships.filter(m => m.userId !== userId);
    for (const group of AppState.groups) {
        group.memberIds = group.memberIds.filter(id => id !== userId);
        if (group.mentorId === userId) group.mentorId = null;
    }
}

export function changeRole(userId, newRole) {
    const m = AppState.memberships.find(m => m.userId === userId);
    if (m) m.role = newRole;
}
