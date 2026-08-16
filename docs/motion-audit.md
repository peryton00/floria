# Floria Motion System Audit Log

| Surface | Component / Interaction | Purpose | Duration | Motion Level | Reduced-Motion Behavior |
|---|---|---|---|---|---|
| **Customer Storefront** | Hero Headline & Subtitle | Hero entrance hierarchy | 300ms | Level 3 (Content) | Instant opacity fade without translateY |
| **Customer Storefront** | Hero Background Plants | Organic brand identity atmosphere | 10s | Level 4 (Ambient) | Animation disabled (`none`) |
| **Customer Storefront** | Product Cards | Image hover scale (`1.025`) & border transition | 250ms | Level 2 (Interaction) | Transform scale disabled (`scale(1)`) |
| **Customer Storefront** | Wishlist Heart Button | Tactile favorite feedback (`1.15` scale pop) | 200ms | Level 1 (Micro) | Scale pop disabled, color transition only |
| **Customer Storefront** | Cart Badge Counter | Quantity update indicator (`1.12` scale pulse) | 200ms | Level 1 (Micro) | Scale pulse disabled |
| **Navigation** | Header Nav Links | Subtly animated hover underline | 150ms | Level 1 (Micro) | Static color hover |
| **Global UI** | Dropdowns & Context Menus | Menu entrance (`translateY -4px`, `scale 0.98`) | 180ms | Level 2 (Interaction) | Instant fade-in |
| **Global UI** | Toast Notifications | Pop-up entrance (`translateY -8px`) & exit | 200ms | Level 2 (Interaction) | Instant fade-in/fade-out |
| **Seller Portal** | Dashboard KPI Cards | Entrance reveal & status badge updates | 200ms | Level 2 (Interaction) | Static render |
| **Admin Portal** | Data Tables & Modals | Modal dialog scale-in & button press states | 180ms | Level 2 (Interaction) | Instant display |
| **Operations Portal**| Dispatch & Packing Queues | Status transition badge crossfades | 150ms | Level 1 (Micro) | Instant status swap |
