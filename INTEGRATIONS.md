# Website handover

The website remains a static site compatible with its existing hosting.

## Pending connections

Configure public URLs in `site-config.js`:

- `freeProductUrl`: active Free product URL. Until supplied, Free links honestly say “Ask about Free”.
- `enquiryEndpoint`: HTTPS service accepting JSON `{name,email,plan,message}` with CORS allowing the website origin. It must validate fields, limit requests, handle spam, and deliver/store the enquiry before returning 2xx. A non-2xx response displays an error and keeps the visitor’s entries. The current fallback prepares an email and explicitly does not claim delivery.
- `analyticsEndpoint`: service accepting JSON `{event,path}`. No service is currently configured. Events: `plan_click`, `free_product_click`, `enquiry_started`, `email_prepared`, `enquiry_submitted`. Do not treat email preparation or clicks as completed enquiries. Global Privacy Control and Do Not Track disable collection. Review provider handling and update privacy information before enabling collection.

No secrets belong in this public configuration. Analytics collection, email delivery, attribution and a reporting dashboard are not yet connected. Product-side signup/activation events require changes in the product itself.

## Content to supply

- Founder photograph, name, biography and relevant experience.
- Paid pricing, limits, support, onboarding and launch dates when decided.
- Confirm full document names: truncated screenshot labels were expanded using the existing document list. The new Founder list has nine entries and excludes Agent Hazard Log.
- Privacy and terms pages currently contain narrow website information, not full product legal documents. Complete retention, lawful basis, rights, service-provider and product-processing details before collecting through a new endpoint.
- Verify domain ownership in Search Console and submit `https://ostify.co.uk/sitemap.xml` to inspect indexing.

No pilot, testimonials, savings figures, certifications or launch dates have been invented. Only Free is available; all four paid plans are labelled forthcoming.
