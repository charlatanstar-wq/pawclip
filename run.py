import sys,os,json,time,torch
ROOT=os.getcwd(); sys.path.insert(0,ROOT+'/Ming-3.0-tts')
torch.set_num_threads(os.cpu_count())
os.chdir(ROOT+'/Ming-3.0-tts')
import ming_tts as M
m=M.MingTTS(ROOT+'/model',device='cpu',text_normalization=False)
m.model.to(torch.float32); m.model.llm_dytpe=torch.float32
for j in json.load(open(ROOT+'/'+sys.argv[1])):
    out=ROOT+'/'+j['out']; os.makedirs(os.path.dirname(out),exist_ok=True)
    t=time.time(); torch.manual_seed(j.get('seed',0))
    kw=dict(cfg=j.get('cfg',2.0),sigma=j.get('sigma',0.25),temperature=j.get('temp',0.0))
    with torch.inference_mode():
        if j['task']=='IP':
            m.synthesize(task='IP',text=j['text'],controls={'ip':j['ip']},use_zero_spk_emb=True,output_path=out,**kw)
        else:
            m.synthesize(task='TTS',text=j['text'],prompt_wav_path=ROOT+'/'+j['ref'],prompt_text=j['ref_text'],use_spk_emb=True,output_path=out,**kw)
    print('done',j['out'],round(time.time()-t,1),flush=True)
