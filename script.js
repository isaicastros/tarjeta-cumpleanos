/*
  PERSONALIZACIÓN RÁPIDA:
  1) Cambia recipient, sender y los textos de CONFIG.
  2) Coloca tus fotos en /fotos con los nombres foto1.jpg ... foto4.jpg.
  3) La música ambiental original se genera al pulsar SÍ. Puedes reemplazarla
     por un MP3 propio/licenciado configurando audioFile.
*/
const CONFIG = {
  recipient: "Para una persona maravillosa",
  sender: "Con mucho cariño ♥",
  question: "¿Quieres recibir tu sorpresa de cumpleaños?",
  openingMessage: "Katty, Hoy no es un día cualquiera... hoy la vida se luce celebrando la enorme alegría de que existas.",
  finalMessage: "Quiero aprovechar este tiempo para recordarte la gran mujer que eres. Eres una persona maravillosa, de esas guerreras y luchadoras que se esfuerzan día a día con el corazón en la mano para salir adelante y alcanzar cada meta que te propones. Admiro profundamente la madre maravillosa que eres y lo hermosa que eres, belleza que irradias tanto por fuera como por dentro. Hoy que estás de cumpleaños, quise darte una pequeña sorpresa para recordarte lo valiosa que eres y sepas cuánto te aprecio. ¡Feliz cumpleaños! Que este nuevo año de vida te regrese con creces todo el amor, la fuerza y la dedicación que entregas al mundo. ¡Disfruta tu día al máximo!",
  photoCaptions: [
    "Los momentos más bonitos merecen recordarse.",
    "Cada recuerdo guarda una historia.",
    "Que nunca te falten motivos para sonreír.",
    "Y que vengan muchos recuerdos más."
  ],
  progressiveMessages: [
    "Que cada nuevo amanecer te acerque a tus sueños.",
    "Que nunca te falten motivos para reír con el corazón.",
    "Que la vida te regale personas bonitas y momentos inolvidables.",
    "Hoy celebramos tu historia... y todo lo hermoso que está por venir."
  ],
  photos: ["fotos/foto1.jpg", "fotos/foto2.jpg", "fotos/foto3.jpg", "fotos/foto4.jpg"],
  // Opcional: "musica/mi-cancion.mp3". Deja "" para usar la música instrumental generada.
  audioFile: "musica/musica.mp3",
  slideDurationMs: 4800
};

const $ = (id) => document.getElementById(id);
const screens = ["intro","question","surprise","final"];
let currentSlide = 0, slideTimer = null, messageTimer = null, audioContext = null;
let masterGain = null, musicNodes = [], audioElement = null, musicOn = false;

