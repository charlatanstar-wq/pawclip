import sys,os,json,time,re,torch,soundfile as sf
ROOT=os.getcwd(); sys.path.insert(0,ROOT+'/Ming-3.0-tts')
torch.set_num_threads(os.cpu_count())
os.chdir(ROOT+'/Ming-3.0-tts')
import ming_tts as M
m=M.MingTTS(ROOT+'/model',device='cpu',text_normalization=False)
m.model.to(torch.float32); m.model.llm_dytpe=torch.float32
def dur(p):
    i=sf.info(p);return i.frames/i.samplerate
def gen(j,out,task,seed,cfg):
    torch.manual_seed(seed)
    with torch.inference_mode():
        if task=='IP':
            m.synthesize(task='IP',text=re.sub(r'\[[A-Za-z-]+\]','',j['text']),controls={'ip':j['ip']},use_zero_spk_emb=True,output_path=out,cfg=cfg)
        else:
            m.synthesize(task='TTS',text=j['text'],prompt_wav_path=ROOT+'/'+j['ref'],prompt_text=j['ref_text'],use_spk_emb=True,output_path=out,cfg=cfg)
for j in json.load(open(ROOT+'/'+sys.argv[1])):
    out=ROOT+'/'+j['out']; os.makedirs(os.path.dirname(out),exist_ok=True); t=time.time()
    n=len(re.sub(r'\[[A-Za-z-]+\]|[，。？！、；：“”\s]','',j['text']));exp=n/5.0
    tries=[(j['task'],0,2.0)] if j['task']=='IP' else [('TTS',0,2.0),('TTS',1,2.5),('TTS',2,2.0),('IP',0,2.0),('IP',1,2.0)]
    for task,seed,cfg in tries:
        gen(j,out,task,seed,cfg); d=dur(out)
        ok=0.55*exp<=d<=2.0*exp+1.5
        print('try',j['out'],task,seed,round(d,2),'exp',round(exp,2),'ok' if ok else 'BAD',flush=True)
        if ok or j['task']=='IP': break
    print('done',j['out'],round(time.time()-t,1),flush=True)
