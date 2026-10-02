import io
import json
from app import app

def run_tests():
    client = app.test_client()
    print(">>> 1. Testing Page Routes...")

    # GET /
    res = client.get("/")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert b"EVERYBODY, SING!" in res.data, "Index page title missing"
    print("   [PASS] GET / (Portal)")

    # GET /controller
    res = client.get("/controller")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert b"OPERATOR COMMAND COCKPIT" in res.data, "Controller page title missing"
    print("   [PASS] GET /controller (Operator Console)")

    # GET /display
    res = client.get("/display")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert b"STAGE LED WALL" in res.data, "Display page title missing"
    print("   [PASS] GET /display (Stage LED Wall)")

    print("\n>>> 2. Testing API Endpoints...")

    # GET /api/songs
    res = client.get("/api/songs")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    songs = json.loads(res.data)
    assert isinstance(songs, list), "Songs should be a list"
    assert len(songs) >= 1, f"Expected at least 1 song, found {len(songs)}"
    print(f"   [PASS] GET /api/songs (Retrieved {len(songs)} pre-populated songs)")

    # POST /api/songs (Create custom song with MM:SS.mmm millisecond timestamps)
    new_song_payload = {
        "title": "Teacher's Tribute Anthem",
        "artist": "Faculty Chorale",
        "era": "",
        "mode": "complete",
        "prompt_lyrics": "Salamat sa aming mga guro / Kayo ang aming",
        "blank_lyrics": "GABAY",
        "following_lyrics": "Sa bawat hakbang ng buhay...",
        "answer": "GABAY",
        "trivia": "Special Teachers Day tribute",
        "start_time": "00:42.500",
        "blank_time": "00:54.250"
    }
    res = client.post("/api/songs", json=new_song_payload)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}"
    created = json.loads(res.data)
    assert created.get("success") is True
    created_id = created["song"]["id"]
    assert created["song"]["start_time"] == 42.5, f"Expected 42.5, got {created['song']['start_time']}"
    assert created["song"]["blank_time"] == 54.25, f"Expected 54.25, got {created['song']['blank_time']}"
    print(f"   [PASS] POST /api/songs (Created song with millisecond timestamps: start={created['song']['start_time']}s, blank={created['song']['blank_time']}s)")

    # Update existing song with new millisecond timestamps
    update_res = client.post("/api/songs", json={
        "id": created_id,
        "title": "Teacher's Tribute Anthem (Live)",
        "start_time": "01:15.123",
        "blank_time": 90.789
    })
    assert update_res.status_code == 200, f"Expected 200, got {update_res.status_code}"
    updated_data = json.loads(update_res.data)
    assert updated_data["song"]["start_time"] == 75.123, f"Expected 75.123, got {updated_data['song']['start_time']}"
    assert updated_data["song"]["blank_time"] == 90.789, f"Expected 90.789, got {updated_data['song']['blank_time']}"
    print(f"   [PASS] POST /api/songs (Updated millisecond timestamps: start={updated_data['song']['start_time']}s, blank={updated_data['song']['blank_time']}s)")

    # POST /api/upload-audio with song_id
    dummy_audio = io.BytesIO(b"RIFF....WAVEfmt ....data....dummy_audio_bytes")
    res = client.post(
        "/api/upload-audio",
        data={"audio": (dummy_audio, "test_sample.mp3"), "song_id": created_id},
        content_type="multipart/form-data"
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    upload_res = json.loads(res.data)
    assert upload_res.get("success") is True
    assert upload_res.get("file_url").startswith("/static/audio/")
    assert upload_res.get("song") is not None
    assert upload_res["song"]["audio_url"] == upload_res["file_url"]
    print(f"   [PASS] POST /api/upload-audio with song_id (Uploaded & Attached to test song: {upload_res.get('filename')})")

    # POST /api/songs (Create Everybody, Sing! multi-blank song)
    es_payload = {
        "title": "Awitin Mo at Isasayaw Ko (Jackpot Test)",
        "artist": "VST & Co.",
        "era": "",
        "mode": "everybody_sing",
        "start_time": "00:00.000",
        "blanks": [
            {
                "index": 0,
                "lyrics_time": "00:15.000",
                "pause_time": "00:27.450",
                "prompt_lyrics": "Walang ibang magandang mangyayari / Kundi ikaw ay",
                "blank_lyrics": "KASAMA KO",
                "following_lyrics": "Awitin mo at isasayaw ko...",
                "answer": "KASAMA KO"
            },
            {
                "index": 1,
                "lyrics_time": "00:35.500",
                "pause_time": "00:45.800",
                "prompt_lyrics": "Ipagpatawad mo ang aking kapangahasan / Ang nais ko lamang ay",
                "blank_lyrics": "IBIGIN KA",
                "following_lyrics": "Sana'y huwag mo akong sisisihin...",
                "answer": "IBIGIN KA"
            }
        ]
    }
    res = client.post("/api/songs", json=es_payload)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}"
    es_created = json.loads(res.data)
    assert es_created.get("success") is True
    es_song = es_created["song"]
    assert es_song["mode"] == "everybody_sing"
    assert len(es_song["blanks"]) == 2
    assert es_song["blanks"][0]["lyrics_time"] == 15.0
    assert es_song["blanks"][0]["pause_time"] == 27.45
    assert es_song["blanks"][1]["lyrics_time"] == 35.5
    assert es_song["blanks"][1]["pause_time"] == 45.8
    print(f"   [PASS] POST /api/songs (Created Everybody, Sing! song with {len(es_song['blanks'])} blanks and lyrics/pause millisecond timestamps)")

    # Cleanup everybody_sing test song
    del_es = client.delete(f"/api/songs/{es_song['id']}")
    assert del_es.status_code == 200

    # DELETE /api/songs/<id>
    res = client.delete(f"/api/songs/{created_id}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print("   [PASS] DELETE /api/songs/<id> (Cleanup successful)")

    print("\n>>> 3. Testing Static Assets...")
    static_files = [
        "/static/css/base.css",
        "/static/css/display.css",
        "/static/css/controller.css",
        "/static/js/bg-canvas.js",
        "/static/js/bus.js",
        "/static/js/audio.js",
        "/static/js/confetti.js",
        "/static/js/display.js",
        "/static/js/controller.js"
    ]
    for path in static_files:
        res = client.get(path)
        assert res.status_code == 200, f"Failed to fetch {path}, status {res.status_code}"
        print(f"   [PASS] {path} (Size: {len(res.data)} bytes)")

    print("\n==========================================")
    print("ALL TESTS PASSED WITH ZERO ERRORS!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()

