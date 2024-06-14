# Firebazy

Firebazy is a Node.js tool that checks a list of domains for the presence of Firebase-related JavaScript files. It can read domains from a file, command-line arguments, or standard input.

## Features

- Check multiple domains for Firebase usage.
- Read domains from a file, command-line arguments, or standard input.
- Display results with color-coded statuses (FIREBASE, NO FIREBASE, HTTP TIMEOUT).
- Option to show all results or only those with Firebase-related files.

## Prerequisites

- Node.js (version 14 or later)
- npm (Node Package Manager)

## Installation

You can install Firebazy globally using npm:

```bash
npm i -g firebazy
```

## Usage

```bash
firebazy [options]
```

### Options

- `--file, -f <file>`: File containing a list of domains to check (one domain per line).
- `--domains, -d <domains>`: List of domains to check, delimited by space, comma, or newline.
- `--help, -h`: Display the help message.
- `--show-all, -s`: Show all results, including NO FIREBASE and HTTP TIMEOUT.

### Examples

1. Check domains from a file:
   ```bash
   firebazy --file domains.txt
   ```

2. Check domains from command-line arguments:
   ```bash
   firebazy --domains "example.com, example.org, example.net"
   ```

3. Check domains from standard input:
   ```bash
   crtsh -d example.com | firebazy
   ```
   **Hint: [crtsh-cli](https://github.com/wiggercomputer/crtsh-cli) pairs well with firebazy for piping all known subdomains. **

4. Show all results, including NO FIREBASE:
   ```bash
   firebazy --file domains.txt --show-all
   ```

## Development

### Code Structure

- `readDomainsFromStdin`: Reads domains from standard input.
- `readDomainsFromFile`: Reads domains from a file.
- `checkForFirebase`: Checks if a domain uses Firebase by analyzing its JavaScript files.
- `main`: The main function that processes command-line arguments and performs domain checks.

### Running the Script Locally

To run the script locally (without installing globally), use the following command:

```bash
node firebazy.js [options]
```

### Dependencies

- `playwright`: For headless browser automation.
- `readline`: For reading input from standard input and files.
- `chalk`: For colorizing terminal output.
- `cli-progress`: For displaying a progress bar.
- `arg`: For parsing command-line arguments.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgements

- [Playwright](https://playwright.dev/) for browser automation.
- [Chalk](https://github.com/chalk/chalk) for terminal string styling.
- [cli-progress](https://github.com/AndiDittrich/Node.CLI-Progress) for progress bars.
- [arg](https://github.com/zeit/arg) for command-line argument parsing.

## Installation for Development

1. Clone the repository:
   ```bash
   git clone https://github.com/wiggercomputer/firebazy.git
   cd firebazy
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Link the package globally for development:
   ```bash
   npm link
   ```

4. Now you can use `firebazy` command globally for testing and development.

## Uninstallation

To uninstall the globally installed Firebazy, use:

```bash
npm uninstall -g firebazy
```
