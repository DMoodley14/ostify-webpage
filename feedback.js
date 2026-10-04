(function () {
  var form=document.getElementById('feedback-form'); if(!form) return;
  var config=window.OSTIFY_CONFIG||{}, status=document.getElementById('feedback-status'), button=document.getElementById('feedback-submit');
  if(config.feedbackEndpoint){button.textContent='Send feedback';status.textContent='We’ll confirm here when your feedback has been received.';}
  form.addEventListener('submit',async function(e){
    e.preventDefault();if(!form.reportValidity()) return;
    var data={name:form.elements.name.value.trim(),email:form.elements.email.value.trim(),plan:form.elements.plan.value,kind:form.elements.kind.value,message:form.elements.message.value.trim(),role:form.elements.role.value,organisation:form.elements.organisation.value,usecase:form.elements.usecase.value.trim(),miss:form.elements.miss.value,recommend:form.elements.recommend.value,pilot:form.elements.pilot.value,browser:navigator.userAgent,company:form.elements.company.value};
    if(!data.name||!data.message){status.textContent='Please enter your name and your feedback.';return;}
    if(!config.feedbackEndpoint){
      var body='Name: '+data.name+'\nEmail: '+(data.email||'Not given')+'\nPlan: '+data.plan+'\nType: '+data.kind+'\nRole: '+(data.role||'Not given')+'\nOrganisation: '+(data.organisation||'Not given')+'\nWants to build: '+(data.usecase||'Not given')+'\nIf Ostify went away: '+(data.miss||'Not given')+'\nRecommend (0-10): '+(data.recommend||'Not given')+'\nWants a pilot: '+(data.pilot||'Not given')+'\nBrowser: '+data.browser+'\n\n'+data.message;
      document.getElementById('email-copy').value=body;document.getElementById('email-fallback').hidden=false;
      status.textContent='Your email is prepared, not sent. Send it in your email app, or copy the text below.';
      location.href='mailto:info@ostify.co.uk?subject='+encodeURIComponent('Ostify tester feedback: '+data.kind)+'&body='+encodeURIComponent(body);return;
    }
    button.disabled=true;status.textContent='Sending your feedback…';
    var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},15000);
    try{
      var response=await fetch(config.feedbackEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(data),signal:controller.signal});
      if(!response.ok)throw new Error('Delivery failed');
      // Keep name and email so a tester can send several notes in one sitting.
      status.textContent='Thank you. Your feedback has been received. Send another whenever you like.';form.elements.message.value='';
    }catch(error){status.textContent='We couldn’t send your feedback. Your entries are still here. Try again or email info@ostify.co.uk.';}
    finally{clearTimeout(timer);button.disabled=false;}
  });
  form.hidden=false;
})();
