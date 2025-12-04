import Navbar from '@/components/Navbar';

export default function PoliticaPrivacidadePage(){
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold mb-4">Política de Privacidade</h1>
            <p className="text-gray-700 mb-4">Esta política descreve como coletamos, usamos e protegemos os dados pessoais dentro do sistema IFPA Projetos.</p>
            <h2 className="text-xl font-semibold mt-4">Dados coletados</h2>
            <p className="text-gray-600">Coletamos informações mínimas para autenticação e identificação (nome, e-mail, tipo de usuário). Os arquivos enviados são armazenados para fins acadêmicos e administrativos.</p>
            <h2 className="text-xl font-semibold mt-4">Uso dos dados</h2>
            <p className="text-gray-600">Os dados são utilizados para exibir projetos, autorizar ações e manter registro de submissões. Não divulgamos dados a terceiros sem consentimento, exceto quando exigido por lei.</p>
            <h2 className="text-xl font-semibold mt-4">Contato</h2>
            <p className="text-gray-600">Em caso de dúvidas sobre privacidade, contate suporte@ifpa.edu.br.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
