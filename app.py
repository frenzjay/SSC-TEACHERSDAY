import os
import json
import base64
import uuid
import urllib.error
import urllib.request
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
SONGS_FILE = os.path.join(DATA_DIR, "songs.json")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "audio")

ALLOWED_EXTENSIONS = {"mp3", "wav", "m4a", "ogg", "aac", "flac"}

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def load_songs():
    if not os.path.exists(SONGS_FILE):
        return []
    try:
        with open(SONGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading songs: {e}")
        return []

def save_songs(songs):
    try:
        with open(SONGS_FILE, "w", encoding="utf-8") as f:
            json.dump(songs, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving songs: {e}")
        return False


def parse_time_value(val):
    if val is None or val == "":
        return 0.0
    if isinstance(val, (int, float)):
        return round(float(val), 3)
    val = str(val).strip()
    if ":" in val:
        parts = val.split(":")
        try:
            m = float(parts[0])
            s = float(parts[1])
            return round(m * 60 + s, 3)
        except (ValueError, IndexError):
            return 0.0
    try:
        return round(float(val), 3)
    except ValueError:
        return 0.0


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/controller")
def controller():
    return render_template("controller.html")

@app.route("/display")
def display():
    return render_template("display.html")

@app.route("/api/songs", methods=["GET"])
def get_songs():
    songs = load_songs()
    return jsonify(songs)

@app.route("/api/songs/<song_id>/transcribe", methods=["POST"])
def transcribe_song(song_id):
    songs = load_songs()
    song = next((item for item in songs if item.get("id") == song_id), None)
    if song is None:
        return jsonify({"error": "Song not found"}), 404

    audio_url = str(song.get("audio_url") or "")
    prefix = "/static/audio/"
    if not audio_url.startswith(prefix):
        return jsonify({"error": "This song does not have a local audio file"}), 400
    audio_path = (Path(UPLOAD_FOLDER) / Path(audio_url[len(prefix):]).name).resolve()
    upload_root = Path(UPLOAD_FOLDER).resolve()
    if upload_root not in audio_path.parents or not audio_path.is_file():
        return jsonify({"error": "Audio file is missing or invalid"}), 400

    try:
        model = os.environ.get(
            "HF_WHISPER_MODEL",
            "openai/whisper-large-v3"
        )
        endpoint = f"https://router.huggingface.co/hf-inference/models/{model}"
        headers = {"Content-Type": "application/json"}
        hf_token = os.environ.get("HF_TOKEN")
        if not hf_token:
            return jsonify({"error": "HF_TOKEN is required. Create a free Hugging Face token with Inference permissions and restart the app."}), 503
        headers["Authorization"] = f"Bearer {hf_token.strip()}"
        payload = {
            "inputs": base64.b64encode(audio_path.read_bytes()).decode("ascii"),
            "parameters": {"return_timestamps": True}
        }
        request = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(request, timeout=600) as response:
            transcript = json.loads(response.read().decode("utf-8"))
        if not isinstance(transcript, dict) or transcript.get("error"):
            message = transcript.get("error", "The transcription service returned no transcript.")
            return jsonify({"error": str(message)}), 502
        blanks = []
        chunks = transcript.get("chunks", [])
        if not chunks and transcript.get("segments"):
            chunks = transcript["segments"]
        for chunk in chunks:
            timestamp = chunk.get("timestamp") or [
                chunk.get("start", 0),
                chunk.get("end", chunk.get("start", 0))
            ]
            text = " ".join(str(chunk.get("text", "")).strip().split())
            if not text:
                continue
            start_time = float(timestamp[0] or 0) if timestamp else 0
            end_time = (
                float(timestamp[1] or start_time)
                if len(timestamp) > 1 else start_time
            )
            blanks.append({
                "index": len(blanks) + 1,
                "lyrics_time": round(start_time, 3),
                "pause_time": round(end_time, 3),
                "prompt_lyrics": text,
                "blank_lyrics": "",
                "following_lyrics": "",
                "answer": ""
            })
        if not blanks:
            return jsonify({
                "error": "The transcription service returned text without timed segments. Try again with a timestamp-capable Whisper model."
            }), 502
        return jsonify({
            "success": True,
            "model": model,
            "blanks": blanks
        })
    except urllib.error.HTTPError as error:
        print(f"Hugging Face transcription failed for {song_id}: {error}")
        if error.code == 401:
            return jsonify({
                "error": "Hugging Face rejected HF_TOKEN. Check that it is valid, has Inference permissions, and restart the app."
            }), 502
        return jsonify({"error": "Free transcription service rejected the audio or is loading the model. Try again shortly."}), 502
    except urllib.error.URLError as error:
        print(f"Hugging Face connection failed for {song_id}: {error}")
        return jsonify({
            "error": "The server cannot reach Hugging Face. Check internet/DNS access, then try again."
        }), 502
    except Exception as error:
        print(f"Transcription failed for {song_id}: {error}")
        return jsonify({"error": "Free external transcription failed. Check your network and try again."}), 502

@app.route("/api/songs", methods=["POST"])
def add_or_update_song():
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Invalid payload format"}), 400

    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Song title is required"}), 400

    songs = load_songs()
    song_id = data.get("id")

    if "start_time" in data:
        data["start_time"] = parse_time_value(data["start_time"])
    if "blank_time" in data:
        data["blank_time"] = parse_time_value(data["blank_time"])
    if "hula_replay_time" in data:
        data["hula_replay_time"] = parse_time_value(data["hula_replay_time"])
    if "blanks" in data and isinstance(data["blanks"], list):
        cleaned_blanks = []
        for idx, b in enumerate(data["blanks"], 1):
            if isinstance(b, dict):
                cleaned_blanks.append({
                    "index": b.get("index", idx),
                    "lyrics_time": parse_time_value(b.get("lyrics_time", 0)),
                    "pause_time": parse_time_value(b.get("pause_time", 0)),
                    "prompt_lyrics": str(b.get("prompt_lyrics", "")).strip(),
                    "blank_lyrics": str(b.get("blank_lyrics", "")).strip(),
                    "following_lyrics": str(b.get("following_lyrics", "")).strip(),
                    "answer": str(b.get("answer") or b.get("blank_lyrics", "")).strip(),
                    "is_lyrics_only": bool(b.get("is_lyrics_only", False))
                })
        data["blanks"] = cleaned_blanks

    if song_id:
        index = next((i for i, s in enumerate(songs) if s.get("id") == song_id), None)
        if index is not None:
            songs[index] = {**songs[index], **data}
            if save_songs(songs):
                return jsonify({"success": True, "song": songs[index], "action": "updated"})
            return jsonify({"error": "Failed to write file"}), 500

    new_song = {
        "id": f"song-{uuid.uuid4().hex[:8]}",
        "title": title,
        "artist": data.get("artist", "Unknown Artist").strip(),
        "era": data.get("era", "Retro / Oldies").strip(),
        "mode": data.get("mode", "guess").strip(),
        "audio_url": data.get("audio_url", "").strip(),
        "prompt_lyrics": data.get("prompt_lyrics", "").strip(),
        "blank_lyrics": data.get("blank_lyrics", "").strip(),
        "following_lyrics": data.get("following_lyrics", "").strip(),
        "answer": data.get("answer", title).strip(),
        "trivia": data.get("trivia", "").strip(),
        "start_time": parse_time_value(data.get("start_time", 0)),
        "blank_time": parse_time_value(data.get("blank_time", 0)),
        "hula_replay_time": parse_time_value(data.get("hula_replay_time", data.get("start_time", 0))),
        "blanks": data.get("blanks", [])
    }
    songs.append(new_song)
    if save_songs(songs):
        return jsonify({"success": True, "song": new_song, "action": "created"}), 201
    return jsonify({"error": "Failed to write file"}), 500

@app.route("/api/songs/<song_id>", methods=["DELETE"])
def delete_song(song_id):
    """Deletes a song from the library."""
    songs = load_songs()
    filtered = [s for s in songs if s.get("id") != song_id]
    if len(filtered) == len(songs):
        return jsonify({"error": "Song not found"}), 404
    if save_songs(filtered):
        return jsonify({"success": True, "message": "Song deleted"})
    return jsonify({"error": "Failed to write file"}), 500

@app.route("/api/upload-audio", methods=["POST"])
def upload_audio():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided in request"}), 400

    file = request.files["audio"]
    if file.filename == "":
        return jsonify({"error": "Empty filename provided"}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "error": f"File type not supported. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        }), 400

    original_name = secure_filename(file.filename)
    unique_prefix = uuid.uuid4().hex[:6]
    clean_filename = f"{unique_prefix}_{original_name}"
    target_path = os.path.join(app.config["UPLOAD_FOLDER"], clean_filename)

    try:
        file.save(target_path)
        file_url = f"/static/audio/{clean_filename}"

        song_id = request.form.get("song_id")
        updated_song = None
        if song_id:
            songs = load_songs()
            for s in songs:
                if s.get("id") == song_id:
                    s["audio_url"] = file_url
                    updated_song = s
                    break
            save_songs(songs)

        return jsonify({
            "success": True,
            "filename": clean_filename,
            "file_url": file_url,
            "song": updated_song
        })
    except Exception as e:
        return jsonify({"error": f"Failed to save audio file: {str(e)}"}), 500

if __name__ == "__main__":
    print("SSC TEACHERS' DAY")
    print("Controller: /controller")
    print("Display:    /display")
    app.run(host="0.0.0.0", port=5000, debug=True)
