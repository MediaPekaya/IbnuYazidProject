import subprocess,sys,json
S,P=sys.argv[1],sys.argv[2]
shots=[ # id, src, offset, start, dur
 ("s01","A001_11041835_C007.mov",0.0,0.0,5.0),
 ("s02","IMG_2894.MOV",0.3,4.2,5.3),
 ("s03","A001_11041841_C010.mov",3.0,8.4,5.2),
 ("s04","A001_11041835_C008.mov",0.4,12.6,4.3),
 ("s05","IMG_2901.MOV",0.5,16.0,6.0),
 ("s06","IMG_2916.MOV",0.0,21.2,5.0),
 ("s07","IMG_2918.MOV",1.8,25.3,5.3),
 ("s08","IMG_2919.MOV",3.0,29.7,5.3),
 ("s09","IMG_2913.MOV",38.0,34.1,5.3),
 ("s10","IMG_2904.MOV",8.0,38.5,4.9),
 ("s11","IMG_2941.MOV",0.8,42.4,5.3),
 ("s12","IMG_2945.MOV",2.5,46.8,5.3),
 ("s13","IMG_2949.MOV",0.8,51.2,5.1),
 ("s14","IMG_2846.MOV",29.0,55.4,4.6),
 ("s15","IMG_2859.MOV",0.3,59.0,6.0),
 ("s16","A001_11041845_C012.mov",5.6,64.0,9.0),
]
json.dump(shots,open(f"{S}/shots.json","w"))
procs=[]
for sid,src,off,st,d in shots:
    out=f"{P}/assets/clips/{sid}.mp4"
    cmd=["ffmpeg","-v","error","-y","-ss",str(off),"-i",f"{S}/clips/{src}","-t",str(d),"-an",
         "-vf","scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,format=yuv420p",
         "-c:v","libx264","-preset","veryfast","-crf","18","-g","30","-movflags","+faststart",out]
    procs.append((sid,subprocess.Popen(cmd)))
    if len(procs)>=3:
        for s,p in procs: p.wait()
        procs=[]
for s,p in procs: p.wait()
print("cut done")
