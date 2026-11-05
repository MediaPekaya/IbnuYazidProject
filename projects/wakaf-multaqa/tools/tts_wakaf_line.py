import json,os,sys,urllib.request
S=sys.argv[1]; OUT=sys.argv[2]; os.makedirs(OUT,exist_ok=True)
VOICE="nPczCjzI2devNBz1zQrb"   # Brian, same as the original take
prev="Di Pusat Konvensyen Antarabangsa Putrajaya, para mutawalli dan nazir khas wakaf berhimpun, bersama Yang Berhormat Menteri, untuk menyusun langkah... menjaga harta Allah."
cases={
 "q1":("Wakaf bukan sekadar tanah dan bangunan... ia adalah amanah.",prev),
 "q2":("Wakaff bukan sekadar tanah dan bangunan... ia adalah amanah.",prev),
 "q3":("Wa kaf bukan sekadar tanah dan bangunan... ia adalah amanah.",prev),
 "q4":("Wakaff bukan sekadar tanah dan bangunan... ia adalah amanah.",None),
}
sel=sys.argv[3].split(",") if len(sys.argv)>3 else list(cases)
for k in sel:
    t,pv=cases[k]
    body={"text":t,"model_id":"eleven_multilingual_v2",
      "voice_settings":{"stability":0.6,"similarity_boost":0.8,"style":0.15,"use_speaker_boost":True,"speed":0.88}}
    if pv: body["previous_text"]=pv
    req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",data=json.dumps(body).encode(),
      headers={"xi-api-key":os.environ["ELEVENLABS_API_KEY"],"Content-Type":"application/json","Accept":"audio/mpeg"})
    try:
        r=urllib.request.urlopen(req,timeout=120); open(f"{OUT}/{k}.mp3","wb").write(r.read()); print(k,"ok",len(t))
    except Exception as e:
        print(k,"ERR",e,getattr(e,"read",lambda:b"")()[:300]); break
