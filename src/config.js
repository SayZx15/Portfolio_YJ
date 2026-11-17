// Configuration publique. Ne jamais ajouter de clé secrète ici.
export const config = {
  name: 'Johan Yang',
  email: 'yangjohan2004@gmail.com',
  linkedin: 'https://www.linkedin.com/in/johan-yang/',
  github: '', // Facultatif : URL de votre profil GitHub.
  cv: './public/cv.html',
  // Vide = messagerie du visiteur. Backend : 'https://votre-api.example.com/api/contact'.
  // En local avec RESEND_API_KEY configurée : '/api/contact'.
  contactEndpoint: '',
  availability: { start: '2027-03-01', end: '2027-04-30', weeks: 24 },
};
