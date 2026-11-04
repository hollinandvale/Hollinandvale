(() => {
  'use strict';
  const form=document.querySelector('[data-contact-form]');
  const models=window.HVCatalogue && window.HVCatalogue.models;
  if(!form || !models)return;
  const config=window.HVEnquiryConfig || {};
  const params=new URLSearchParams(window.location.search);
  const field=name=>form.elements.namedItem(name);
  const submit=form.querySelector('[data-enquiry-submit]');
  const receipt=form.querySelector('[data-contact-receipt]');
  const types={'retail':'General enquiry','trade':'Trade enquiry','samples':'Fabric samples','advice':'Advice / call request','callback':'Advice / call request','aftercare':'Aftercare'};
  const validModel=name=>typeof name==='string' && Object.hasOwn(models,name);
  const currency=n=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n);
  const options=(select,values,placeholder,previous)=>{
    select.replaceChildren(new Option(placeholder,''));
    for(const value of values)select.add(new Option(value==='Cambridge Linen'?'Cambridge linen blend':value,value));
    select.value=values.includes(previous)?previous:'';
  };
  const price=()=>{
    const model=field('model').value,size=field('size').value,fabric=field('fabric').value;
    const data=validModel(model)?models[model]:null;
    const index=data?data.sizes.indexOf(size):-1;
    const cloth=data&&Object.hasOwn(data.fabrics,fabric)?data.fabrics[fabric]:null;
    const value=index>=0&&cloth?cloth.prices[index]:null;
    field('price').value=Number.isFinite(value)?currency(value):'';
  };
  const updateColours=()=>{
    const model=field('model').value,fabric=field('fabric').value;
    const data=validModel(model)?models[model]:null;
    const colours=data&&Object.hasOwn(data.fabrics,fabric)?data.fabrics[fabric].colours:[];
    options(field('colour'),colours,'Choose a colour',field('colour').value);
    field('colour').disabled=!colours.length;price();
  };
  const updateModel=()=>{
    const data=validModel(field('model').value)?models[field('model').value]:null;
    options(field('size'),data?data.sizes:[],'Choose a size',field('size').value);
    options(field('fabric'),data?Object.keys(data.fabrics):[],'Choose upholstery',field('fabric').value);
    field('size').disabled=!data;field('fabric').disabled=!data;updateColours();
    for(const name of ['size','fabric','colour','price']){
      const detail=field(name)?.closest?.('[data-configuration-detail]');
      if(detail)detail.hidden=!data;
    }
  };
  options(field('model'),Object.keys(models),'Help me choose',params.get('model'));
  updateModel();
  if(validModel(field('model').value)){
    const data=models[field('model').value];
    if(data.sizes.includes(params.get('size')))field('size').value=params.get('size');
    if(Object.hasOwn(data.fabrics,params.get('fabric')))field('fabric').value=params.get('fabric');
    updateColours();
    const fabric=field('fabric').value;
    if(fabric && data.fabrics[fabric].colours.includes(params.get('colour')))field('colour').value=params.get('colour');
  }
  field('model').addEventListener('change',updateModel);
  field('fabric').addEventListener('change',updateColours);
  field('size').addEventListener('change',price);price();
  if(Object.hasOwn(types,params.get('enquiry')))field('type').value=types[params.get('enquiry')];
  let samples=[];
  try{
    const requested=JSON.parse(params.get('samples')||'[]');
    if(Array.isArray(requested))for(const item of requested.slice(0,6)){
      if(item && typeof item.fabric==='string' && typeof item.colour==='string' && Object.values(models).some(m=>Object.hasOwn(m.fabrics,item.fabric)&&m.fabrics[item.fabric].colours.includes(item.colour)) && !samples.some(x=>x.fabric===item.fabric&&x.colour===item.colour))samples.push({fabric:item.fabric,colour:item.colour});
    }
  }catch(_error){}
  if(samples.length){
    form.querySelector('[data-requested-samples]').hidden=false;
    field('samplesSummary').value=samples.map(item=>item.fabric+' — '+item.colour).join('\n');
    const edit=form.querySelector('[data-requested-samples] a');
    const url=new URL('samples.html',window.location.href);url.searchParams.set('samples',JSON.stringify(samples));
    if(validModel(field('model').value)){
      url.searchParams.set('model',field('model').value);
      if(models[field('model').value].sizes.includes(field('size').value))url.searchParams.set('size',field('size').value);
    }
    edit.href=url.href;
  }
  const projectBrief=form.querySelector('[data-trade-brief]');
  const updateProjectBrief=()=>{
    const active=field('type').value==='Trade enquiry';
    if(projectBrief){projectBrief.hidden=!active;projectBrief.disabled=!active;}
    field('message').maxLength=active?4500:5000;
  };
  field('type').addEventListener('change',updateProjectBrief);
  updateProjectBrief();
  const type=field('type').value,model=field('model').value;
  field('message').value= type==='Fabric samples' ? 'Please confirm availability, any sample charge and postage, and the expected dispatch timing for '+(samples.length?'my selected fabric samples.':'physical fabric samples'+(params.get('fabric')?' in '+String(params.get('fabric')).slice(0,60):'')+'.')
    : type==='Advice / call request' ? 'I would like some help with '+(model?'the '+model:'choosing a sofa')+'. Please contact me to discuss sizes, upholstery or arranging a call.'
    : type==='Aftercare' ? 'I would like help with an existing order. My order reference and a description of the issue are: '
    : model ? 'I would like to '+(params.get('enquiry')==='retail'?'request an order for':'ask about')+' the '+model+'. Please confirm fabric availability, delivery and the next steps.' : '';
  const status=document.createElement('p');status.className='form-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');form.append(status);
  const fallback=document.createElement('details');fallback.className='enquiry-fallback';
  const summary=document.createElement('summary');summary.textContent='Prefer to email, or need a copy of your request?';
  const draft=document.createElement('textarea');draft.readOnly=true;draft.setAttribute('aria-label','Your enquiry text');
  const mail=document.createElement('a');mail.className='text-link';mail.textContent='Open your email app';
  const note=document.createElement('p');note.className='form-note';note.textContent='You can copy the text above into your own email. Opening an email app does not send a message; review it and send it there.';
  fallback.append(summary,draft,mail,note);form.append(fallback);
  const collect=()=>{
    const data={};
    for(const name of ['name','email','business','type','model','size','fabric','colour','postcode','message','phone','contactPreference','timePreference','website'])data[name]=String(field(name)?.value||'').trim();
    if(data.type==='Trade enquiry'){
      const details=[
        ['Project setting',field('projectSetting')?.value],
        ['Approximate quantity',field('projectQuantity')?.value],
        ['Preferred project timing',field('projectTiming')?.value]
      ].filter(([,value])=>String(value||'').trim()).map(([label,value])=>label+': '+String(value).trim());
      if(details.length)data.message=details.join('\n')+'\n\n'+data.message;
    }
    data.samples=samples;
    return data;
  };
  const updateDraft=()=>{
    const data=collect();
    const body=['Hollin & Vale — '+data.type,'Name: '+data.name,'Email: '+data.email,'Phone: '+data.phone,'Preferred reply: '+data.contactPreference,'Convenient time: '+data.timePreference,'Business: '+data.business,'','Design: '+data.model,'Size: '+data.size,'Fabric: '+data.fabric,'Colour: '+data.colour,'Published retail price: '+field('price').value,'Delivery postcode: '+data.postcode,samples.length?'Samples:\n'+samples.map(x=>x.fabric+' — '+x.colour).join('\n'):'','',data.message].filter(x=>x!==null).join('\n');
    draft.value=body;
    const destination=data.type==='Trade enquiry'?'trade@hollinandvale.co.uk':data.type==='Manufacturing / supplier'?'partnerships@hollinandvale.co.uk':'enquiries@hollinandvale.co.uk';
    mail.href='mailto:'+destination+'?subject='+encodeURIComponent('Hollin & Vale — '+data.type+(data.model?' — '+data.model:''))+'&body='+encodeURIComponent(body);
  };
  const phoneState=()=>{
    const required=field('contactPreference').value==='Phone';
    field('phone').required=required;
    field('phone').setAttribute('aria-required',String(required));
    const label=form.querySelector('label[for="phone"] .muted');
    if(label)label.textContent=required?'(required for a call)':'(optional)';
  };
  field('contactPreference').addEventListener('change',phoneState);phoneState();
  let challenge=null,challengePromise=null,retry=null,busy=false,complete=false;
  const asTime=value=>typeof value==='number'?value:Date.parse(value);
  const getChallenge=()=>{
    if(challengePromise)return challengePromise;
    challengePromise=(async()=>{
      const response=await fetch(config.challengeEndpoint,{mode:'cors',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});
      const data=await response.json();
      if(!response.ok || typeof data.token!=='string' || !Number.isFinite(asTime(data.expiresAt)))throw new Error('We could not open a secure enquiry session. Please try again.');
      challenge=data;return data;
    })().finally(()=>{challengePromise=null;});
    return challengePromise;
  };
  const freshChallenge=async()=>{
    if(challenge && asTime(challenge.expiresAt)>Date.now()+5000)return challenge;
    return getChallenge();
  };
  const ready=typeof config.endpoint==='string'&&config.endpoint.startsWith('https://')&&typeof config.challengeEndpoint==='string'&&config.challengeEndpoint.startsWith('https://');
  submit.disabled=false;
  if(ready)getChallenge().catch(()=>{});
  else{submit.textContent='Prepare enquiry email';status.textContent='Use the email option below to send your request.';}
  const changed=()=>{updateDraft();if(!busy&&complete){complete=false;submit.disabled=false;submit.textContent='Send enquiry';receipt.hidden=true;receipt.replaceChildren();status.textContent='Your edited request has not been submitted.';delete status.dataset.state;}if(retry){retry=null;challenge=null;}};
  form.addEventListener('input',changed);
  form.addEventListener('change',changed);
  updateDraft();
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||complete)return;phoneState();price();updateDraft();
    if(!form.reportValidity())return;
    if(!ready){fallback.open=true;status.textContent='Your enquiry text is ready below. Copy it into an email, or open your email app and press Send there.';return;}
    const data=collect();busy=true;submit.disabled=true;submit.textContent='Sending…';form.setAttribute('aria-busy','true');status.dataset.state='pending';status.textContent='Saving your enquiry securely…';receipt.hidden=true;
    const locked=Array.from(form.querySelectorAll('input,select,textarea')).map(control=>[control,control.disabled]);
    locked.forEach(([control])=>{control.disabled=true;});
    try{
      const current=retry || {challenge:await freshChallenge(),data};
      retry=current;
      const delay=Math.max(0,asTime(current.challenge.minSubmitAt)-Date.now()+100);
      if(delay>0)await new Promise(resolve=>setTimeout(resolve,Math.min(delay,3000)));
      const response=await fetch(config.endpoint,{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({...current.data,token:current.challenge.token}),signal:AbortSignal.timeout(20000)});
      let result;try{result=await response.json();}catch(_error){throw new Error('We could not confirm receipt. Please retry the same request, or use the email alternative below.');}
      if(!response.ok || result.ok!==true || typeof result.receipt!=='string' || !/^HV-[A-Za-z0-9_-]{6,100}$/.test(result.receipt)){
        if(response.status!==429 && response.status<500){retry=null;challenge=null;}
        throw new Error(typeof result.error==='string'?result.error:'Your enquiry could not be confirmed. Check the details and try again.');
      }
      receipt.replaceChildren();const heading=document.createElement('strong');heading.textContent='Your enquiry has been received.';
      const detail=document.createElement('p');detail.textContent='Reference '+result.receipt+'. We will use your contact details to respond. An enquiry does not confirm an order, sample dispatch or payment.';
      receipt.append(heading,detail);receipt.hidden=false;receipt.tabIndex=-1;receipt.focus();
      status.dataset.state='success';status.textContent='Saved successfully. Keep your reference for any follow-up. This confirmation is shown on the website; an automatic email has not been sent.';
      if(typeof window.dispatchEvent==='function' && typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('site:conversion',{detail:{form:'enquiry'}}));
      complete=true;submit.textContent='Enquiry received';challenge=null;retry=null;
    }catch(error){
      status.dataset.state='error';status.textContent=(error&&error.name==='TimeoutError'?'We could not confirm receipt in time. Retry the same request to check safely.':error&&error.message?error.message:'We could not confirm receipt. Please try again.')+' Your details are still on this page. You can also use the email alternative below.';
      submit.textContent='Try sending again';
    }finally{locked.forEach(([control,disabled])=>{control.disabled=disabled;});busy=false;submit.disabled=complete;form.removeAttribute('aria-busy');}
  });
})();
