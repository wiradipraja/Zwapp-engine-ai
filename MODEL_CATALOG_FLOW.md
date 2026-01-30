# Image Catalog UI Flow (Draft)

## User Flow (Image)
1) Sidebar: select Image.
2) Image Catalog view opens.
3) User filters by capability or search.
4) User selects a model card.
5) App opens the model form (generate/edit) with the standard output panel.

## User Flow (Video)
1) Sidebar: select Video.
2) Video Catalog view opens.
3) User filters by text-to-video or image-to-video.
4) User selects a model card.
5) App opens the video generation form with the output panel.

## Admin Flow (Catalog Manager)
1) Sidebar: select Catalog.
2) Admin fills model details (name, family, API model, app module, credits).
3) Upload thumbnail and sample images.
4) Save -> model appears in Image Catalog for users (active = true).

## Key Screens
- Image Catalog (grid of cards, grouped by family).
- Video Catalog (grid of cards, grouped by family).
- Model Form (existing generation forms).
- Catalog Manager (admin CRUD with upload).

## Responsive Notes
- Mobile: cards stack in single column, filters wrap.
- Tablet: 2-column grid for cards.
- Desktop: 3-column grid with grouped sections.
