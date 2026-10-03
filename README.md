### SSC Teachers' Day

The Everybody, Sing! blank editor includes a free Hugging Face Whisper transcription action. It creates timestamped lyric rows for manual review and editing. Set `HF_TOKEN` to a free Hugging Face access token with Inference permissions before starting Flask:

```powershell
$env:HF_TOKEN = "hf_your_token_here"
```

The token is sent only to Hugging Face and is never stored in song data.