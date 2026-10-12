# Project content maintenance

The reviewed catalog in data/projects.json drives project content in the original English and Spanish home carousels, all four service-page menus, the Games/Juegos section, individual portfolio pages and both original-format README tables. Layouts, components, CSS, typography and animations remain the original design.

Run npm run build, npm run lint and npm test in this checkout. Run node scripts/sync-presence.mjs --portfolio ../portfolio --personal ../personal-profile --organization ../organization-profile to update explicit local destinations. The portfolio uses its existing Projects cards, tag filters, pagination and detail styles. The personal inventory currently has 19 Projects and one Game. Non-game entries link to /projects/<id>/; games link to /games/<id>/.

Only explicitly published entries qualify. Private-source projects require public project webpages. Download repositories are distribution, not application source. A license label requires evidence; unspecified licenses receive neutral public-source wording. Preserve uncertain professional and scientific claims until owner confirmation.

Keep existing layout markup when editing the HTML; the build updates catalog cards, counts, menus and sitemap in place. Project illustration provenance and source licensing are documented in assets/ATTRIBUTION.md.

Production publishing still requires review and explicit authorization. Website pushes auto-deploy. Do not submit the contact form during preview checks.

Add future games with category game and qualifying public evidence in data/projects.json. The existing carousel and portfolio cards are reused automatically. Keep first-class Atelier support packages and confirmed forks out of the showcases; retain attribution for original collections that include upstream components. Use implementation-backed ML/software areas in tags; source, license, platform and lifecycle metadata stay separate. All twenty projects use approved concept illustrations. Keep `visual.fit: contain` for the nineteen purpose-led images so their headings remain visible. The Flow Atelier illustration keeps its separately approved composition. Illustrations are not interface screenshots.
