import {
    AppState, getCurrentUser, getCurrentRole,
    createOrganization, deleteOrganization, loadDemoData,
    addGroup, removeGroup, addMember, removeMember, changeRole
} from './data.js';
import { canPerform } from './permissions.js';
import {
    renderCreateOrg, renderDashboard, renderMembers,
    renderGroups, renderPermissionMatrix, showToast
} from './ui.js';

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
const tabsNav = document.querySelector(".tabs");
const tabs = document.querySelectorAll(".tab-btn");

let currentTab = "dashboard";

function render() {
    const user = getCurrentUser();
    const role = getCurrentRole();
    const hasOrg = AppState.organization !== null;

    // update role badge in header
    const roleEl = document.getElementById("current-role");
    if (role) {
        roleEl.textContent = ROLE_LABELS[role];
        roleEl.style.background = ROLE_COLORS[role];
    } else {
        roleEl.textContent = hasOrg ? "Not a member" : "No Org";
        roleEl.style.background = "#95a5a6";
    }

    // hide tabs when there's no org
    tabsNav.style.display = hasOrg ? "flex" : "none";

    if (!hasOrg) {
        // no organization exists — show create form
        content.innerHTML = renderCreateOrg();
        return;
    }

    if (!role) {
        // org exists but current user is not a member
        content.innerHTML = `
            <div class="card" style="max-width:500px; margin:40px auto; text-align:center;">
                <h2>Access Denied</h2>
                <p style="color:#666; margin-top:8px;">
                    You are not a member of <strong>${AppState.organization.name}</strong>.
                    <br>Ask an Org Admin to invite you.
                </p>
            </div>`;
        return;
    }

    // normal org view
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

    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === currentTab));
}

// --- User switcher ---
userSwitcher.addEventListener("change", (e) => {
    AppState.currentUserId = Number(e.target.value);
    currentTab = "dashboard";
    render();
});

// --- Tab clicks ---
tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        currentTab = tab.dataset.tab;
        render();
    });
});

// --- All button/form actions ---
content.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const targetId = btn.dataset.target;
    const role = getCurrentRole();
    const user = getCurrentUser();

    // --- Create Organization ---
    if (action === "createOrganization") {
        const name = document.getElementById("org-name").value.trim();

        if (!name) {
            showToast("Organization name is required", "denied");
            return;
        }

        createOrganization(name);
        showToast(`Organization "${name}" created! You are now Org Admin.`, "allowed");
        currentTab = "dashboard";
        render();
        return;
    }

    // --- Load Stanford Demo ---
    if (action === "loadDemo") {
        loadDemoData();
        userSwitcher.value = "1";
        showToast("Stanford demo loaded — you are Org Admin", "allowed");
        currentTab = "dashboard";
        render();
        return;
    }

    // --- Delete Organization ---
    if (action === "deleteOrganization") {
        const check = canPerform("deleteOrganization", role);
        if (!check.allowed) {
            showToast(check.reason, "denied");
            return;
        }
        const orgName = AppState.organization.name;
        deleteOrganization();
        showToast(`Organization "${orgName}" deleted`, "allowed");
        render();
        return;
    }

    // --- Invite Member ---
    if (action === "inviteMember") {
        const check = canPerform("inviteMember", role);
        if (!check.allowed) {
            showToast(check.reason, "denied");
            return;
        }
        const userId = Number(document.getElementById("invite-user").value);
        const inviteRole = document.getElementById("invite-role").value;
        const invitedUser = AppState.users.find(u => u.id === userId);

        if (addMember(userId, inviteRole)) {
            showToast(`${invitedUser.name} added as ${ROLE_LABELS[inviteRole]}`, "allowed");
        } else {
            showToast("User is already a member", "denied");
        }
        render();
        return;
    }

    // --- Create Group ---
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

    // --- Delete Group ---
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

    // --- Remove Member ---
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

    // --- Generic action feedback ---
    const check = canPerform(action, role, {
        actorId: user.id,
        groupMentorId: targetId ? Number(targetId) : null,
    });
    showToast(check.reason, check.allowed ? "allowed" : "denied");
});

// --- Role change via dropdown ---
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

// --- Start the app ---
render();
