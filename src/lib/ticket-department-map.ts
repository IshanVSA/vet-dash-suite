/**
 * Maps each ticket type to the departments where it should be visible.
 * "Add/Remove Team Members" has a conditional rule for social_media
 * (only shown if "Promote on Social Media: Yes" is in the description).
 */
export const TICKET_VISIBILITY: Record<string, string[]> = {
  "Time Changes": ["website", "seo", "google_ads", "social_media"],
  "Pop-up Offers": ["website", "social_media"],
  "Third Party Integrations": ["website"],
  "Payment Options": ["website"],
  "Add/Remove Team Members": ["website"], // social_media is conditional
  "New Forms": ["website"],
  "Price List Updates": ["website", "social_media"],
  "Emergency": ["website"],
};

/**
 * Returns all ticket types that should be visible in a given department.
 */
export function getVisibleTicketTypes(department: string): string[] {
  return Object.entries(TICKET_VISIBILITY)
    .filter(([, depts]) => depts.includes(department))
    .map(([type]) => type);
}
