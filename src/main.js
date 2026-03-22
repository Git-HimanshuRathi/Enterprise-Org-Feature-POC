import { AppState, getCurrentUser, getCurrentRole, addGroup, removeGroup, removeMember, changeRole } from './data.js';
import { canPerform } from './permissions.js';
import { renderDashboard, renderMembers, renderGroups, renderPermissionMatrix, showToast } from './ui.js';

const ROLE_LABELS = {
    org_admin: "Org Admin",
    instructor: "Instructor",
    member: "Member",
};

const ROLE_COLORS = {
    org_admin: "#e74c3c",
    instructor: "#2980b9",
    member: "#7f8c8d",
};

const content = document.getElementById("content");
const userSwitcher = document.getElementById("user-switcher");
const tabs = document.querySelectorAll(".tab-btn");

let currentTab = "dashboard";

function render() {
    const role = getCurrentRole();
    const user = getCurrentUser();

    const roleEl = document.getElementById("current-role");
    roleEl.textContent = ROLE_LABELS[role];
    roleEl.style.background = ROLE_COLORS[role];

    switch (currentTab) {
        case "dashboard":
            content.innerHTML = renderDashboard();
            break;
        case "members":
            content.innerHTML = renderMembers(role, user.id);
            break;
        case "groups":
            content.innerHTML = renderGroups(role);
            break;
        case "permissions":
            content.innerHTML = renderPermissionMatrix(role);
            break;
    }

    tabs.forEach(t => {
        t.classList.toggle("active", t.dataset.tab === currentTab);
    });
}

userSwitcher.addEventListener("change", (e) => {
    AppState.currentUserId = Number(e.target.value);
    render();
});

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        currentTab = tab.dataset.tab;
        render();
    });
});

content.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const targetId = btn.dataset.target;
    const role = getCurrentRole();
    const user = getCurrentUser();

    if (action === "createGroup") {
        const nameInput = document.getElementById("new-group-name");
        const mentorSelect = document.getElementById("new-group-mentor");
        const name = nameInput.value.trim();

        if (!name) {
            showToast("Please enter a group name", "denied");
            return;
        }

        const check = canPerform("createGroup", role);
        if (!check.allowed) {
            showToast(check.reason, "denied");
            return;
        }

        addGroup(name, mentorSelect.value);
        showToast(`Group "${name}" created`, "allowed");
        render();
        return;
    }

    if (action === "deleteGroup") {
        const check = canPerform("deleteGroup", role);
        if (!check.allowed) {
            showToast(check.reason, "denied");
            return;
        }
        removeGroup(Number(targetId));
        showToast("Group deleted", "allowed");
        render();
        return;
    }

    if (action === "removeMember") {
        const targetUserId = Number(targetId);
        const targetRole = AppState.memberships.find(m => m.userId === targetUserId)?.role;
        const check = canPerform("removeMember", role, { targetRole });
        if (!check.allowed) {
            showToast(check.reason, "denied");
            return;
        }
        removeMember(targetUserId);
        showToast("Member removed", "allowed");
        render();
        return;
    }

    const check = canPerform(action, role, {
        actorId: user.id,
        groupMentorId: targetId ? Number(targetId) : null,
    });

    if (check.allowed) {
        showToast(`${action}: ${check.reason}`, "allowed");
    } else {
        showToast(check.reason, "denied");
    }
});

content.addEventListener("change", (e) => {
    const select = e.target.closest("[data-action='changeRole']");
    if (!select) return;

    const targetUserId = Number(select.dataset.target);
    const newRole = select.value;
    const role = getCurrentRole();
    const targetRole = AppState.memberships.find(m => m.userId === targetUserId)?.role;

    const check = canPerform("changeRole", role, { targetRole, newRole });
    if (!check.allowed) {
        showToast(check.reason, "denied");
        render();
        return;
    }

    changeRole(targetUserId, newRole);
    showToast(`Role changed to ${ROLE_LABELS[newRole]}`, "allowed");
    render();
});

render();
