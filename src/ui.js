import { AppState, getUserById } from './data.js';
import { canPerform, getPermissionMatrix, ROLES } from './permissions.js';

const ROLE_COLORS = {
    org_admin: "#e74c3c",
    instructor: "#2980b9",
    member: "#7f8c8d",
};

const ROLE_LABELS = {
    org_admin: "Org Admin",
    instructor: "Instructor",
    member: "Member",
};

function roleBadge(role) {
    return `<span class="role-badge" style="background:${ROLE_COLORS[role]}">${ROLE_LABELS[role]}</span>`;
}

function actionBtn(label, action, targetId, disabled) {
    if (disabled) {
        return `<button class="btn btn-sm btn-disabled" disabled title="No permission">🔒 ${label}</button>`;
    }
    return `<button class="btn btn-sm" data-action="${action}" data-target="${targetId}">${label}</button>`;
}

export function renderDashboard() {
    const org = AppState.organization;
    const roleCounts = {};
    for (const r of ROLES) roleCounts[r] = 0;
    for (const m of AppState.memberships) roleCounts[m.role]++;

    return `
        <div class="org-title-row">
            <svg class="org-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#27ae60" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M9 3v18M3 9h18"/>
            </svg>
            <h2>${org.name}</h2>
        </div>

        <div class="stats-row">
            <div class="stat-card">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#27ae60" stroke-width="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <div class="stat-number">${AppState.memberships.length}</div>
                <div class="stat-label">Total Members</div>
            </div>
            <div class="stat-card">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#27ae60" stroke-width="1.5">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <div class="stat-number">${AppState.groups.length}</div>
                <div class="stat-label">Groups</div>
            </div>
            <div class="stat-card">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#27ae60" stroke-width="1.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <div class="stat-number">${roleCounts.org_admin}</div>
                <div class="stat-label">Org Admins</div>
            </div>
            <div class="stat-card">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#27ae60" stroke-width="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                <div class="stat-number">${roleCounts.instructor}</div>
                <div class="stat-label">Instructors</div>
            </div>
        </div>
    `;
}

export function renderMembers(currentRole, currentUserId) {
    const rows = AppState.memberships.map(m => {
        const user = getUserById(m.userId);
        const isSelf = m.userId === currentUserId;

        const canRemove = !isSelf && canPerform("removeMember", currentRole, { targetRole: m.role }).allowed;
        const canChange = !isSelf && canPerform("changeRole", currentRole, { targetRole: m.role }).allowed;

        const roleOptions = ROLES
            .filter(r => r !== m.role)
            .map(r => `<option value="${r}">${ROLE_LABELS[r]}</option>`)
            .join("");

        const changeRoleHtml = canChange
            ? `<select class="role-select" data-action="changeRole" data-target="${m.userId}">
                <option value="" disabled selected>Change role</option>
                ${roleOptions}
              </select>`
            : "";

        return `
            <tr class="${isSelf ? 'current-user-row' : ''}">
                <td><strong>${user.name}</strong>${isSelf ? ' (you)' : ''}</td>
                <td>${user.email}</td>
                <td>${roleBadge(m.role)}</td>
                <td class="actions-cell">
                    ${changeRoleHtml}
                    ${isSelf ? '' : actionBtn("Remove", "removeMember", m.userId, !canRemove)}
                </td>
            </tr>
        `;
    }).join("");

    return `
        <div class="card">
            <div class="card-header">
                <h2>Members</h2>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

export function renderGroups(currentRole) {
    const canCreate = canPerform("createGroup", currentRole).allowed;

    const instructorOptions = AppState.memberships
        .filter(m => m.role === "instructor" || m.role === "org_admin")
        .map(m => {
            const u = getUserById(m.userId);
            return `<option value="${m.userId}">${u.name} (${ROLE_LABELS[m.role]})</option>`;
        })
        .join("");

    const groupCards = AppState.groups.map(g => {
        const instructor = g.mentorId ? getUserById(g.mentorId) : null;
        const members = g.memberIds.map(id => getUserById(id)).filter(Boolean);

        const canDelete = canPerform("deleteGroup", currentRole).allowed;

        return `
            <div class="group-card">
                <div class="group-header">
                    <h3>${g.name}</h3>
                    <div>
                        ${actionBtn("Delete", "deleteGroup", g.id, !canDelete)}
                    </div>
                </div>
                <p>Instructor: ${instructor ? `<strong>${instructor.name}</strong>` : '<em>None</em>'}</p>
                <p>Members: ${members.length > 0 ? members.map(m => m.name).join(", ") : '<em>None</em>'}</p>
            </div>
        `;
    }).join("");

    const createForm = canCreate ? `
        <div class="card create-form">
            <h3>Create New Group</h3>
            <div class="form-row">
                <input type="text" id="new-group-name" placeholder="Group name" class="input" />
                <select id="new-group-mentor" class="input">${instructorOptions}</select>
                <button class="btn" data-action="createGroup">Create</button>
            </div>
        </div>
    ` : "";

    return `
        <div class="card">
            <div class="card-header">
                <h2>Groups</h2>
            </div>
            ${groupCards.length > 0 ? groupCards : '<p class="empty">No groups yet</p>'}
        </div>
        ${createForm}
    `;
}

export function renderPermissionMatrix(currentRole) {
    const matrix = getPermissionMatrix();

    const headerCells = ROLES.map(r =>
        `<th class="${r === currentRole ? 'highlight-col' : ''}">${roleBadge(r)}</th>`
    ).join("");

    const rows = matrix.map(row => {
        const cells = ROLES.map(r => {
            const result = row[r];
            const cls = r === currentRole ? 'highlight-col' : '';
            return `<td class="${cls}" title="${result.reason}">
                ${result.allowed
                    ? '<span class="perm-yes">&#10003;</span>'
                    : '<span class="perm-no">&#10007;</span>'}
            </td>`;
        }).join("");

        return `<tr><td class="action-name">${row.action}</td>${cells}</tr>`;
    }).join("");

    return `
        <div class="card">
            <h2>Permission Matrix</h2>
            <p class="hint">Hover over cells to see the permission rule. Your current role column is highlighted.</p>
            <table class="data-table matrix-table">
                <thead>
                    <tr>
                        <th>Action</th>
                        ${headerCells}
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

export function showToast(message, type) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast toast-${type} toast-show`;
    setTimeout(() => {
        toast.className = "toast";
    }, 2000);
}
