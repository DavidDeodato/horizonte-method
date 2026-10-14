// space.js — motor de cinema espacial: céu procedural, estrelas que viram riscos, pós (lente/flash/onda/bloom/AgX/grão)
// e acumulação de subquadros (anti-serrilhado + motion blur). Tudo determinístico: render(t) desenha o quadro t.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { TexturePass } from 'three/addons/postprocessing/TexturePass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export const NOISE = `
float h31(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<6;i++){s+=a*n3(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}`;

// ---------- céu: Via Láctea + poeira + nebulosas + poeira de estrelas finas ----------
export function makeSky(opt = {}) {
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    uniforms: { uGal: { value: new THREE.Vector3(.25, 1, .15).normalize() }, uTint: { value: new THREE.Color(opt.tint || 0x88aaff) }, uNeb: { value: opt.neb ?? 1 }, uBright: { value: opt.bright ?? 1 }, uSeed: { value: opt.seed ?? 0 } },
    vertexShader: 'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
    fragmentShader: `uniform vec3 uGal,uTint;uniform float uNeb,uBright,uSeed;varying vec3 vD;${NOISE}
    void main(){vec3 d=normalize(vD)+uSeed;float g=dot(normalize(vD),uGal);float band=exp(-g*g*9.);
     float dust=fbm(d*3.2+7.);float lanes=smoothstep(.45,.7,fbm(d*6.5+3.));
     vec3 mw=mix(vec3(.9,.78,.62),vec3(.55,.65,1.),fbm(d*1.6))*band*(.35+.9*dust)*(1.-.75*lanes*band);
     float neb=pow(fbm(d*2.1+11.),3.)*1.6;vec3 nc=mix(vec3(.9,.22,.35),uTint,fbm(d*1.3+5.));
     float fine=pow(h31(floor(normalize(vD)*900.)),900.)*1.5+pow(h31(floor(normalize(vD)*420.)+3.),1400.)*2.5;
     vec3 c=(mw*.03+nc*neb*.014*uNeb)*uBright+fine*vec3(.9,.95,1.)*(.5+band);gl_FragColor=vec4(c,1.);}` });
  const s = new THREE.Mesh(new THREE.SphereGeometry(900, 64, 32), m); s.frustumCulled = false; s.renderOrder = -10; return s;
}
// ---------- estrelas que viram riscos (dobra / velocidade) com desvio para o azul à frente ----------
export function makeStars(n = 7000, seed = 3, RS = 1) {
  const pos = new Float32Array(n * 6), side = new Float32Array(n * 2), col = new Float32Array(n * 6); let s = seed;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) { const u = r() * 2 - 1, a = r() * 6.283, q = Math.sqrt(1 - u * u), R = (120 + r() * 380) * RS; const p = [q * Math.cos(a) * R, u * R, q * Math.sin(a) * R];
    pos.set(p, i * 6); pos.set(p, i * 6 + 3); side[i * 2] = 0; side[i * 2 + 1] = 1; const b = Math.pow(r(), 5) * 3.2 + .12, w = r(); const c = [b * (.8 + .25 * w), b * (.85 + .1 * w), b * (1.1 - .3 * w)]; col.set(c, i * 6); col.set(c, i * 6 + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('side', new THREE.BufferAttribute(side, 1)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uDir: { value: new THREE.Vector3(0, 0, 1) }, uStretch: { value: 0 }, uShift: { value: 0 }, uOrigin: { value: new THREE.Vector3() } },
    vertexShader: `attribute float side;attribute vec3 color;uniform vec3 uDir,uOrigin;uniform float uStretch,uShift;varying vec3 vC;varying float vS;
      void main(){vec3 p=position+uOrigin;float ahead=dot(normalize(position),uDir);p-=uDir*uStretch*(length(position)/300.)*side*(.4+.6*abs(ahead));
        vec3 c=color;c*=mix(vec3(1.),mix(vec3(1.4,.7,.5),vec3(.6,.85,1.6),ahead*.5+.5),uShift);vC=c*(1.+uShift*1.5)*(1.-side*.85);vS=side;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=2.;}`,
    fragmentShader: 'varying vec3 vC;void main(){gl_FragColor=vec4(vC,1.);}' });
  const ls = new THREE.LineSegments(g, m); ls.frustumCulled = false;
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: m.uniforms,
    vertexShader: `attribute float side;attribute vec3 color;uniform vec3 uOrigin;varying vec3 vC;void main(){vC=color*(1.-side);gl_Position=projectionMatrix*modelViewMatrix*vec4(position+uOrigin,1.);gl_PointSize=1.8;}`,
    fragmentShader: 'varying vec3 vC;void main(){vec2 q=gl_PointCoord-.5;gl_FragColor=vec4(vC*(1.-smoothstep(.2,.5,length(q))),1.);}' }));
  pts.frustumCulled = false; const grp = new THREE.Group(); grp.add(ls, pts); grp.userData.u = m.uniforms; return grp;
}
// ---------- pós-produção ----------
const FX = { uniforms: { tDiffuse: { value: null }, uLens: { value: new THREE.Vector2(.5, .5) }, uLensAmt: { value: 0 }, uFlash: { value: 0 }, uRing: { value: -1 }, uAb: { value: 0 }, uRes: { value: new THREE.Vector2(1920, 1080) } },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform vec2 uLens,uRes;uniform float uLensAmt,uFlash,uRing,uAb;varying vec2 vUv;
  void main(){vec2 asp=vec2(uRes.x/uRes.y,1.);vec2 d=(vUv-uLens)*asp;float r=length(d);
   float k=uLensAmt*exp(-r*r*18.);vec2 uv=uLens+(d*(1.-k*.55))/asp;              // bolha de dobra: o espaço à frente se comprime
   float ab=.0015+uAb*.01+k*.02;vec2 dir=normalize(d+1e-5)/asp;
   vec3 c=vec3(texture2D(tDiffuse,uv-dir*ab).r,texture2D(tDiffuse,uv).g,texture2D(tDiffuse,uv+dir*ab).b);if(any(isnan(c))||any(isinf(c)))c=vec3(0.);c=clamp(c,0.,6e4);
   if(uRing>0.){float w=.012+uRing*.05;float ring=exp(-pow((r-uRing*1.6)/w,2.))*(1.-uRing);c+=vec3(.55,.75,1.)*ring*2.5;}
   c+=vec3(.85,.92,1.)*uFlash*3.*exp(-r*r*(uFlash>1.?.0:3.));gl_FragColor=vec4(c,1.);}` };
