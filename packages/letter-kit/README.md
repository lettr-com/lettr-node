# letter-kit

CLI tool for managing [Lettr](https://lettr.com) email templates locally.

## Installation

```bash
npm install -g letter-kit
```

Or run directly with npx:

```bash
npx letter-kit
```

## Setup

Initialize a config file in your project:

```bash
letter-kit init
```

This creates a `lettr.json` file:

```json
{
  "apiKey": "$LETTR_API_KEY",
  "outputDir": "./emails"
}
```

- **apiKey** — Your API key directly, or `$ENV_VAR` to reference an environment variable.
- **outputDir** — Directory where templates will be saved.

### API Key Resolution

The API key is resolved in this order:

1. `--api-key` flag
2. `apiKey` in `lettr.json` (supports `$ENV_VAR` syntax)
3. `LETTR_API_KEY` environment variable

## Commands

### `letter-kit init`

Interactively creates a `lettr.json` config file in the current directory.

### `letter-kit list`

Lists all templates from the Lettr API.

```bash
letter-kit list
letter-kit list --api-key lttr_abc123
```

### `letter-kit pull`

Pulls all templates and saves them as `{slug}.html` files in the configured output directory.

```bash
letter-kit pull
letter-kit pull --api-key lttr_abc123
```

## License

MIT
