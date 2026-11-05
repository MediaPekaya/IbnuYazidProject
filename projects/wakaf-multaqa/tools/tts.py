import json,os,sys,urllib.request
S=sys.argv[1]
VOICE="nPczCjzI2devNBz1zQrb"
lines={
 "v1":"Ada kebaikan... yang tidak pernah berhenti... walau jasad telah pergi.",
 "v3":"Di Pusat Konvensyen Antarabangsa Putrajaya, para mutawalli dan nazir khas wakaf berhimpun, bersama Yang Berhormat Menteri, untuk menyusun langkah... menjaga harta Allah.",
 "v4":"Kerana wakaf bukan sekadar tanah dan bangunan... ia adalah amanah.",
 "v6":"Sabda Rasulullah, sallallahu alaihi wasallam: apabila manusia meninggal dunia, terputuslah amalnya... kecuali sedekah jariah, ilmu yang bermanfaat, dan anak soleh yang mendoakannya.",
 "v7":"Ya Allah, terimalah wakaf mereka yang telah pergi, kuatkan amanah mereka yang menjaganya, dan jadikan ia pahala yang terus mengalir. Aamiin.",
}
for k,t in lines.items():
    out=f"{S}/vo/{k}.mp3"
    if os.path.exists(out) and os.path.getsize(out)>5000: continue
    body=json.dumps({"text":t,"model_id":"eleven_multilingual_v2",
      "voice_settings":{"stability":0.6,"similarity_boost":0.8,"style":0.15,"use_speaker_boost":True,"speed":0.88}}).encode()
    req=urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",data=body,
      headers={"xi-api-key":os.environ["ELEVENLABS_API_KEY"],"Content-Type":"application/json","Accept":"audio/mpeg"})
    try:
        r=urllib.request.urlopen(req,timeout=120); open(out,"wb").write(r.read()); print(k,"ok",len(t),"chars")
    except Exception as e:
        print(k,"ERR",e, getattr(e,"read",lambda:b"")()[:300]); break
