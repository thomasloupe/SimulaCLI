// dice - Roll dice with customizable sides and count
// Community package for SimulaCLI

export default async function dice(...args) {
  // Parse arguments
  if (args.length === 0 || args[0] === 'help') {
    return `Dice Roller Usage:<br>
dice [sides] - Roll one die with specified sides<br>
dice [sides] [count] - Roll multiple dice<br>
<br>
Examples:<br>
dice 6 - Roll one six-sided die<br>
dice 20 - Roll one twenty-sided die<br>
dice 6 5 - Roll five six-sided dice<br>
dice 100 10 - Roll ten hundred-sided dice<br>
<br>
Maximum: 1,000 rolls per command<br>
<span style="color: #0f0;">Green = Critical Success (max value)</span><br>
<span style="color: #f00;">Red = Critical Failure (1)</span>`;
  }

  const sides = parseInt(args[0]);
  const count = args[1] ? parseInt(args[1]) : 1;

  // Validation
  if (isNaN(sides) || sides < 2) {
    return 'E: Invalid die size. Must be at least 2 sides.';
  }

  if (sides > 1000000) {
    return 'E: Die size too large. Maximum 1,000,000 sides.';
  }

  if (isNaN(count) || count < 1) {
    return 'E: Invalid roll count. Must be at least 1.';
  }

  if (count > 1000) {
    return 'E: Too many rolls. Maximum 1,000 rolls per command.';
  }

  // Roll the dice
  const rolls = [];
  let critSuccesses = 0;
  let critFailures = 0;
  let total = 0;

  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
    total += roll;

    if (roll === sides) {
      critSuccesses++;
    } else if (roll === 1) {
      critFailures++;
    }
  }

  // Format output
  let output = `Rolling ${count}d${sides}:<br><br>`;

  // Display rolls with color coding
  const formattedRolls = rolls.map(roll => {
    if (roll === sides) {
      return `<span style="color: #0f0; font-weight: bold;">${roll}</span>`;
    } else if (roll === 1) {
      return `<span style="color: #f00; font-weight: bold;">${roll}</span>`;
    } else {
      return roll.toString();
    }
  });

  // Group rolls for better display
  if (count <= 20) {
    output += `Rolls: ${formattedRolls.join(', ')}<br><br>`;
  } else if (count <= 100) {
    // Display in rows of 10
    for (let i = 0; i < formattedRolls.length; i += 10) {
      const row = formattedRolls.slice(i, i + 10);
      output += `${row.join(', ')}<br>`;
    }
    output += '<br>';
  } else {
    // For large rolls, just show summary
    output += `[${count} rolls - showing summary only]<br><br>`;
  }

  // Statistics
  output += `<strong>Results:</strong><br>`;
  output += `Total: ${total}<br>`;

  if (count > 1) {
    const average = (total / count).toFixed(2);
    output += `Average: ${average}<br>`;
    output += `Minimum: ${Math.min(...rolls)}<br>`;
    output += `Maximum: ${Math.max(...rolls)}<br>`;
  }

  if (critSuccesses > 0) {
    output += `<span style="color: #0f0;">Critical Successes: ${critSuccesses}</span><br>`;
  }

  if (critFailures > 0) {
    output += `<span style="color: #f00;">Critical Failures: ${critFailures}</span><br>`;
  }

  // Success/failure percentage for multiple rolls
  if (count >= 10) {
    const successRate = ((critSuccesses / count) * 100).toFixed(1);
    const failureRate = ((critFailures / count) * 100).toFixed(1);
    output += `<br><strong>Crit Rates:</strong><br>`;
    output += `Success Rate: ${successRate}%<br>`;
    output += `Failure Rate: ${failureRate}%<br>`;
  }

  return output;
}

dice.help = "Roll dice with customizable sides and count. Usage: dice [sides] [count] or dice help";