# Util

The `/util` directory contains plain TypeScript utility functions and types that are used throughout the shell (e.g. in components). These utilities are designed to be reusable and provide common functionality.

## File Structure

- `/util/<name>.ts`: Contains one (or in some cases multiple) utility functions or types. The file name should be descriptive of the utility's purpose, e.g. `array.ts`, `debounce.ts`, `number.ts`, `network-manager.ts`, etc.

## Code Style & Conventions

- **TypeScript**: Prefer strict, clean, and expressive types. Avoid `any` in almost all cases! Use expressive variable names, and don't abbreviate or shorten names.