function showScreen(id){
  screens.forEach(s => $(s).classList.toggle("hidden", s !== id));
  window.scrollTo({top:0,behavior:"smooth"});
}
function toast(message){
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(()=>$("toast").classList.remove("show"),2400);
}
function makeParticles(){
  const root=$("particles");
  for(let i=0;i<35;i++){
    const p=document.createElement("i");
    p.className="particle";
    p.style.left=(Math.random()*100)+"%";
    p.style.animationDuration=(9+Math.random()*15)+"s";
    p.style.animationDelay=(-Math.random()*20)+"s";
    p.style.opacity=String(.2+Math.random()*.5);
    root.appendChild(p);
  }
}
function openEnvelope(){
  const btn=$("openEnvelope");
  btn.classList.add("opening");
  btn.disabled=true;
  setTimeout(()=>showScreen("question"),1150);
}
function escapeNoButton(){
  const no=$("noButton"), area=$("choiceArea");
  const maxX=Math.max(40,area.clientWidth/2-65);
  const maxY=55;
  const x=(Math.random()*2-1)*maxX;
  const y=(Math.random()*2-1)*maxY;
  no.style.position="relative";
  no.style.left=x+"px";
  no.style.top=y+"px";
}
function setupNoButton(){
  const no=$("noButton");
  no.addEventListener("pointerenter",escapeNoButton);
  no.addEventListener("touchstart",(e)=>{e.preventDefault();escapeNoButton();},{passive:false});
  no.addEventListener("click",(e)=>{e.preventDefault();escapeNoButton();});
}
function startMusic(){
  if(CONFIG.audioFile){
    if(!audioElement){
      audioElement=new Audio(CONFIG.audioFile);
      audioElement.loop=true;
      audioElement.volume=.35;
    }
    audioElement.play().then(()=>{musicOn=true;updateMusicButton();}).catch(()=>toast("Toca el botón de música para reproducirla."));
    return;
  }
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC){toast("Este navegador no permite generar música.");return;}
    if(!audioContext){
      audioContext=new AC();
      masterGain=audioContext.createGain();
      masterGain.gain.value=.0001;
      masterGain.connect(audioContext.destination);
      // Armonía ambiental original: acordes lentos y suaves, sin grabaciones externas.
      const chords=[
        [130.81,164.81,196.00,261.63],
        [110.00,130.81,164.81,220.00],
        [87.31,110.00,130.81,174.61],
        [98.00,123.47,146.83,196.00]
      ];
      chords.forEach((chord,index)=>{
        chord.forEach((freq,j)=>{
          const osc=audioContext.createOscillator(), gain=audioContext.createGain(), filter=audioContext.createBiquadFilter();
          osc.type=j===0?"sine":"triangle";
          osc.frequency.value=freq;
          filter.type="lowpass";filter.frequency.value=850;
          gain.gain.value=(j===0?.12:.045);
          osc.connect(filter);filter.connect(gain);gain.connect(masterGain);
          osc.start();
          musicNodes.push({osc,gain,filter});
        });
      });
      // Nota brillante lenta que aporta una sensación cinematográfica.
      const bell=audioContext.createOscillator(), bellGain=audioContext.createGain();
      bell.type="sine";bell.frequency.value=523.25;bellGain.gain.value=.018;
      bell.connect(bellGain);bellGain.connect(masterGain);bell.start();
      musicNodes.push({osc:bell,gain:bellGain});
      let chordIndex=0;
      window.chordInterval=setInterval(()=>{
        if(!audioContext||audioContext.state==="closed")return;
        chordIndex=(chordIndex+1)%chords.length;
        musicNodes.slice(0,4).forEach((node,i)=>{
          node.osc.frequency.setTargetAtTime(chords[chordIndex][i],audioContext.currentTime,1.8);
        });
      },6500);
    }
    audioContext.resume();
    masterGain.gain.setTargetAtTime(.20,audioContext.currentTime,.8);
    musicOn=true;updateMusicButton();
  }catch(err){toast("No se pudo iniciar la música en este navegador.");}
}
function stopMusic(){
  if(audioElement){audioElement.pause();}
  if(audioContext&&masterGain){masterGain.gain.setTargetAtTime(.0001,audioContext.currentTime,.3);}
  musicOn=false;updateMusicButton();
}
function updateMusicButton(){
  $("musicButton").classList.toggle("paused",!musicOn);
  $("musicLabel").textContent=musicOn?"MÚSICA ACTIVADA":"MÚSICA PAUSADA";
}
function toggleMusic(){musicOn?stopMusic():startMusic();}
function renderDots(){
  const root=$("slideDots");root.innerHTML="";
  CONFIG.photos.forEach((_,i)=>{
    const dot=document.createElement("button");
    dot.className="slide-dot"+(i===currentSlide?" active":"");
    dot.setAttribute("aria-label","Ver fotografía "+(i+1));
    dot.addEventListener("click",()=>showSlide(i,true));
    root.appendChild(dot);
  });
}
function showSlide(index,resetTimer=false){
  currentSlide=(index+CONFIG.photos.length)%CONFIG.photos.length;
  const img=$("slideImage"), fallback=$("photoFallback");
  img.classList.remove("loaded");
  img.onload=()=>{img.classList.add("loaded");fallback.style.display="none";};
  img.onerror=()=>{img.classList.remove("loaded");fallback.style.display="flex";};
  img.src=CONFIG.photos[currentSlide];
  $("slideCounter").textContent=String(currentSlide+1).padStart(2,"0")+" / "+String(CONFIG.photos.length).padStart(2,"0");
  $("photoCaption").textContent=CONFIG.photoCaptions[currentSlide]||"Un recuerdo para guardar en el corazón.";
  renderDots();
  if(resetTimer)startSlideshow();
}
function startSlideshow(){
  clearInterval(slideTimer);
  slideTimer=setInterval(()=>showSlide(currentSlide+1),CONFIG.slideDurationMs);
}
function revealProgressively(){
  const line=$("sequenceLine"), messages=CONFIG.progressiveMessages;
  let index=0;
  function next(){
    if(index>=messages.length)return;
    line.style.opacity="0";
    setTimeout(()=>{
      line.textContent=messages[index++];
      line.style.opacity="1";
      line.animate([{opacity:0,filter:"blur(5px)",transform:"translateY(8px)"},{opacity:1,filter:"blur(0)",transform:"translateY(0)"}],{duration:850,easing:"ease-out"});
      messageTimer=setTimeout(next,4200);
    },450);
  }
  next();
}
function acceptSurprise(){
  startMusic();
  $("musicButton").classList.remove("hidden");
  $("recipientLine").textContent=CONFIG.recipient;
  $("storyMessage").textContent=CONFIG.openingMessage;
  showScreen("surprise");
  showSlide(0);
  startSlideshow();
  revealProgressively();
}
function showFinal(){
  clearInterval(slideTimer);clearTimeout(messageTimer);
  $("finalMessage").textContent=CONFIG.finalMessage;
  $("signature").textContent=CONFIG.sender;
  showScreen("final");
}
function replay(){
  clearInterval(slideTimer);clearTimeout(messageTimer);
  currentSlide=0;
  $("noButton").style.left="0px";$("noButton").style.top="0px";
  $("openEnvelope").classList.remove("opening");$("openEnvelope").disabled=false;
  $("sequenceLine").textContent="";
  showScreen("intro");
}
$("openEnvelope").addEventListener("click",openEnvelope);
$("yesButton").addEventListener("click",acceptSurprise);
$("prevSlide").addEventListener("click",()=>showSlide(currentSlide-1,true));
$("nextSlide").addEventListener("click",()=>showSlide(currentSlide+1,true));
$("finalButton").addEventListener("click",showFinal);
$("replayButton").addEventListener("click",replay);
$("musicButton").addEventListener("click",toggleMusic);
$("questionText").textContent=CONFIG.question;
setupNoButton();makeParticles();
