document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('login-modal');
    const openModalBtn = document.querySelector('.btn-login');
    const closeModalBtn = document.querySelector('.modal-close');
    const backdrop = document.querySelector('.modal-backdrop');

    function openModal() {
        loginModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Evita scroll na página principal
    }

    function closeModal() {
        loginModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    openModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Opcional: Fechar com a tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loginModal.getAttribute('aria-hidden') === 'false') {
            closeModal();
        }
    });

    // Opcional: Adicionar funcionalidade para o link "Registrar"
    const signupLink = document.querySelector('.signup-link');
    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Aqui você pode adicionar a lógica para abrir o modal de registro ou redirecionar para a página de registro
        console.log('Link de registro clicado! Adicione sua lógica aqui.');
        closeModal();
    });
});