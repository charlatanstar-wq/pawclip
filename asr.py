import glob,json,subprocess,numpy as np
from faster_whisper import WhisperModel
m=WhisperModel('small',device='cpu',compute_type='int8')
res={}
for f in sorted(glob.glob('clips/*/*.wav'))+sorted(glob.glob('out/fix/*.wav')):
    a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-f','f32le','-ac','1','-ar','16000','-'],capture_output=True).stdout,np.float32)
    segs,_=m.transcribe(a,language='zh',beam_size=1,initial_prompt='以下是普通话的句子。')
    res[f]=''.join(s.text for s in segs);print(f,res[f],flush=True)
json.dump(res,open('asr.json','w'),ensure_ascii=False,indent=0)
