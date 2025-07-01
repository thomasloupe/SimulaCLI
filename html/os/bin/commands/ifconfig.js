export default async function ifconfig() {
  return "inet 127.0.0.1 netmask 255.0.0.0";
}

ifconfig.help = "Display network configuration. Usage: ifconfig";