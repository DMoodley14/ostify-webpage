# Website handover

The website remains a static site compatible with its existing hosting.

## Pending connections

Configure public URLs in `site-config.js`:

- `freeProductUrl`: Hobbyist product URL (free at launch). Until supplied, the “Open Hobbyist” link stays hidden and the card offers only “Ask about this plan”. Supplying it reveals the product link alongside the enquiry link; it never replaces it.
- `enquiryEndpoint`: HTTPS service accepting JSON `{name,email,plan,message}` with CORS allowing the website origin. It must validate fields, limit requests, handle spam, and deliver/store the enquiry before returning 2xx. A non-2xx response displays an error and keeps the visitor’s entries. The current fallback prepares an email and explicitly does not claim delivery.
- `analyticsEndpoint`: service accepting JSON `{event,path}`. No service is currently configured. Events: `plan_click`, `free_product_click`, `enquiry_started`, `email_prepared`, `enquiry_submitted`. Do not treat email preparation or clicks as completed enquiries. Global Privacy Control and Do Not Track disable collection. Review provider handling and update privacy information before enabling collection.

No secrets belong in this public configuration. Analytics collection, email delivery, attribution and a reporting dashboard are not yet connected. Product-side signup/activation events require changes in the product itself.

## Content to supply

- Founder photograph, name, biography and relevant experience.
- Paid pricing, limits, support, onboarding and launch dates when decided.
- Confirm full document names: truncated screenshot labels were expanded using the existing document list. The new Founder list has nine entries and excludes Agent Hazard Log.
- Privacy and terms pages currently contain narrow website information, not full product legal documents. Complete retention, lawful basis, rights, service-provider and product-processing details before collecting through a new endpoint.
- Verify domain ownership in Search Console and submit `https://ostify.co.uk/sitemap.xml` to inspect indexing.

No pilot, testimonials, savings figures, certifications or launch dates have been invented. Hobbyist is the initial release, free at launch, and carries the Osteoblast builder and Osteoclast evaluator. Osteoblast is described as building agents “to DTAC expectations” rather than as DTAC-compliant, because Hobbyist includes no assurance service and the DTAC assessment stays with the customer. Founder, Founder Plus and Enterprise are presented as "contact us for pricing" rather than with published prices or dates — confirm that each assurance service described (Osteocite Assist drafting, an Ostify CSO, DCB0129, DTAC) can actually be delivered when enquired about, since the pages no longer label them as forthcoming.
