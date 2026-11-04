(() => {
  'use strict';
  const models = window.HVCatalogue && window.HVCatalogue.models;
  if (!models) return;
  const params = new URLSearchParams(window.location.search);
  const knownModel = value => typeof value === 'string' && Object.hasOwn(models, value);
  const product = document.querySelector('[data-product-enquiry]');
  if (product) {
    const updateLinks = () => {
      const value = name => product.elements.namedItem(name)?.value || '';
      const model = value('model');
      if (!knownModel(model)) return;
      const sample = new URL('samples.html', window.location.href);
      const advice = new URL('contact.html', window.location.href);
      advice.searchParams.set('enquiry', 'advice');
      for (const key of ['model','size','fabric','colour']) {
        const val = value(key);
        if (val) { advice.searchParams.set(key,val); sample.searchParams.set(key,val); }
      }
      const sampleLink=document.querySelector('[data-product-samples]');
      const adviceLink=document.querySelector('[data-product-advice]');
      if (sampleLink) sampleLink.href=sample.href;
      if (adviceLink) adviceLink.href=advice.href;
    };
    product.addEventListener('change',updateLinks);
    product.addEventListener('click',updateLinks);
    updateLinks();
  }
  const fabricSelect=document.querySelector('[data-sample-fabric]');
  if(!fabricSelect)return;
  const selectedModel=knownModel(params.get('model')) ? params.get('model') : '';
  const selectedSize=selectedModel && models[selectedModel].sizes.includes(params.get('size')) ? params.get('size') : '';
  const fabrics=selectedModel ? models[selectedModel].fabrics : models.Marlow.fabrics;
  const grid=document.querySelector('[data-sample-grid]');
  const list=document.querySelector('[data-sample-shortlist]');
  const status=document.querySelector('[data-sample-status]');
  const enquire=document.querySelector('[data-sample-enquire]');
  const description=document.querySelector('[data-sample-description]');
  const descriptions={
    'Lovely Velvet':'43 shades of soft polyester velvet with an EasyClean finish.',
    'Manolo':'44 colours in a soft, textured polyester chenille.',
    'Cambridge Linen':'32 colours in a blend of 43% cotton, 32% linen and 25% polyester.'
  };
  let chosen=[];
  const valid=(fabric,colour)=> typeof fabric==='string' && Object.hasOwn(fabrics,fabric) && typeof colour==='string' && fabrics[fabric].colours.includes(colour);
  const same=(a,b)=>a.fabric===b.fabric&&a.colour===b.colour;
  const addInitial=item=>{if(item && valid(item.fabric,item.colour) && !chosen.some(x=>same(x,item)) && chosen.length<6)chosen.push({fabric:item.fabric,colour:item.colour});};
  try {const arr=JSON.parse(params.get('samples')||'[]');if(Array.isArray(arr))arr.slice(0,6).forEach(addInitial);}catch(_error){}
  addInitial({fabric:params.get('fabric'),colour:params.get('colour')});
  fabricSelect.replaceChildren();
  for(const name of Object.keys(fabrics)){const o=document.createElement('option');o.value=name;o.textContent=name==='Cambridge Linen'?'Cambridge linen blend':name;fabricSelect.append(o);}
  if(Object.hasOwn(fabrics,params.get('fabric')))fabricSelect.value=params.get('fabric');
  const update=()=>{
    list.replaceChildren();
    for(const item of chosen){
      const li=document.createElement('li');
      const label=document.createElement('div');
      const name=document.createElement('span');name.textContent=item.colour;
      const fabric=document.createElement('small');fabric.textContent=item.fabric;
      label.append(name,fabric);
      const remove=document.createElement('button');remove.type='button';remove.className='sample-remove';remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+item.colour+' '+item.fabric);
      remove.addEventListener('click',()=>{chosen=chosen.filter(x=>!same(x,item));update();status.textContent=item.colour+' removed. '+chosen.length+' of 6 selected.';});
      li.append(label,remove);list.append(li);
    }
    if(!chosen.length){const li=document.createElement('li');li.textContent='Your shortlist is empty. Select a colour to add it.';list.append(li);}
    grid.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(chosen.some(x=>x.fabric===fabricSelect.value&&x.colour===button.dataset.colour))));
    status.textContent=chosen.length+' of 6 colours selected.';
    const target=new URL('contact.html',window.location.href);target.searchParams.set('enquiry','samples');
    if(selectedModel)target.searchParams.set('model',selectedModel);
    if(selectedSize)target.searchParams.set('size',selectedSize);
    if(chosen.length===1){
      target.searchParams.set('fabric',chosen[0].fabric);
      target.searchParams.set('colour',chosen[0].colour);
    }
    if(chosen.length)target.searchParams.set('samples',JSON.stringify(chosen));
    enquire.href=target.href;
    const own=new URL(window.location.href);own.searchParams.delete('colour');own.searchParams.set('fabric',fabricSelect.value);
    if(chosen.length)own.searchParams.set('samples',JSON.stringify(chosen));else own.searchParams.delete('samples');
    try{window.history.replaceState(null,'',own.href);}catch(_error){}
  };
  const render=()=>{
    grid.replaceChildren();
    const fabric=fabricSelect.value, data=fabrics[fabric], atlas=data.swatches;
    description.textContent=descriptions[fabric]||'';
    data.colours.forEach((colour,index)=>{
      const button=document.createElement('button');button.type='button';button.className='sample-choice';button.dataset.colour=colour;button.setAttribute('aria-label','Select '+colour+' in '+fabric);
      const image=document.createElement('span');image.className='sample-texture';image.setAttribute('aria-hidden','true');
      image.style.backgroundImage='url("'+atlas.image+'")';image.style.backgroundSize=(atlas.columns*100)+'% '+(atlas.rows*100)+'%';image.style.backgroundPosition=(index%atlas.columns/(atlas.columns-1)*100)+'% '+(Math.floor(index/atlas.columns)/(atlas.rows-1)*100)+'%';
      const label=document.createElement('span');label.className='sample-label';label.textContent=colour;
      button.append(image,label);
      button.addEventListener('click',()=>{
        const item={fabric,colour};
        if(chosen.some(x=>same(x,item)))chosen=chosen.filter(x=>!same(x,item));
        else if(chosen.length<6)chosen.push(item);
        else{status.textContent='Six colours are selected. Remove one before adding another.';return;}
        update();
      });
      grid.append(button);
    });
    update();
  };
  fabricSelect.addEventListener('change',render);render();
})();
