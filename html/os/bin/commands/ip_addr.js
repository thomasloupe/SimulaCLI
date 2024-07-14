export default async function ip_addr() {
  return "inet 127.0.0.1/8 scope host lo";
}

ip_addr.help = "Display IP address information.";
