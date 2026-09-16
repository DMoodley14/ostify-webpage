# Ostify enquiry function

Azure Function (Node.js, v4 programming model) that receives the contact form POST from
`contact.js` and emails it to `info@ostify.co.uk` via Azure Communication Services (ACS) Email.

It validates and re-checks every field server-side (the client-side `maxlength`s are not
trusted), silently no-ops on the hidden honeypot field, and only returns 2xx once ACS confirms
the send.

## One-time Azure setup

Run these with an Azure CLI already logged in to the subscription (`az login`), from any
directory:

```bash
# 1. Resource group (skip if you already have one you want to use)
az group create --name ostify-rg --location uksouth

# 2. Communication Services resource
az communication create --name ostify-acs --resource-group ostify-rg --location global --data-location uk

# 3. Email Communication Service resource + Azure-managed domain (fastest way to get sending working)
az communication email create --name ostify-email --resource-group ostify-rg --location global --data-location uk
az communication email domain create --domain-name AzureManagedDomain \
  --email-service-name ostify-email --resource-group ostify-rg --location global \
  --domain-management AzureManaged

# Link the domain to the ACS resource
az communication update --name ostify-acs --resource-group ostify-rg \
  --linked-domains "/subscriptions/<sub-id>/resourceGroups/ostify-rg/providers/Microsoft.Communication/emailServices/ostify-email/domains/AzureManagedDomain"
```

The Azure-managed domain gives you a working `donotreply@<random>.azurecomm.net` sender
immediately, with no DNS records to add — good enough to start. To send as
`enquiries@ostify.co.uk` instead, add a **custom verified domain** under the Email Communication
Service resource in the portal (Communication Services → Email → Domains → Connect domain →
Add custom domain), then add the SPF/DKIM/DMARC TXT records it gives you to the `ostify.co.uk`
DNS zone and wait for verification.

Get the connection string and sender address once the domain is verified:

```bash
az communication list-key --name ostify-acs --resource-group ostify-rg
# -> use the "primaryConnectionString" value

az communication email domain list --email-service-name ostify-email --resource-group ostify-rg
# -> the MailFrom sender address is shown under the domain, e.g.
#    DoNotReply@<guid>.azurecomm.net or DoNotReply@ostify.co.uk once custom-verified
```

## Create the Function App

```bash
az storage account create --name ostifyenquiryfn --resource-group ostify-rg --location uksouth --sku Standard_LRS

az functionapp create --name ostify-enquiry --resource-group ostify-rg \
  --storage-account ostifyenquiryfn --consumption-plan-location uksouth \
  --runtime node --runtime-version 20 --functions-version 4 --os-type Linux

az functionapp config appsettings set --name ostify-enquiry --resource-group ostify-rg --settings \
  ACS_CONNECTION_STRING="<primaryConnectionString from above>" \
  ACS_SENDER_ADDRESS="DoNotReply@<your-domain>" \
  ENQUIRY_RECIPIENT="info@ostify.co.uk" \
  ALLOWED_ORIGIN="https://ostify.co.uk"

# CORS so the browser is allowed to call it from the website origin
az functionapp cors add --name ostify-enquiry --resource-group ostify-rg --allowed-origins "https://ostify.co.uk"
```

## Deploy the function code

From this `azure-function/` directory:

```bash
npm install
npm install -g azure-functions-core-tools@4 --unsafe-perm true   # if you don't have `func` yet
func azure functionapp publish ostify-enquiry
```

This prints the live URL, e.g. `https://ostify-enquiry.azurewebsites.net/api/enquiry`.

## Wire it into the website

Set that URL in [`../site-config.js`](../site-config.js):

```js
window.OSTIFY_CONFIG = Object.freeze({
  freeProductUrl: '',
  enquiryEndpoint: 'https://ostify-enquiry.azurewebsites.net/api/enquiry',
  analyticsEndpoint: ''
});
```

Once that's deployed, the form switches from "prepare an email in your mail app" to actually
POSTing and showing a confirmation on the page — `contact.js` already branches on whether
`enquiryEndpoint` is set, no further front-end changes needed.

## Local testing

```bash
cp local.settings.json.example local.settings.json
# fill in ACS_CONNECTION_STRING and ACS_SENDER_ADDRESS
npm install
npm start
# POST http://localhost:7071/api/enquiry
```

## Notes

- The function has no rate limiting beyond field validation and the honeypot. If spam becomes a
  problem, add Azure Front Door / API Management with rate limiting in front, or add a CAPTCHA
  (e.g. Turnstile) to the form and verify its token here.
- `authLevel: "anonymous"` is intentional — the form is public and has no way to hold a secret
  key client-side. CORS + the honeypot + server-side validation are the available defences.
- Keep `ACS_CONNECTION_STRING` only in Function App settings, never in `site-config.js` or any
  committed file.
