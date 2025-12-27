---
title: Remote Access
description: Control Maestro from your phone via the built-in web server and Cloudflare tunnels.
icon: wifi
---

Maestro includes a built-in web server for mobile remote control:

1. **Automatic Security**: Web server runs on a random port with an auto-generated security token embedded in the URL
2. **QR Code Access**: Scan a QR code to connect instantly from your phone
3. **Global Access**: All sessions are accessible when the web interface is enabled - the security token protects access
4. **Remote Tunneling**: Access Maestro from anywhere via Cloudflare tunnel (requires `cloudflared` CLI)

## Mobile Web Interface

The mobile web interface provides:
- Real-time session monitoring and command input
- Device color scheme preference support (light/dark mode)
- Connection status indicator with automatic reconnection
- Offline queue for commands typed while disconnected
- Swipe gestures for common actions
- Quick actions menu for the send button

## Local Access (Same Network)

1. Click the "OFFLINE" button in the header to enable the web interface
2. The button changes to "LIVE" and shows a QR code overlay
3. Scan the QR code or copy the secure URL to access from your phone on the same network

## Remote Access (Outside Your Network)

To access Maestro from outside your local network (e.g., on mobile data or from another location):

1. Install cloudflared: `brew install cloudflared` (macOS) or [download for other platforms](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
2. Enable the web interface (OFFLINE → LIVE)
3. Toggle "Remote Access" in the Live overlay
4. A secure Cloudflare tunnel URL will be generated
5. Use the Local/Remote pill selector to switch between QR codes
6. The tunnel stays active as long as Maestro is running - no time limits, no account required

## Static Port Configuration

By default, Maestro assigns a **random port** each time the web server starts. This is a security-by-obscurity measure — attackers can't easily guess which port to target.

However, if you need a **fixed port** (e.g., for firewall rules, reverse proxies, or persistent tunnel configurations), you can enable static port mode:

1. Click the **OFFLINE** button to open the Live overlay
2. Toggle **Use Custom Port** to enable static port mode
3. Enter your desired port number (1024-65535)
4. The server restarts automatically on the new port

**Use cases for static ports:**
- Punching a hole through a firewall or NAT
- Configuring a reverse proxy (nginx, Caddy)
- Setting up persistent SSH tunnels
- Integration with home automation systems

<Warning>
**Security Trade-off**: Using a static port removes one layer of security-by-obscurity. The randomized port and auto-generated auth token in the URL work together to protect access. With a static port, you're relying solely on the auth token for security.

**Recommendations when using static ports:**
- Use Cloudflare tunnel for remote access instead of exposing ports directly
- Ensure your network firewall is properly configured
- Consider additional authentication at the network level
</Warning>

## Screenshots

![Mobile chat](./screenshots/mobile-chat.png)
![Mobile groups](./screenshots/mobile-groups.png)
![Mobile history](./screenshots/mobile-history.png)
