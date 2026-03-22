export const AppState = {
    organization: {
        name: "Stanford University",
        slug: "stanford-circuits",
        description: "Stanford EE department — digital circuit design courses on CircuitVerse",
        visibility: "private",
        ssoEnabled: false,
    },

    users: [
        { id: 1, name: "Dr. Sarah Chen", email: "orgadmin@stanford.edu" },
        { id: 2, name: "Prof. James Miller", email: "instructor1@stanford.edu" },
        { id: 3, name: "Prof. Lisa Wang", email: "instructor2@stanford.edu" },
        { id: 4, name: "Alice Johnson", email: "student@stanford.edu" },
    ],

    memberships: [
        { userId: 1, role: "org_admin" },
        { userId: 2, role: "instructor" },
        { userId: 3, role: "instructor" },
        { userId: 4, role: "member" },
    ],

    groups: [
        { id: 1, name: "EE 101 — Intro to Digital Logic", mentorId: 2, memberIds: [4] },
        { id: 2, name: "EE 271 — Advanced Circuit Design", mentorId: 3, memberIds: [4] },
    ],

    currentUserId: 1,
    _nextGroupId: 3,
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

export function removeMember(userId) {
    AppState.memberships = AppState.memberships.filter(m => m.userId !== userId);
    for (const group of AppState.groups) {
        group.memberIds = group.memberIds.filter(id => id !== userId);
        if (group.mentorId === userId) {
            group.mentorId = null;
        }
    }
}

export function changeRole(userId, newRole) {
    const m = AppState.memberships.find(m => m.userId === userId);
    if (m) m.role = newRole;
}
