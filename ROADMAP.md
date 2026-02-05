# Pipeline Server v2.0 Roadmap

## Phase 1: Authentication & Deployment Foundation

### 1.1 Cloudflare Workers Migration
- Move from Node.js server to Cloudflare Workers
- Use Durable Objects for stateful operations
- KV storage for caching
- D1 database for persistence

### 1.2 Authentication Strategy
- **Local Development**: Nuxt DevTools-style auth (simple, no external deps)
- **Production**: GitHub OAuth (leverage existing GitHub integration)
- JWT tokens with refresh mechanism
- Role-based access (viewer, editor, admin)

### 1.3 GitHub Integration
- OAuth app for repository access
- Webhook support for pipeline file changes
- Read `.ucd-pipeline.ts` files from repos
- Sync pipeline definitions with GitHub

## Phase 2: Core Features

### 2.1 Multi-tenant Support
- Organizations/teams
- Repository-level permissions
- Pipeline sharing between teams

### 2.2 Advanced Execution
- Queue system for pipeline runs
- Concurrent execution limits
- Execution history retention
- Scheduled/cron jobs

### 2.3 Collaboration Features
- Comments on pipeline executions
- Share execution results via links
- Export/import pipeline configs

## Phase 3: UI/UX Overhaul

### 3.1 Design System
- Consistent component library
- Dark/light mode
- Responsive layouts
- Accessibility (WCAG 2.1)

### 3.2 Pipeline Visualizer Improvements
- Interactive graph editing
- Real-time execution visualization
- Performance profiling
- Bottleneck detection

### 3.3 Mobile Support
- Responsive sidebar
- Touch-friendly interactions
- Mobile-optimized views

## Phase 4: Developer Experience

### 4.1 VS Code Extension
- Edit pipelines in IDE
- Live preview
- Auto-completion
- One-click deploy

### 4.2 CLI Improvements
- Remote pipeline management
- CI/CD integration
- Deployment commands

### 4.3 API & SDK
- RESTful API
- TypeScript SDK
- WebSocket for real-time updates

## Technical Considerations

### Architecture Changes
- Move to edge functions (Cloudflare)
- Separate compute from storage
- Event-driven architecture
- GraphQL for flexible queries

### Data Model

```typescript
// Organizations
interface Organization {
  id: string;
  name: string;
  githubInstallationId: string;
}

// Repositories
interface Repository {
  id: string;
  orgId: string;
  fullName: string; // owner/repo
  pipelines: Pipeline[];
}

// Users
interface User {
  id: string;
  githubId: string;
  orgs: string[];
  role: 'viewer' | 'editor' | 'admin';
}
```

### Security
- Encrypted tokens at rest
- Rate limiting
- Audit logs
- Secret management for pipeline configs

## Priority Order

1. **Authentication** (Nuxt DevTools style for local)
2. **Cloudflare Workers migration**
3. **GitHub OAuth & repo sync**
4. **UI overhaul** (fix context menus, actions)
5. **Multi-tenant/teams**
6. **Advanced features** (scheduler, webhooks)

---

*Last updated: February 2026*
