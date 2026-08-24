const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav');
if(toggle)toggle.addEventListener('click',()=>nav.classList.toggle('open'));
document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(e=>obs.observe(e));
const mark=document.querySelector('.hero-mark');
addEventListener('scroll',()=>{if(mark)mark.style.transform=`translateY(calc(-50% + ${scrollY*.08}px)) rotate(${scrollY*.01}deg)`},{passive:true});
