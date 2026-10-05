/* Public integration settings. Never put API keys or secrets in this file. */
window.OSTIFY_CONFIG = Object.freeze({
  freeProductUrl: '',
  // App sign-up page. "Start building" buttons fall back to /contact/ while this is empty.
  signupUrl: 'https://api.ostify.co.uk/.auth/login/ostifycustomerauth?prompt=create&post_login_redirect_uri=https://app.ostify.co.uk/',
  enquiryEndpoint: 'https://ostify-email-cfacd8c7f7b2h5bd.uksouth-01.azurewebsites.net/api/enquiry',
  // Tester feedback form at /feedback/. Same function app as enquiries.
  feedbackEndpoint: 'https://ostify-email-cfacd8c7f7b2h5bd.uksouth-01.azurewebsites.net/api/feedback',
  // Job application form at /apply/. Same function app as enquiries.
  applicationEndpoint: 'https://ostify-email-cfacd8c7f7b2h5bd.uksouth-01.azurewebsites.net/api/application',
  analyticsEndpoint: '',
  appInsightsConnectionString: 'InstrumentationKey=891a6f2e-4d99-48f6-aeb8-c99bc5163099;IngestionEndpoint=https://uksouth-1.in.applicationinsights.azure.com/;LiveEndpoint=https://uksouth.livediagnostics.monitor.azure.com/;ApplicationId=fb479a0a-1905-4499-b3a1-c78e49bfb933'
});
