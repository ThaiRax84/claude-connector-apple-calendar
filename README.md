# Claude Connector for Apple Calendar

An [MCP](https://modelcontextprotocol.io) server that lets Claude read and write your Apple Calendar through iCloud. Ask "add a study block Thursday at 5 pm" or "find two free hours this week", and the change shows up on your iPhone, iPad and Mac.

> Community project. Not affiliated with, endorsed by, or sponsored by Anthropic or Apple.

## How it works

```
You ──"add X"──▶ Claude ──MCP tool call──▶ this server ──CalDAV──▶ iCloud ──sync──▶ iPhone / Mac
                                      (Node.js on your computer)
```

The server talks to `caldav.icloud.com`, the same CalDAV service Apple devices sync with. That means it works from any OS, including Windows and Linux, not only macOS.

## Tools

| Tool | What it does |
| --- | --- |
| `list_calendars` | Lists your iCloud event calendars |
| `list_events` | Events between two dates, recurring events expanded |
| `find_free_slots` | Free slots of N minutes inside a daily window (default 07:00–22:00) |
| `add_event` | Creates an event with optional notes, location, alert and repetition (RRULE, e.g. every weekday) |
| `delete_event` | Permanently deletes an event (Claude is told to confirm first) |

## Setup

**Requirements:** Node.js 20+, an Apple ID with two-factor authentication, and the Claude desktop app.

1. **Install**
   ```bash
   git clone https://github.com/ThaiRax84/claude-connector-apple-calendar.git
   cd claude-connector-apple-calendar
   npm install
   npm test
   ```

2. **Create an app-specific password** at [account.apple.com](https://account.apple.com) → Sign-In and Security → App-Specific Passwords. Name it something like "Claude Calendar". This is not your Apple ID password, and you can revoke it at any time.

3. **Register the server with Claude desktop.** Add the block from [`claude_desktop_config.example.json`](claude_desktop_config.example.json) to your `claude_desktop_config.json`, with your own path, Apple ID and app-specific password:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

   On Windows, write the path with double backslashes (`C:\\Users\\you\\...`).

4. **Restart Claude desktop** and ask: "What calendars do I have?"

### Configuration

| Variable | Required | Description |
| --- | --- | --- |
| `ICLOUD_USERNAME` | Yes | Your Apple ID email |
| `ICLOUD_APP_PASSWORD` | Yes | App-specific password (format `xxxx-xxxx-xxxx-xxxx`) |
| `TZ_NAME` | No | IANA time zone for free-slot search. Default `America/Mexico_City` |

## Security

- **Credentials stay on your machine.** They are read from environment variables, sent only to iCloud over HTTPS, and never logged or returned to Claude.
- **Use an app-specific password**, never your Apple ID password. If it leaks, revoke it in your Apple account.
- **Requests are pinned to your calendars.** `delete_event` only accepts `https://*.icloud.com` event URLs inside one of your own calendars, so a malicious prompt cannot redirect your credentials to another host.
- **Input is escaped.** Titles and notes cannot inject extra iCalendar properties.
- **Never commit your config.** `.env` and local config files are ignored by git; keep real values out of issues and pull requests.

Found a vulnerability? Please open a private security advisory on GitHub instead of a public issue.

## Limitations

- Works only while the Claude desktop app is running on the computer where the server is installed.
- The Reminders app is not available: Apple stopped exposing Reminders over CalDAV in iOS 13. Use events with alerts instead.
- Recurring events are created in local time (`TZ_NAME`). For zones with daylight saving time, the server relies on iCloud resolving the IANA zone name.
- All-day events (birthdays, holidays) are not counted as busy when searching for free time.

## Project structure

```
src/index.js      MCP server and tool definitions
src/icloud.js     iCloud connection (CalDAV)
src/urlGuard.js   keeps requests inside your own calendars
src/expand.js     expands recurring events
src/freeSlots.js  free-time algorithm
src/ics.js        builds iCalendar events
test/             tests (npm test)
```

## License

[MIT](LICENSE)
