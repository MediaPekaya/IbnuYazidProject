import json,os,sys,urllib.request
S=sys.argv[1]; VOICE=sys.argv[2]; OUT=sys.argv[3]
os.makedirs(OUT,exist_ok=True)
prev="Di Pusat Konvensyen Antarabangsa Putrajaya, para mutawalli dan nazir khas wakaf berhimpun, bersama Yang Berhormat Menteri, untuk menyusun langkah, menjaga harta Allah."
cases={
 "p1":("Wakaf bukan sekadar tanah dan bangunan, ia adalah amanah.",prev),
 "p2":("Wakap bukan sekadar tanah dan bangunan, ia adalah amanah.",prev),
 "p3":("Wakaff bukan sekadar tanah dan bangunan, ia adalah amanah.",prev),
 "p4":("Wa kaf bukan sekadar tanah dan bangunan, ia adalah amanah.",prev),
}
for k,(t,pv) in cases.items():
    body={"text":t,"model_id":"eleven_turbo_v2_5","language_code":"ms","previous_text":pv,
      "voice_settings":{"stability":0.6,"similarity_boost":0.8,"style":0.1,"use_speaker_boost":True,"speed":0.9}}
    req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",data=json.dumps(body).encode(),
      headers={"xi-api-key":os.environ["ELEVENLABS_API_KEY"],"Content-Type":"application/json","Accept":"audio/mpeg"})
    try:
        r=urllib.request.urlopen(req,timeout=120); open(f"{OUT}/{k}.mp3","wb").write(r.read()); print(k,"ok",len(t))
    except Exception as e:
        print(k,"ERR",e,getattr(e,"read",lambda:b"")()[:300]); break
