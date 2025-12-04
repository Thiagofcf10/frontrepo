export default function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-200 mt-12">
      <div className="max-w-7xl mx-auto py-8 px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="font-semibold text-white">IFPA Projetos</h4>
          <p className="text-sm mt-2 text-gray-300">Sistema de gerenciamento de projetos acadêmicos do IFPA.</p>
        </div>

        <div>
          <h4 className="font-semibold text-white">Links</h4>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li><a href="/sobre" className="hover:underline">Sobre</a></li>
            <li><a href="/contato" className="hover:underline">Contato</a></li>
            <li><a href="/politica-privacidade" className="hover:underline">Política de Privacidade</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white">Contato</h4>
          <p className="text-sm mt-2 text-gray-300">E-mail: repoifpa@gmail.com</p>
          <p className="text-sm text-gray-300">Telefone: (91) 0000-0000 não sei</p>
        </div>
      </div>
      <div className="border-t border-gray-700 text-center py-3 text-xs text-gray-400">© {new Date().getFullYear()} IFPA Projetos — Todos os direitos reservados</div>
    </footer>
  );
}
