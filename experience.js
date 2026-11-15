import * as THREE from 'three';

const canvas=document.getElementById('world');
const fallback=document.getElementById('world-fallback');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,scene,camera,gateGroup,towerGroup,cityGroup,rain,portalActive=false,frame=0;
const clock=new THREE.Clock();
try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:innerWidth>700,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.65));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x080916,.012);
  camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,500);
  camera.position.set(0,5,24);
  scene.add(new THREE.HemisphereLight(0x9db8ff,0x080512,1.1));
  const moon=new THREE.DirectionalLight(0x75dfff,1.8);moon.position.set(-12,20,8);scene.add(moon);
  const pinkLight=new THREE.PointLight(0xff36bd,22,75);pinkLight.position.set(10,8,-15);scene.add(pinkLight);
  const cyanLight=new THREE.PointLight(0x27dfff,20,80);cyanLight.position.set(-10,6,-25);scene.add(cyanLight);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),new THREE.MeshStandardMaterial({color:0x080b18,metalness:.55,roughness:.65}));ground.rotation.x=-Math.PI/2;ground.position.y=-.05;scene.add(ground);
  const grid=new THREE.GridHelper(260,80,0x1a9db2,0x20233c);grid.position.y=.015;grid.material.transparent=true;grid.material.opacity=.22;scene.add(grid);

  cityGroup=new THREE.Group();scene.add(cityGroup);
  const buildingMats=[0x11172a,0x17142a,0x0d1d2a,0x1c1630].map(c=>new THREE.MeshStandardMaterial({color:c,metalness:.65,roughness:.55}));
  const windowMats=[new THREE.MeshBasicMaterial({color:0x35d9ed}),new THREE.MeshBasicMaterial({color:0xf13ab9}),new THREE.MeshBasicMaterial({color:0x7f6aff})];
  for(let i=0;i<105;i++){
    const x=(Math.random()-.5)*150,z=-Math.random()*155-8,w=2+Math.random()*5,d=2+Math.random()*5,h=7+Math.random()*36;
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),buildingMats[i%buildingMats.length]);b.position.set(x,h/2,z);cityGroup.add(b);
    if(i%2===0){const count=Math.max(2,Math.floor(h/3));for(let j=0;j<count;j++){const win=new THREE.Mesh(new THREE.PlaneGeometry(w*.65,.12),windowMats[(i+j)%3]);win.position.set(x,h*.18+j*(h*.62/count),z+d/2+.006);cityGroup.add(win);}}
    if(i%5===0){const strip=new THREE.Mesh(new THREE.BoxGeometry(.08,h*.8,.08),new THREE.MeshBasicMaterial({color:i%2?0xff42c8:0x36eaff}));strip.position.set(x+w/2+.05,h*.5,z);cityGroup.add(strip);}
  }
  // Tower landmark: monumental industrial geometry with restrained neon seams.
  towerGroup=new THREE.Group();towerGroup.position.set(0,0,-42);scene.add(towerGroup);
  const towerMat=new THREE.MeshStandardMaterial({color:0x151b2c,metalness:.78,roughness:.4});
  const tower=new THREE.Mesh(new THREE.BoxGeometry(17,48,13),towerMat);tower.position.y=24;towerGroup.add(tower);
  const crown=new THREE.Mesh(new THREE.BoxGeometry(21,3,17),new THREE.MeshStandardMaterial({color:0x242a42,metalness:.8,roughness:.3}));crown.position.y=49;towerGroup.add(crown);
  for(let y=5;y<47;y+=7){const band=new THREE.Mesh(new THREE.BoxGeometry(17.3,.13,13.3),new THREE.MeshBasicMaterial({color:y%2?0x42ddf4:0xf33cbd}));band.position.y=y;towerGroup.add(band);}
  for(let x of [-7.8,7.8]){const rib=new THREE.Mesh(new THREE.BoxGeometry(.35,48,.35),new THREE.MeshStandardMaterial({color:0x58647f,metalness:.8}));rib.position.set(x,24,6.6);towerGroup.add(rib);}
  const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=128;const ctx=signCanvas.getContext('2d');ctx.clearRect(0,0,512,128);ctx.font='bold 54px Arial';ctx.fillStyle='#68edff';ctx.textAlign='center';ctx.fillText('HARISH  P',256,82);const signTex=new THREE.CanvasTexture(signCanvas);const sign=new THREE.Mesh(new THREE.PlaneGeometry(11,2.75),new THREE.MeshBasicMaterial({map:signTex,transparent:true}));sign.position.set(0,36,6.7);towerGroup.add(sign);
  const portalMat=new THREE.MeshBasicMaterial({color:0x55eaff,wireframe:true,transparent:true,opacity:.55});
  gateGroup=new THREE.Group();gateGroup.position.set(0,3,10);scene.add(gateGroup);
  [4.2,3.5,2.75].forEach((r,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.08,8,100),new THREE.MeshStandardMaterial({color:i===1?0xb94fff:0x52eaff,metalness:.8,emissive:i===1?0x4c0c60:0x07506a,emissiveIntensity:1.5}));gateGroup.add(ring);});
  for(let i=0;i<16;i++){const a=i*Math.PI/8;const glyph=new THREE.Mesh(new THREE.BoxGeometry(.18,.7,.2),new THREE.MeshBasicMaterial({color:i%2?0x55eaff:0xff4bc8}));glyph.position.set(Math.cos(a)*4.2,Math.sin(a)*4.2,0);glyph.rotation.z=a;gateGroup.add(glyph);}
  const core=new THREE.Mesh(new THREE.CircleGeometry(2.55,64),new THREE.MeshBasicMaterial({color:0x37206e,transparent:true,opacity:.52,side:THREE.DoubleSide}));core.position.z=-.12;gateGroup.add(core);
  const portalGlow=new THREE.Mesh(new THREE.CircleGeometry(2.1,64),new THREE.MeshBasicMaterial({color:0x48dfff,transparent:true,opacity:.14,side:THREE.DoubleSide}));portalGlow.position.z=-.1;gateGroup.add(portalGlow);
  // Rain is sparse on mobile to keep the scene within a modest GPU budget.
  const rainCount=innerWidth<700?650:1400;const rainGeo=new THREE.BufferGeometry();const rainPos=new Float32Array(rainCount*3);for(let i=0;i<rainCount;i++){rainPos[i*3]=(Math.random()-.5)*90;rainPos[i*3+1]=Math.random()*45;rainPos[i*3+2]=(Math.random()-.5)*100-12;}rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPos,3));rain=new THREE.Points(rainGeo,new THREE.PointsMaterial({color:0x70d9f4,size:.055,transparent:true,opacity:.55}));scene.add(rain);
  const starsGeo=new THREE.BufferGeometry();const stars=new Float32Array(900*3);for(let i=0;i<900;i++){stars[i*3]=(Math.random()-.5)*180;stars[i*3+1]=Math.random()*65+5;stars[i*3+2]=-Math.random()*180;}starsGeo.setAttribute('position',new THREE.BufferAttribute(stars,3));scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xa3c8ff,size:.09,transparent:true,opacity:.7})));

  function resize(){if(!renderer)return;camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<600?62:55;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.65));}
  window.addEventListener('resize',resize);
  window.addEventListener('portfolio:enter',()=>{portalActive=true;});
  function animate(){requestAnimationFrame(animate);const t=clock.getElapsedTime();frame++;
    if(!reduced){gateGroup.rotation.z=t*.12;gateGroup.children.forEach((o,i)=>{if(o.geometry.type==='TorusGeometry'&&i===1)o.rotation.z=-t*.18;});}
    const p=rain.geometry.attributes.position.array;for(let i=0;i<rainCount;i++){p[i*3+1]-=.22;if(p[i*3+1]<0){p[i*3+1]=45;p[i*3]=(Math.random()-.5)*90;}}rain.geometry.attributes.position.needsUpdate=true;
    if(portalActive){const targetX=innerWidth<600?0:0;const targetY=innerWidth<600?5.5:7;const targetZ=innerWidth<600?26:31;camera.position.x+=(targetX-camera.position.x)*.012;camera.position.y+=(targetY-camera.position.y)*.012;camera.position.z+=(targetZ-camera.position.z)*.012;camera.lookAt(0,9,-32);gateGroup.scale.lerp(new THREE.Vector3(.45,.45,.45),.012);gateGroup.position.y=3+Math.sin(t*1.2)*.12;}
    else{camera.position.x=Math.sin(t*.12)*.35;camera.position.y=5+Math.sin(t*.25)*.18;camera.lookAt(0,5,-18);}
    renderer.render(scene,camera);
  }
  animate();
}catch(error){console.warn('3D scene unavailable:',error);if(fallback)fallback.style.display='block';}
