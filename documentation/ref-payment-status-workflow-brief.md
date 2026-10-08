# Payment status workflow — build brief

> Project-derived sample artifact. Assembled from saved project fields; no model was called and no application behavior is verified by this document.

## Goal

Build a support workflow using the shared Finance agent "Payment status", pinned to version 1.2.

This is a simulated cross-team integration in the shared Architect–Studio workspace. Owner: Maya · Finance owner. Permitted capability: Read payment status. Restriction: Cannot update invoices, issue refunds, or view bank details.

Input contract: [{"name":"invoiceId","type":"string","description":"The invoice to look up.","required":true}]. Output contract: [{"name":"status","type":"string","description":"paid, pending, or overdue"},{"name":"dueDate","type":"string","description":"ISO date: YYYY-MM-DD"}].

Use structured inputs and outputs, show the pinned version, and request human approval before any external write. Do not pretend a live agent has been connected.

## Implementation direction

- Framework: LangGraph
- Stage: draft (prototype UX state)
- Source files: 6
- Planned connections: None

## Agent responsibilities

- **Payment status workflow**: Invoke a permitted, pinned capability
- **Reviewer**: Check before delivery

## Planned workflow

The workspace does not have a saved plan yet.

## Human approval

Review before external actions or publication.

## Verification boundary

Build, integration, Studio, and deployment flows in this prototype are simulations. Review the source and test a connected runtime before relying on results.
