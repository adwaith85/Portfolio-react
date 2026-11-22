PUT YOUR CERTIFICATE IMAGES IN THIS FOLDER  (public/certificates/)

File names the site already expects (change them in src/data/content.js
under  achievements.items[].image  if you prefer other names):

  bca.jpg            -> BCA Degree
  mern.jpg           -> MERN Stack Certification
  internship.jpg     -> Internship Certificate
  certificate-4.jpg  -> Certificate 04
  certificate-5.jpg  -> Certificate 05

Tips: landscape images (about 4:3, e.g. 1200x900) look best, under 400 KB each.
.png or .webp also work: just change the extension in content.js.
Until a file exists, a placeholder certificate icon is shown, nothing breaks.