const GRADE = { uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uBars: { value: .12 }, uFade: { value: 1 }, uRes: { value: new THREE.Vector2(1920, 1080) } },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform float uT,uBars,uFade;uniform vec2 uRes;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){vec2 c=vUv-.5;vec3 col=texture2D(tDiffuse,vUv).rgb;col*=1.-.5*pow(length(c*vec2(1.,.75))*1.25,2.6);col=max(col-.006,0.)*1.006;col*=uFade;
   col+=(h(vUv*uRes+fract(uT)*97.)-.5)*.05*(.12+col);if(vUv.y<uBars||vUv.y>1.-uBars)col=vec3(0.);gl_FragColor=vec4(col,1.);}` };

export function makeEngine(W, H, K) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); renderer.setSize(W, H, false); renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.AgXToneMapping; renderer.toneMappingExposure = 1.1; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const rtS = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType }), rtA = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType });
  const accS = new THREE.Scene(), accM = new THREE.ShaderMaterial({ uniforms: { t: { value: rtS.texture }, k: { value: 1 } }, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}', fragmentShader: 'uniform sampler2D t;uniform float k;varying vec2 vUv;void main(){vec3 c=texture2D(t,vUv).rgb;if(any(isnan(c))||any(isinf(c)))c=vec3(0.);gl_FragColor=vec4(clamp(c,0.,6e4)*k,1.);}' });
  accS.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), accM)); const qc = new THREE.Camera();
  const comp = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType })); comp.setPixelRatio(1); comp.setSize(W, H);
  comp.addPass(new TexturePass(rtA.texture)); const fx = new ShaderPass(FX); fx.uniforms.uRes.value.set(W, H); comp.addPass(fx);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .45, .55, 1.2); comp.addPass(bloom);
  const grade = new ShaderPass(GRADE); grade.uniforms.uRes.value.set(W, H); comp.addPass(grade); comp.addPass(new OutputPass());
  const R2 = i => [((i * .7548776662) % 1) - .5, ((i * .5698402910) % 1) - .5];
  // setScene(tk, i) prepara a cena para o subquadro; retorna {scene, camera}
  function render(t, setScene, fps = 30, shutter = .5) {
    renderer.setRenderTarget(rtA); renderer.setClearColor(0, 0); renderer.clear(); accM.uniforms.k.value = 1 / K;
    for (let i = 0; i < K; i++) { const tk = K > 1 ? t + shutter / fps * ((i + .5) / K - .5) : t; const { scene, camera } = setScene(tk, i);
      const [jx, jy] = R2(i + 1); camera.setViewOffset(W, H, jx, jy, W, H);
      renderer.setRenderTarget(rtS); renderer.setClearColor(0, 1); renderer.clear(); renderer.render(scene, camera);
      renderer.setRenderTarget(rtA); renderer.autoClear = false; renderer.render(accS, qc); renderer.autoClear = true; }
    grade.uniforms.uT.value = t; renderer.setRenderTarget(null); comp.render(); }
  return { renderer, render, fx: fx.uniforms, grade: grade.uniforms, bloom };
}
