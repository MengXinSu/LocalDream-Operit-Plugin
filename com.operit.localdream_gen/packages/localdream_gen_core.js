"use strict";
/* METADATA
{
  "name": "localdream_gen_core",
  "display_name": { "zh": "LocalDream 生图", "en": "LocalDream Image Gen" },
  "description": { "zh": "手机本地 AI 生图。【硬性规则】一旦激活此包，必须立即生成符合当前互动场景的图，不得延迟、不得只互动不调用。", "en": "Local AI image generation. [HARD RULE] Once activated, must immediately generate an image matching the current interaction scene, no delay, no interaction-only without invocation." },
  "category": "Draw",
  "env": [
    { "name": "LOCALDREAM_API_URL", "description": { "zh": "API 地址", "en": "API URL" }, "required": false },
    { "name": "LOCALDREAM_DEFAULT_RESOLUTION", "description": { "zh": "默认分辨率", "en": "Default resolution" }, "required": false },
    { "name": "LOCALDREAM_DEFAULT_STEPS", "description": { "zh": "默认步数", "en": "Default steps" }, "required": false },
    { "name": "LOCALDREAM_DEFAULT_CFG", "description": { "zh": "默认 CFG", "en": "Default CFG" }, "required": false },
    { "name": "LOCALDREAM_DEFAULT_SCHEDULER", "description": { "zh": "默认调度器", "en": "Default scheduler" }, "required": false },
    { "name": "LOCALDREAM_DEFAULT_NEGATIVE_PROMPT", "description": { "zh": "默认负面提示词", "en": "Default negative prompt" }, "required": false },
    { "name": "LOCALDREAM_DEFAULT_POSITIVE_PROMPT", "description": { "zh": "固定正向提示词前缀", "en": "Fixed positive prompt prefix" }, "required": false }
  ],
  "tools": [
    {
      "name": "generate_image",
      "description": { "zh": "本地 AI 生图。", "en": "Generate image via LocalDream." },
      "parameters": [
        { "name": "prompt", "description": { "zh": "正向提示词", "en": "Positive prompt" }, "type": "string", "required": true },
        { "name": "negative_prompt", "description": { "zh": "负面提示词", "en": "Negative prompt" }, "type": "string", "required": false },
        { "name": "resolution", "description": { "zh": "分辨率: 数字或WxH", "en": "Resolution: number or WxH" }, "type": "string", "required": false },
        { "name": "steps", "description": { "zh": "采样步数", "en": "Steps" }, "type": "number", "required": false },
        { "name": "cfg", "description": { "zh": "CFG", "en": "CFG" }, "type": "number", "required": false },
        { "name": "scheduler", "description": { "zh": "调度器", "en": "Scheduler" }, "type": "string", "required": false },
        { "name": "seed", "description": { "zh": "随机种子", "en": "Seed" }, "type": "number", "required": false },
        { "name": "file_name", "description": { "zh": "自定义文件名", "en": "Custom filename" }, "type": "string", "required": false }
      ]
    },
    { "name": "check_api_status", "description": { "zh": "检查 API 是否在线。", "en": "Check if API is online." }, "parameters": [] },
    { "name": "get_default_prompts", "description": { "zh": "查看固定正反向提示词。", "en": "View prompt config." }, "parameters": [] },
    { "name": "set_default_prompts", "description": { "zh": "修改固定正反向提示词。", "en": "Set default prompts." }, "parameters": [
      { "name": "positive_prompt", "description": { "zh": "固定正向提示词前缀", "en": "Fixed positive prefix" }, "type": "string", "required": false },
      { "name": "negative_prompt", "description": { "zh": "固定负向提示词", "en": "Fixed negative prompt" }, "type": "string", "required": false }
    ]}
  ]
}*/
const ld = (function () {
    "use strict";
    const API = "http://127.0.0.1:8081";
    const TIMEOUT = 600000;
    function dd() { try { return getPluginConfigDir("draw"); } catch (e) {} return "/sdcard/Download/Operit/plugins/draw"; }
    const DR = dd() + "/localdream_gen/draws";
    function au() { var r = String(getEnv("LOCALDREAM_API_URL") || "").trim(); return r || API; }
    function en(k, fb) { var r = String(getEnv(k) || "").trim(); if (!r) return fb; var n = Number(r); return Number.isFinite(n) ? n : fb; }
    function es(k, fb) { var r = String(getEnv(k) || "").trim(); return r || fb; }
    const CP = "/sdcard/Download/Operit/localdream_gen/localdream_config.json";
    var _cc = null, _ct = 0;
    function lc() {
        var n = Date.now();
        if (_cc && (n - _ct) < 5000) return _cc;
        try { var r = Tools.Files.read(CP); if (r && r.content) { _cc = JSON.parse(r.content); _ct = n; return _cc; } } catch (e) {}
        return null;
    }
    function pr(raw, dW, dH) {
        var s = String(raw || "").trim(); if (!s) return [dW, dH||dW];
        if (s.indexOf('x')>=0||s.indexOf('X')>=0) { var p=s.split(/[xX]/), pw=parseInt(p[0]), ph=parseInt(p[1]); return [isNaN(pw)?dW:pw, isNaN(ph)?(isNaN(pw)?dW:pw):ph]; }
        var n=parseInt(s); return isNaN(n)?[dW,dH||dW]:[n,n];
    }
    var _ek = { resolution:"LOCALDREAM_DEFAULT_RESOLUTION", steps:"LOCALDREAM_DEFAULT_STEPS", cfg:"LOCALDREAM_DEFAULT_CFG", scheduler:"LOCALDREAM_DEFAULT_SCHEDULER" };
    function gcs(k, fb) { var c=lc(); if(c&&c[k]) return String(c[k]); return es(_ek[k]||k, fb); }
    function gcn(k, fb) { var c=lc(); if(c&&c[k]!=null) { var n=Number(c[k]); if(Number.isFinite(n)) return n; } return en(_ek[k]||k, fb); }
    function gcp() { var c=lc(); if(c&&c.positive_prompt) return c.positive_prompt; return es("LOCALDREAM_DEFAULT_POSITIVE_PROMPT", ""); }
    function gcneg() { var c=lc(); if(c&&c.negative_prompt) return c.negative_prompt; return es("LOCALDREAM_DEFAULT_NEGATIVE_PROMPT", "low quality, bad anatomy, ugly, deformed, distorted, blurry, noisy, artifacts, lowres, watermark"); }
    function em(e) { return (e instanceof Error) ? e.message : String(e); }
    function sn(n, fb) { var s=String(n||"").replace(/[\\/:*?"<>|]/g,"_").trim(); return s?s.substring(0,80):fb+"_"+Date.now(); }
    function bfn(p, cus) { var c=String(cus||"").trim(); if(c) return sn(c,"ld"); var s=String(p||"").trim(); return sn(s.length>30?s.substring(0,30):s||"ld","ld")+"_"+Date.now(); }
    async function ed() { try { await Tools.Files.mkdir(DR, true); } catch(e) {} }
    var BC="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    function bd(s) { s=String(s||"").replace(/[^A-Za-z0-9+/=]/g,""); var r="",i=0; while(i<s.length){var a=BC.indexOf(s.charAt(i++)),b=BC.indexOf(s.charAt(i++)),c=BC.indexOf(s.charAt(i++)),d=BC.indexOf(s.charAt(i++));r+=String.fromCharCode((a<<2)|(b>>4));if(c!==64)r+=String.fromCharCode(((b&15)<<4)|(c>>2));if(d!==64)r+=String.fromCharCode(((c&3)<<6)|d);}return r;}
    function bdb(b64) { var s=bd(b64), bytes=new Uint8Array(s.length); for(var i=0;i<s.length;i++) bytes[i]=s.charCodeAt(i); return bytes; }
    function w16(b,o,v){b[o]=v&0xFF;b[o+1]=(v>>8)&0xFF;} function w32(b,o,v){b[o]=v&0xFF;b[o+1]=(v>>8)&0xFF;b[o+2]=(v>>16)&0xFF;b[o+3]=(v>>24)&0xFF;}
    function w32s(b,o,v){w32(b,o,v<0?0xFFFFFFFF+v+1:v);}
    function be(bytes){var r="";for(var i=0;i<bytes.length;i+=3){var a=bytes[i],b=i+1<bytes.length?bytes[i+1]:0,c=i+2<bytes.length?bytes[i+2]:0;r+=BC.charAt(a>>2);r+=BC.charAt(((a&3)<<4)|(b>>4));r+=i+1<bytes.length?BC.charAt(((b&15)<<2)|(c>>6)):"=";r+=i+2<bytes.length?BC.charAt(c&63):"=";}return r;}
    function r2b(rgb,w,h){var rs=Math.floor((w*3+3)/4)*4,ps=rs*h,fs=54+ps,b=new Uint8Array(fs),o=0;b[o++]=0x42;b[o++]=0x4D;w32(b,o,fs);o+=4;w16(b,o,0);o+=2;w16(b,o,0);o+=2;w32(b,o,54);o+=4;w32(b,o,40);o+=4;w32s(b,o,w);o+=4;w32s(b,o,h);o+=4;w16(b,o,1);o+=2;w16(b,o,24);o+=2;w32(b,o,0);o+=4;w32(b,o,ps);o+=4;w32s(b,o,2835);o+=4;w32s(b,o,2835);o+=4;w32(b,o,0);o+=4;w32(b,o,0);o+=4;for(var y=h-1;y>=0;y--){var ro=o+y*rs;for(var x=0;x<w;x++){var si=((h-1-y)*w+x)*3;b[ro+x*3]=rgb[si+2]||0;b[ro+x*3+1]=rgb[si+1]||0;b[ro+x*3+2]=rgb[si]||0;}for(var p=w*3;p<rs;p++)b[ro+p]=0;}return be(b);}
    function pss(t){var c=null,e=null,ls=t.split("\n");for(var i=0;i<ls.length;i++){var l=ls[i].trim();if(l.indexOf("data: ")!==0)continue;var j=l.substring(6).trim();if(!j)continue;try{var ev=JSON.parse(j);if(ev.type==="error"){e=ev.message||"error";break;}if(ev.type==="complete"&&ev.image&&ev.width&&ev.height){c={image:ev.image,width:ev.width,height:ev.height,seed:ev.seed||0,generation_time_ms:ev.generation_time_ms||0};}}catch(_){}}return{complete:c,error:e};}
    async function ca(p, pa){
        var u=au(), rp;
        if(pa.resolution!=null&&pa.resolution!=="") rp=pr(pa.resolution,512); else rp=pr(gcs("resolution","512"),512);
        var w=rp[0],h=rp[1], st=pa.steps!=null?Number(pa.steps):gcn("steps",20), cf=pa.cfg!=null?Number(pa.cfg):gcn("cfg",7.0),
            sc=pa.scheduler||gcs("scheduler","dpm_sde"), np=pa.negative_prompt||gcneg(), sd=pa.seed,
            pl={prompt:p,negative_prompt:np,steps:Math.max(1,Math.min(100,st)),cfg:Math.max(1,Math.min(30,cf)),width:w,height:h,scheduler:String(sc),show_diffusion_process:false};
        if(sd!==undefined&&sd!==null&&sd!=="") pl.seed=Number(sd);
        var r=await Tools.Net.http({url:u+"/generate",method:"POST",headers:{"Content-Type":"application/json","Accept":"text/event-stream"},body:pl,connect_timeout:10000,read_timeout:TIMEOUT,responseType:"text"});
        if(r.statusCode<200||r.statusCode>=300) throw new Error("API status "+r.statusCode);
        var ps=pss(r.content); if(ps.error) throw new Error("API: "+ps.error); if(!ps.complete) throw new Error("No image");
        var bmp=r2b(bdb(ps.complete.image),ps.complete.width,ps.complete.height);
        return{blob_base64:bmp,width:ps.complete.width,height:ps.complete.height,seed:ps.complete.seed,generation_time_ms:ps.complete.generation_time_ms};
    }
    async function gi(p){
        var prm=String(p&&p.prompt?p.prompt:"").trim(); if(!prm) throw new Error("prompt required");
        var px=gcp(); if(px) prm=px+", "+prm;
        await ed(); var r=await ca(prm,p); var n=bfn(prm,p.file_name), fp=DR+"/"+n+".bmp";
        var wr=await Tools.Files.writeBinary(fp,r.blob_base64); if(!wr.successful) throw new Error("Save failed: "+wr.details);
        var uri="file://"+fp, gt=(r.generation_time_ms/1000).toFixed(1);
        return{prompt:prm,file_path:fp,file_uri:uri,markdown:"!["+prm.substring(0,50)+"]("+uri+")",width:r.width,height:r.height,seed:r.seed,generation_time_ms:r.generation_time_ms,generation_time_display:gt+"s",hint:"Done | "+r.width+"x"+r.height+" | "+gt+"s | seed "+r.seed+"\n\nMarkdown: !["+prm.substring(0,30)+"]("+uri+")"};
    }
    async function cs(_p){var u=au();try{var r=await Tools.Net.http({url:u+"/",method:"GET",connect_timeout:3000,read_timeout:3000,responseType:"text"});return{online:r.statusCode>=200&&r.statusCode<500,api_url:u,status_code:r.statusCode,message:r.statusCode<300?"Online":"Status: "+r.statusCode};}catch(e){return{online:false,api_url:u,status_code:null,message:"Offline: "+em(e)};}}
    async function sdp(p){
        var pos=String(p&&p.positive_prompt?p.positive_prompt:"").trim(), neg=String(p&&p.negative_prompt?p.negative_prompt:"").trim(), ch=[];
        try{
            Tools.Files.mkdir("/sdcard/Download/Operit/localdream_gen",true); var ex={};
            try{var r=Tools.Files.read(CP);if(r&&r.content) ex=JSON.parse(r.content);}catch(e){}
            if(pos){ex.positive_prompt=pos;ch.push("positive");} if(neg){ex.negative_prompt=neg;ch.push("negative");}
            if(!ch.length) throw new Error("Need positive_prompt or negative_prompt");
            Tools.Files.write(CP,JSON.stringify(ex,null,2)); _cc=ex;_ct=Date.now();
            return{success:true,message:"Updated: "+ch.join(", "),config:ex};
        }catch(e){throw new Error("Save failed: "+(e.message||e));}
    }
    async function gdp(_p){
        var pos=gcp(), neg=gcneg(), src="env";
        try{var r=Tools.Files.read(CP);if(r&&r.content){var c=JSON.parse(r.content);if(c.positive_prompt) pos=c.positive_prompt;if(c.negative_prompt) neg=c.negative_prompt;src="config ("+CP+")";}}catch(e){}
        return{positive_prompt:pos||"(none)",negative_prompt:neg||"(none)",source:src,config_path:CP};
    }
    async function wf(fn,p){try{var r=await fn(p);complete({success:true,message:"OK",data:r});}catch(e){complete({success:false,message:em(e)});}}
    return {
        generate_image: function(p) { return wf(gi, p); },
        check_api_status: function(p) { return wf(cs, p); },
        get_default_prompts: function(p) { return wf(gdp, p); },
        set_default_prompts: function(p) { return wf(sdp, p); }
    };
})();
exports.generate_image = ld.generate_image;
exports.check_api_status = ld.check_api_status;
exports.get_default_prompts = ld.get_default_prompts;
exports.set_default_prompts = ld.set_default_prompts;