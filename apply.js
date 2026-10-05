(function () {
  var form=document.getElementById('apply-form'); if(!form) return;
  var config=window.OSTIFY_CONFIG||{}, status=document.getElementById('apply-status'), button=document.getElementById('apply-submit');
  // /apply/advisor/ arrives as /apply/?role=advisor.
  if(/[?&]role=advisor(&|$)/.test(location.search)) form.elements.role.value='Clinical Advisor';
  if(config.applicationEndpoint){button.textContent='Send application';status.textContent='We’ll confirm here when your application has been received.';}
  var message=form.elements.message, count=document.getElementById('message-count');
  function words(){var t=message.value.trim();return t?t.split(/\s+/).length:0;}
  function checkWords(){var n=words();count.textContent=n+' of 100 words.';message.setCustomValidity(n>100?'Please keep this to 100 words or fewer. You have '+n+'.':'');}
  var cv=form.elements.cv, CV_MAX=3*1024*1024;
  function checkCv(){var f=cv.files[0];cv.setCustomValidity(!f?'':!/\.(pdf|docx)$/i.test(f.name)?'Please choose a PDF or Word (.docx) file.':f.size>CV_MAX?'Please choose a file of 3 MB or less.':'');}
  cv.addEventListener('change',checkCv);
  function readCv(f){return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){resolve(String(r.result).split(',')[1]||'');};r.onerror=reject;r.readAsDataURL(f);});}
  message.addEventListener('input',checkWords);form.addEventListener('reset',function(){setTimeout(checkWords,0);});
  form.addEventListener('submit',async function(e){
    e.preventDefault();checkWords();checkCv();if(!form.reportValidity()) return;
    var data={name:form.elements.name.value.trim(),email:form.elements.email.value.trim(),role:form.elements.role.value,current:form.elements.current.value.trim(),link:form.elements.link.value.trim(),message:form.elements.message.value.trim(),company:form.elements.company.value};
    if(!data.name||!data.email||!data.link||!data.message||!cv.files[0]){status.textContent='Please fill in every field except your current role, which is optional.';return;}
    if(!config.applicationEndpoint){
      var body='Name: '+data.name+'\nEmail: '+data.email+'\nRole: '+data.role+'\nCurrent role: '+(data.current||'Not given')+'\nLinkedIn: '+data.link+'\n\n'+data.message;
      document.getElementById('email-copy').value=body;document.getElementById('email-fallback').hidden=false;
      status.textContent='Your email is prepared, not sent. Attach your CV and send it in your email app, or copy the text below.';
      location.href='mailto:info@ostify.co.uk?subject='+encodeURIComponent('Application: '+data.role+' - '+data.name)+'&body='+encodeURIComponent(body);return;
    }
    button.disabled=true;status.textContent='Sending your application…';
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},45000);
    try{
      data.cvName=cv.files[0].name;data.cv=await readCv(cv.files[0]);
      var response=await fetch(config.applicationEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data),signal:controller.signal});
      if(!response.ok)throw new Error('Delivery failed');
      status.textContent='Thank you. Your application has been received. We’ll reply personally.';form.reset();
    }catch(error){status.textContent='We couldn’t send your application. Your entries are still here. Try again or email info@ostify.co.uk.';}
    finally{clearTimeout(timer);button.disabled=false;}
  });
  form.hidden=false;
})();
