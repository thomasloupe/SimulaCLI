# SimulaCLI Packages (Simpacks)

Welcome to the SimulaCLI package system! This directory contains all installable packages for SimulaCLI, organized by category.

## Directory Structure

- **`official/`** - Official packages maintained by the SimulaCLI team
- **`community/`** - Community-contributed packages

## Package Categories

### Official Packages
These packages are maintained by the SimulaCLI development team and are thoroughly tested. They provide core functionality and serve as examples for package development.

**Examples:** fortune, calc, weather, sysinfo

### Community Packages
These packages are contributed by the community. They offer creative, experimental, and specialized functionality that extends SimulaCLI's capabilities.

**Examples:** dice, notes, timer, ascii, password

## Installing Packages

Use the built-in `apt` command to install packages:

```bash
# Install any package
apt get packagename

# Search for packages
apt search keyword

# List installed packages
apt list

# Remove packages
apt remove packagename
```

## Contributing Packages

### Quick Start
1. Fork this repository
2. Create your package file in the appropriate directory
3. Follow the package format requirements
4. Submit a pull request

### Package Format
```javascript
export default async function packagename(...args) {
  // Your command logic here
  return "output string or HTML";
}

packagename.help = "Brief description for help system";
```

### Requirements
- Filename must match function name (`calc.js` → `calc` function)
- Must export default async function
- Must include `.help` property
- Should handle errors gracefully
- Must be safe for client-side execution

## Package Guidelines

### Do's
- Keep packages focused on a single purpose
- Provide clear, helpful error messages
- Include usage examples in help text
- Handle edge cases and invalid input
- Use proper JavaScript practices
- Style output with HTML/CSS when appropriate

### Don'ts
- Don't access sensitive browser APIs without purpose
- Don't create packages with malicious intent
- Don't duplicate existing functionality (check first!)
- Don't use overly complex dependencies
- Don't forget error handling

## Testing Your Package

Before submitting:

1. **Test installation:**
   ```bash
   apt get yourpackage
   reboot
   yourpackage --help
   ```

2. **Test functionality:**
   - Try normal usage
   - Test edge cases
   - Test with invalid input
   - Verify error messages

3. **Check integration:**
   - Ensure it works with SimulaCLI's help system
   - Verify it doesn't conflict with existing commands
   - Test reboot/reload functionality

## Submission Process

### For Community Packages

1. **Choose the right category** (currently `community/`)
2. **Create your package file** following naming conventions
3. **Test thoroughly** in your local SimulaCLI
4. **Submit pull request** with:
   - Package file in correct location
   - Clear description of functionality
   - Usage examples
   - Any special requirements or notes

### Review Process

Community packages will be reviewed for:
- Code quality and safety
- Functionality and usefulness
- Proper format compliance
- No conflicts with existing packages
- Appropriate category placement

## Getting Help

- **Issues:** Report bugs or request features via GitHub Issues
- **Discussions:** Use GitHub Discussions for questions
- **Examples:** Check existing packages for reference
- **Format:** See the main README for detailed package format info

## Package Ideas

Looking for inspiration? Here are some package ideas:

**Utilities:**
- `hash` - Generate MD5/SHA hashes
- `uuid` - Generate unique identifiers
- `color` - Color code converter (hex, rgb, hsl)
- `units` - Unit conversion tool

**Fun & Games:**
- `hangman` - Word guessing game
- `slots` - Slot machine simulator
- `maze` - ASCII maze generator
- `sudoku` - Sudoku puzzle generator

**Productivity:**
- `todo` - Task management system
- `calendar` - Calendar display
- `timer` - Countdown timer with alerts
- `reminders` - Reminder system

**Educational:**
- `morse` - Morse code translator
- `periodic` - Periodic table lookup
- `math` - Math problem generator
- `quiz` - Interactive quiz system
