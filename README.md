# GitHub Public Image Library — Fixed Version

This version does NOT use Firebase.

## What it does
- Anyone can view images.
- Anyone can download images.
- Images are grouped into categories.
- Search is available.
- Upload is protected by password `333784`.
- Upload uses a GitHub fine-grained Personal Access Token entered only at upload time.
- The token is not stored in localStorage.
- Upload progress and GitHub errors are shown clearly.
- The app uses cache-busting so an old `app.js` is less likely to remain active.
- Maximum image size in this version: 25 MB. For mobile, 1–5 MB is recommended.

## Required repository structure

```text
your-repo/
├── index.html
├── styles.css
├── app.js
├── data/
│   └── images.json
└── images/
```

`data/images.json` should initially contain:

```json
[]
```

## GitHub Pages
1. Open repository Settings.
2. Pages.
3. Select Deploy from a branch.
4. Select your main branch and `/ (root)`.
5. Save.
6. Open the generated Pages URL.

## Upload token
Create a fine-grained GitHub token with access ONLY to this repository and Contents permission set to Read and write.

Do not paste the token into `app.js` or `index.html`.

## Important security note
The upload password is a browser-side gate, not server-side authentication. The GitHub token is much more sensitive. Use a fine-grained token restricted to one repository, with the minimum required permission, and never commit it to the repository.

## If upload still fails
The new uploader displays the actual HTTP status/error. Common causes:
- 401: token invalid/expired.
- 403: token lacks repository Contents write permission.
- 404: owner/repository/branch or repository access is wrong.
- 409: catalogue changed simultaneously; retry.
- Network error: connection or browser/network issue.

For testing, first use a JPG around 500 KB–2 MB.
