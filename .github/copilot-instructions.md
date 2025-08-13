# UCD.js Development Instructions

UCD.js is a TypeScript monorepo providing a Unicode Character Database (UCD) API, web interface, and CLI tools. The project consists of Cloudflare Workers API, React web frontend, and various utility packages.

## Specialized Instructions

For detailed guidance on specific aspects of UCD.js development, refer to the specialized instruction files in the `instructions/` directory:

- **[Setup Instructions](./instructions/setup.instructions.md)** - Environment setup, installation, and bootstrap procedures
- **[Testing Instructions](./instructions/testing.instructions.md)** - Testing workflows, validation scenarios, and CI compliance  
- **[Development Instructions](./instructions/development.instructions.md)** - Development servers, project structure, and common issues
- **[Code Style Instructions](./instructions/codestyle.instructions.md)** - Code style standards, timing expectations, and repository management

## Quick Start

1. **Environment Setup**: Follow [setup.instructions.md](./instructions/setup.instructions.md) for Node.js 22.17.0+ and pnpm installation
2. **Build**: Run `pnpm install --frozen-lockfile && pnpm build && pnpm build:apps` (takes ~3 minutes total)
3. **Validate**: Follow validation scenarios in [testing.instructions.md](./instructions/testing.instructions.md)
4. **Develop**: Use development servers from [development.instructions.md](./instructions/development.instructions.md)

Always reference the specialized instruction files first and fallback to search or bash commands only when you encounter unexpected information that does not match the info there.