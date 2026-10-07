import sys, json
from faster_whisper import WhisperModel
m = WhisperModel(sys.argv[3], device="cpu", compute_type="int8", cpu_threads=4)
import wave, numpy as np
wf=wave.open(sys.argv[1]); audio=np.frombuffer(wf.readframes(wf.getnframes()),dtype=np.int16).astype(np.float32)/32768
segs, info = m.transcribe(audio, language="fr", word_timestamps=True, vad_filter=False,
    initial_prompt="Angiospermes, mycorhizes, poils absorbants, stomates, thylakoïdes, nodosités, Rhizobium, Rosène, Mesurim, chlorophylle, caroténoïdes, Fabacées.")
out=[]
for s in segs:
    out.append({"start":s.start,"end":s.end,"text":s.text,"words":[[w.start,w.end,w.word] for w in s.words]})
    print(f"{s.start:7.2f} {s.end:7.2f} {s.text}", flush=True)
json.dump(out, open(sys.argv[2],"w"), ensure_ascii=False, indent=0)
