document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('application-form');
  const fileInput = document.getElementById('cv') || document.getElementById('resume');
  const fileText = document.getElementById('file-chosen-text');
  const statusMessage = document.getElementById('status-message');
  const statusDetail = document.getElementById('status-detail');
  const submitBtn = document.getElementById('start-btn') || document.getElementById('submit-btn');

  // Cookie & Privacy Consent Modal handling
  const cookieModal = document.getElementById('cookie-consent-modal');
  const acceptCookieBtn =
    document.getElementById('onetrust-accept-btn-handler') ||
    document.querySelector('.cookie-consent-accept');

  function dismissCookieModal() {
    if (cookieModal) {
      cookieModal.classList.remove('show');
      cookieModal.classList.add('hidden');
      cookieModal.removeAttribute('role');
      cookieModal.removeAttribute('aria-modal');
      cookieModal.style.display = 'none';
    }
  }

  if (acceptCookieBtn) {
    acceptCookieBtn.addEventListener('click', dismissCookieModal);
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dismissCookieModal();
    }
  });

  // Update file input feedback when a file is selected
  if (fileInput && fileText) {
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        fileText.textContent = `Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        fileText.style.color = '#38bdf8';
      } else {
        fileText.textContent = 'PDF, DOCX up to 10MB';
        fileText.style.color = '#64748b';
      }
    });
  }

  // Handle application submission
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const candidateName = (
        document.getElementById('candidate_name')?.value ||
        document.getElementById('full_name')?.value ||
        ''
      ).trim();
      const contact = (
        document.getElementById('contact')?.value ||
        document.getElementById('email')?.value ||
        ''
      ).trim();
      const skills = (document.getElementById('skills')?.value || '').trim();
      const hasFile = Boolean(fileInput?.files && fileInput.files.length > 0);

      // Display success message area
      if (statusMessage) {
        statusMessage.classList.remove('hidden');
        if (statusDetail) {
          const namePart = candidateName || 'Candidate';
          const filePart = hasFile ? 'CV attached' : 'No file';
          statusDetail.textContent = `Candidate: ${namePart} • ${contact || 'No contact'} • ${filePart}`;
        }
      }

      console.log('✅ Application received:', {
        candidateName,
        contact,
        skills,
        hasFile,
        timestamp: new Date().toISOString(),
      });
    });
  }
});
