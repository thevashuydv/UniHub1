const { spawn } = require('child_process');
const path = require('path');

// Function to start a process
function startProcess(command, args, cwd, name) {
  console.log(`Starting ${name}...`);
  
  const process = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'pipe'
  });
  
  process.stdout.on('data', (data) => {
    console.log(`[${name}] ${data.toString().trim()}`);
  });
  
  process.stderr.on('data', (data) => {
    console.error(`[${name}] ${data.toString().trim()}`);
  });
  
  process.on('close', (code) => {
    console.log(`${name} process exited with code ${code}`);
  });
  
  return process;
}

// Start the email server
const serverPath = path.join(__dirname, 'server');
const emailServer = startProcess('npm', ['start'], serverPath, 'Email Server');

// Start the React app
const reactApp = startProcess('npm', ['run', 'dev'], __dirname, 'React App');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down all processes...');
  emailServer.kill();
  reactApp.kill();
  process.exit(0);
});

console.log('Both servers are starting. Press Ctrl+C to stop all servers.');
