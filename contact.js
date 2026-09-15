(function () {
  var form=document.getElementById('enquiry-form'); if(!form) return;
  var config=window.OSTIFY_CONFIG||{}, status=document.getElementById('enquiry-status'), button=document.getElementById('enquiry-submit');
  var plan=new URLSearchParams(location.search).get('plan');
  if(Array.from(form.elements.plan.options).some(function(o){return o.value===plan;})) form.elements.plan.value=plan;
  if(config.enquiryEndpoint){button.textContent='Send enquiry';status.textContent='We’ll confirm here when your enquiry has been received.';}
  form.addEventListener('input',function(){window.ostifyTrack('enquiry_started');},{once:true});
  form.addEventListener('submit',async function(e){
    e.preventDefault();if(!form.reportValidity()) return;
    var data={name:form.elements.name.value.trim(),email:form.elements.email.value.trim(),plan:form.elements.plan.value,message:form.elements.message.value.trim()};
    if(!data.name||!data.message){status.textContent='Please enter your name and a message.';return;}
    if(!config.enquiryEndpoint){
      var body='Name: '+data.name+'\nEmail: '+data.email+'\nPlan: '+data.plan+'\n\n'+data.message;
      document.getElementById('email-copy').value=body;document.getElementById('email-fallback').hidden=false;
      status.textContent='Your email is prepared, not sent. Send it in your email app, or copy the text below.';
      window.ostifyTrack('email_prepared');
      location.href='mailto:info@ostify.co.uk?subject='+encodeURIComponent('Ostify enquiry: '+data.plan)+'&body='+encodeURIComponent(body);return;
    }
    button.disabled=true;status.textContent='Sending your enquiry…';
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},15000);
    try{
      var response=await fetch(config.enquiryEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data),signal:controller.signal});
      if(!response.ok)throw new Error('Delivery failed');
      status.textContent='Thank you. Your enquiry has been received. We’ll reply personally.';window.ostifyTrack('enquiry_submitted');form.reset();
    }catch(error){status.textContent='We couldn’t send your enquiry. Your entries are still here. Try again or email info@ostify.co.uk.';}
    finally{clearTimeout(timer);button.disabled=false;}
  });
  form.hidden=false;
})();
