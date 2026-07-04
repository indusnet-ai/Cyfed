# Administrator Guide: Security and SSO Preparation

This guide documents authentication mapping, SSL configurations, and Role-Based Access Control (RBAC) schemas.

---

## 1. Role-Based Access Control (RBAC) Levels

The dashboard implements three access roles:

| Access Role | Privileges | Layout Restrictions |
| :--- | :--- | :--- |
| **Admin** | Full read and write. Can trigger threat simulations and modify settings. | Unrestricted. |
| **Security Analyst**| Read-only metrics. Can triage incidents and export reports. | Disables "Simulate Attack Detection" action. |
| **Viewer** | Read-only metrics. Cannot triage, simulate, or export reports. | Hides or disables all trigger buttons and export links. |

---

## 2. Production Single Sign-On (SSO) Roadmap

To transition the abstracted authentication layer from local storage sessions to enterprise providers (Okta, Azure AD, SAML):

1. **Supabase Auth Config**: Enable SAML or OIDC options inside your Supabase project dashboard.
2. **Context hook updates**: Modify the `login` function inside [useAuthContext.tsx](file:///e:/CyberFed%20AI/apps/dashboard/src/context/useAuthContext.tsx) to call OAuth2 providers:
   ```typescript
   // Example redirecting session verification to Azure AD SSO:
   await supabase.auth.signInWithOAuth({
     provider: 'azure',
     options: { redirectTo: 'https://fedsoc.company.com/dashboard' }
   });
   ```

---

## 3. Reverse Proxy SSL Certificates

To secure inbound client telemetry and browser sessions, edit the production Nginx proxy to listen on port `443` with valid SSL certificates:

```nginx
server {
    listen 443 ssl;
    server_name fedsoc.company.com;

    ssl_certificate /etc/ssl/certs/fedsoc.crt;
    ssl_certificate_key /etc/ssl/private/fedsoc.key;

    location / {
        proxy_pass http://dashboard_server;
    }
}
```
