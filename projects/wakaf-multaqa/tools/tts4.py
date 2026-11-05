import json,os,sys,urllib.request
S=sys.argv[1]; VOICE=sys.argv[2]; MODEL=sys.argv[3]; OUT=sys.argv[4]
os.makedirs(OUT,exist_ok=True)
lines={
 "v1a":"Ada kebaikan yang tidak pernah berhenti, walau jasad telah pergi.",
 "v1b":"Terdapat kebaikan yang tidak pernah berhenti, walau jasad telah pergi.",
 "v1c":"Ada satu kebaikan yang tidak pernah berhenti, walau jasad telah pergi.",
}
only=sys.argv[5].split(",") if len(sys.argv)>5 else list(lines)
for k in only:
    t=lines[k]; out=f"{OUT}/{k}.mp3"
    body={"text":t,"model_id":MODEL,"voice_settings":{"stability":0.6,"similarity_boost":0.8,"style":0.1,"use_speaker_boost":True,"speed":0.9}}
    if "v2" not in MODEL or "turbo" in MODEL or "flash" in MODEL: body["language_code"]="ms"
    req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",data=json.dumps(body).encode(),
      headers={"xi-api-key":os.environ["ELEVENLABS_API_KEY"],"Content-Type":"application/json","Accept":"audio/mpeg"})
    try:
        r=urllib.request.urlopen(req,timeout=120); open(out,"wb").write(r.read()); print(k,"ok",len(t))
    except Exception as e:
        print(k,"ERR",e,getattr(e,"read",lambda:b"")()[:300]); break
