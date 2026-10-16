### SSC Teachers' Day

### This app was used for SSC's Teachers' Day celebration.

## Use a phone or another device as the stage display

1. Run `python app.py`
2. Open `http://localhost:5000/controller`
3. Connect the phone to the same network and open `http://<laptop-LAN-IP>:5000/display`. Use the laptop's IP address, not `localhost`, on the phone.

Song selection, lyrics, answer reveals, scores, and roulette events now travel through Flask instead of a device-local browser channel. The display requests the current controller state when it connects, reconnects, or returns to the foreground. A connection notice appears during outages. Commands older than 10 seconds are discarded rather than replaying stale music/actions after a long outage.

For phone audio, tap **Enable sound on this device** on the phone stage page. This grants playback permission and unmutes that device even when the controller output is set to laptop only. Tap the button again to mute locally; refresh the page to return to following the controller output setting. If the browser blocks playback again, the button changes to **Tap to start sound**. Network synchronization is for game state and playback commands; it does not guarantee sample-accurate audio timing across devices.