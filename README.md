# Enterprise Organization Features — PoC

A small standalone proof-of-concept showing how organization management and role-based access control (RBAC) would work in CircuitVerse.

Built as part of my GSoC 2026 proposal for the **Enterprise & Institutional Organization Features** project.

## What this PoC does

- Shows an organization dashboard with member/group stats (modeled after Stanford University)
- 4 roles: **Owner**, **Admin**, **Mentor**, **Member** — each with different permissions
- Switch between users to see how the UI changes based on role
- Change roles, remove members, create/delete groups — all permission-checked
- Full permission matrix showing what each role can and cannot do

## What this PoC does NOT do

- No backend / no database — everything is in-memory JS
- No SSO/SAML integration — that's a backend feature
- No real authentication — just a user switcher dropdown
- No circuit sharing or assignment features

## Files

```
index.html          — UI shell + CSS
src/data.js         — data model (Organization, Users, Memberships, Groups)
src/permissions.js  — RBAC engine (13 actions, 4 roles, contextual checks)
src/ui.js           — rendering functions for each tab
src/main.js         — wires everything together
```
